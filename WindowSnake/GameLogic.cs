namespace WindowSnake;

/// <summary>
/// 蛇的移动方向。
/// </summary>
internal enum Direction
{
    Up,
    Down,
    Left,
    Right,
}

internal enum GameStatus
{
    Running,
    Paused,
    GameOver,
    Win,
}

/// <summary>
/// 贪食蛇核心游戏逻辑。与 UI / 渲染解耦,
/// 由 <see cref="MainForm"/> 通过 <c>Tick()</c> 驱动步进。
///
/// 约定:
///   - 棋盘坐标系原点在左上角,X 向右、Y 向下。
///   - 边界 0 和 Width-1 / Height-1 视为墙,蛇不能进入。
///   - 蛇身用 <see cref="LinkedList{T}"/> 维护,头在 <c>First</c>,尾在 <c>Last</c>。
///   - 每吃 <see cref="SpeedUpEveryFood"/> 个食物,步进间隔减 10ms,最低不超过 <see cref="MinSpeedMs"/>。
///   - 任何状态变化都会触发 <see cref="StateChanged"/>,UI 据此刷新。
/// </summary>
internal sealed class GameLogic
{
    public int BoardWidth { get; }
    public int BoardHeight { get; }
    public int InitialSpeedMs { get; }
    public int MinSpeedMs { get; }
    public int SpeedUpEveryFood { get; }

    private readonly LinkedList<Point> _snake = new();
    private readonly HashSet<Point> _body = new();
    private readonly Random _random = new();

    private Point _food;
    private Direction _direction;
    private Direction _nextDirection;
    private int _score;
    private int _foodEaten;
    private int _stepIntervalMs;
    private GameStatus _status = GameStatus.Running;

    /// <summary>当前蛇身序列(头在前,尾在后)。</summary>
    public IReadOnlyCollection<Point> Snake => _snake;

    /// <summary>蛇头位置。游戏中始终存在。</summary>
    public Point Head => _snake.First!.Value;

    /// <summary>当前食物位置。</summary>
    public Point Food => _food;

    /// <summary>当前游戏状态。</summary>
    public GameStatus Status => _status;

    /// <summary>当前得分。</summary>
    public int Score => _score;

    /// <summary>当前蛇身长度(节数)。</summary>
    public int Length => _snake.Count;

    /// <summary>当前步进间隔(毫秒)。</summary>
    public int StepIntervalMs => _stepIntervalMs;

    /// <summary>游戏内任何状态变化(步进、暂停、结束、胜利、重置)都会触发该事件。</summary>
    public event EventHandler? StateChanged;

    public GameLogic(
        int width,
        int height,
        int initialSpeedMs,
        int minSpeedMs,
        int speedUpEveryFood)
    {
        BoardWidth = width;
        BoardHeight = height;
        InitialSpeedMs = initialSpeedMs;
        MinSpeedMs = minSpeedMs;
        SpeedUpEveryFood = speedUpEveryFood;
        _stepIntervalMs = initialSpeedMs;
        Reset();
    }

    /// <summary>把游戏恢复到初始状态(蛇身、得分、速度、状态机全部重置)。</summary>
    public void Reset()
    {
        _snake.Clear();
        _body.Clear();
        _score = 0;
        _foodEaten = 0;
        _stepIntervalMs = InitialSpeedMs;
        _direction = Direction.Right;
        _nextDirection = Direction.Right;
        _status = GameStatus.Running;

        // 蛇初始 3 节,水平居中,头朝右
        int cx = BoardWidth / 2;
        int cy = BoardHeight / 2;
        for (int i = 0; i < 3; i++)
        {
            var p = new Point(cx - i, cy);
            _snake.AddLast(p);
            _body.Add(p);
        }

        SpawnFood();
        RaiseStateChanged();
    }

    /// <summary>主循环步进一次。游戏处于 Paused/GameOver/Win 时为 no-op。</summary>
    public void Tick()
    {
        if (_status != GameStatus.Running) return;
        Update();
        RaiseStateChanged();
    }

    /// <summary>切换暂停/继续。仅在 Running/Paused 之间有效。</summary>
    public void TogglePause()
    {
        switch (_status)
        {
            case GameStatus.Running:
                _status = GameStatus.Paused;
                RaiseStateChanged();
                break;
            case GameStatus.Paused:
                _status = GameStatus.Running;
                RaiseStateChanged();
                break;
        }
    }

    /// <summary>尝试设置蛇的下一运动方向。会忽略 180 度掉头。</summary>
    public void TrySetDirection(Direction newDir)
    {
        if (IsOpposite(newDir, _direction)) return;
        _nextDirection = newDir;
        if (_status == GameStatus.Paused)
        {
            // 暂停时按方向键即解除暂停
            _status = GameStatus.Running;
            RaiseStateChanged();
        }
    }

    private void Update()
    {
        _direction = _nextDirection;
        Point delta = _direction switch
        {
            Direction.Up    => new Point(0, -1),
            Direction.Down  => new Point(0,  1),
            Direction.Left  => new Point(-1, 0),
            Direction.Right => new Point(1,  0),
            _ => new Point(0, 0),
        };

        Point head = _snake.First!.Value;
        Point newHead = head + delta;

        // 撞墙
        if (newHead.X <= 0 || newHead.X >= BoardWidth - 1 ||
            newHead.Y <= 0 || newHead.Y >= BoardHeight - 1)
        {
            _status = GameStatus.GameOver;
            return;
        }

        // 撞自己:不吃到食物时尾巴会立刻移走,所以尾巴格不算碰撞;
        //        吃到食物时尾巴不动,这时必须把整个身体都算作障碍
        bool willEat = newHead == _food;
        Point currentTail = _snake.Last!.Value;
        bool hitBody = _body.Contains(newHead) && (willEat || newHead != currentTail);
        if (hitBody)
        {
            _status = GameStatus.GameOver;
            return;
        }

        _snake.AddFirst(newHead);
        _body.Add(newHead);

        if (willEat)
        {
            _score += 10;
            _foodEaten++;
            if (_foodEaten % SpeedUpEveryFood == 0 && _stepIntervalMs > MinSpeedMs)
            {
                _stepIntervalMs = Math.Max(MinSpeedMs, _stepIntervalMs - 10);
            }
            if (!SpawnFood())
            {
                _status = GameStatus.Win;
            }
        }
        else
        {
            Point tail = _snake.Last!.Value;
            _snake.RemoveLast();
            _body.Remove(tail);
        }
    }

    /// <summary>在所有空闲格子里随机选一个放置食物。返回 false 表示已填满(胜利)。</summary>
    private bool SpawnFood()
    {
        int innerW = BoardWidth - 2;
        int innerH = BoardHeight - 2;
        int free = innerW * innerH - _body.Count;
        if (free <= 0) return false;

        int x, y;
        do
        {
            x = _random.Next(1, BoardWidth - 1);
            y = _random.Next(1, BoardHeight - 1);
        } while (_body.Contains(new Point(x, y)));

        _food = new Point(x, y);
        return true;
    }

    private static bool IsOpposite(Direction a, Direction b) =>
        (a == Direction.Up    && b == Direction.Down)  ||
        (a == Direction.Down  && b == Direction.Up)    ||
        (a == Direction.Left  && b == Direction.Right) ||
        (a == Direction.Right && b == Direction.Left);

    private void RaiseStateChanged() => StateChanged?.Invoke(this, EventArgs.Empty);
}

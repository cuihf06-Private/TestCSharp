namespace SnakeGame;

/// <summary>
/// 蛇的移动方向。故意使用 int 顺序让 ToString 顺序自然,代码里只用其名称比较。
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
/// 贪食蛇游戏主类。负责游戏循环、输入、碰撞检测与渲染。
/// </summary>
internal sealed class Game
{
    private const char BorderChar = '#';
    private const char HeadChar = '@';
    private const char BodyChar = 'o';
    private const char FoodChar = '*';

    private readonly int _width;
    private readonly int _height;
    private readonly int _initialSpeedMs;
    private readonly int _minSpeedMs;
    private readonly int _speedUpEveryFood;

    private readonly LinkedList<Point> _snake = new();
    private readonly HashSet<Point> _body = new();
    private Point _food;
    private Direction _direction;
    private Direction _nextDirection;
    private int _score;
    private int _foodEaten;
    private int _speedMs;
    private GameStatus _status = GameStatus.Running;
    private readonly Random _random = new();

    // 用于 Render() 直接覆盖: 缓存上一次绘制的字符网格
    private readonly char[,] _backBuffer;
    // 用于只重绘发生变化的格子
    private readonly bool[,] _dirty;

    public Game(
        int width,
        int height,
        int initialSpeedMs,
        int minSpeedMs,
        int speedUpEveryFood)
    {
        _width = width;
        _height = height;
        _initialSpeedMs = initialSpeedMs;
        _minSpeedMs = minSpeedMs;
        _speedUpEveryFood = speedUpEveryFood;

        _backBuffer = new char[_height, _width];
        _dirty = new bool[_height, _width];

        Reset();
    }

    /// <summary>把游戏恢复到初始状态。</summary>
    public void Reset()
    {
        _snake.Clear();
        _body.Clear();
        _score = 0;
        _foodEaten = 0;
        _speedMs = _initialSpeedMs;
        _direction = Direction.Right;
        _nextDirection = Direction.Right;
        _status = GameStatus.Running;

        // 蛇初始 3 节,水平居中,头朝右
        int cx = _width / 2;
        int cy = _height / 2;
        for (int i = 0; i < 3; i++)
        {
            var p = new Point(cx - i, cy);
            _snake.AddLast(p);
            _body.Add(p);
        }

        SpawnFood();
        ClearBackBuffer();
        MarkAllDirty();
    }

    /// <summary>启动游戏主循环,直到玩家选择退出。</summary>
    public void Run()
    {
        Console.Clear();
        DrawHud();
        Render();

        while (_status is GameStatus.Running or GameStatus.Paused)
        {
            HandleInput();

            if (_status == GameStatus.Paused)
            {
                // 暂停期间,蛇不动,但要持续重画 HUD 才能让玩家看到 “暂停中” 提示
                DrawHud();
                Thread.Sleep(50);
                continue;
            }

            Update();
            Render();
            Thread.Sleep(_speedMs);
        }

        ShowEndScreen();
    }

    private void HandleInput()
    {
        // KeyAvailable 非阻塞: 没有按键直接返回
        while (Console.KeyAvailable)
        {
            var key = Console.ReadKey(intercept: true);
            switch (key.Key)
            {
                case ConsoleKey.UpArrow:
                case ConsoleKey.W:
                    SetDirection(Direction.Up);
                    break;
                case ConsoleKey.DownArrow:
                case ConsoleKey.S:
                    SetDirection(Direction.Down);
                    break;
                case ConsoleKey.LeftArrow:
                case ConsoleKey.A:
                    SetDirection(Direction.Left);
                    break;
                case ConsoleKey.RightArrow:
                case ConsoleKey.D:
                    SetDirection(Direction.Right);
                    break;
                case ConsoleKey.Spacebar:
                    if (_status == GameStatus.Running)
                    {
                        _status = GameStatus.Paused;
                        MarkAllDirty();
                    }
                    else if (_status == GameStatus.Paused)
                    {
                        _status = GameStatus.Running;
                        MarkAllDirty();
                    }
                    break;
                case ConsoleKey.Q:
                case ConsoleKey.Escape:
                    _status = GameStatus.GameOver;
                    break;
            }
        }
    }

    private void SetDirection(Direction newDir)
    {
        // 不允许 180 度掉头
        if (IsOpposite(newDir, _direction))
            return;
        _nextDirection = newDir;
        if (_status == GameStatus.Paused)
        {
            // 暂停时,按方向键即解除暂停
            _status = GameStatus.Running;
            MarkAllDirty();
        }
    }

    private static bool IsOpposite(Direction a, Direction b) =>
        (a == Direction.Up && b == Direction.Down) ||
        (a == Direction.Down && b == Direction.Up) ||
        (a == Direction.Left && b == Direction.Right) ||
        (a == Direction.Right && b == Direction.Left);

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
        if (newHead.X <= 0 || newHead.X >= _width - 1 ||
            newHead.Y <= 0 || newHead.Y >= _height - 1)
        {
            _status = GameStatus.GameOver;
            return;
        }

        // 撞自己(注意:不吃到食物时尾巴会立刻移走,所以尾巴格不算碰撞;
        //       吃到食物时尾巴不动,这时必须把整个身体都算作障碍)
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
            if (_foodEaten % _speedUpEveryFood == 0 && _speedMs > _minSpeedMs)
            {
                _speedMs = Math.Max(_minSpeedMs, _speedMs - 10);
            }
            if (!SpawnFood())
            {
                _status = GameStatus.Win;
            }
            MarkAllDirty();
        }
        else
        {
            // 把尾巴那一格标为脏
            Point tail = _snake.Last!.Value;
            _snake.RemoveLast();
            _body.Remove(tail);
            MarkDirty(tail.Y, tail.X);
            MarkDirty(newHead.Y, newHead.X);
            // 头与身之间也用空格/蛇身做了区分,头那一格要标脏
            MarkDirty(head.Y, head.X);
        }
    }

    /// <summary>在所有空闲格子里随机选一个放置食物。返回 false 表示已填满(胜利)。</summary>
    private bool SpawnFood()
    {
        int innerWidth = _width - 2;
        int innerHeight = _height - 2;
        int total = innerWidth * innerHeight;
        int free = total - _body.Count;
        if (free <= 0) return false;

        // 用 拒绝采样 选位置,简单且足够随机
        int x, y;
        do
        {
            x = _random.Next(1, _width - 1);
            y = _random.Next(1, _height - 1);
        } while (_body.Contains(new Point(x, y)));

        _food = new Point(x, y);
        MarkDirty(y, x);
        return true;
    }

    private void MarkDirty(int y, int x)
    {
        if (y >= 0 && y < _height && x >= 0 && x < _width)
            _dirty[y, x] = true;
    }

    private void MarkAllDirty()
    {
        for (int y = 0; y < _height; y++)
            for (int x = 0; x < _width; x++)
                _dirty[y, x] = true;
    }

    /// <summary>把 _backBuffer 里所有单元格置为空格,用于完全重绘前的清场。</summary>
    private void ClearBackBuffer()
    {
        for (int y = 0; y < _height; y++)
            for (int x = 0; x < _width; x++)
                _backBuffer[y, x] = ' ';
    }

    /// <summary>仅把标记为脏的格子写到控制台,大幅减少闪烁。</summary>
    private void Render()
    {
        for (int y = 0; y < _height; y++)
        {
            for (int x = 0; x < _width; x++)
            {
                if (!_dirty[y, x]) continue;

                char ch = CharAt(y, x);
                if (ch == _backBuffer[y, x])
                {
                    // 没变化,不再重绘,但要清掉脏标记
                    _dirty[y, x] = false;
                    continue;
                }
                _backBuffer[y, x] = ch;
                Console.SetCursorPosition(x, y);
                Console.Write(ch);
                _dirty[y, x] = false;
            }
        }

        DrawHud();
    }

    private char CharAt(int y, int x)
    {
        // 边框
        if (x == 0 || x == _width - 1 || y == 0 || y == _height - 1)
            return BorderChar;

        var p = new Point(x, y);
        if (p == _food) return FoodChar;
        if (p == _snake.First!.Value) return HeadChar;
        if (_body.Contains(p)) return BodyChar;
        return ' ';
    }

    private void DrawHud()
    {
        // HUD 区域: 第 _height 行(0-based)
        string line1 = $" 分数: {_score,5}    长度: {_snake.Count,3}    速度: {1000.0 / _speedMs,5:F1} 步/秒 ";
        string line2 = " 操作: 方向键 / WASD 移动    空格 = 暂停    Q / Esc = 退出 ";
        string state = _status switch
        {
            GameStatus.Paused  => "  *** 暂停中,再按空格继续 *** ",
            GameStatus.Running => "  --- 游戏进行中 --- ",
            _ => "  ",
        };

        Console.SetCursorPosition(0, _height);
        Console.Write(line1);
        Console.SetCursorPosition(0, _height + 1);
        Console.Write(line2);
        Console.SetCursorPosition(0, _height + 2);
        Console.Write(state);
    }

    private void ShowEndScreen()
    {
        string title = _status == GameStatus.Win
            ? " === 恭喜!你吃满了整张地图 === "
            : " === 游戏结束 === ";
        string sub = _status == GameStatus.Win
            ? $"用时共吃了 {_foodEaten} 个食物,最终得分: {_score}"
            : $"撞墙或撞到自己了。最终得分: {_score}";

        int cx = _width / 2;
        int cy = _height / 2;
        Console.SetCursorPosition(Math.Max(0, cx - title.Length / 2), cy);
        Console.Write(title);
        Console.SetCursorPosition(Math.Max(0, cx - sub.Length / 2), cy + 1);
        Console.Write(sub);
        Console.SetCursorPosition(0, _height + 3);
        Console.Write("按 Enter / R 重新开始,按 Q 退出...");
        Console.CursorVisible = true;
    }
}

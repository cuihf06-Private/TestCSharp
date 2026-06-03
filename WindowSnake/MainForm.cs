using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;

namespace WindowSnake;

/// <summary>
/// 窗口版贪食蛇 - 主窗口。
///
/// 职责:
///   - 持有 <see cref="GameLogic"/> 并通过 <see cref="System.Windows.Forms.Timer"/> 驱动游戏步进
///   - 在 <see cref="OnPaint"/> 中把游戏状态绘制成像素方格
///   - 在 <see cref="ProcessCmdKey"/> 中拦截键盘输入
///
/// 渲染策略:
///   - 双缓冲全量重绘。棋盘只有 25*20 = 500 格,完全够用
///   - HUD 区在顶部,棋盘在下方,GameOver/Paused 时在棋盘上覆盖半透明遮罩 + 文字
/// </summary>
internal sealed class MainForm : Form
{
    // ---- 棋盘几何参数(DIP,WinForms 自动按 DPI 缩放) ----
    private const int CellSize = 32;       // 每格 DIP,决定窗口整体大小
    private const int BoardMargin = 16;    // 棋盘外边距

    // ---- 棋盘逻辑尺寸 / 难度参数 ----
    private const int BoardW = 25;
    private const int BoardH = 20;
    private const int InitialSpeedMs = 130;
    private const int MinSpeedMs     = 55;
    private const int SpeedUpEvery   = 3;

    // HUD 布局常量
    private const float HudTopPadding = 12f;
    private const float HudLineGap = 8f;
    private const float HudBottomPadding = 12f;

    // 动态计算的 HUD 高度
    private int _hudHeight;

    private readonly GameLogic _game;
    private readonly System.Windows.Forms.Timer _timer = new();

    // 预创建常用画笔/画刷,避免 OnPaint 中反复 new
    private static readonly SolidBrush BgBrush         = new(Color.FromArgb(18, 18, 22));
    private static readonly SolidBrush BoardBrush      = new(Color.FromArgb(24, 24, 30));
    private static readonly SolidBrush BorderBrush     = new(Color.FromArgb(70, 70, 80));
    private static readonly SolidBrush SnakeBodyBrush  = new(Color.FromArgb(0, 170, 80));
    private static readonly SolidBrush SnakeHeadBrush  = new(Color.FromArgb(120, 255, 120));
    private static readonly SolidBrush FoodBrush       = new(Color.FromArgb(230, 60, 60));
    private static readonly SolidBrush OverlayBrush    = new(Color.FromArgb(180, 0, 0, 0));
    private static readonly SolidBrush TextBrush       = new(Color.White);
    private static readonly SolidBrush DimTextBrush    = new(Color.FromArgb(200, 200, 200));
    private static readonly SolidBrush AccentBrush     = new(Color.Khaki);
    private static readonly SolidBrush WarnBrush       = new(Color.FromArgb(255, 200, 80));
    private static readonly SolidBrush DangerBrush     = new(Color.FromArgb(255, 90, 90));
    private static readonly SolidBrush WinBrush        = new(Color.FromArgb(120, 255, 120));
    private static readonly Pen       GridPen          = new(Color.FromArgb(40, 40, 50));

    public MainForm()
    {
        // 渲染相关
        DoubleBuffered = true;
        BackColor = Color.FromArgb(18, 18, 22);
        Text = "贪食蛇 (WindowSnake)";
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        StartPosition = FormStartPosition.CenterScreen;
        KeyPreview = true;

        // 计算 HUD 实际高度
        CalculateHudHeight();

        // 设置客户区大小
        int clientW = BoardMargin * 2 + CellSize * BoardW;
        int clientH = BoardMargin + _hudHeight + CellSize * BoardH + BoardMargin;
        ClientSize = new Size(clientW, clientH);

        // 核心游戏逻辑
        _game = new GameLogic(BoardW, BoardH, InitialSpeedMs, MinSpeedMs, SpeedUpEvery);
        _game.StateChanged += (_, _) => Invalidate();

        // 计时器
        _timer.Interval = _game.StepIntervalMs;
        _timer.Tick += GameTimer_Tick;
        _timer.Start();

        // 释放计时器
        FormClosed += (_, _) => _timer.Dispose();
    }

    private void GameTimer_Tick(object? sender, EventArgs e)
    {
        _game.Tick();
        // 速度可能因吃食物而变化,这里同步一次
        _timer.Interval = _game.StepIntervalMs;
    }

    /// <summary>
    /// 在命令键被分发给控件之前拦截。
    /// 这样即便窗口内将来放了可聚焦的控件,方向键也会先被游戏处理。
    /// </summary>
    protected override bool ProcessCmdKey(ref Message msg, Keys keyData)
    {
        switch (keyData)
        {
            case Keys.Up:    _game.TrySetDirection(Direction.Up);    return true;
            case Keys.Down:  _game.TrySetDirection(Direction.Down);  return true;
            case Keys.Left:  _game.TrySetDirection(Direction.Left);  return true;
            case Keys.Right: _game.TrySetDirection(Direction.Right); return true;
            case Keys.W:     _game.TrySetDirection(Direction.Up);    return true;
            case Keys.S:     _game.TrySetDirection(Direction.Down);  return true;
            case Keys.A:     _game.TrySetDirection(Direction.Left);  return true;
            case Keys.D:     _game.TrySetDirection(Direction.Right); return true;
            case Keys.Space:
            case Keys.P:
                _game.TogglePause();
                return true;
            case Keys.R:
                if (_game.Status is GameStatus.GameOver or GameStatus.Win)
                {
                    _game.Reset();
                    _timer.Interval = _game.StepIntervalMs;
                }
                return true;
            case Keys.Escape:
                Close();
                return true;
        }
        return base.ProcessCmdKey(ref msg, keyData);
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        Graphics g = e.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;

        // 1. 全局背景
        g.FillRectangle(BgBrush, ClientRectangle);

        // 2. HUD
        DrawHud(g);

        // 3. 棋盘 + 蛇 + 食物
        DrawBoard(g);

        // 4. 状态覆盖层(暂停/结束/胜利)
        DrawOverlay(g);
    }

    private void DrawHud(Graphics g)
    {
        // HUD 与棋盘的分隔线
        using var linePen = new Pen(Color.FromArgb(60, 60, 70));
        g.DrawLine(linePen, 0, _hudHeight, ClientSize.Width, _hudHeight);

        // 字体集中创建一次
        using var titleFont = new Font("Microsoft YaHei UI", 12f, FontStyle.Bold, GraphicsUnit.Point);
        using var infoFont  = new Font("Microsoft YaHei UI", 10f, FontStyle.Regular, GraphicsUnit.Point);
        using var hintFont  = new Font("Microsoft YaHei UI", 9.5f, FontStyle.Regular, GraphicsUnit.Point);

        float x = BoardMargin;
        float y = HudTopPadding;

        // 第 1 行:状态
        string stateText = _game.Status switch
        {
            GameStatus.Running  => "游戏中",
            GameStatus.Paused   => "已暂停",
            GameStatus.GameOver => "游戏结束",
            GameStatus.Win      => "胜利!",
            _ => string.Empty,
        };
        Brush stateBrush = _game.Status switch
        {
            GameStatus.Running  => AccentBrush,
            GameStatus.Paused   => WarnBrush,
            GameStatus.GameOver => DangerBrush,
            GameStatus.Win      => WinBrush,
            _ => TextBrush,
        };
        string stateLine = $"状态:{stateText}";
        var stateSize = g.MeasureString(stateLine, titleFont);
        g.DrawString(stateLine, titleFont, stateBrush, x, y);
        y += stateSize.Height + HudLineGap;

        // 第 2 行:分数 / 长度 / 速度
        double stepsPerSec = 1000.0 / _game.StepIntervalMs;
        string info = $"分数:{_game.Score,5}    长度:{_game.Length,3}    速度:{stepsPerSec,5:F1} 步/秒";
        var infoSize = g.MeasureString(info, infoFont);
        g.DrawString(info, infoFont, TextBrush, x, y);
        y += infoSize.Height + HudLineGap;

        // 第 3 行:操作提示
        const string hint = "WASD / 方向键 移动    空格 暂停    R 重开    Esc 退出";
        var hintSize = g.MeasureString(hint, hintFont);
        g.DrawString(hint, hintFont, DimTextBrush, x, y);
    }

    private void DrawBoard(Graphics g)
    {
        int ox = BoardMargin;
        int oy = _hudHeight + BoardMargin;
        int boardPixelW = CellSize * _game.BoardWidth;
        int boardPixelH = CellSize * _game.BoardHeight;

        // 棋盘底色
        g.FillRectangle(BoardBrush, ox, oy, boardPixelW, boardPixelH);

        // 内部网格线(只在内部格之间画)
        for (int x = 1; x < _game.BoardWidth; x++)
        {
            g.DrawLine(GridPen,
                ox + x * CellSize, oy,
                ox + x * CellSize, oy + boardPixelH);
        }
        for (int y = 1; y < _game.BoardHeight; y++)
        {
            g.DrawLine(GridPen,
                ox,           oy + y * CellSize,
                ox + boardPixelW, oy + y * CellSize);
        }

        // 边框格(整格填充深灰)
        for (int x = 0; x < _game.BoardWidth; x++)
        {
            for (int y = 0; y < _game.BoardHeight; y++)
            {
                if (x == 0 || x == _game.BoardWidth - 1 || y == 0 || y == _game.BoardHeight - 1)
                {
                    g.FillRectangle(BorderBrush,
                        ox + x * CellSize,
                        oy + y * CellSize,
                        CellSize, CellSize);
                }
            }
        }

        // 食物(圆)
        var foodRect = new Rectangle(
            ox + _game.Food.X * CellSize + 3,
            oy + _game.Food.Y * CellSize + 3,
            CellSize - 6,
            CellSize - 6);
        g.FillEllipse(FoodBrush, foodRect);

        // 蛇(头在前)
        int index = 0;
        foreach (var p in _game.Snake)
        {
            var rect = new Rectangle(
                ox + p.X * CellSize + 1,
                oy + p.Y * CellSize + 1,
                CellSize - 2,
                CellSize - 2);
            if (index == 0) g.FillRectangle(SnakeHeadBrush, rect);
            else            g.FillRectangle(SnakeBodyBrush, rect);
            index++;
        }
    }

    private void DrawOverlay(Graphics g)
    {
        if (_game.Status == GameStatus.Running) return;

        var boardRect = new Rectangle(
            BoardMargin,
            _hudHeight + BoardMargin,
            CellSize * _game.BoardWidth,
            CellSize * _game.BoardHeight);
        g.FillRectangle(OverlayBrush, boardRect);

        using var bigFont   = new Font("Microsoft YaHei UI", 32f, FontStyle.Bold, GraphicsUnit.Point);
        using var smallFont = new Font("Microsoft YaHei UI", 12f, FontStyle.Regular, GraphicsUnit.Point);

        string title, sub;
        Brush titleBrush = TextBrush;
        switch (_game.Status)
        {
            case GameStatus.Paused:
                title = "已 暂 停";
                sub = "按 [空格] 继续   ·   按 [R] 重开   ·   按 [Esc] 退出";
                break;
            case GameStatus.GameOver:
                title = "游 戏 结 束";
                sub = $"最终得分:{_game.Score}    长度:{_game.Length}    按 [R] 重新开始";
                break;
            case GameStatus.Win:
                title = "胜  利";
                titleBrush = WinBrush;
                sub = $"你吃满了整张地图!    长度:{_game.Length}    得分:{_game.Score}    按 [R] 再来一局";
                break;
            default:
                return;
        }

        var titleSize = g.MeasureString(title, bigFont);
        var subSize   = g.MeasureString(sub,   smallFont);
        // 总高度 = 标题 + 间距 24 + 副标题,整体在棋盘内垂直居中
        float totalH = titleSize.Height + 24 + subSize.Height;
        float ty = boardRect.Y + (boardRect.Height - totalH) / 2f;
        float sy = ty + titleSize.Height + 24;
        float tx = boardRect.X + (boardRect.Width  - titleSize.Width)  / 2f;
        float sx = boardRect.X + (boardRect.Width  - subSize.Width)    / 2f;
        g.DrawString(title, bigFont,   titleBrush, tx, ty);
        g.DrawString(sub,   smallFont, DimTextBrush, sx, sy);
    }

    /// <summary>
    /// 根据当前字体和 DPI 计算 HUD 实际需要的像素高度。
    /// </summary>
    private void CalculateHudHeight()
    {
        // 创建临时 Graphics 对象用于测量
        using var tempGraphics = CreateGraphics();
        using var titleFont = new Font("Microsoft YaHei UI", 12f, FontStyle.Bold, GraphicsUnit.Point);
        using var infoFont  = new Font("Microsoft YaHei UI", 10f, FontStyle.Regular, GraphicsUnit.Point);
        using var hintFont  = new Font("Microsoft YaHei UI", 9.5f, FontStyle.Regular, GraphicsUnit.Point);

        // 第 1 行:状态
        string stateLine = "状态:游戏中"; // 使用最长文本估算
        float totalHeight = HudTopPadding;
        totalHeight += tempGraphics.MeasureString(stateLine, titleFont).Height + HudLineGap;

        // 第 2 行:分数/长度/速度（使用示例文本）
        string infoLine = "分数:  999    长度: 99    速度:999.9 步/秒";
        totalHeight += tempGraphics.MeasureString(infoLine, infoFont).Height + HudLineGap;

        // 第 3 行:操作提示
        string hintLine = "WASD / 方向键 移动    空格 暂停    R 重开    Esc 退出";
        totalHeight += tempGraphics.MeasureString(hintLine, hintFont).Height + HudBottomPadding;

        // 向上取整确保足够空间
        _hudHeight = (int)Math.Ceiling(totalHeight);
    }
}

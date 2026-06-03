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
///   - 双缓冲全量重绘
///   - HUD 区在顶部,棋盘在下方,GameOver/Paused/Waiting 时在棋盘上覆盖半透明遮罩 + 文字
///   - 窗口可自由缩放,CellSize 根据窗口大小动态计算
/// </summary>
internal sealed class MainForm : Form
{
    // ---- 棋盘几何参数(DIP,WinForms 自动按 DPI 缩放) ----
    private const int BoardMargin = 16;    // 棋盘外边距
    private const int MinCellSize = 16;    // 最小单元格大小
    private const int MaxCellSize = 48;    // 最大单元格大小

    // 字体缩放参数
    private const float BaseFontSize = 12f;     // 基准字体大小
    private const float MinFontSize = 6f;       // 最小字体大小
    private const float MaxFontSize = 24f;      // 最大字体大小
    private const int ReferenceWidth = 800;     // 参考窗口宽度

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
    private const float MenuStripExtraPadding = 8f; // MenuStrip 下方的额外间距

    // 动态计算的 HUD 高度
    private int _hudHeight;

    // 菜单
    private MenuStrip? _menuStrip;

    private GameLogic _game; // 非 readonly，因为需要切换地图尺寸时重新创建
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
        // 关键：启用 ResizeRedraw 样式，确保拖拽窗口时自动重绘
        SetStyle(ControlStyles.ResizeRedraw | ControlStyles.AllPaintingInWmPaint | ControlStyles.UserPaint | ControlStyles.OptimizedDoubleBuffer, true);
        
        // 渲染相关
        BackColor = Color.FromArgb(18, 18, 22);
        Text = "贪食蛇 (WindowSnake)";
        FormBorderStyle = FormBorderStyle.Sizable;
        StartPosition = FormStartPosition.CenterScreen;
        KeyPreview = true;

        // 设置最小窗口大小
        MinimumSize = new Size(400, 300);

        // 创建菜单
        CreateMenu();

        // 计算 HUD 实际高度
        CalculateHudHeight();

        // 设置初始客户区大小
        int initialCellSize = 32;
        int clientW = BoardMargin * 2 + initialCellSize * BoardW;
        int clientH = BoardMargin + _hudHeight + initialCellSize * BoardH + BoardMargin;
        ClientSize = new Size(clientW, clientH);

        // 核心游戏逻辑
        _game = new GameLogic(BoardW, BoardH, InitialSpeedMs, MinSpeedMs, SpeedUpEvery);
        _game.StateChanged += (_, _) => Invalidate();

        // 计时器（初始不启动，等待用户按键）
        _timer.Interval = _game.StepIntervalMs;
        _timer.Tick += GameTimer_Tick;

        // 窗口大小改变时重绘并重新计算 HUD
        Resize += (_, _) =>
        {
            CalculateHudHeight();
            Invalidate();
        };
        
        // 拖拽开始时暂停计时器，避免拖拽过程中游戏继续运行导致画面不同步
        ResizeBegin += (_, _) =>
        {
            // 保存拖拽前的运行状态
            if (_game.Status == GameStatus.Running)
            {
                _timer.Stop();
            }
        };
        
        // 拖拽结束时恢复计时器并强制完整重绘
        ResizeEnd += (_, _) =>
        {
            // 恢复游戏运行
            if (_game.Status == GameStatus.Running)
            {
                _timer.Start();
            }
            // 重新计算 HUD 高度（可能窗口大小已改变）
            CalculateHudHeight();
            // 强制立即重绘，清除拖拽残留的旧画面
            Invalidate();
            Update();
        };

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
        // 处理开始游戏
        bool isDirectionKey = keyData is Keys.Up or Keys.Down or Keys.Left or Keys.Right
            or Keys.W or Keys.S or Keys.A or Keys.D;
        
        if ((isDirectionKey || keyData == Keys.Space) && _game.Status == GameStatus.Waiting)
        {
            _game.StartGame();
            _timer.Start();
            
            // 如果是方向键，设置方向
            if (isDirectionKey)
            {
                switch (keyData)
                {
                    case Keys.Up: case Keys.W:     _game.TrySetDirection(Direction.Up);    break;
                    case Keys.Down: case Keys.S:   _game.TrySetDirection(Direction.Down);  break;
                    case Keys.Left: case Keys.A:   _game.TrySetDirection(Direction.Left);  break;
                    case Keys.Right: case Keys.D:  _game.TrySetDirection(Direction.Right); break;
                }
            }
            return true; // 已经处理，不再继续
        }

        // 非 Waiting 状态的按键处理
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
                    _timer.Stop(); // 重置后停止计时器，等待重新开始
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

        // 动态计算字体大小
        float titleFontSize = CalculateFontSize(12f);
        float infoFontSize = CalculateFontSize(10f);
        float hintFontSize = CalculateFontSize(9.5f);

        // 字体集中创建一次
        using var titleFont = new Font("Microsoft YaHei UI", titleFontSize, FontStyle.Bold, GraphicsUnit.Point);
        using var infoFont  = new Font("Microsoft YaHei UI", infoFontSize, FontStyle.Regular, GraphicsUnit.Point);
        using var hintFont  = new Font("Microsoft YaHei UI", hintFontSize, FontStyle.Regular, GraphicsUnit.Point);

        // 关键修复：HUD 绘制起始位置需要跳过 MenuStrip 的高度
        float menuStripHeight = _menuStrip?.Height ?? 0;
        float x = BoardMargin;
        float y = menuStripHeight + HudTopPadding;

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

        // 第 2 行:分数 / 长度 / 速度 / 地图
        double stepsPerSec = 1000.0 / _game.StepIntervalMs;
        string info = $"分数:{_game.Score,5}    长度:{_game.Length,3}    速度:{stepsPerSec,5:F1} 步/秒    地图:{_game.BoardWidth}x{_game.BoardHeight}";
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
        // 动态计算单元格大小
        int cellSize = CalculateCellSize();

        // 居中计算
        int boardPixelW = cellSize * _game.BoardWidth;
        int boardPixelH = cellSize * _game.BoardHeight;
        int ox = BoardMargin + (ClientSize.Width - BoardMargin * 2 - boardPixelW) / 2;
        int oy = _hudHeight + BoardMargin + (ClientSize.Height - _hudHeight - BoardMargin * 2 - boardPixelH) / 2;

        // 棋盘底色
        g.FillRectangle(BoardBrush, ox, oy, boardPixelW, boardPixelH);

        // 内部网格线(只在内部格之间画)
        for (int x = 1; x < _game.BoardWidth; x++)
        {
            g.DrawLine(GridPen,
                ox + x * cellSize, oy,
                ox + x * cellSize, oy + boardPixelH);
        }
        for (int y = 1; y < _game.BoardHeight; y++)
        {
            g.DrawLine(GridPen,
                ox,           oy + y * cellSize,
                ox + boardPixelW, oy + y * cellSize);
        }

        // 边框格(整格填充深灰)
        for (int x = 0; x < _game.BoardWidth; x++)
        {
            for (int y = 0; y < _game.BoardHeight; y++)
            {
                if (x == 0 || x == _game.BoardWidth - 1 || y == 0 || y == _game.BoardHeight - 1)
                {
                    g.FillRectangle(BorderBrush,
                        ox + x * cellSize,
                        oy + y * cellSize,
                        cellSize, cellSize);
                }
            }
        }

        // 食物(圆)
        var foodRect = new Rectangle(
            ox + _game.Food.X * cellSize + cellSize / 8,
            oy + _game.Food.Y * cellSize + cellSize / 8,
            cellSize - cellSize / 4,
            cellSize - cellSize / 4);
        g.FillEllipse(FoodBrush, foodRect);

        // 蛇(头在前)
        int index = 0;
        foreach (var p in _game.Snake)
        {
            var rect = new Rectangle(
                ox + p.X * cellSize + 1,
                oy + p.Y * cellSize + 1,
                cellSize - 2,
                cellSize - 2);
            if (index == 0) g.FillRectangle(SnakeHeadBrush, rect);
            else            g.FillRectangle(SnakeBodyBrush, rect);
            index++;
        }
    }

    /// <summary>
    /// 根据窗口大小动态计算单元格大小。
    /// </summary>
    private int CalculateCellSize()
    {
        int availableW = ClientSize.Width - BoardMargin * 2;
        int availableH = ClientSize.Height - _hudHeight - BoardMargin * 2;

        int cellW = availableW / _game.BoardWidth;
        int cellH = availableH / _game.BoardHeight;

        int cellSize = Math.Min(cellW, cellH);
        return Math.Max(MinCellSize, Math.Min(MaxCellSize, cellSize));
    }

    /// <summary>
    /// 根据窗口大小动态计算字体大小。
    /// </summary>
    private float CalculateFontSize(float baseSize)
    {
        float scale = (float)ClientSize.Width / ReferenceWidth;
        float fontSize = baseSize * scale;
        return Math.Max(MinFontSize, Math.Min(MaxFontSize, fontSize));
    }

    /// <summary>
    /// 计算 HUD 区域高度（内部方法，避免重复代码）。
    /// </summary>
    private int CalculateHudHeightInternal()
    {
        using var tempGraphics = CreateGraphics();
        tempGraphics.SmoothingMode = SmoothingMode.AntiAlias;
        
        float titleFontSize = CalculateFontSize(12f);
        float infoFontSize = CalculateFontSize(10f);
        float hintFontSize = CalculateFontSize(9.5f);

        using var titleFont = new Font("Microsoft YaHei UI", titleFontSize, FontStyle.Bold, GraphicsUnit.Point);
        using var infoFont  = new Font("Microsoft YaHei UI", infoFontSize, FontStyle.Regular, GraphicsUnit.Point);
        using var hintFont  = new Font("Microsoft YaHei UI", hintFontSize, FontStyle.Regular, GraphicsUnit.Point);

        // 关键修复：HUD 高度必须包含 MenuStrip 的高度
        float menuStripHeight = _menuStrip?.Height ?? 0;
        float totalHeight = menuStripHeight + HudTopPadding;
        
        string stateLine = "状态:游戏中";
        totalHeight += tempGraphics.MeasureString(stateLine, titleFont).Height + HudLineGap;

        string infoLine = "分数:  999    长度: 99    速度:999.9 步/秒    地图:99x99";
        totalHeight += tempGraphics.MeasureString(infoLine, infoFont).Height + HudLineGap;

        string hintLine = "WASD / 方向键 移动    空格 暂停    R 重开    Esc 退出";
        totalHeight += tempGraphics.MeasureString(hintLine, hintFont).Height + HudBottomPadding;

        return (int)Math.Ceiling(totalHeight);
    }

    private void DrawOverlay(Graphics g)
    {
        if (_game.Status == GameStatus.Running) return;

        int cellSize = CalculateCellSize();
        int boardPixelW = cellSize * _game.BoardWidth;
        int boardPixelH = cellSize * _game.BoardHeight;
        int ox = BoardMargin + (ClientSize.Width - BoardMargin * 2 - boardPixelW) / 2;
        int oy = _hudHeight + BoardMargin + (ClientSize.Height - _hudHeight - BoardMargin * 2 - boardPixelH) / 2;

        var boardRect = new Rectangle(ox, oy, boardPixelW, boardPixelH);
        g.FillRectangle(OverlayBrush, boardRect);

        // 动态计算字体大小
        float bigFontSize = CalculateFontSize(32f);
        float smallFontSize = CalculateFontSize(12f);

        using var bigFont   = new Font("Microsoft YaHei UI", bigFontSize, FontStyle.Bold, GraphicsUnit.Point);
        using var smallFont = new Font("Microsoft YaHei UI", smallFontSize, FontStyle.Regular, GraphicsUnit.Point);

        string title, sub;
        Brush titleBrush = TextBrush;
        switch (_game.Status)
        {
            case GameStatus.Waiting:
                title = "贪 食 蛇";
                sub = "按 [方向键] 或 [空格] 开始游戏";
                break;
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
        _hudHeight = CalculateHudHeightInternal();
    }

    /// <summary>
    /// 创建菜单栏。
    /// </summary>
    private void CreateMenu()
    {
        _menuStrip = new MenuStrip();
        _menuStrip.BackColor = Color.FromArgb(30, 30, 35);
        _menuStrip.ForeColor = Color.White;

        // 游戏菜单
        var gameMenu = new ToolStripMenuItem("游戏(&G)");
        
        var newGameItem = new ToolStripMenuItem("新游戏(&N)", null, NewGame_Click, Keys.Control | Keys.N);
        gameMenu.DropDownItems.Add(newGameItem);

        gameMenu.DropDownItems.Add(new ToolStripSeparator());

        // 地图尺寸子菜单
        var sizeMenu = new ToolStripMenuItem("地图尺寸(&M)");
        var sizeSmall = new ToolStripMenuItem("小型 (15x15)", null, (s, e) => ChangeBoardSize(15, 15));
        var sizeMedium = new ToolStripMenuItem("中型 (25x25)", null, (s, e) => ChangeBoardSize(25, 25)) { Checked = true };
        var sizeLarge = new ToolStripMenuItem("大型 (35x35)", null, (s, e) => ChangeBoardSize(35, 35));
        var sizeExtraLarge = new ToolStripMenuItem("超大型 (45x45)", null, (s, e) => ChangeBoardSize(45, 45));
        
        sizeMenu.DropDownItems.AddRange(new ToolStripItem[] { sizeSmall, sizeMedium, sizeLarge, sizeExtraLarge });
        
        sizeMenu.DropDownItems.Add(new ToolStripSeparator());
        
        var customSizeItem = new ToolStripMenuItem("自定义大小...", null, CustomSize_Click);
        sizeMenu.DropDownItems.Add(customSizeItem);
        
        gameMenu.DropDownItems.Add(sizeMenu);

        gameMenu.DropDownItems.Add(new ToolStripSeparator());

        var exitItem = new ToolStripMenuItem("退出(&X)", null, (s, e) => Close());
        gameMenu.DropDownItems.Add(exitItem);

        _menuStrip.Items.Add(gameMenu);

        // 帮助菜单
        var helpMenu = new ToolStripMenuItem("帮助(&H)");
        var aboutItem = new ToolStripMenuItem("关于(&A)", null, About_Click);
        helpMenu.DropDownItems.Add(aboutItem);

        _menuStrip.Items.Add(helpMenu);

        // 将菜单添加到窗体
        MainMenuStrip = _menuStrip;
        Controls.Add(_menuStrip);
    }

    /// <summary>
    /// 新游戏：重置游戏到 Waiting 状态。
    /// </summary>
    private void NewGame_Click(object? sender, EventArgs e)
    {
        _timer.Stop();
        _game.Reset();
        Invalidate();
    }

    /// <summary>
    /// 显示自定义地图尺寸对话框。
    /// </summary>
    private void CustomSize_Click(object? sender, EventArgs e)
    {
        using var dialog = new Form
        {
            Text = "自定义地图尺寸",
            FormBorderStyle = FormBorderStyle.FixedDialog,
            MaximizeBox = false,
            MinimizeBox = false,
            StartPosition = FormStartPosition.CenterParent,
            Size = new System.Drawing.Size(320, 180),
            BackColor = Color.FromArgb(30, 30, 35)
        };

        var lblWidth = new Label
        {
            Text = "宽度 (6-50):",
            Location = new System.Drawing.Point(20, 20),
            Size = new System.Drawing.Size(100, 20),
            ForeColor = Color.White,
            TextAlign = ContentAlignment.MiddleRight
        };

        var txtWidth = new TextBox
        {
            Location = new System.Drawing.Point(130, 18),
            Size = new System.Drawing.Size(80, 20),
            Text = _game.BoardWidth.ToString()
        };

        var lblHeight = new Label
        {
            Text = "高度 (6-50):",
            Location = new System.Drawing.Point(20, 50),
            Size = new System.Drawing.Size(100, 20),
            ForeColor = Color.White,
            TextAlign = ContentAlignment.MiddleRight
        };

        var txtHeight = new TextBox
        {
            Location = new System.Drawing.Point(130, 48),
            Size = new System.Drawing.Size(80, 20),
            Text = _game.BoardHeight.ToString()
        };

        var btnOk = new Button
        {
            Text = "确定",
            Location = new System.Drawing.Point(80, 90),
            Size = new System.Drawing.Size(70, 30),
            DialogResult = DialogResult.OK
        };

        var btnCancel = new Button
        {
            Text = "取消",
            Location = new System.Drawing.Point(160, 90),
            Size = new System.Drawing.Size(70, 30),
            DialogResult = DialogResult.Cancel
        };

        dialog.Controls.AddRange(new Control[] { lblWidth, txtWidth, lblHeight, txtHeight, btnOk, btnCancel });
        dialog.AcceptButton = btnOk;
        dialog.CancelButton = btnCancel;

        if (dialog.ShowDialog(this) == DialogResult.OK)
        {
            if (int.TryParse(txtWidth.Text, out int width) && int.TryParse(txtHeight.Text, out int height))
            {
                if (width >= 6 && width <= 50 && height >= 6 && height <= 50)
                {
                    ChangeBoardSize(width, height);
                }
                else
                {
                    MessageBox.Show(
                        "地图尺寸必须在 6-50 之间！",
                        "错误",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Warning);
                }
            }
            else
            {
                MessageBox.Show(
                    "请输入有效的数字！",
                    "错误",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);
            }
        }
    }

    /// <summary>
    /// 改变地图尺寸。
    /// </summary>
    private void ChangeBoardSize(int width, int height)
    {
        // 停止计时器
        _timer.Stop();

        // 重新创建游戏逻辑
        _game = new GameLogic(width, height, InitialSpeedMs, MinSpeedMs, SpeedUpEvery);
        _game.StateChanged += (_, _) => Invalidate();

        // 重新计算 HUD 高度
        CalculateHudHeight();

        // 调整窗口大小到新地图
        int initialCellSize = 32;
        int clientW = BoardMargin * 2 + initialCellSize * width;
        int clientH = BoardMargin + _hudHeight + initialCellSize * height + BoardMargin;
        ClientSize = new Size(clientW, clientH);

        // 重置计时器
        _timer.Interval = _game.StepIntervalMs;

        // 更新菜单选中状态
        UpdateMenuCheckState(width, height);

        Invalidate();
    }

    /// <summary>
    /// 更新地图尺寸菜单的选中状态。
    /// </summary>
    private void UpdateMenuCheckState(int width, int height)
    {
        if (_menuStrip == null) return;

        var gameMenu = (ToolStripMenuItem)_menuStrip.Items[0];
        var sizeMenu = (ToolStripMenuItem)gameMenu.DropDownItems[2]; // 地图尺寸

        foreach (ToolStripMenuItem item in sizeMenu.DropDownItems)
        {
            item.Checked = false;
        }

        // 根据尺寸设置选中
        if (width == 15 && height == 15) ((ToolStripMenuItem)sizeMenu.DropDownItems[0]).Checked = true;
        else if (width == 25 && height == 25) ((ToolStripMenuItem)sizeMenu.DropDownItems[1]).Checked = true;
        else if (width == 35 && height == 35) ((ToolStripMenuItem)sizeMenu.DropDownItems[2]).Checked = true;
        else if (width == 45 && height == 45) ((ToolStripMenuItem)sizeMenu.DropDownItems[3]).Checked = true;
    }

    /// <summary>
    /// 显示关于对话框。
    /// </summary>
    private void About_Click(object? sender, EventArgs e)
    {
        MessageBox.Show(
            "贪食蛇 (WindowSnake)\n\n" +
            "一个使用 C# WinForms 开发的经典贪食蛇游戏。\n\n" +
            "操作说明：\n" +
            "• 方向键或 WASD 移动\n" +
            "• 空格键暂停/继续\n" +
            "• R 键重新开始\n" +
            "• Esc 退出游戏\n\n" +
            "© 2026 WindowSnake",
            "关于",
            MessageBoxButtons.OK,
            MessageBoxIcon.Information);
    }
}

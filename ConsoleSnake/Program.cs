namespace SnakeGame;

/// <summary>
/// 贪食蛇游戏 - 主入口。
///
/// 操作:
///   - 方向键 / WASD   移动
///   - 空格            暂停 / 继续
///   - Q / Esc         退出
///   - 撞墙 / 撞自己  游戏结束
///
/// 运行:
///   dotnet run
///   或者在 Visual Studio 中按 F5 启动。
/// </summary>
internal static class Program
{
    private const int BoardWidth       = 40;
    private const int BoardHeight      = 20;
    private const int InitialSpeedMs   = 130;   // 每步间隔 (毫秒), 数值越小越快
    private const int MinSpeedMs       = 55;
    private const int SpeedUpEveryFood = 3;     // 每吃 N 个食物提速一次

    private static void Main()
    {
        if (!TryPrepareConsole())
        {
            // 在没有交互式控制台的环境(比如后台重定向、IDE 的 NoNewWindow 调试等)里
            // 几乎所有 Console API 都会抛 IOException,此时直接退出即可
            return;
        }

        var game = new Game(BoardWidth, BoardHeight, InitialSpeedMs, MinSpeedMs, SpeedUpEveryFood);
        while (true)
        {
            game.Run();

            if (!WaitForRestartChoice())
                break;

            Console.CursorVisible = false;
            game.Reset();
        }

        Console.CursorVisible = true;
        Console.SetCursorPosition(0, BoardHeight + 4);
        Console.WriteLine("感谢游玩,再见!");
    }

    /// <summary>
    /// 试着初始化控制台环境,如果没有可用的交互式控制台就返回 false。
    /// </summary>
    private static bool TryPrepareConsole()
    {
        try
        {
            Console.OutputEncoding = System.Text.Encoding.UTF8;
            Console.CursorVisible = false;
            Console.Title = "贪食蛇 (Snake)";
            // 这里会真正触发控制台句柄初始化
            _ = Console.WindowWidth;
            return true;
        }
        catch
        {
            // 没有可用的交互式控制台(例如后台重定向、调试器 NoNewWindow 等)
            // 此时所有 Console API 都会失效,游戏无法运行,静默退出
            return false;
        }
    }

    /// <summary>等待玩家按 Enter(重玩)或 Q / Esc(退出)。</summary>
    private static bool WaitForRestartChoice()
    {
        while (true)
        {
            var key = Console.ReadKey(intercept: true);
            switch (key.Key)
            {
                case ConsoleKey.Enter:
                case ConsoleKey.R:
                    return true;
                case ConsoleKey.Q:
                case ConsoleKey.Escape:
                    return false;
            }
        }
    }
}

using System;
using System.Windows.Forms;

namespace WindowSnake;

/// <summary>
/// 窗口版贪食蛇 - 主入口。
///
/// 运行:
///   dotnet run --project WindowSnake
///   或者在 Visual Studio 中按 F5 启动。
/// </summary>
internal static class Program
{
    [STAThread]
    private static void Main()
    {
        // .NET 6+ 推荐写法:集中设置视觉样式、高 DPI、字体等
        ApplicationConfiguration.Initialize();
        Application.Run(new MainForm());
    }
}

# 窗口版贪食蛇 (WindowSnake)

[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet&logoColor=white)](#系统要求)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D4?logo=windows&logoColor=white)](#系统要求)
[![UI](https://img.shields.io/badge/UI-WinForms-2C7BBB)](#技术栈)
[![License](https://img.shields.io/badge/License-MIT-green)](#许可)

一个用 C# / .NET 8 + Windows Forms 实现的窗口版贪食蛇游戏，与 [ConsoleSnake](../ConsoleSnake) 共用一套核心玩法,
但用真正的窗口、双缓冲 GDI+ 渲染,支持方向键与 WASD 双套操作。

---

## 目录

- [功能特性](#功能特性)
- [运行截图](#运行截图)
- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [游戏操作](#游戏操作)
- [项目结构](#项目结构)
- [构建与发布](#构建与发布)
- [代码架构](#代码架构)
- [可调参数](#可调参数)
- [兼容性与限制](#兼容性与限制)
- [常见问题](#常见问题)
- [路线图](#路线图)
- [许可](#许可)

---

## 功能特性

- **双套操作**:方向键(↑↓←→)与 WASD 都能控制移动,手感一致。
- **暂停 / 继续**:随时按空格暂停,再按一次或任意方向键继续。
- **难度递增**:每吃 3 个食物,蛇的移动速度提升一档(步进间隔 -10ms),最低不低于 55ms。
- **胜利条件**:把整张地图都填满(身体占据所有内部格子)即通关。
- **状态覆盖层**:游戏结束 / 暂停 / 胜利时,在棋盘上覆盖半透明遮罩 + 大字提示,清楚交代下一步操作。
- **顶部 HUD**:实时显示状态(游戏中/已暂停/游戏结束/胜利)、分数、蛇长、速度(步/秒)与操作提示。
- **DPI 感知**:通过 `app.manifest` 声明 PerMonitorV2,在 4K / 高分屏下图形不会糊。
- **逻辑与渲染解耦**:`GameLogic` 不引用任何 WinForms 类型,日后可零成本替换为 WPF / Avalonia / 控制台前端。
- **零额外 NuGet 依赖**:只用 .NET 8 SDK 自带的 `Microsoft.WindowsDesktop.App.WindowsForms`。

---

## 运行截图

下面用 ASCII 形式示意游戏画面:

```
┌────────────────────────────────────────────┐
│ 状态: 游戏中                                │
│ 分数:    40    长度:   7    速度:  7.7 步/秒   方向键/WASD 移动   空格 暂停   R 重开   Esc 退出
├────────────────────────────────────────────┤
│ ##########################################  │
│ #                                        #  │
│ #                  ●                     #  │
│ #                                        #  │
│ #                       ■■■■■           #  │
│ #                            ■           #  │
│ #                                        #  │
│ #                                        #  │
│ ##########################################  │
└────────────────────────────────────────────┘
   ▲ ■=蛇身(深绿)  ●=蛇头(亮绿)  ●=食物(红圆)
```

实际运行后是真正的 Windows 窗口,带标题栏、边框、可拖动、可关闭。

---

## 系统要求

- **操作系统**:Windows 10 1809(17763)或更高 / Windows 11
- **运行时**:.NET 8 SDK(开发用)**或** .NET 8 Desktop Runtime(纯运行用)
- **屏幕**:任意分辨率,DPI 缩放自适应
- **依赖**:**不需要 Visual Studio**,只要 `dotnet` CLI
- **架构**:Any CPU(同时支持 x86 / x64 / ARM64 Windows)

> 如果你之前装过 Visual Studio 又删了,只要安装 .NET 8 SDK 即可,完全够用。

---

## 快速开始

### 0. 安装 .NET 8 SDK(如果还没有)

到 [https://dotnet.microsoft.com/download/dotnet/8.0](https://dotnet.microsoft.com/download/dotnet/8.0) 下载
**`.NET 8.0 SDK`**(不是 Runtime)安装。

装完后,在 PowerShell 里验证:

```powershell
dotnet --list-sdks
# 应该能看到类似:
#   8.0.xxx [C:\Program Files\dotnet\sdk]

dotnet --list-runtimes
# 应该能看到:
#   Microsoft.WindowsDesktop.App 8.0.xxx [...]
```

`Microsoft.WindowsDesktop.App` 这一项必须存在,这是 Windows Forms 的运行时。

### 1. 进入项目目录

```powershell
cd d:\Projects\TestCSharp\WindowSnake
```

### 2. 还原 + 运行

```powershell
dotnet run
```

第一次会还原 NuGet 包并编译,之后秒启。

### 3. 或者只编译再运行

```powershell
dotnet build -c Release
.\bin\Release\net8.0-windows\WindowSnake.exe
```

---

## 游戏操作

| 按键 | 作用 |
|---|---|
| `↑` / `W` | 向上 |
| `↓` / `S` | 向下 |
| `←` / `A` | 向左 |
| `→` / `D` | 向右 |
| `Space` / `P` | 暂停 / 继续 |
| `R` | 游戏结束后重新开始 |
| `Esc` | 退出游戏 |

> 180 度掉头(例如正在向右时按 ←)会被忽略,不会自杀。
> 暂停时按方向键,会同时解除暂停并改变方向。

---

## 项目结构

```
WindowSnake\
├── WindowSnake.sln          解决方案文件
├── WindowSnake.csproj       项目配置(net8.0-windows, WinForms)
├── app.manifest             DPI 感知 + Windows 10/11 兼容性声明
├── Program.cs               入口点:ApplicationConfiguration + 启动 MainForm
├── MainForm.cs              窗口、计时器、输入处理、GDI+ 渲染
├── GameLogic.cs             核心游戏逻辑(蛇、食物、碰撞、状态机) — 纯 C#,无 UI 依赖
├── Point.cs                 网格坐标 record struct
├── bin\                     编译输出
└── obj\                     编译中间产物
```

---

## 构建与发布

### 调试构建

```powershell
dotnet build
dotnet run
```

### Release 构建(不发布,只产 exe)

```powershell
dotnet build -c Release
```

### 发布为独立单文件可执行(可在没有 .NET 环境的机器上运行)

```powershell
# x64 平台,自包含,单文件,裁剪未启用(Windows Forms 暂不建议 trim)
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true
```

输出在 `bin\Release\net8.0-windows\win-x64\publish\WindowSnake.exe`,把整个目录拷给朋友就能玩。

### 发布为依赖系统运行时的轻量 exe(机器上装了 .NET 8 Desktop Runtime 即可)

```powershell
dotnet publish -c Release -r win-x64 --self-contained false -p:PublishSingleFile=true
```

输出文件非常小(几百 KB),目标机器需要先装 .NET 8 Desktop Runtime。

---

## 代码架构

整体遵循"逻辑 / 渲染分离"原则:

```
┌──────────────────┐        ┌──────────────────┐
│   Program.cs     │        │  Windows Forms   │
│   (入口)         │───────▶│   System.Windows  │
└──────────────────┘        └────────┬─────────┘
                                      │ 持有
                                      ▼
                             ┌──────────────────┐
                             │    MainForm      │
                             │  ─ 计时器        │  每 N ms
                             │  ─ OnPaint       │  全量重绘
                             │  ─ ProcessCmdKey │  拦截输入
                             └────────┬─────────┘
                                      │ Tick / TrySetDirection
                                      │ TogglePause / Reset
                                      ▼
                             ┌──────────────────┐
                             │   GameLogic      │
                             │  ─ 蛇 LinkedList │  与 UI 完全解耦
                             │  ─ 食物 Random   │  可单独单元测试
                             │  ─ 碰撞检测      │
                             │  ─ 状态机        │
                             └──────────────────┘
```

### 关键设计点

1. **`GameLogic` 不引用 `System.Windows.Forms`**,所以你随时可以把它搬到控制台、WPF、Unity、单元测试里。
2. **`StateChanged` 事件**:游戏内任何状态变化(步进、暂停、结束、胜利、重置)都会触发,UI 收到后调用 `Invalidate()` 重绘。
3. **`ProcessCmdKey` 而非 `OnKeyDown`**:在命令键分发到控件前拦截,即便以后在窗口里放按钮也能正确处理方向键。
4. **双缓冲 + 全量重绘**:棋盘 25×20 = 500 格,性能毫无压力,代码更简单。改用脏矩形优化也是一两行的事。
5. **DPI**:通过 `app.manifest` 声明 PerMonitorV2,WinForms 会自动把 32 DIP 缩放到当前 DPI 对应的物理像素。
6. **常量集中在 `MainForm` 顶部**:调参只需改 `BoardW` / `BoardH` / `InitialSpeedMs` 等。

---

## 可调参数

全部在 [MainForm.cs](MainForm.cs) 顶部以 `const` 暴露:

| 常量 | 默认值 | 含义 |
|---|---|---|
| `CellSize` | `32` | 每格 DIP 像素大小,改大就是"大屏版" |
| `HudHeight` | `60` | 顶部 HUD 区高度 |
| `Margin` | `12` | 棋盘外边距 |
| `BoardW` | `25` | 棋盘逻辑宽度(含墙) |
| `BoardH` | `20` | 棋盘逻辑高度(含墙) |
| `InitialSpeedMs` | `130` | 起步每步间隔,数值越小越快 |
| `MinSpeedMs` | `55` | 提速下限,达到后不再加速 |
| `SpeedUpEvery` | `3` | 每吃 N 个食物提速一档 |

要更刺激就把 `InitialSpeedMs` 调到 80;要休闲调到 200。

---

## 兼容性与限制

- **仅 Windows**:依赖 WinForms;Linux / macOS 用户需用 Wine 或者改写为跨平台框架。
- **高分屏**:已声明 PerMonitorV2,但如果你的 Windows 是 1903 之前的版本,可能降级为系统 DPI 感知。
- **无音效**:目前没有背景音乐 / 吃食物音效(见路线图)。
- **无存档**:关闭窗口后没有"最高分"持久化。
- **无障碍**:暂不支持自定义键位 / 色盲友好主题。

---

## 常见问题

**Q: 运行 `dotnet run` 报错 "MSB4019: 找不到 Microsoft.NET.Sdk.WindowsDesktop"**  
A: 你只装了 .NET Runtime,没装 SDK。请到 [https://dotnet.microsoft.com/download/dotnet/8.0](https://dotnet.microsoft.com/download/dotnet/8.0) 下载 **SDK** 完整安装。

**Q: 双击 exe 报错 "无法启动此应用程序"**  
A: 同上,需要 .NET 8 Desktop Runtime,或使用自包含发布(见"构建与发布")。

**Q: 编译报 "UseWindowsForms" 不识别**  
A: 确认 `WindowSnake.csproj` 里有 `<UseWindowsForms>true</UseWindowsForms>` 且 `TargetFramework` 是 `net8.0-windows` 而非 `net8.0`。

**Q: 高 DPI 屏上方格看起来不正方形?**  
A: 应该不会。如果遇到,检查系统 DPI 缩放是否被某个外部工具强制改成旧版 DPI 感知。

**Q: 能改成中文 UI 之外的英文 UI 吗?**  
A: 完全可以。所有可见文字都集中在 `MainForm.cs` 的 `DrawHud` / `DrawOverlay` 中,直接替换为英文即可。

**Q: 怎么改成横屏更大的棋盘?**  
A: 改 `BoardW` / `BoardH`,如果想保持窗口不超出屏幕,顺手把 `CellSize` 也调小。

---

## 路线图

- [ ] 音效:吃食物、撞墙、胜利
- [ ] 最高分持久化(`%AppData%\WindowSnake\highscore.json`)
- [ ] 暂停菜单(继续 / 重新开始 / 退出)
- [ ] 皮肤切换(经典绿 / 蓝紫 / 高对比度色盲友好)
- [ ] 撞墙"无敌闪烁"反馈
- [ ] 单元测试:把 `GameLogic` 抽出来跑 xUnit

---

## 许可

[MIT License](LICENSE) — 自由使用、修改、分发。

---

如果你是从 [ConsoleSnake](../ConsoleSnake) 过来的,会发现 `GameLogic.cs` 与 `Game.cs` 的算法几乎一致,
但 `GameLogic` 把 `Render()` 拆给了 `MainForm`,`Input` 拆给了 `MainForm.ProcessCmdKey`,
从而做到"一份核心逻辑、多种前端"。

# 贪食蛇 (SnakeGame)

一款用 C# / .NET 8 实现的经典控制台贪食蛇游戏,代码量精简、零依赖,既能像普通程序一样直接双击运行,也能作为 .NET 控制台项目在 Visual Studio / VS Code 里二次开发。

![Tech](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Windows%2010%2F11-0078D4?logo=windows)
![Runtime](https://img.shields.io/badge/Runtime-Self--contained-success)
![Size](https://img.shields.io/badge/Size-~10%20MB-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 目录

- [功能特性](#功能特性)
- [运行截图](#运行截图)
- [系统要求](#系统要求)
- [快速开始](#快速开始)
  - [方式一:直接运行(推荐)](#方式一直接运行推荐)
  - [方式二:从源码编译](#方式二从源码编译)
- [游戏操作](#游戏操作)
- [项目结构](#项目结构)
- [构建与发布](#构建与发布)
- [代码架构](#代码架构)
- [可调参数](#可调参数)
- [兼容性与限制](#兼容性与限制)
- [常见问题](#常见问题)
- [路线图 / 可改进点](#路线图--可改进点)
- [许可](#许可)

---

## 功能特性

- 🐍 **经典玩法** — 方向键 / WASD 操控,撞墙或撞自己即结束
- ⏸ **随时暂停** — 空格键暂停 / 继续,暂停时按方向键自动恢复
- 🚀 **渐进提速** — 每吃 3 个食物速度 +1 档,最低不低于 55 ms/步
- 🏆 **胜利条件** — 蛇身填满整张地图即获胜
- 🔁 **一键重开** — 游戏结束后按 `Enter` / `R` 直接重玩,无需重启程序
- 🖥 **零闪烁渲染** — 双重缓冲 + 脏矩形标记,只刷新发生变化的格子
- 📦 **真正单文件** — 自包含 .NET 运行时,**目标电脑无需安装 .NET**
- 🛡 **健壮启动** — 在无控制台环境(后台 / 重定向)中优雅退出而非崩溃
- 🧹 **零外部依赖** — 项目本身没有任何 NuGet 包,纯 BCL 实现
- 🌐 **UTF-8 控制台** — 正确显示中文标题与提示

---

## 运行截图

```
########################################
#                                      #
#              *                       #
#                                      #
#                  @oo                 #
#                                      #
#                                      #
#                                      #
#                                      #
#                                      #
#                                      #
#                                      #
#                                      #
#                                      #
#                                      #
#                                      #
#                                      #
#                                      #
#                                      #
########################################
 分数:    40    长度:   5    速度:  7.7 步/秒
 操作: 方向键 / WASD 移动    空格 = 暂停    Q / Esc = 退出
  --- 游戏进行中 ---
```

---

## 系统要求

| 项目 | 最低要求 |
|---|---|
| 操作系统 | Windows 10 (1809+) / Windows 11 / Windows Server 2019+ |
| 架构 | x64 (64 位) |
| 磁盘空间 | ~12 MB(单 exe) |
| .NET 运行时 | **不需要**(已嵌入 exe) |
| 控制台 | 支持 UTF-8 的真实终端(PowerShell / Windows Terminal / cmd 均可) |

> **不兼容** Windows 7 / 8 / XP(需另行发布 win-x86 单文件版,详见下文)。

---

## 快速开始

### 方式一:直接运行(推荐)

发布好的单文件 exe 已放在:

```
bin\Release\net8.0\win-x64\publish\SnakeGame.exe
```

**直接双击**即可开始游戏,或在 PowerShell / cmd 中执行:

```powershell
.\SnakeGame.exe
```

> 整个文件夹只需要这一个 exe,**拷到任何 64 位 Windows 10/11 电脑都能玩**。

### 方式二:从源码编译

#### 前置条件

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)(验证版本:8.0.421)
- 任意编辑器:Visual Studio 2022 / VS Code + C# Dev Kit / Rider

#### 命令行运行

```powershell
# 进入项目目录
cd d:\Projects\TestCSharp

# 还原 + 编译 + 运行
dotnet run -c Release
```

#### Visual Studio 中运行

1. 双击打开 `SnakeGame.sln`
2. 按 `F5`(调试)或 `Ctrl + F5`(不调试)启动

---

## 游戏操作

| 按键 | 作用 |
|---|---|
| `↑` `↓` `←` `→` | 控制蛇的移动方向 |
| `W` `A` `S` `D` | 同上(为熟悉 FPS 游戏的玩家准备) |
| `Space` | 暂停 / 继续;暂停时按方向键自动恢复 |
| `Q` 或 `Esc` | 主动结束当前一局 |
| 游戏结束后 `Enter` 或 `R` | 重新开始一局 |
| 游戏结束后 `Q` 或 `Esc` | 退出程序 |

**规则**

- 每吃到一个 `*`(食物)得 10 分,蛇身 +1
- 每吃 3 个食物,移动间隔减少 10 ms(最高提速到 55 ms/步)
- 蛇头撞墙(`#`)或撞到自己的身体 → 游戏结束
- 蛇身填满整张地图 → 胜利
- 不可 180° 掉头(防止快速连按两键自尽)

---

## 项目结构

```
TestCSharp/
├── SnakeGame.sln              # Visual Studio 解决方案文件
├── SnakeGame.csproj           # .NET 8 项目配置
├── Program.cs                 # 入口: 控制台初始化 + 主循环
├── Game.cs                    # 游戏主类(渲染、输入、碰撞、状态机)
├── Point.cs                   # 网格坐标 record struct
├── bin/                       # 编译输出(运行 dotnet build 后生成)
│   └── Release/
│       └── net8.0/
│           └── win-x64/
│               └── publish/
│                   └── SnakeGame.exe   # ← 最终分发的单文件 exe
└── obj/                       # dotnet 生成的中间文件(可随时删除)
```

### 各文件职责

| 文件 | 行数 | 职责 |
|---|---|---|
| [Point.cs](Point.cs) | 10 | 不可变值类型网格坐标,重载 `+` 让 `head + delta` 直接得到新头位置 |
| [Program.cs](Program.cs) | 90 | 程序入口,初始化控制台,负责"一局接一局"的主循环 |
| [Game.cs](Game.cs) | 377 | 全部游戏逻辑: 状态机、输入、碰撞、食物生成、脏矩形渲染 |
| [SnakeGame.csproj](SnakeGame.csproj) | 15 | .NET 8 项目元数据,启用 nullable、隐式 using、最新语言版本 |

---

## 构建与发布

### 仅构建(开发用)

```powershell
dotnet build -c Release
```

产物:`bin\Release\net8.0\SnakeGame.dll`(< 20 KB,需 .NET 8 运行时才能跑)

### 发布为可分发单文件 exe(本项目用的命令)

```powershell
dotnet publish -c Release -r win-x64 `
    --self-contained true `
    -p:PublishSingleFile=true `
    -p:PublishTrimmed=true `
    -p:EnableCompressionInSingleFile=true `
    -p:DebugType=embedded `
    -nologo
```

产物:`bin\Release\net8.0\win-x64\publish\SnakeGame.exe`(~10 MB,自带 .NET 8 运行时)

### 各参数含义

| 参数 | 作用 |
|---|---|
| `-c Release` | Release 优化配置 |
| `-r win-x64` | 目标运行时:64 位 Windows |
| `--self-contained true` | **把 .NET 运行时嵌入 exe**,目标电脑无需预装 |
| `-p:PublishSingleFile=true` | **合并为单文件**(无附属 dll) |
| `-p:PublishTrimmed=true` | **裁剪未使用的 BCL 代码**,从 ~70 MB 降到 ~10 MB |
| `-p:EnableCompressionInSingleFile=true` | 启用内嵌压缩,进一步缩体积 |
| `-p:DebugType=embedded` | 把 PDB 调试信息嵌入 exe,体积略增但便于排错 |

### 其他目标平台(如需)

| 命令 | 产物 | 用途 |
|---|---|---|
| `-r win-x86` | 32 位单文件 | 兼容老电脑 |
| `-r win-arm64` | ARM64 单文件 | Surface Pro X / Snapdragon 设备 |
| 去掉 `PublishTrimmed` | ~70 MB 单文件 | 兼容性最高(避免任何裁剪误伤) |
| 去掉 `--self-contained` | ~20 KB dll | 目标电脑需装 .NET 8 桌面运行时 |

---

## 代码架构

### 1. 状态机

```
        ┌──────────────┐
   ┌───▶│   Running    │◀──┐
   │    └──────┬───────┘   │
   │ Space     │ 撞墙/撞自己 │
   │           ▼           │
   │    ┌──────────────┐    │
   │    │   Paused     │    │
   │    └──────┬───────┘    │
   │ Space / 方向键          │
   │           │           │
   │           ▼           │
   │    (回到 Running)      │
   │                       │
   │  Q / Esc 主动结束       │
   │           │           │
   │           ▼           │
   │    ┌──────────────┐    │
   └────┤  GameOver /  │────┘ Enter/R → Reset → 回到 Running
        │     Win      │  Q/Esc → 退出整个程序
        └──────────────┘
```

### 2. 渲染管线(防闪烁)

- `_backBuffer[y,x]`:**上一次写入控制台的字符快照**
- `_dirty[y,x]`:**本帧需要重绘的格子标记**

每帧 `Render()` 流程:

```
对每个被标脏的格子:
    ch = CharAt(y, x)             // 计算应当显示的字符
    if ch == _backBuffer[y,x]:    // 与上次一致
        清掉脏标记,跳过
    else:
        _backBuffer[y,x] = ch
        SetCursorPosition(x, y)
        Write(ch)
        清掉脏标记
```

绝大多数格子字符未变化 → 不重绘 → **几乎无闪烁**。

### 3. 碰撞检测

- **撞墙**:`newHead` 触到第 0 行 / 最后一行 / 第 0 列 / 最后一列
- **撞自己**:`HashSet<Point> _body` O(1) 查询
  - **关键细节**:不吃到食物时,尾巴会立刻移走,所以**新头位置 = 旧尾巴位置 不算撞**
  - 吃到食物时,尾巴不动,**整个身体都算障碍**

```csharp
bool willEat = newHead == _food;
Point currentTail = _snake.Last!.Value;
bool hitBody = _body.Contains(newHead) && (willEat || newHead != currentTail);
```

### 4. 数据结构选择

| 数据 | 结构 | 理由 |
|---|---|---|
| 蛇身序列 | `LinkedList<Point>` | 头部 `AddFirst` / 尾部 `RemoveLast` 都是 O(1) |
| 蛇身集合 | `HashSet<Point>` | 碰撞检测 O(1),`record struct` 自带值相等 |
| 方向 | `enum` | 类型安全,可读性高 |

### 5. 食物生成

使用**拒绝采样**:在内部格子 `[1, width-1) × [1, height-1)` 内反复随机,直到落到空格。简单且均匀分布。

当所有格子都被蛇身占满时返回 `false` → 触发胜利。

---

## 可调参数

所有可调参数集中在 [Program.cs](Program.cs) 顶部的常量区:

```csharp
private const int BoardWidth       = 40;     // 地图宽度(列数)
private const int BoardHeight      = 20;     // 地图高度(行数)
private const int InitialSpeedMs   = 130;    // 初始每步间隔(毫秒)
private const int MinSpeedMs       = 55;     // 提速上限
private const int SpeedUpEveryFood = 3;      // 每吃几个食物提速一次
```

游戏内的字符定义集中在 [Game.cs](Game.cs) 顶部:

```csharp
private const char BorderChar = '#';   // 边框
private const char HeadChar   = '@';   // 蛇头
private const char BodyChar   = 'o';   // 蛇身
private const char FoodChar   = '*';   // 食物
```

想改成 Unicode 美观符号?直接改这几个常量即可,例如:

```csharp
private const char BorderChar = '█';
private const char HeadChar   = '●';
private const char BodyChar   = '○';
private const char FoodChar   = '◆';
```

> 注意 `Console.OutputEncoding = UTF8` 已在 `TryPrepareConsole()` 中设置,旧版 cmd (非 Windows Terminal) 也能正常显示。

---

## 兼容性与限制

### 已验证 ✅

- 编译:`dotnet build -c Release` 0 警告 0 错误
- 自包含 exe 启动后主循环正常激活
- 拷贝到任意目录后**无需任何依赖**即可运行
- 在没有控制台的环境(`Start-Process -NoNewWindow`、管道重定向)下**优雅退出**而非崩溃

### 限制 ⚠️

- **仅 win-x64** — 32 位 Windows / ARM64 Windows 需重新发布
- **不支持 Windows 7 / 8 / XP** — .NET 8 最低要求 Windows 10 1809+
- **控制台尺寸** — 推荐窗口宽度 ≥ 42 列、高度 ≥ 24 行,否则 HUD 会被截断
- **键位** — 使用 `Console.ReadKey`,需要真实键盘输入,无法在 SSH / 远程桌面无控制台会话下玩
- **暂停期间** — 游戏循环会持续占用极少量 CPU(50 ms 一次空转)以保持"暂停中"提示刷新

---

## 常见问题

**Q: 启动后窗口一闪就退出了?**
A: 多半是在没有交互式控制台的环境(比如 IDE 的"无控制台"调试)启动的。直接从资源管理器双击 exe,或在新开的 PowerShell / cmd 中执行,即可。

**Q: 中文显示成问号 / 乱码?**
A: 程序已强制设置 `Console.OutputEncoding = UTF8`,如果还乱码,说明终端字体不支持中文。把窗口标题栏右键 → 属性 → 字体 改为 `Consolas` 或 `新宋体` 试试。

**Q: 能否在 Linux / macOS 上玩?**
A: 当前只发布了 win-x64。如果想跨平台,改成 `Microsoft.NET.Sdk` 默认目标并把 `TargetFramework` 设为 `net8.0`(去掉 win 限定),再在 Linux/macOS 上重新 `dotnet publish` 即可,代码本身是跨平台的。

**Q: 怎么改地图大小 / 速度?**
A: 见 [可调参数](#可调参数),改 [Program.cs](Program.cs) 顶部几个常量后重新 build 即可。

**Q: exe 体积还能更小吗?**
A: 当前 ~10 MB,理论最低可以裁剪到 ~6 MB(关闭压缩、用 R2R 替代 ReadyToRun),但代价是启动变慢。可以试试:

```powershell
dotnet publish -c Release -r win-x64 `
    --self-contained true `
    -p:PublishSingleFile=true `
    -p:PublishTrimmed=true `
    -p:PublishReadyToRun=false `
    -p:EnableCompressionInSingleFile=true
```

---

## 路线图 / 可改进点

可作为练习的方向(欢迎 PR):

- [ ] 分数榜(本地保存 Top 10)
- [ ] 障碍物 / 多关卡
- [ ] 多种食物(不同分值、不同效果)
- [ ] 音效(`Console.Beep`)
- [ ] 颜色(ANSI 转义,蛇头 / 蛇身 / 食物 / 边框各一色)
- [ ] 单元测试(碰撞 / 食物生成 / 状态机)
- [ ] 跨平台发布脚本(Linux + macOS + win-x86 + win-arm64 一键生成)

---

## 许可

MIT License — 随便用,欢迎魔改。

如果觉得有帮助,顺手点个 ⭐ 就更好啦。

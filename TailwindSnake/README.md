# Tailwind Snake · 贪食蛇

基于 **Tauri 2 + React 18 + TypeScript + Tailwind CSS 3** 的桌面贪食蛇游戏。

界面清新现代，支持原生桌面菜单栏、动态棋盘大小切换和三套主题皮肤。

## ✨ 特性

- 🐍 经典贪食蛇玩法，支持 **20×20 / 30×30 / 50×50** 及自定义棋盘大小
- 🎨 **三套主题皮肤**：薄荷绿、深海蓝、日落橘，菜单一键切换
- 🖥️ **原生桌面菜单栏**：使用 Tauri 原生 `tauri::menu` API，支持勾选状态同步
- ⌨️ 方向键 / WASD 控制，空格暂停/继续
- 📱 触屏方向键（手机/平板也能玩）
- ⚡ 吃食物自动加速，每 50 分升一级
- 🏆 最高分、棋盘大小、主题选择均本地持久化（localStorage）
- 💚 Tauri 2 打包，Windows 原生窗口（理论上支持 macOS / Linux，未测试）

## 📁 项目结构

```
TailwindSnake/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── scripts/
│   ├── gen-icon.mjs       # 单张图标生成（调试用）
│   └── gen-icons.mjs      # Tauri 全套图标生成
├── src/                    # 前端（React）
│   ├── main.tsx
│   ├── App.tsx              # 主界面 + 对话框覆盖层
│   ├── index.css
│   ├── components/
│   │   ├── Board.tsx        # 游戏棋盘渲染
│   │   ├── ScorePanel.tsx   # 分数/等级面板
│   │   ├── DirectionPad.tsx # 触屏方向键
│   │   └── Kbd.tsx          # 键盘按键样式
│   ├── game/
│   │   ├── types.ts         # 类型定义（ThemeId / GameState / ThemeColors 等）
│   │   ├── logic.ts         # 纯函数游戏单步推进
│   │   ├── utils.ts         # 工具函数
│   │   └── themes.ts        # 三套主题配色方案
│   └── hooks/
│       ├── useSnakeGame.ts       # 游戏循环 + 键盘事件 + 状态持久化
│       └── useNativeMenuEvents.ts # 监听 Tauri 原生菜单事件
└── src-tauri/              # Rust 端
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── build.rs
    ├── capabilities/default.json
    ├── icons/              # 图标（已生成）
    └── src/
        ├── main.rs
        └── lib.rs          # 原生菜单栏 + 事件桥接
```

## 🚀 开发与构建

### 前置条件

1. **Node.js ≥ 18**
2. **Rust 工具链**（Tauri 必需）
   - 访问 [rustup.rs](https://rustup.rs) 下载安装
   - 安装 Microsoft C++ Build Tools（Windows）：勾选"使用 C++ 的桌面开发"
   - 安装 WebView2 Runtime（Windows 10/11 多数已自带）
3. **Tauri CLI**（可选，会用项目本地依赖装）

### 启动

```powershell
# 1. 安装依赖
npm install

# 2. 开发模式（热重载，自动启动 Tauri 窗口）
npm run tauri:dev
```

第一次运行会下载并编译 Rust 依赖，大约 3–8 分钟（取决于网速和机器）。之后增量编译会快很多。

### 打包 Windows 安装包

```powershell
npm run tauri:build
```

产物在 `src-tauri/target/release/bundle/`，常见路径：

- `msi/Tailwind Snake_0.1.0_x64_en-US.msi`
- `nsis/Tailwind Snake_0.1.0_x64-setup.exe`

### 只跑前端（不开 Tauri 窗口，纯浏览器预览）

```powershell
npm run dev
# 浏览器访问 http://localhost:1420
```

> 注意：`localStorage` 在浏览器和 Tauri 窗口之间是隔离的，最高分是各自一份。

## 🎮 操作

| 按键 | 动作 |
| --- | --- |
| `↑` `↓` `←` `→` | 控制方向 |
| `W` `A` `S` `D` | 控制方向（备选） |
| `Space` / `Enter` | 开始 / 暂停 / 继续 |
| 触屏 | 点击屏幕下方方向键 |

## 🖥️ 原生菜单栏

通过 **Tauri 原生菜单 API** (`tauri::menu`) 实现，当前在 Windows 上运行：

| 菜单 | 选项 | 说明 |
|------|------|------|
| **游戏** | 新游戏 (Ctrl+N) | 重新开始 |
| | 暂停 / 继续 (Space) | 暂停或恢复 |
| | 重置 (Ctrl+R) | 重置当前局 |
| **棋盘** | 20 × 20 / 30 × 30 / 50 × 50 | 预设大小（带勾选） |
| | 自定义大小… | 输入 5~100 的任意整数 |
| **外观** | 薄荷绿 / 深海蓝 / 日落橘 | 三套主题（带勾选） |
| **帮助** | 操作说明 | 弹出快捷键说明对话框 |
| | 关于 | 显示版本信息 |

### 菜单勾选状态同步

Rust 端保存 `CheckMenuItem` 的引用，通过 `Arc` 共享给事件监听器。当前端切换棋盘大小或主题时，通过 Tauri 事件通道 (`state:grid-size` / `state:theme`) 通知 Rust 端更新菜单勾选状态。

> 注意：避免使用 `menu.get(id)` 在子菜单中查找项，因为该方法在嵌套子菜单中可能失效。应直接保存 `CheckMenuItem` 引用操作。

## 🧩 关键设计

- **游戏逻辑纯函数化**：`src/game/logic.ts` 中的 `step(state)` 是纯函数，易测试。
- **不可变状态更新**：每次 tick 返回新对象，React 渲染更可靠。
- **可变速循环**：用 `setTimeout` 递归而非 `setInterval`，这样可以动态改变 tick 速度。
- **方向缓冲**：`nextDirection` 字段防止"连按两次反向"导致 180° 调头自杀。
- **碰撞规则**：撞墙 / 撞自己（吃完时尾巴即将移走所以不算）。
- **等级曲线**：`speed = max(70, 160 - (level-1) * 12)`，Lv1 = 160ms，Lv8 ≈ 70ms 封顶。
- **主题系统**：通过 `ThemeColors` 接口定义完整配色，动态注入 `style` 属性实现主题切换，无需切换 Tailwind class。
- **Rust ↔ 前端事件桥接**：
  - Rust 端 `app.emit("menu:xxx")` → 前端 `listen("menu:xxx")` 响应菜单点击
  - 前端 `emit("state:xxx")` → Rust 端 `h.listen("state:xxx")` 同步勾选状态

## 📝 备注

- 图标是用 Node 脚本手画的简单占位，如需替换成自定义图标，把图片放进 `src-tauri/icons/` 覆盖同名文件即可（或者用 `npx tauri icon path/to/source.png` 让 Tauri 重新切片）。
- `src-tauri/icons/icon.icns` 是占位 PNG（非真正的 icns），Windows 不需要它，macOS 打包时建议重新生成。
- 如需打包成 macOS / Linux，把 `gen-icons.mjs` 跑一次并用 `npx tauri icon` 重新生成完整图标集。

---

Have fun. 🐍💚

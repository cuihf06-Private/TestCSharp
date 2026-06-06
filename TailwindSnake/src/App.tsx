// 主 App:整合游戏与界面 — 原生 Tauri 菜单栏

import { useState, useMemo } from "react";
import { useSnakeGame } from "./hooks/useSnakeGame";
import { useNativeMenuEvents } from "./hooks/useNativeMenuEvents";
import { Board } from "./components/Board";
import { ScorePanel } from "./components/ScorePanel";
import { Kbd } from "./components/Kbd";
import { getTheme } from "./game/themes";
import { ThemeId } from "./game/types";

function App() {
  const {
    state,
    start,
    togglePause,
    reset,
    gridSize,
    setGridSize,
    themeId,
    setThemeId,
  } = useSnakeGame();

  const theme = getTheme(themeId);
  const isRunning = state.status === "running";
  const isPaused = state.status === "paused";
  const isOver = state.status === "over";
  const isIdle = state.status === "idle";

  // 对话框状态
  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showCustomSize, setShowCustomSize] = useState(false);

  // 原生菜单事件回调
  const menuCallbacks = useMemo(
    () => ({
      onNewGame: start,
      onPause: togglePause,
      onReset: reset,
      onGridSize: (size: number) => setGridSize(size),
      onCustomSize: () => setShowCustomSize(true),
      onTheme: (id: string) => setThemeId(id as ThemeId),
      onShowHelp: () => setShowHelp(true),
      onShowAbout: () => setShowAbout(true),
    }),
    [start, togglePause, reset, setGridSize, setThemeId]
  );

  useNativeMenuEvents(menuCallbacks);

  return (
    <div
      className="h-screen min-w-[960px] transition-colors duration-300 overflow-hidden"
      style={{ background: theme.pageBg }}
    >
      <div className="h-full grid grid-cols-[clamp(280px,22vw,360px)_minmax(520px,1fr)] grid-rows-1 gap-x-[clamp(24px,5vw,96px)] px-[clamp(24px,4vw,72px)] py-6">
        {/* 左侧：信息面板 */}
        <div className="self-center flex flex-col gap-3 animate-slide-in">
          <header className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl shadow-soft flex items-center justify-center text-white text-lg flex-shrink-0"
              style={{
                background: `linear-gradient(to bottom right, ${theme.iconGradFrom}, ${theme.iconGradTo})`,
              }}
              aria-hidden
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path
                  d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8c-2.5 0-4.7-1.1-6.2-2.9"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                <circle cx="9" cy="11" r="1.2" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-none">
                贪食蛇
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5">Snake · Tauri + React</p>
            </div>
          </header>

          {/* 状态 */}
          <span
            className="chip self-start"
            style={{
              background: isRunning
                ? theme.chipBg
                : isPaused
                ? "#fffbeb"
                : isOver
                ? "#fff1f2"
                : "#f8fafc",
              color: isRunning
                ? theme.chipText
                : isPaused
                ? "#d97706"
                : isOver
                ? "#e11d48"
                : "#64748b",
              borderColor: isRunning
                ? theme.chipBorder
                : isPaused
                ? "#fde68a"
                : isOver
                ? "#fecdd3"
                : "#e2e8f0",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: isRunning
                  ? theme.accentText
                  : isPaused
                  ? "#d97706"
                  : isOver
                  ? "#e11d48"
                  : "#94a3b8",
              }}
            />
            {isRunning
              ? "进行中"
              : isPaused
              ? "已暂停"
              : isOver
              ? "已结束"
              : "待开始"}
          </span>

          <ScorePanel score={state.score} highScore={state.highScore} level={state.level} theme={theme} />

          {/* 操作按钮 */}
          <div className="flex flex-col gap-2">
            {(isIdle || isOver) && (
              <button
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: theme.btnPrimaryBg, boxShadow: theme.boardShadow }}
                onMouseEnter={(e) => { e.currentTarget.style.background = theme.btnPrimaryHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = theme.btnPrimaryBg; }}
                onClick={start}
              >
                <PlayIcon />
                {isOver ? "再来一局" : "开始游戏"}
              </button>
            )}
            {isRunning && (
              <button
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-150 active:scale-[0.98]"
                style={{ borderColor: theme.chipBorder, color: theme.accentText, background: "transparent" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = theme.chipBg; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                onClick={togglePause}
              >
                <PauseIcon />
                暂停
              </button>
            )}
            {isPaused && (
              <button
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-150 active:scale-[0.98]"
                style={{ background: theme.btnPrimaryBg, boxShadow: theme.boardShadow }}
                onMouseEnter={(e) => { e.currentTarget.style.background = theme.btnPrimaryHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = theme.btnPrimaryBg; }}
                onClick={togglePause}
              >
                <PlayIcon />
                继续
              </button>
            )}
            <button
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: "#475569", background: "transparent" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.chipBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              onClick={reset}
              disabled={isIdle}
            >
              <ResetIcon />
              重置
            </button>
          </div>

          <div className="text-xs text-slate-400 leading-relaxed">
            <div className="flex items-center gap-1 flex-wrap">
              <Kbd>W</Kbd><Kbd>A</Kbd><Kbd>S</Kbd><Kbd>D</Kbd>
              <span className="ml-1">/ 方向键 控制</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Kbd>Space</Kbd>
              <span>暂停 / 开始</span>
            </div>
          </div>
        </div>

        {/* 右侧：游戏棋盘 */}
        <main className="min-w-0 min-h-0 flex items-center justify-center overflow-hidden">
          <div style={{ height: "100%", maxWidth: "100%", aspectRatio: "1/1" }}>
            <Board
              snake={state.snake}
              food={state.food}
              status={state.status}
              gridSize={gridSize}
              theme={theme}
            />
          </div>
        </main>
      </div>

      {/* ── 对话框覆盖层 ── */}
      {showHelp && (
        <DialogOverlay onClose={() => setShowHelp(false)}>
          <div className="w-[420px] p-6 space-y-3">
            <h2 className="text-lg font-bold text-slate-800">操作说明</h2>
            <div className="text-sm text-slate-600 space-y-2">
              <p>使用 <Kbd>W</Kbd> <Kbd>A</Kbd> <Kbd>S</Kbd> <Kbd>D</Kbd> 或方向键控制蛇的移动方向。</p>
              <p>按 <Kbd>Space</Kbd> 暂停或继续游戏。</p>
              <p>吃到食物得 10 分，每 50 分升一级，速度逐渐加快。</p>
              <p>撞墙或撞到自己则游戏结束。</p>
              <p className="text-slate-400 pt-1">通过菜单栏可以切换棋盘大小和外观皮肤。</p>
            </div>
            <DialogCloseButton onClick={() => setShowHelp(false)} />
          </div>
        </DialogOverlay>
      )}

      {showAbout && (
        <DialogOverlay onClose={() => setShowAbout(false)}>
          <div className="w-[360px] p-6 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-white text-xl"
              style={{ background: `linear-gradient(to bottom right, ${theme.iconGradFrom}, ${theme.iconGradTo})` }}>
              🐍
            </div>
            <h2 className="text-lg font-bold text-slate-800">贪食蛇</h2>
            <p className="text-sm text-slate-500">Snake Game v0.1.0</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              基于 Tauri + React + Tailwind CSS 构建<br />
              原生桌面菜单栏 · 跨平台支持
            </p>
            <DialogCloseButton onClick={() => setShowAbout(false)} />
          </div>
        </DialogOverlay>
      )}

      {showCustomSize && (
        <DialogOverlay onClose={() => setShowCustomSize(false)}>
          <CustomSizeDialog
            onSubmit={(size) => {
              setGridSize(size);
              setShowCustomSize(false);
            }}
            onCancel={() => setShowCustomSize(false)}
            theme={theme}
          />
        </DialogOverlay>
      )}
    </div>
  );
}

/* ── 对话框组件 ── */

function DialogOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px] animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100">
        {children}
      </div>
    </div>
  );
}

function DialogCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="mt-4 px-5 py-2 rounded-xl text-sm font-medium text-white transition-all active:scale-[0.98]"
      style={{ background: "#475569" }}
      onClick={onClick}
    >
      关闭
    </button>
  );
}

function CustomSizeDialog({
  onSubmit,
  onCancel,
  theme,
}: {
  onSubmit: (size: number) => void;
  onCancel: () => void;
  theme: ReturnType<typeof getTheme>;
}) {
  const [val, setVal] = useState("");

  const handleSubmit = () => {
    const n = parseInt(val, 10);
    if (n >= 5 && n <= 100) onSubmit(n);
  };

  return (
    <div className="w-[320px] p-6 space-y-4">
      <h2 className="text-lg font-bold text-slate-800">自定义棋盘大小</h2>
      <p className="text-sm text-slate-500">输入 5 ~ 100 之间的整数：</p>
      <input
        type="number"
        min={5}
        max={100}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="例如 40"
        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2"
        style={{ "--tw-ring-color": theme.accentText } as React.CSSProperties}
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <button
          className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          onClick={onCancel}
        >
          取消
        </button>
        <button
          className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all active:scale-[0.98]"
          style={{ background: theme.btnPrimaryBg }}
          onClick={handleSubmit}
        >
          确定
        </button>
      </div>
    </div>
  );
}

/* ── 图标 ── */

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}
function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

export default App;

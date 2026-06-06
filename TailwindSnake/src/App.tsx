// 主 App:整合游戏与界面

import { useSnakeGame } from "./hooks/useSnakeGame";
import { Board } from "./components/Board";
import { ScorePanel } from "./components/ScorePanel";
import { MenuBar } from "./components/MenuBar";
import { Kbd } from "./components/Kbd";
import { getTheme } from "./game/themes";

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

  return (
    <div
      className="h-screen min-w-[960px] flex flex-col transition-colors duration-300 overflow-hidden"
      style={{ background: theme.pageBg }}
    >
      {/* 顶部菜单栏 */}
      <div className="flex justify-center pt-3 pb-1 px-6 flex-shrink-0 relative z-10">
        <MenuBar
          gridSize={gridSize}
          onGridSizeChange={setGridSize}
          themeId={themeId}
          onThemeChange={setThemeId}
        />
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-[clamp(280px,22vw,360px)_minmax(520px,1fr)] grid-rows-1 gap-x-[clamp(24px,5vw,96px)] px-[clamp(24px,4vw,72px)] py-4">
        {/* 左侧：信息面板（固定宽度，不被压缩） */}
        <div className="self-center flex flex-col gap-3 animate-slide-in">
          {/* 标题区 */}
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

          {/* 分数面板 */}
          <ScorePanel score={state.score} highScore={state.highScore} level={state.level} theme={theme} />

          {/* 操作按钮 */}
          <div className="flex flex-col gap-2">
            {(isIdle || isOver) && (
              <button
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl
                           text-sm font-medium text-white transition-all duration-150
                           active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl
                           text-sm font-medium border transition-all duration-150
                           active:scale-[0.98]"
                style={{
                  borderColor: theme.chipBorder,
                  color: theme.accentText,
                  background: "transparent",
                }}
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
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl
                           text-sm font-medium text-white transition-all duration-150
                           active:scale-[0.98]"
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
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl
                         text-sm font-medium transition-all duration-150
                         active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* 键盘提示 */}
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

        {/* 右侧：游戏棋盘（以高度为约束的正方形） */}
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
    </div>
  );
}

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

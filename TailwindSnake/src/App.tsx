// 主 App:整合游戏与界面

import { useSnakeGame } from "./hooks/useSnakeGame";
import { Board } from "./components/Board";
import { ScorePanel } from "./components/ScorePanel";
import { Kbd } from "./components/Kbd";

function App() {
  const { state, start, togglePause, reset } = useSnakeGame();

  const isRunning = state.status === "running";
  const isPaused = state.status === "paused";
  const isOver = state.status === "over";
  const isIdle = state.status === "idle";

  return (
    <div className="h-full w-full flex items-center justify-center p-5 gap-5">
      {/* 左侧：信息面板（响应式宽度） */}
      <div className="w-56 sm:w-64 md:w-72 lg:w-80 flex-shrink-0 flex flex-col gap-3 justify-center animate-slide-in">
        {/* 标题区 */}
        <header className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-mint-400 to-mint-600
                          shadow-soft flex items-center justify-center text-white text-lg flex-shrink-0"
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
          className={
            "chip self-start " +
            (isRunning
              ? "bg-mint-50 text-mint-600 border-mint-100"
              : isPaused
              ? "bg-amber-50 text-amber-600 border-amber-100"
              : isOver
              ? "bg-rose-50 text-rose-500 border-rose-100"
              : "bg-slate-50 text-slate-500 border-slate-100")
          }
        >
          <span
            className={
              "w-1.5 h-1.5 rounded-full " +
              (isRunning
                ? "bg-mint-500 animate-pulse-soft"
                : isPaused
                ? "bg-amber-500"
                : isOver
                ? "bg-rose-500"
                : "bg-slate-400")
            }
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
        <ScorePanel score={state.score} highScore={state.highScore} level={state.level} />

        {/* 操作按钮 */}
        <div className="flex flex-col gap-2">
          {(isIdle || isOver) && (
            <button className="btn-primary" onClick={start}>
              <PlayIcon />
              {isOver ? "再来一局" : "开始游戏"}
            </button>
          )}
          {isRunning && (
            <button className="btn-outline" onClick={togglePause}>
              <PauseIcon />
              暂停
            </button>
          )}
          {isPaused && (
            <button className="btn-primary" onClick={togglePause}>
              <PlayIcon />
              继续
            </button>
          )}
          <button className="btn-ghost" onClick={reset} disabled={isIdle}>
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

      {/* 右侧：游戏棋盘（以高度为约束的方形） */}
      <div className="flex-1 min-w-0 h-full flex items-center justify-center">
        <div className="h-full max-h-full aspect-square">
          <Board
            snake={state.snake}
            food={state.food}
            status={state.status}
          />
        </div>
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

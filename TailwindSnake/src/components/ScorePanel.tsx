import { GameState } from "../game/types";

interface ScorePanelProps {
  state: GameState;
}

export function ScorePanel({ state }: ScorePanelProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Stat label="分数" value={state.score} highlight />
      <Stat label="最高" value={state.highScore} />
      <Stat label="等级" value={state.level} suffix={`Lv`} />
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  highlight,
}: {
  label: string;
  value: number;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "card px-4 py-3 text-center " + (highlight ? "ring-1 ring-mint-200" : "")
      }
    >
      <div className="text-[11px] uppercase tracking-widest text-slate-400">
        {label}
      </div>
      <div
        className={
          "mt-1 text-2xl font-bold tabular-nums " +
          (highlight ? "text-mint-600" : "text-slate-700")
        }
      >
        {value}
        {suffix && (
          <span className="ml-1 text-xs font-medium text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

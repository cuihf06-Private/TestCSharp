interface ScorePanelProps {
  score: number;
  highScore: number;
  level: number;
}

export function ScorePanel({ score, highScore, level }: ScorePanelProps) {
  return (
    <div className="flex flex-col gap-2">
      <Stat label="分数" value={score} highlight />
      <div className="grid grid-cols-2 gap-2">
        <Stat label="最高" value={highScore} />
        <Stat label="等级" value={level} suffix={`Lv`} />
      </div>
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
        "card px-3 py-2 text-center " + (highlight ? "ring-1 ring-mint-200" : "")
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

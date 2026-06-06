import { ThemeColors } from "../game/types";

interface ScorePanelProps {
  score: number;
  highScore: number;
  level: number;
  theme: ThemeColors;
}

export function ScorePanel({ score, highScore, level, theme }: ScorePanelProps) {
  return (
    <div className="flex flex-col gap-2">
      <Stat label="分数" value={score} highlight theme={theme} />
      <div className="grid grid-cols-2 gap-2">
        <Stat label="最高" value={highScore} theme={theme} />
        <Stat label="等级" value={level} suffix={`Lv`} theme={theme} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  highlight,
  theme,
}: {
  label: string;
  value: number;
  suffix?: string;
  highlight?: boolean;
  theme: ThemeColors;
}) {
  return (
    <div
      className="card px-3 py-2 text-center"
      style={{
        borderColor: theme.cardBorder,
        boxShadow: highlight ? `0 0 0 1px ${theme.cardRing}` : undefined,
      }}
    >
      <div className="text-[11px] sm:text-xs uppercase tracking-widest text-slate-400">
        {label}
      </div>
      <div
        className="mt-0.5 text-xl sm:text-2xl font-bold tabular-nums"
        style={{ color: highlight ? theme.accentText : "#334155" }}
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

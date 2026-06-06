import { Direction } from "../game/types";

interface DirectionPadProps {
  onChange: (dir: Direction) => void;
  disabled?: boolean;
}

/**
 * 移动端/触屏的方向键。
 * 桌面端也能用,只作为键盘的备份。
 */
export function DirectionPad({ onChange, disabled }: DirectionPadProps) {
  const press = (dir: Direction) => () => onChange(dir);

  return (
    <div
      className="grid grid-cols-3 grid-rows-3 gap-2 w-44 mx-auto
                 select-none touch-none"
      aria-label="方向控制"
    >
      <span />
      <PadButton onClick={press("UP")} disabled={disabled} label="↑" />
      <span />

      <PadButton onClick={press("LEFT")} disabled={disabled} label="←" />
      <PadButton onClick={press("DOWN")} disabled={disabled} label="·" muted />
      <PadButton onClick={press("RIGHT")} disabled={disabled} label="→" />

      <span />
      <PadButton onClick={press("DOWN")} disabled={disabled} label="↓" />
      <span />
    </div>
  );
}

function PadButton({
  onClick,
  disabled,
  label,
  muted = false,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  muted?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        "h-11 rounded-xl text-lg font-semibold transition-all duration-100 " +
        "border border-mint-100 active:scale-95 " +
        (muted
          ? "bg-transparent text-mint-200 cursor-default"
          : "bg-white hover:bg-mint-50 text-mint-600 shadow-sm")
      }
    >
      {label}
    </button>
  );
}

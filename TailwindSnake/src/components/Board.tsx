import { memo, useMemo } from "react";
import { Point, ThemeColors } from "../game/types";
import { Kbd } from "./Kbd";

interface BoardProps {
  snake: Point[];
  food: Point;
  status: "idle" | "running" | "paused" | "over";
  gridSize: number;
  theme: ThemeColors;
}

/**
 * 棋盘渲染:
 * - 用 CSS Grid 渲染一个 NxN 的网格
 * - 蛇头/蛇身/食物用绝对定位的小方块覆盖在网格上(性能更优,DOM 更少)
 */
function BoardImpl({ snake, food, status, gridSize, theme }: BoardProps) {
  const cellPct = 100 / gridSize;

  // 静态网格底纹,只需计算一次
  const gridCells = useMemo(() => {
    return Array.from({ length: gridSize * gridSize }).map((_, i) => {
      const x = i % gridSize;
      const y = Math.floor(i / gridSize);
      const dark = (x + y) % 2 === 0;
      return (
        <div
          key={i}
          style={{ background: dark ? theme.gridCellDark : "transparent" }}
        />
      );
    });
  }, [gridSize, theme.gridCellDark]);

  return (
    <div
      className="relative w-full aspect-square rounded-2xl overflow-hidden
                 transition-opacity duration-200"
      style={{
        background: theme.boardBg,
        border: `1px solid ${theme.boardBorder}`,
        boxShadow: theme.boardShadow,
        opacity: status === "paused" ? 0.85 : 1,
      }}
    >
      {/* 网格底纹 */}
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
        }}
      >
        {gridCells}
      </div>

      {/* 食物 */}
      {food.x >= 0 && food.y >= 0 && (
        <div
          className="absolute"
          style={{
            left: `${food.x * cellPct}%`,
            top: `${food.y * cellPct}%`,
            width: `${cellPct}%`,
            height: `${cellPct}%`,
          }}
          aria-label="食物"
        >
          <div
            className="absolute rounded-full animate-pulse-soft"
            style={{
              inset: "18%",
              background: `linear-gradient(to bottom right, ${theme.foodFrom}, ${theme.foodTo})`,
              boxShadow: theme.foodGlow,
            }}
          />
        </div>
      )}

      {/* 蛇身 */}
      {snake.map((seg, idx) => {
        const isHead = idx === 0;
        const inset = isHead ? "8%" : "12%";
        const radius = isHead ? "rounded-md" : "rounded-sm";
        return (
          <div
            key={`${seg.x}-${seg.y}-${idx}`}
            className="absolute"
            style={{
              left: `${seg.x * cellPct}%`,
              top: `${seg.y * cellPct}%`,
              width: `${cellPct}%`,
              height: `${cellPct}%`,
            }}
          >
            <div
              className={"absolute " + radius}
              style={{
                inset,
                background: isHead
                  ? `linear-gradient(to bottom right, ${theme.snakeHeadFrom}, ${theme.snakeHeadTo})`
                  : theme.snakeBody,
                boxShadow: isHead ? theme.snakeHeadShadow : undefined,
              }}
            />
          </div>
        );
      })}

      {/* 暂停遮罩 */}
      {status === "paused" && (
        <div className="absolute inset-0 flex items-center justify-center
                        bg-white/40 backdrop-blur-[1px] animate-fade-in">
          <div
            className="px-5 py-2 rounded-full bg-white/90 font-semibold tracking-wider"
            style={{ boxShadow: theme.boardShadow, color: theme.pauseText }}
          >
            PAUSED
          </div>
        </div>
      )}

      {/* 结束遮罩 */}
      {status === "over" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center
                        bg-white/60 backdrop-blur-sm animate-fade-in gap-2">
          <div className="text-2xl font-bold text-slate-700">Game Over</div>
          <div className="text-sm text-slate-500">按 <Kbd>空格</Kbd>{" "}或点击开始按钮再来一局</div>
        </div>
      )}
    </div>
  );
}

export const Board = memo(BoardImpl);

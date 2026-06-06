import { memo, useMemo } from "react";
import { GRID_SIZE, Point } from "../game/types";
import { Kbd } from "./Kbd";

interface BoardProps {
  snake: Point[];
  food: Point;
  status: "idle" | "running" | "paused" | "over";
}

/**
 * 棋盘渲染:
 * - 用 CSS Grid 渲染一个 NxN 的网格
 * - 蛇头/蛇身/食物用绝对定位的小方块覆盖在网格上(性能更优,DOM 更少)
 */
function BoardImpl({ snake, food, status }: BoardProps) {
  const cellPct = 100 / GRID_SIZE;

  // 静态网格底纹,只需计算一次
  const gridCells = useMemo(() => {
    return Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
      const x = i % GRID_SIZE;
      const y = Math.floor(i / GRID_SIZE);
      const dark = (x + y) % 2 === 0;
      return (
        <div
          key={i}
          className={dark ? "bg-mint-50/40" : "bg-transparent"}
        />
      );
    });
  }, []);

  return (
    <div
      className="relative w-full aspect-square rounded-2xl overflow-hidden
                 bg-gradient-to-br from-mint-50 to-white
                 border border-mint-100 shadow-soft
                 transition-opacity duration-200"
      style={{
        opacity: status === "paused" ? 0.85 : 1,
      }}
    >
      {/* 网格底纹 */}
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
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
            className="absolute rounded-full bg-gradient-to-br from-rose-300 to-rose-400
                       shadow-[0_0_12px_rgba(244,114,182,0.55)]
                       animate-pulse-soft"
            style={{ inset: "18%" }}
          />
        </div>
      )}

      {/* 蛇身 */}
      {snake.map((seg, idx) => {
        const isHead = idx === 0;
        // 蛇头占格子 90%(inset 5%),蛇身占格子 80%(inset 10%)
        // inset 的 % 是相对**父 div**(5% Board)的 width/height 算
        // 5% inset of 5% = 5% * 5% = 0.25% Board = 5% 格子边距
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
              className={
                "absolute " + radius + " " +
                (isHead
                  ? "bg-gradient-to-br from-mint-400 to-mint-600 shadow-[0_0_10px_rgba(34,197,94,0.45)]"
                  : "bg-mint-300/90")
              }
              style={{ inset }}
            />
          </div>
        );
      })}

      {/* 暂停遮罩 */}
      {status === "paused" && (
        <div className="absolute inset-0 flex items-center justify-center
                        bg-white/40 backdrop-blur-[1px] animate-fade-in">
          <div className="px-5 py-2 rounded-full bg-white/90 shadow-soft
                          text-mint-600 font-semibold tracking-wider">
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

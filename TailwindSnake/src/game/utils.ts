// 贪食蛇工具函数

import { Direction, Point } from "./types";

/** 方向是否互为反向(不能 180° 调头) */
export function isOpposite(a: Direction, b: Direction): boolean {
  return (
    (a === "UP" && b === "DOWN") ||
    (a === "DOWN" && b === "UP") ||
    (a === "LEFT" && b === "RIGHT") ||
    (a === "RIGHT" && b === "LEFT")
  );
}

/** 随机生成一个不与蛇身重叠的坐标 */
export function spawnFood(snake: Point[], gridSize: number): Point {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  const free: Point[] = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) free.push({ x, y });
    }
  }
  if (free.length === 0) return { x: -1, y: -1 }; // 满图,胜利
  return free[Math.floor(Math.random() * free.length)];
}

/** 根据分数计算等级:每累计 50 分(即 5 个食物)升一级 */
export function calcLevel(score: number): number {
  return Math.floor(score / 50) + 1;
}

/** 根据等级计算 tick 速度(ms),等级越高越快 */
export function calcSpeed(level: number): number {
  const min = 70;
  const start = 160;
  const speed = start - (level - 1) * 12;
  return Math.max(min, speed);
}

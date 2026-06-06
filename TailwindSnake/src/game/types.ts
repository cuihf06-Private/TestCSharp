// 贪食蛇核心类型定义

export type Point = { x: number; y: number };

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export type GameStatus = "idle" | "running" | "paused" | "over";

export interface GameState {
  /** 蛇身,索引 0 是蛇头 */
  snake: Point[];
  /** 食物坐标 */
  food: Point;
  /** 当前移动方向 */
  direction: Direction;
  /** 下一帧将要切换的方向(用于缓冲连按) */
  nextDirection: Direction;
  /** 当前分数 */
  score: number;
  /** 历史最高分 */
  highScore: number;
  /** 游戏状态 */
  status: GameStatus;
  /** 当前等级,随吃食物递增 */
  level: number;
  /** 当前 tick 速度 (ms) */
  speed: number;
}

export const GRID_SIZE = 20; // 20x20 棋盘

export const DIRECTION_VECTORS: Record<Direction, Point> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

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
export function spawnFood(snake: Point[]): Point {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  const free: Point[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) free.push({ x, y });
    }
  }
  if (free.length === 0) return { x: -1, y: -1 }; // 满图,胜利
  return free[Math.floor(Math.random() * free.length)];
}

/** 根据分数计算等级(每 5 个食物升一级) */
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

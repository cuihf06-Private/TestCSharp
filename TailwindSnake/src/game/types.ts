// 贪食蛇核心类型与常量

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

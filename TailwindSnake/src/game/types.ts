// 贪食蛇核心类型与常量

export type Point = { x: number; y: number };

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export type GameStatus = "idle" | "running" | "paused" | "over";

export type GridSizePreset = 20 | 30 | 50 | "custom";

export type ThemeId = "mint" | "ocean" | "sunset";

export interface ThemeColors {
  /** 主题显示名 */
  name: string;
  /** 页面背景渐变 */
  pageBg: string;
  /** 棋盘背景渐变 */
  boardBg: string;
  /** 棋盘边框 */
  boardBorder: string;
  /** 棋盘阴影 */
  boardShadow: string;
  /** 网格交替格颜色 */
  gridCellDark: string;
  /** 蛇头渐变 from */
  snakeHeadFrom: string;
  /** 蛇头渐变 to */
  snakeHeadTo: string;
  /** 蛇头阴影 */
  snakeHeadShadow: string;
  /** 蛇身颜色 */
  snakeBody: string;
  /** 食物渐变 from */
  foodFrom: string;
  /** 食物渐变 to */
  foodTo: string;
  /** 食物光晕 */
  foodGlow: string;
  /** 主按钮背景 */
  btnPrimaryBg: string;
  /** 主按钮hover */
  btnPrimaryHover: string;
  /** 强调色文字 */
  accentText: string;
  /** 强调色淡文字 */
  accentTextLight: string;
  /** 状态芯片背景 */
  chipBg: string;
  /** 状态芯片文字 */
  chipText: string;
  /** 状态芯片边框 */
  chipBorder: string;
  /** 卡片边框 */
  cardBorder: string;
  /** 卡片ring */
  cardRing: string;
  /** 图标容器渐变 from */
  iconGradFrom: string;
  /** 图标容器渐变 to */
  iconGradTo: string;
  /** 暂停遮罩文字 */
  pauseText: string;
  /** 滚动条颜色 */
  scrollbar: string;
  /** 滚动条hover */
  scrollbarHover: string;
}

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

export const DEFAULT_GRID_SIZE = 20;

export const DIRECTION_VECTORS: Record<Direction, Point> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

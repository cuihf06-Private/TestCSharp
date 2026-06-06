// 纯函数式贪食蛇单步推进逻辑,便于测试

import {
  DIRECTION_VECTORS,
  GameState,
  Point,
} from "./types";
import { calcLevel, calcSpeed, spawnFood } from "./utils";

/**
 * 单步推进游戏状态。
 * 返回新的状态对象(不可变更新),以及是否触发游戏结束。
 */
export function step(state: GameState, gridSize: number): GameState {
  if (state.status !== "running") return state;

  // 应用缓冲方向
  const direction = state.nextDirection;
  const vec = DIRECTION_VECTORS[direction];

  const head = state.snake[0];
  const newHead: Point = { x: head.x + vec.x, y: head.y + vec.y };

  // 撞墙
  if (
    newHead.x < 0 ||
    newHead.x >= gridSize ||
    newHead.y < 0 ||
    newHead.y >= gridSize
  ) {
    return { ...state, status: "over", direction };
  }

  // 撞自己(注意:尾巴在下一步会移除,所以尾巴位置不算)
  const willEat = newHead.x === state.food.x && newHead.y === state.food.y;
  const bodyToCheck = willEat ? state.snake : state.snake.slice(0, -1);
  if (bodyToCheck.some((p) => p.x === newHead.x && p.y === newHead.y)) {
    return { ...state, status: "over", direction };
  }

  let newSnake: Point[];
  let newFood = state.food;
  let newScore = state.score;

  if (willEat) {
    // 吃到食物:不删尾巴
    newSnake = [newHead, ...state.snake];
    newScore += 10;
    newFood = spawnFood(newSnake, gridSize);
    if (newFood.x === -1) {
      // 通关
      return {
        ...state,
        snake: newSnake,
        food: { x: -1, y: -1 },
        score: newScore,
        direction,
        level: calcLevel(newScore),
        speed: calcSpeed(calcLevel(newScore)),
        status: "over",
      };
    }
  } else {
    // 正常移动
    newSnake = [newHead, ...state.snake.slice(0, -1)];
  }

  const newLevel = calcLevel(newScore);
  return {
    ...state,
    snake: newSnake,
    food: newFood,
    score: newScore,
    direction,
    level: newLevel,
    speed: calcSpeed(newLevel),
  };
}

/** 初始蛇身,横向 3 节,放在棋盘中央 */
export function createInitialSnake(gridSize: number): Point[] {
  const cy = Math.floor(gridSize / 2);
  const cx = Math.floor(gridSize / 2);
  return [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ];
}

export function createInitialState(gridSize: number, highScore = 0): GameState {
  const snake = createInitialSnake(gridSize);
  return {
    snake,
    food: spawnFood(snake, gridSize),
    direction: "RIGHT",
    nextDirection: "RIGHT",
    score: 0,
    highScore,
    status: "idle",
    level: 1,
    speed: calcSpeed(1),
  };
}

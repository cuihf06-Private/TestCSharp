// 游戏循环 hook:按当前 speed 节拍推进游戏

import { useEffect, useRef, useState, useCallback } from "react";
import { createInitialState, step } from "../game/logic";
import { Direction, GameState, ThemeId } from "../game/types";
import { isOpposite } from "../game/utils";

const HIGH_SCORE_KEY = "tailwind-snake:high-score";
const GRID_SIZE_KEY = "tailwind-snake:grid-size";
const THEME_KEY = "tailwind-snake:theme";

function readHighScore(): number {
  try {
    const v = localStorage.getItem(HIGH_SCORE_KEY);
    return v ? Number(v) || 0 : 0;
  } catch {
    return 0;
  }
}

function writeHighScore(score: number) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    /* noop */
  }
}

function readGridSize(): number {
  try {
    const v = localStorage.getItem(GRID_SIZE_KEY);
    const n = v ? Number(v) : 20;
    return [20, 30, 50].includes(n) ? n : 20;
  } catch {
    return 20;
  }
}

function writeGridSize(size: number) {
  try {
    localStorage.setItem(GRID_SIZE_KEY, String(size));
  } catch {
    /* noop */
  }
}

function readTheme(): ThemeId {
  try {
    const v = localStorage.getItem(THEME_KEY) as ThemeId | null;
    return v && ["mint", "ocean", "sunset"].includes(v) ? v : "mint";
  } catch {
    return "mint";
  }
}

function writeTheme(id: ThemeId) {
  try {
    localStorage.setItem(THEME_KEY, id);
  } catch {
    /* noop */
  }
}

export function useSnakeGame() {
  const [gridSize, setGridSizeState] = useState<number>(readGridSize);
  const [themeId, setThemeIdState] = useState<ThemeId>(readTheme);

  const [state, setState] = useState<GameState>(() =>
    createInitialState(gridSize, readHighScore())
  );
  const stateRef = useRef(state);
  stateRef.current = state;

  const gridSizeRef = useRef(gridSize);
  gridSizeRef.current = gridSize;

  // 游戏循环:基于 setTimeout 递归,而不是 setInterval,这样可以动态改变 speed
  useEffect(() => {
    if (state.status !== "running") return;

    let timer: number | undefined;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      setState((prev) => step(prev, gridSizeRef.current));
      timer = window.setTimeout(tick, stateRef.current.speed);
    };
    timer = window.setTimeout(tick, stateRef.current.speed);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [state.status, state.speed]);

  // 同步最高分
  useEffect(() => {
    if (state.score > state.highScore) {
      writeHighScore(state.score);
      setState((prev) => ({ ...prev, highScore: state.score }));
    }
  }, [state.score, state.highScore]);

  const start = useCallback(() => {
    setState((prev) => {
      // 如果已经结束/未开始,重置一局
      if (prev.status === "over" || prev.status === "idle") {
        const fresh = createInitialState(
          gridSizeRef.current,
          Math.max(prev.highScore, prev.score)
        );
        return { ...fresh, status: "running" };
      }
      return prev;
    });
  }, []);

  const togglePause = useCallback(() => {
    setState((prev) => {
      if (prev.status === "running") return { ...prev, status: "paused" };
      if (prev.status === "paused") return { ...prev, status: "running" };
      return prev;
    });
  }, []);

  const reset = useCallback(() => {
    setState((prev) => {
      const fresh = createInitialState(
        gridSizeRef.current,
        Math.max(prev.highScore, prev.score)
      );
      return fresh;
    });
  }, []);

  const changeDirection = useCallback((dir: Direction) => {
    setState((prev) => {
      // 不允许反向
      if (isOpposite(prev.direction, dir)) return prev;
      return { ...prev, nextDirection: dir };
    });
  }, []);

  const setGridSize = useCallback((size: number) => {
    writeGridSize(size);
    setGridSizeState(size);
    // 重置游戏
    setState((prev) => {
      const fresh = createInitialState(size, Math.max(prev.highScore, prev.score));
      return fresh;
    });
  }, []);

  const setThemeId = useCallback((id: ThemeId) => {
    writeTheme(id);
    setThemeIdState(id);
  }, []);

  // 键盘控制
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: "UP",
        ArrowDown: "DOWN",
        ArrowLeft: "LEFT",
        ArrowRight: "RIGHT",
        w: "UP",
        W: "UP",
        s: "DOWN",
        S: "DOWN",
        a: "LEFT",
        A: "LEFT",
        d: "RIGHT",
        D: "RIGHT",
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        changeDirection(dir);
        return;
      }
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (stateRef.current.status === "idle" || stateRef.current.status === "over") {
          start();
        } else {
          togglePause();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changeDirection, start, togglePause]);

  return {
    state,
    start,
    togglePause,
    reset,
    changeDirection,
    gridSize,
    setGridSize,
    themeId,
    setThemeId,
  } as const;
}

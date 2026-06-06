// 游戏循环 hook:按当前 speed 节拍推进游戏

import { useEffect, useRef, useState, useCallback } from "react";
import { createInitialState, step } from "../game/logic";
import { Direction, GameState, isOpposite } from "../game/types";

const HIGH_SCORE_KEY = "tailwind-snake:high-score";

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

export function useSnakeGame() {
  const [state, setState] = useState<GameState>(() =>
    createInitialState(readHighScore())
  );
  const stateRef = useRef(state);
  stateRef.current = state;

  // 游戏循环:基于 setTimeout 递归,而不是 setInterval,这样可以动态改变 speed
  useEffect(() => {
    if (state.status !== "running") return;

    let timer: number | undefined;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      setState((prev) => step(prev));
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

  return { state, start, togglePause, reset, changeDirection } as const;
}

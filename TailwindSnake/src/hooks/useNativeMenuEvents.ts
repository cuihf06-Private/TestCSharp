// 监听 Tauri 原生菜单事件，桥接到游戏逻辑

import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";

interface MenuCallbacks {
  onNewGame: () => void;
  onPause: () => void;
  onReset: () => void;
  onGridSize: (size: number) => void;
  onCustomSize: () => void;
  onTheme: (id: string) => void;
  onShowHelp: () => void;
  onShowAbout: () => void;
}

export function useNativeMenuEvents(callbacks: MenuCallbacks) {
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    const setup = async () => {
      unsubs.push(await listen("menu:new-game", () => callbacks.onNewGame()));
      unsubs.push(await listen("menu:pause", () => callbacks.onPause()));
      unsubs.push(await listen("menu:reset", () => callbacks.onReset()));
      unsubs.push(
        await listen<number>("menu:grid-size", (e) => callbacks.onGridSize(e.payload))
      );
      unsubs.push(await listen("menu:custom-size", () => callbacks.onCustomSize()));
      unsubs.push(
        await listen<string>("menu:theme", (e) => callbacks.onTheme(e.payload))
      );
      unsubs.push(await listen("menu:show-help", () => callbacks.onShowHelp()));
      unsubs.push(await listen("menu:show-about", () => callbacks.onShowAbout()));
    };

    setup();

    return () => {
      unsubs.forEach((fn) => fn());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    callbacks.onNewGame,
    callbacks.onPause,
    callbacks.onReset,
    callbacks.onGridSize,
    callbacks.onCustomSize,
    callbacks.onTheme,
    callbacks.onShowHelp,
    callbacks.onShowAbout,
  ]);
}

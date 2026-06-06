// 顶部菜单栏:棋盘大小 + 皮肤选择

import { useState, useRef, useEffect } from "react";
import { ThemeId } from "../game/types";
import { THEMES, THEME_IDS } from "../game/themes";

interface MenuBarProps {
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  themeId: ThemeId;
  onThemeChange: (id: ThemeId) => void;
}

const GRID_PRESETS = [
  { label: "20 × 20", value: 20, desc: "经典" },
  { label: "30 × 30", value: 30, desc: "中等" },
  { label: "50 × 50", value: 50, desc: "挑战" },
];

export function MenuBar({
  gridSize,
  onGridSizeChange,
  themeId,
  onThemeChange,
}: MenuBarProps) {
  const [sizeOpen, setSizeOpen] = useState(false);
  const [skinOpen, setSkinOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customVal, setCustomVal] = useState("");

  const sizeRef = useRef<HTMLDivElement>(null);
  const skinRef = useRef<HTMLDivElement>(null);
  const customRef = useRef<HTMLDivElement>(null);

  const theme = THEMES[themeId];

  // 点击外部关闭下拉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sizeRef.current && !sizeRef.current.contains(e.target as Node)) {
        setSizeOpen(false);
      }
      if (skinRef.current && !skinRef.current.contains(e.target as Node)) {
        setSkinOpen(false);
      }
      if (customRef.current && !customRef.current.contains(e.target as Node)) {
        setCustomOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCustomSubmit = () => {
    const n = parseInt(customVal, 10);
    if (n >= 5 && n <= 100) {
      onGridSizeChange(n);
      setCustomOpen(false);
      setSizeOpen(false);
      setCustomVal("");
    }
  };

  return (
    <nav
      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border backdrop-blur-sm"
      style={{
        borderColor: theme.cardBorder,
        background: "rgba(255,255,255,0.75)",
        boxShadow: theme.boardShadow,
      }}
    >
      {/* 棋盘大小 */}
      <div className="relative" ref={sizeRef}>
        <MenuButton
          onClick={() => { setSizeOpen(!sizeOpen); setSkinOpen(false); }}
          theme={theme}
          label={`棋盘 ${gridSize}×${gridSize}`}
        />
        {sizeOpen && (
          <div
            className="absolute top-full left-0 mt-1.5 w-44 rounded-xl border py-1 z-50"
            style={{
              borderColor: theme.cardBorder,
              background: "rgba(255,255,255,0.97)",
              boxShadow: theme.boardShadow,
            }}
          >
            {GRID_PRESETS.map((p) => (
              <button
                key={p.value}
                className="w-full px-3 py-2 text-left text-sm flex items-center justify-between transition-colors"
                style={{
                  background: gridSize === p.value ? theme.chipBg : "transparent",
                  color: gridSize === p.value ? theme.accentText : "#475569",
                }}
                onMouseEnter={(e) => {
                  if (gridSize !== p.value) e.currentTarget.style.background = theme.chipBg;
                }}
                onMouseLeave={(e) => {
                  if (gridSize !== p.value) e.currentTarget.style.background = "transparent";
                }}
                onClick={() => {
                  onGridSizeChange(p.value);
                  setSizeOpen(false);
                }}
              >
                <span className="font-medium">{p.label}</span>
                <span className="text-xs opacity-60">{p.desc}</span>
              </button>
            ))}
            <div
              className="mx-2 my-1 border-t"
              style={{ borderColor: theme.cardBorder }}
            />
            <button
              className="w-full px-3 py-2 text-left text-sm flex items-center justify-between transition-colors"
              style={{
                background: customOpen ? theme.chipBg : "transparent",
                color: !GRID_PRESETS.some(p => p.value === gridSize) ? theme.accentText : "#475569",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.chipBg; }}
              onMouseLeave={(e) => { if (!customOpen) e.currentTarget.style.background = "transparent"; }}
              onClick={() => setCustomOpen(!customOpen)}
            >
              <span className="font-medium">自定义</span>
              <span className="text-xs opacity-60">5-100</span>
            </button>
            {customOpen && (
              <div className="px-3 py-2 flex items-center gap-2" ref={customRef}>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={customVal}
                  onChange={(e) => setCustomVal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
                  placeholder="如 40"
                  className="w-full px-2 py-1 text-sm rounded-lg border outline-none"
                  style={{ borderColor: theme.cardBorder }}
                  autoFocus
                />
                <button
                  className="px-2.5 py-1 text-xs font-medium rounded-lg text-white transition-colors"
                  style={{ background: theme.btnPrimaryBg }}
                  onClick={handleCustomSubmit}
                >
                  确定
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 分隔线 */}
      <div className="w-px h-5 mx-1" style={{ background: theme.cardBorder }} />

      {/* 皮肤选择 */}
      <div className="relative" ref={skinRef}>
        <MenuButton
          onClick={() => { setSkinOpen(!skinOpen); setSizeOpen(false); }}
          theme={theme}
          label={`皮肤: ${theme.name}`}
        />
        {skinOpen && (
          <div
            className="absolute top-full left-0 mt-1.5 w-52 rounded-xl border py-1 z-50"
            style={{
              borderColor: theme.cardBorder,
              background: "rgba(255,255,255,0.97)",
              boxShadow: theme.boardShadow,
            }}
          >
            {THEME_IDS.map((id) => {
              const t = THEMES[id];
              const active = themeId === id;
              return (
                <button
                  key={id}
                  className="w-full px-3 py-2.5 text-left text-sm flex items-center gap-3 transition-colors"
                  style={{
                    background: active ? t.chipBg : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = t.chipBg;
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = "transparent";
                  }}
                  onClick={() => {
                    onThemeChange(id);
                    setSkinOpen(false);
                  }}
                >
                  {/* 色块预览 */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ background: t.snakeHeadFrom }}
                    />
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ background: t.snakeHeadTo }}
                    />
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ background: t.foodFrom }}
                    />
                  </div>
                  <div className="flex-1">
                    <div
                      className="font-medium"
                      style={{ color: active ? t.accentText : "#475569" }}
                    >
                      {t.name}
                    </div>
                  </div>
                  {active && (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none" stroke={t.accentText} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}

function MenuButton({
  onClick,
  theme,
  label,
}: {
  onClick: () => void;
  theme: { accentText: string; chipBg: string };
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
      style={{ color: theme.accentText }}
      onMouseEnter={(e) => { e.currentTarget.style.background = theme.chipBg; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {label}
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 opacity-50" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}

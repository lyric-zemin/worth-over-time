"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const ACCENTS = ["coral", "violet", "mint", "amber"] as const;
export type AccentTheme = (typeof ACCENTS)[number];

export const ACCENT_LABELS: Record<AccentTheme, string> = {
  coral: "暖橘",
  violet: "暮紫",
  mint: "薄荷",
  amber: "麦芽",
};

export const ACCENT_SWATCHES: Record<AccentTheme, string> = {
  coral: "linear-gradient(135deg,#FFB25A,#FF7A59)",
  violet: "linear-gradient(135deg,#A88BFF,#7C5CFC)",
  mint: "linear-gradient(135deg,#7BE0B4,#2FBF87)",
  amber: "linear-gradient(135deg,#FFD881,#F5A524)",
};

const ACCENT_KEY = "worth-over-time-accent";

export function readAccent(): AccentTheme {
  try {
    const value = window.localStorage.getItem(ACCENT_KEY) as AccentTheme | null;
    return value && ACCENTS.includes(value) ? value : "coral";
  } catch (error) {
    console.error("读取配色主题失败", error);
    return "coral";
  }
}

type AccentContextValue = { accent: AccentTheme; setAccent: (value: AccentTheme) => void };
const AccentContext = createContext<AccentContextValue>({ accent: "coral", setAccent: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<AccentTheme>("coral");

  useEffect(() => {
    setAccentState(readAccent());
  }, []);

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
  }, [accent]);

  const setAccent = useCallback((value: AccentTheme) => {
    setAccentState(value);
    try {
      window.localStorage.setItem(ACCENT_KEY, value);
    } catch (error) {
      console.error("保存配色主题失败", error);
    }
  }, []);

  const value = useMemo(() => ({ accent, setAccent }), [accent, setAccent]);

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AccentContext.Provider value={value}>{children}</AccentContext.Provider>
    </NextThemesProvider>
  );
}

export function useAccent() {
  return useContext(AccentContext);
}

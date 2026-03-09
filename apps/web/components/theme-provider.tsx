"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { DEFAULT_THEME, getThemeConfig } from "@/lib/themes";
import type { ThemeConfig } from "@/lib/themes";

interface ThemeContextValue {
  theme: string;
  themeConfig: ThemeConfig;
  setTheme: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  themeConfig: getThemeConfig(DEFAULT_THEME),
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("bdo-theme") || DEFAULT_THEME;
    setThemeState(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const config = getThemeConfig(theme);
    const root = document.documentElement;

    root.setAttribute("data-theme", theme);

    if (config.mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem("bdo-theme", theme);
  }, [theme, mounted]);

  const setTheme = useCallback((id: string) => {
    setThemeState(id);
  }, []);

  const themeConfig = getThemeConfig(theme);

  return (
    <ThemeContext.Provider value={{ theme, themeConfig, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

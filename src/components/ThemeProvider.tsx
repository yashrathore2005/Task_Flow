import React, { useEffect } from "react";
import { useThemeStore } from "../store/themeStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, accentColor } = useThemeStore();

  const accentHues: Record<string, string> = {
    blue: '221 83% 53%',
    purple: '262 83% 58%',
    emerald: '142 70% 45%',
    orange: '24 95% 53%',
    rose: '346 84% 61%',
    indigo: '239 84% 67%',
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Handle accent color
  useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty('--primary', accentHues[accentColor] || accentHues.blue);
  }, [accentColor]);

  // Handle system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(mediaQuery.matches ? "dark" : "light");
      };
      
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  return <>{children}</>;
}

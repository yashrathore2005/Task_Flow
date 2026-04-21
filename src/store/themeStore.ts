import { create } from 'zustand';

type Theme = 'dark' | 'light' | 'system';
type AccentColor = 'blue' | 'purple' | 'emerald' | 'orange' | 'rose' | 'indigo';

interface ThemeState {
  theme: Theme;
  accentColor: AccentColor;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (localStorage.getItem('vite-ui-theme') as Theme) || 'system',
  accentColor: (localStorage.getItem('taskflow-accent') as AccentColor) || 'blue',
  setTheme: (theme: Theme) => {
    localStorage.setItem('vite-ui-theme', theme);
    set({ theme });
  },
  setAccentColor: (accentColor: AccentColor) => {
    localStorage.setItem('taskflow-accent', accentColor);
    set({ accentColor });
  },
}));

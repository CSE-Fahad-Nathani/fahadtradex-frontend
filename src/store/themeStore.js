import { create } from "zustand";

const THEME_KEY = "theme";

export const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
};

const getInitialTheme = () => {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === "light" ? "light" : "dark";
};

export const useThemeStore = create((set, get) => ({
  theme: getInitialTheme(),

  setTheme: (theme) => {
    const next = theme === "light" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
    set({ theme: next });
  },

  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
}));

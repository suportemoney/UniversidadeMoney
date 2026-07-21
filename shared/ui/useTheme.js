import { useCallback, useEffect, useState } from "react";

export const THEME_STORAGE_KEY = "um-theme";

/** Lê tema salvo; default dark. */
export function getStoredTheme() {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* ignore */
  }
  return "dark";
}

/** Aplica data-theme no <html>. */
export function applyTheme(theme) {
  const next = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  return next;
}

/**
 * Hook de tema dark/light com persistência em localStorage.
 */
export function useTheme() {
  const [theme, setThemeState] = useState(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(next === "light" ? "light" : "dark");
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return { theme, setTheme, toggleTheme, isDark: theme === "dark" };
}

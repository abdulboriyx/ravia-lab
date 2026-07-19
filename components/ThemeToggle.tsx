"use client";

import { useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";
const themeChangeEvent = "ravia-theme-change";

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem("theme");
  return stored === "light" || stored === "dark" ? stored : null;
}

function getThemeSnapshot(): Theme {
  const theme = document.documentElement.dataset.theme;
  return theme === "light" || theme === "dark" ? theme : "dark";
}

function getServerSnapshot(): Theme {
  return "dark";
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(themeChangeEvent, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(themeChangeEvent, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new Event(themeChangeEvent));
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getServerSnapshot);

  useEffect(() => {
    const activeTheme = getStoredTheme() ?? "dark";
    applyTheme(activeTheme);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    window.localStorage.setItem("theme", nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      className="themeToggle"
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      aria-pressed={theme === "dark"}
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}

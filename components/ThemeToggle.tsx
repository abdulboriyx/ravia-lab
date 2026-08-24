"use client";

import { useEffect, useSyncExternalStore } from "react";
import { applyScinaTheme, readScinaTheme, subscribeToScinaTheme, type ScinaTheme } from "@/app/scina-theme";

function getThemeSnapshot(): ScinaTheme {
  const theme = document.documentElement.dataset.theme;
  return theme === "light" || theme === "dark" ? theme : readScinaTheme();
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToScinaTheme, getThemeSnapshot, () => "dark");

  useEffect(() => {
    applyScinaTheme(readScinaTheme());
  }, []);

  function toggleTheme() {
    // Read the applied value so a click remains correct even while React is
    // hydrating around the small pre-paint theme script in the root layout.
    const nextTheme = getThemeSnapshot() === "dark" ? "light" : "dark";
    applyScinaTheme(nextTheme, true);
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

export type ScinaTheme = "light" | "dark";

export const scinaThemeStorageKey = "theme";
export const scinaThemeChangeEvent = "scina-theme-change";

export const scinaThemePresentation = {
  light: {
    pageBackground: "#f6f8f7",
    surfaceBackground: "#ffffff",
    elevatedSurface: "rgba(255, 255, 255, 0.9)",
    primaryText: "#142226",
    secondaryText: "#597076",
    border: "rgba(45, 63, 69, 0.22)",
    controlBackground: "#eef3f4",
    controlSelected: "#2b8c79",
    canvasBackground: "#f6f8f7",
    canvasFog: "#edf3f1",
    sceneAmbient: "#dbe8e8",
    sceneKey: "#fff5df",
    sceneFill: "#6f9fb4",
    labelPrimary: "#26343b",
    labelSecondary: "#53646b",
    foreground: "#26343b",
    annotation: "#53646b",
  },
  dark: {
    pageBackground: "#020305",
    surfaceBackground: "#091016",
    elevatedSurface: "rgba(9, 14, 18, 0.9)",
    primaryText: "#eef7fa",
    secondaryText: "#a9c0c5",
    border: "rgba(191, 218, 224, 0.24)",
    controlBackground: "#111a20",
    controlSelected: "#73e3c6",
    canvasBackground: "#020305",
    canvasFog: "#020305",
    sceneAmbient: "#b7d8df",
    sceneKey: "#fff0d1",
    sceneFill: "#4c93b5",
    labelPrimary: "#eef7fa",
    labelSecondary: "#b9c8cd",
    foreground: "#eef7fa",
    annotation: "#b9c8cd",
  },
} as const;

export function normalizeScinaTheme(value: string | null | undefined): ScinaTheme {
  return value === "light" || value === "dark" ? value : "dark";
}

export function readScinaTheme(): ScinaTheme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(scinaThemeStorageKey);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyScinaTheme(theme: ScinaTheme, persist = false) {
  if (typeof window === "undefined") return;
  if (persist) window.localStorage.setItem(scinaThemeStorageKey, theme);
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.body.dataset.theme = theme;
  window.dispatchEvent(new Event(scinaThemeChangeEvent));
}

export function subscribeToScinaTheme(onStoreChange: () => void) {
  window.addEventListener(scinaThemeChangeEvent, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(scinaThemeChangeEvent, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export type SpatialRaviaTheme = "light" | "dark";

export const spatialRaviaThemeStorageKey = "spatial-ravia-theme";

export const spatialRaviaThemePresentation = {
  light: { canvasBackground: "#f6f8f7", foreground: "#162226", annotation: "#53646b" },
  dark: { canvasBackground: "#020305", foreground: "#eef7fa", annotation: "#b9c8cd" },
} as const;

export function normalizeSpatialRaviaTheme(value: string | null | undefined): SpatialRaviaTheme {
  return value === "dark" ? "dark" : "light";
}

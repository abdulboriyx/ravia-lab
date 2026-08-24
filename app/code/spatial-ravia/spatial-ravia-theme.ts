import { normalizeScinaTheme, scinaThemePresentation, type ScinaTheme } from "@/app/scina-theme";

/** @deprecated Internal compatibility alias; Scina owns the presentation theme. */
export type SpatialRaviaTheme = ScinaTheme;
/** @deprecated Use the shared Scina theme contract. */
export const spatialRaviaThemePresentation = scinaThemePresentation;
/** @deprecated Use normalizeScinaTheme. */
export const normalizeSpatialRaviaTheme = normalizeScinaTheme;

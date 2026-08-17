import type { RnaPoint } from "./RnaVisualSystem.ts";

export type RnaCompositionBounds = {
  min: RnaPoint;
  max: RnaPoint;
  center: RnaPoint;
  width: number;
  height: number;
  depth: number;
};

export type RnaCompositionPoint = { position: RnaPoint };

export type RnaCompositionLabel = {
  text: string;
  position: RnaPoint;
  anchor: string;
  priority?: "primary" | "secondary" | "tertiary";
};

export type RnaCompositionCamera = {
  position: RnaPoint;
  target: RnaPoint;
  fov: number;
  distance: number;
};

export function bottomDockInsetPx(canvasTop: number, canvasBottom: number, dockTop: number, padding = 12) {
  if (![canvasTop, canvasBottom, dockTop, padding].every(Number.isFinite)) return 0;
  return Math.max(0, Math.min(Math.max(0, canvasBottom - canvasTop), canvasBottom - dockTop + padding));
}

const finite = (value: number) => Number.isFinite(value) ? value : 0;

export function boundsFromPoints(points: readonly RnaPoint[]): RnaCompositionBounds | null {
  const valid = points.filter((point) => point.every(Number.isFinite));
  if (valid.length === 0) return null;
  const min: RnaPoint = [Math.min(...valid.map((point) => point[0])), Math.min(...valid.map((point) => point[1])), Math.min(...valid.map((point) => point[2]))];
  const max: RnaPoint = [Math.max(...valid.map((point) => point[0])), Math.max(...valid.map((point) => point[1])), Math.max(...valid.map((point) => point[2]))];
  return { min, max, center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2], width: Math.max(0, max[0] - min[0]), height: Math.max(0, max[1] - min[1]), depth: Math.max(0, max[2] - min[2]) };
}

export function unionBounds(...bounds: readonly (RnaCompositionBounds | null)[]): RnaCompositionBounds | null {
  const present = bounds.filter((value): value is RnaCompositionBounds => value !== null);
  if (present.length === 0) return null;
  return boundsFromPoints(present.flatMap((value) => [value.min, value.max]));
}

export function cameraForBounds(bounds: RnaCompositionBounds, options: { aspect: number; fov?: number; bottomInsetPx?: number; viewportHeightPx?: number; padding?: number; minDistance?: number }): RnaCompositionCamera {
  const fov = options.fov ?? 42;
  const aspect = Math.max(0.35, finite(options.aspect) || 1);
  const padding = options.padding ?? 1.05;
  const insetRatio = options.viewportHeightPx && options.bottomInsetPx ? Math.min(0.38, Math.max(0, options.bottomInsetPx / options.viewportHeightPx)) : 0;
  const usableHeight = Math.max(0.55, 1 - insetRatio);
  const extent = Math.max((bounds.height + padding) / usableHeight, (bounds.width + padding) / aspect);
  const distance = Math.max(options.minDistance ?? 3.8, extent / (2 * Math.tan((fov * Math.PI) / 360)));
  const target: RnaPoint = [bounds.center[0], bounds.center[1] - bounds.height * insetRatio * 0.38, bounds.center[2]];
  return { position: [target[0], target[1], target[2] + distance], target, fov, distance };
}

function labelKey(label: RnaCompositionLabel) {
  return `${label.anchor}|${label.text}|${label.position.map((value) => value.toFixed(4)).join(",")}`;
}

/** Deterministic world-space label layout used by every production RNA family. */
export function layoutRnaLabels(labels: readonly RnaCompositionLabel[], bounds: RnaCompositionBounds | null, options: { padding?: number; fontSize?: number } = {}) {
  const deduped = [...new Map(labels.map((label) => [labelKey(label), label])).values()];
  if (!bounds) return deduped;
  const padding = options.padding ?? 0.18;
  const fontSize = options.fontSize ?? 0.16;
  const occupied: { x: number; y: number; width: number; height: number; priority: string }[] = [];
  const ordered = deduped.map((label, index) => ({ label, index })).sort((a, b) => ({ primary: 0, secondary: 1, tertiary: 2 }[a.label.priority ?? "secondary"] - ({ primary: 0, secondary: 1, tertiary: 2 }[b.label.priority ?? "secondary"]) || a.index - b.index));
  const result: RnaCompositionLabel[] = [];
  for (const { label } of ordered) {
    const width = Math.max(fontSize * 1.2, label.text.length * fontSize * 0.46);
    const height = fontSize * 1.25;
    const candidates: RnaPoint[] = [[label.position[0], label.position[1] + height + padding, label.position[2] + 0.05], [label.position[0] + width / 2 + padding, label.position[1], label.position[2] + 0.05], [label.position[0] - width / 2 - padding, label.position[1], label.position[2] + 0.05], [label.position[0], label.position[1] - height - padding, label.position[2] + 0.05]];
    let chosen: RnaPoint | undefined;
    for (const candidate of candidates) {
      const x = Math.min(bounds.max[0] - width / 2, Math.max(bounds.min[0] + width / 2, candidate[0]));
      const y = Math.min(bounds.max[1] - height / 2, Math.max(bounds.min[1] + height / 2, candidate[1]));
      const rect = { x, y, width, height, priority: label.priority ?? "secondary" };
      if (!occupied.some((other) => Math.abs(rect.x - other.x) < (rect.width + other.width) / 2 && Math.abs(rect.y - other.y) < (rect.height + other.height) / 2)) { chosen = [x, y, candidate[2]]; occupied.push(rect); break; }
    }
    if (chosen || (label.priority ?? "secondary") !== "tertiary") result.push({ ...label, position: chosen ?? [Math.min(bounds.max[0], Math.max(bounds.min[0], label.position[0])), Math.min(bounds.max[1], Math.max(bounds.min[1], label.position[1])), label.position[2] + 0.05] });
  }
  return result;
}

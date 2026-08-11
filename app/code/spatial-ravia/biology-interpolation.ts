export type Vector3Tuple = [number, number, number];

export function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

export function lerpNumber(start: number, end: number, progress: number): number {
  const t = clamp01(progress);
  return start + (end - start) * t;
}

export function lerpVector(
  start: Vector3Tuple,
  end: Vector3Tuple,
  progress: number
): Vector3Tuple {
  return [
    lerpNumber(start[0], end[0], progress),
    lerpNumber(start[1], end[1], progress),
    lerpNumber(start[2], end[2], progress),
  ];
}

export function smoothstep(progress: number): number {
  const t = clamp01(progress);
  return t * t * (3 - 2 * t);
}

export function visibleAfter(progress: number, threshold: number): number {
  if (progress <= threshold) {
    return 0;
  }

  return clamp01((progress - threshold) / (1 - threshold));
}

export function visibleUntil(progress: number, threshold: number): number {
  if (progress >= threshold) {
    return 0;
  }

  return clamp01(1 - progress / threshold);
}

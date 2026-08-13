import type { DnaVisualFamily } from "./biology-dna-visual-dispatcher.ts";

export type DnaCameraPoint = readonly [number, number, number];

export type DnaCameraBounds = {
  center: DnaCameraPoint;
  halfExtent: DnaCameraPoint;
  radius: number;
};

/**
 * Renderer-neutral ownership contract for a DNA-family composition. The
 * geometry owner supplies bounds; this policy supplies a stable teaching view.
 */
export type DnaSceneCameraContract = {
  family: DnaVisualFamily;
  viewDirection: DnaCameraPoint;
  targetScreenOccupancy: number;
  fov: number;
  minDistance: number;
  maxDistance: number;
  /** Reserves the lower part of the screen for the persistent prompt/timeline. */
  usableViewportVerticalOffset: number;
  /** Applied to a Mol* reset snapshot whose bounds are authoritative. */
  molstarDistanceScale: number;
};

export type DnaSceneCameraFrame = {
  target: DnaCameraPoint;
  position: DnaCameraPoint;
  fov: number;
  distance: number;
  bounds: DnaCameraBounds;
};

const contracts: Readonly<Record<DnaVisualFamily, DnaSceneCameraContract>> = {
  structure: {
    family: "structure", viewDirection: [0.76, -1, 0.62], targetScreenOccupancy: 0.54,
    fov: 29, minDistance: 5.5, maxDistance: 90, usableViewportVerticalOffset: 0.08, molstarDistanceScale: 0.58,
  },
  regulation: {
    family: "regulation", viewDirection: [0.7, -0.76, 0.82], targetScreenOccupancy: 0.68,
    fov: 30, minDistance: 7, maxDistance: 100, usableViewportVerticalOffset: 0.08, molstarDistanceScale: 1.12,
  },
  replication: {
    family: "replication", viewDirection: [0.74, -0.76, 0.66], targetScreenOccupancy: 0.6,
    fov: 29, minDistance: 6, maxDistance: 100, usableViewportVerticalOffset: 0.06, molstarDistanceScale: 1,
  },
  transcription: {
    family: "transcription", viewDirection: [0.7, -0.72, 0.8], targetScreenOccupancy: 0.62,
    fov: 28, minDistance: 5, maxDistance: 80, usableViewportVerticalOffset: 0.07, molstarDistanceScale: 0.9,
  },
  damageRepair: {
    family: "damageRepair", viewDirection: [0.36, -0.2, 1], targetScreenOccupancy: 0.46,
    fov: 25, minDistance: 3.2, maxDistance: 26, usableViewportVerticalOffset: 0.06, molstarDistanceScale: 0.72,
  },
  packaging: {
    family: "packaging", viewDirection: [0.7, 0.7, 1], targetScreenOccupancy: 0.5,
    fov: 30, minDistance: 5, maxDistance: 100, usableViewportVerticalOffset: 0.06, molstarDistanceScale: 0.82,
  },
  localChemistry: {
    family: "localChemistry", viewDirection: [0.22, -0.12, 1], targetScreenOccupancy: 0.45,
    fov: 25, minDistance: 3.2, maxDistance: 28, usableViewportVerticalOffset: 0.06, molstarDistanceScale: 0.68,
  },
};

export function getDnaSceneCameraContract(family: DnaVisualFamily): DnaSceneCameraContract {
  return contracts[family];
}

export function boundsForDnaCamera(points: readonly DnaCameraPoint[]): DnaCameraBounds {
  if (points.length === 0 || points.some((point) => point.some((value) => !Number.isFinite(value)))) {
    throw new Error("DNA camera bounds require finite geometry points.");
  }
  const low: [number, number, number] = [...points[0]];
  const high: [number, number, number] = [...points[0]];
  for (const point of points.slice(1)) {
    for (let axis = 0; axis < 3; axis += 1) {
      low[axis] = Math.min(low[axis], point[axis]);
      high[axis] = Math.max(high[axis], point[axis]);
    }
  }
  const center: DnaCameraPoint = [(low[0] + high[0]) / 2, (low[1] + high[1]) / 2, (low[2] + high[2]) / 2];
  const halfExtent: DnaCameraPoint = [(high[0] - low[0]) / 2, (high[1] - low[1]) / 2, (high[2] - low[2]) / 2];
  return { center, halfExtent, radius: Math.max(0.001, Math.hypot(...halfExtent)) };
}

function normalize(point: DnaCameraPoint): DnaCameraPoint {
  const length = Math.hypot(...point);
  return length > 0 ? [point[0] / length, point[1] / length, point[2] / length] : [0, 0, 1];
}

/** Fits both the horizontal and vertical geometry extents at the requested usable screen occupancy. */
export function deriveDnaSceneCameraFrame(
  contract: DnaSceneCameraContract,
  bounds: DnaCameraBounds,
  aspect: number,
): DnaSceneCameraFrame {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 16 / 9;
  const halfFovRadians = contract.fov * Math.PI / 360;
  const tangent = Math.tan(halfFovRadians);
  const occupancy = Math.min(0.9, Math.max(0.15, contract.targetScreenOccupancy));
  const verticalDistance = Math.max(bounds.halfExtent[1], bounds.radius * 0.36) / (occupancy * tangent);
  const horizontalDistance = Math.max(bounds.halfExtent[0], bounds.radius * 0.36) / (occupancy * safeAspect * tangent);
  const distance = Math.min(contract.maxDistance, Math.max(contract.minDistance, verticalDistance, horizontalDistance));
  const direction = normalize(contract.viewDirection);
  const target: DnaCameraPoint = [
    bounds.center[0],
    bounds.center[1] - bounds.radius * contract.usableViewportVerticalOffset,
    bounds.center[2],
  ];
  return {
    target,
    position: [target[0] + direction[0] * distance, target[1] + direction[1] * distance, target[2] + direction[2] * distance],
    fov: contract.fov,
    distance,
    bounds,
  };
}

export function isFiniteDnaSceneCameraFrame(frame: DnaSceneCameraFrame) {
  return [...frame.position, ...frame.target, frame.fov, frame.distance, frame.bounds.radius].every(Number.isFinite)
    && frame.distance > 0 && frame.fov > 0;
}

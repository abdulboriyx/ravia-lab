import * as THREE from "three";
import type { StructureDerivedGeometry } from "./biology-structure-grounding.ts";

/**
 * Compact, source-coordinate policy for the RNAP teaching representation.
 *
 * 6ALH contains a much larger protein assembly than the local transcription
 * event.  This policy deliberately keeps only protein residue clusters around
 * the grounded active centre, leaving the DNA-channel corridor unoccupied.
 */
export const transcriptionRnapPresentationPolicy = {
  activeSiteRadius: 42,
  axialHalfExtent: 27,
  cleftRadius: 10,
  cleftLength: 31,
  maxLobeRadius: 13,
  maximumLobes: 3,
  lobeCohesion: 0.2,
  groundedWorldScale: 0.0115,
  /** A primary RNAP body may use at most this fraction of the DNA teaching ROI. */
  maximumDnaRoiFraction: 0.35,
} as const;

/** Compact fallback dimensions in mechanism-world units, never an assembly hull. */
export const schematicRnapFallbackShape = {
  bodyScale: [1.18, 0.82, 0.7] as const,
  bodyRadius: 0.5,
  cleftRadius: 0.16,
  cleftLength: 1.12,
} as const;

export type RnapPresentationLobe = {
  center: THREE.Vector3;
  radii: THREE.Vector3;
};

export type RnapPresentationGeometry = {
  source: "6ALH";
  /** Compact source-derived lobes; intentionally no enclosing global hull. */
  lobes: RnapPresentationLobe[];
  cleft: { center: THREE.Vector3; axis: THREE.Vector3; length: number; radius: number };
  sourceBounds: { min: THREE.Vector3; max: THREE.Vector3 };
};

/**
 * Derives a local, cleft-shaped RNAP presentation from deposited 6ALH protein
 * residue centroids. It never produces a full-complex ellipsoid: the prior
 * global ellipsoid was an inflated hull that visually buried the DNA.
 */
export function deriveTranscriptionRnapPresentation(
  geometry: StructureDerivedGeometry,
): RnapPresentationGeometry {
  const proteins = geometry.residuePoints
    .filter((point) => point.entityType === "protein")
    .map((point) => point.position);
  const active = anchor(geometry, "active-center");
  const upstream = anchor(geometry, "upstream-dna");
  const downstream = anchor(geometry, "downstream-dna");
  if (proteins.length < 3 || !active || !upstream || !downstream) {
    throw new Error("6ALH RNAP presentation requires protein points and DNA anchors");
  }

  const axis = downstream.clone().sub(upstream).normalize();
  const lateralReference = Math.abs(axis.y) < 0.9
    ? new THREE.Vector3(0, 1, 0)
    : new THREE.Vector3(0, 0, 1);
  const lateral = new THREE.Vector3().crossVectors(axis, lateralReference).normalize();
  const vertical = new THREE.Vector3().crossVectors(lateral, axis).normalize();
  const cleft = {
    center: active.clone(),
    axis,
    length: transcriptionRnapPresentationPolicy.cleftLength,
    radius: transcriptionRnapPresentationPolicy.cleftRadius,
  };

  const localProteins = proteins.filter((point) => isLocalProteinPoint(point, active, axis, cleft));
  const lobePoints = localProteins.filter((point) => !isInsideCleftCorridor(point, cleft));
  const lobes = deriveClampLobes(lobePoints, active, lateral, vertical, cleft);
  if (lobes.length < 2) {
    throw new Error("6ALH RNAP presentation could not resolve a compact cleft-shaped body");
  }
  const sourceBounds = boundsForLobes(lobes);

  return { source: "6ALH", lobes, cleft, sourceBounds };
}

/** Largest source-space dimension after the RNAP presentation transform. */
export function rnapPresentationWorldSpan(
  presentation: RnapPresentationGeometry,
  renderedScale: number,
) {
  const size = presentation.sourceBounds.max.clone().sub(presentation.sourceBounds.min);
  return Math.max(size.x, size.y, size.z) * renderedScale;
}

function anchor(geometry: StructureDerivedGeometry, id: string) {
  return geometry.anchors.find((candidate) => candidate.id === id)?.point;
}

function isLocalProteinPoint(
  point: THREE.Vector3,
  active: THREE.Vector3,
  axis: THREE.Vector3,
  cleft: RnapPresentationGeometry["cleft"],
) {
  const offset = point.clone().sub(active);
  return Math.abs(offset.dot(axis)) <= transcriptionRnapPresentationPolicy.axialHalfExtent
    && offset.length() <= transcriptionRnapPresentationPolicy.activeSiteRadius
    && !isInsideCleftCorridor(point, cleft, 0.78);
}

function isInsideCleftCorridor(
  point: THREE.Vector3,
  cleft: RnapPresentationGeometry["cleft"],
  radiusMultiplier = 1,
) {
  const offset = point.clone().sub(cleft.center);
  const along = offset.dot(cleft.axis);
  if (Math.abs(along) > cleft.length * 0.62) return false;
  const radial = offset.sub(cleft.axis.clone().multiplyScalar(along)).length();
  return radial < cleft.radius * radiusMultiplier;
}

function deriveClampLobes(
  points: readonly THREE.Vector3[],
  active: THREE.Vector3,
  lateral: THREE.Vector3,
  vertical: THREE.Vector3,
  cleft: RnapPresentationGeometry["cleft"],
) {
  // Quadrants around the DNA corridor preserve a visible channel while the
  // overlapping local ellipsoids still read as one enzyme complex.
  const buckets = [[], [], [], []] as THREE.Vector3[][];
  for (const point of points) {
    const offset = point.clone().sub(active);
    const lateralBit = offset.dot(lateral) >= 0 ? 0 : 1;
    const verticalBit = offset.dot(vertical) >= 0 ? 0 : 2;
    buckets[lateralBit + verticalBit].push(point);
  }
  const lobes = buckets
    .filter((bucket) => bucket.length >= 2)
    .sort((a, b) => b.length - a.length)
    .slice(0, transcriptionRnapPresentationPolicy.maximumLobes)
    .map((bucket) => preserveCleftClearance(compactEllipsoidFor(bucket), cleft));
  if (lobes.length < 2) return lobes;

  // Pull the few retained grounded lobes toward their shared local mass. This
  // maintains their source-derived placement while avoiding a balloon cluster.
  const sharedCenter = lobes.reduce((sum, lobe) => sum.add(lobe.center), new THREE.Vector3())
    .multiplyScalar(1 / lobes.length);
  return lobes.map((lobe) => preserveCleftClearance({
    center: lobe.center.clone().lerp(sharedCenter, transcriptionRnapPresentationPolicy.lobeCohesion),
    radii: lobe.radii,
  }, cleft));
}

function compactEllipsoidFor(points: readonly THREE.Vector3[]): RnapPresentationLobe {
  const center = points.reduce((sum, point) => sum.add(point), new THREE.Vector3()).multiplyScalar(1 / points.length);
  const maxRadius = transcriptionRnapPresentationPolicy.maxLobeRadius;
  const radii = points.reduce(
    (result, point) => {
      const offset = point.clone().sub(center);
      return result.max(new THREE.Vector3(Math.abs(offset.x), Math.abs(offset.y), Math.abs(offset.z)));
    },
    new THREE.Vector3(5, 5, 5),
  ).multiplyScalar(0.6).clampScalar(4.5, maxRadius);
  return { center, radii };
}

function preserveCleftClearance(
  lobe: RnapPresentationLobe,
  cleft: RnapPresentationGeometry["cleft"],
) {
  const offset = lobe.center.clone().sub(cleft.center);
  const along = offset.dot(cleft.axis);
  const radialDistance = offset.sub(cleft.axis.clone().multiplyScalar(along)).length();
  // A sphere of this radius bounds the ellipsoid, so this conservative clamp
  // guarantees it cannot occupy the DNA-channel centreline.
  const permittedRadius = Math.max(3, radialDistance - cleft.radius * 1.16);
  const currentRadius = Math.max(lobe.radii.x, lobe.radii.y, lobe.radii.z);
  if (currentRadius <= permittedRadius) return lobe;
  return {
    center: lobe.center,
    radii: lobe.radii.clone().multiplyScalar(permittedRadius / currentRadius),
  };
}

function boundsForLobes(lobes: readonly RnapPresentationLobe[]) {
  const min = new THREE.Vector3(Infinity, Infinity, Infinity);
  const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  for (const lobe of lobes) {
    min.min(lobe.center.clone().sub(lobe.radii));
    max.max(lobe.center.clone().add(lobe.radii));
  }
  return { min, max };
}

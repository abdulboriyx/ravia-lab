import * as THREE from "three";

/** Contact and context windows are structural, not whole-protein camera radii. */
export const TRANSCRIPTION_NUCLEIC_CONTACT_DISTANCE_ANGSTROM = 16;
export const TRANSCRIPTION_PROTEIN_CONTEXT_PADDING_ANGSTROM = 16;
export const TRANSCRIPTION_CUTAWAY_PADDING_ANGSTROM = 8;
export const TRANSCRIPTION_CAMERA_PADDING = 0.9;

export type TranscriptionActiveSiteRoi = {
  center: THREE.Vector3;
  bounds: THREE.Box3;
  radius: number;
  nucleicBounds: THREE.Box3;
  proteinVerticesIncluded: number;
  proteinVerticesTotal: number;
  proteinVertexFraction: number;
  source: "deposited-dna-rna-plus-local-polymerase";
  contactDistanceAngstrom: number;
  proteinPaddingAngstrom: number;
};

type NucleicRoiGeometry = {
  chainId: string;
  visual: "polymer-trace" | "nucleotide-ring" | "nucleotide-block";
  geometry: THREE.BufferGeometry;
};

export type TranscriptionCameraFrame = {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
  distance: number;
  roiRadius: number;
};

export type TranscriptionActiveSiteCutaway = {
  center: THREE.Vector3;
  halfExtent: THREE.Vector3;
  bounds: THREE.Box3;
  viewDirection: THREE.Vector3;
  paddingAngstrom: number;
};

function geometryPoints(geometry: THREE.BufferGeometry) {
  const position = geometry.getAttribute("position");
  if (!position) return [];
  const points: THREE.Vector3[] = [];
  const point = new THREE.Vector3();
  for (let index = 0; index < position.count; index += 1) {
    point.fromBufferAttribute(position, index);
    points.push(point.clone());
  }
  return points;
}

function spatiallyNear(points: readonly THREE.Vector3[], references: readonly THREE.Vector3[], distance: number) {
  const cellSize = Math.max(distance, 1e-6);
  const key = (point: THREE.Vector3) => `${Math.floor(point.x / cellSize)}:${Math.floor(point.y / cellSize)}:${Math.floor(point.z / cellSize)}`;
  const grid = new Map<string, THREE.Vector3[]>();
  for (const reference of references) {
    const bucket = grid.get(key(reference));
    if (bucket) bucket.push(reference);
    else grid.set(key(reference), [reference]);
  }
  const nearby: THREE.Vector3[] = [];
  const distanceSquared = distance * distance;
  for (const point of points) {
    const cx = Math.floor(point.x / cellSize);
    const cy = Math.floor(point.y / cellSize);
    const cz = Math.floor(point.z / cellSize);
    let found = false;
    for (let x = cx - 1; x <= cx + 1 && !found; x += 1) for (let y = cy - 1; y <= cy + 1 && !found; y += 1) for (let z = cz - 1; z <= cz + 1 && !found; z += 1) {
      const bucket = grid.get(`${x}:${y}:${z}`);
      if (bucket?.some((reference) => point.distanceToSquared(reference) <= distanceSquared)) found = true;
    }
    if (found) nearby.push(point);
  }
  return nearby;
}

/**
 * Builds a local camera ROI from deposited nucleic-acid geometry and only the
 * nearby portion of the computed protein surface. Actor transforms are already
 * in the M1 frame, so the active origin is the scene origin.
 */
export function deriveTranscriptionActiveSiteRoi(options: {
  proteinGeometry: THREE.BufferGeometry;
  nucleicGeometries: readonly NucleicRoiGeometry[];
  scale: number;
  dnaChainIds?: readonly string[];
  rnaChainIds?: readonly string[];
  contactDistanceAngstrom?: number;
  proteinPaddingAngstrom?: number;
  includeProteinContext?: boolean;
}): TranscriptionActiveSiteRoi {
  if (!Number.isFinite(options.scale) || options.scale <= 0) throw new Error("TRANSCRIPTION_ROI_SCALE_INVALID");
  const contactDistanceAngstrom = options.contactDistanceAngstrom ?? TRANSCRIPTION_NUCLEIC_CONTACT_DISTANCE_ANGSTROM;
  const proteinPaddingAngstrom = options.proteinPaddingAngstrom ?? TRANSCRIPTION_PROTEIN_CONTEXT_PADDING_ANGSTROM;
  const includeProteinContext = options.includeProteinContext ?? true;
  const dnaChainIds = new Set(options.dnaChainIds ?? ["A", "B"]);
  const rnaChainIds = new Set(options.rnaChainIds ?? ["R"]);
  if (!Number.isFinite(contactDistanceAngstrom) || contactDistanceAngstrom <= 0) throw new Error("TRANSCRIPTION_ROI_CONTACT_DISTANCE_INVALID");
  if (!Number.isFinite(proteinPaddingAngstrom) || proteinPaddingAngstrom <= 0) throw new Error("TRANSCRIPTION_ROI_PADDING_INVALID");
  const nucleotideGeometries = options.nucleicGeometries.filter((entry) => entry.visual !== "polymer-trace");
  const sourceGeometries = nucleotideGeometries.length > 0 ? nucleotideGeometries : options.nucleicGeometries;
  const rnaPoints = sourceGeometries.filter((entry) => rnaChainIds.has(entry.chainId)).flatMap((entry) => geometryPoints(entry.geometry));
  const dnaPoints = sourceGeometries.filter((entry) => dnaChainIds.has(entry.chainId)).flatMap((entry) => geometryPoints(entry.geometry));
  if (rnaPoints.length === 0 || dnaPoints.length === 0) throw new Error("TRANSCRIPTION_ROI_NUCLEIC_ACTIVE_REGION_MISSING");
  const contactDistance = contactDistanceAngstrom * options.scale;
  const activeRnaPoints = spatiallyNear(rnaPoints, dnaPoints, contactDistance);
  const activeDnaPoints = spatiallyNear(dnaPoints, activeRnaPoints, contactDistance);
  if (activeRnaPoints.length === 0 || activeDnaPoints.length === 0) throw new Error("TRANSCRIPTION_ROI_DNA_CONTACT_UNRESOLVED");
  const nucleicPoints = [...activeRnaPoints, ...activeDnaPoints];
  const nucleicBounds = new THREE.Box3().setFromPoints(nucleicPoints);
  const proteinBounds = nucleicBounds.clone().expandByScalar(proteinPaddingAngstrom * options.scale);
  const proteinPoints = geometryPoints(options.proteinGeometry);
  const localProteinPoints = includeProteinContext ? proteinPoints.filter((point) => proteinBounds.containsPoint(point)) : [];
  const bounds = nucleicBounds.clone();
  for (const point of localProteinPoints) bounds.expandByPoint(point);
  const center = nucleicBounds.getCenter(new THREE.Vector3());
  const roiSphere = bounds.getBoundingSphere(new THREE.Sphere());
  const proteinVertexFraction = localProteinPoints.length / proteinPoints.length;
  return {
    center,
    bounds,
    radius: roiSphere.radius,
    nucleicBounds,
    proteinVerticesIncluded: localProteinPoints.length,
    proteinVerticesTotal: proteinPoints.length,
    proteinVertexFraction,
    source: "deposited-dna-rna-plus-local-polymerase",
    contactDistanceAngstrom,
    proteinPaddingAngstrom,
  };
}

/** Computes a deterministic three-quarter camera fit for the local ROI. */
export function deriveTranscriptionCameraFrame(options: {
  roi: TranscriptionActiveSiteRoi;
  width: number;
  height: number;
  fov?: number;
  padding?: number;
}): TranscriptionCameraFrame {
  if (!Number.isFinite(options.width) || !Number.isFinite(options.height) || options.width <= 0 || options.height <= 0) throw new Error("TRANSCRIPTION_CAMERA_VIEWPORT_INVALID");
  const fov = options.fov ?? 34;
  const padding = options.padding ?? TRANSCRIPTION_CAMERA_PADDING;
  const aspect = options.width / options.height;
  const verticalFov = THREE.MathUtils.degToRad(fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
  const limitingFov = Math.min(verticalFov, horizontalFov);
  const distance = Math.max(1.2, (options.roi.radius * padding) / Math.tan(limitingFov / 2));
  // These are local M1-frame axes: DNA axis + normal/binormal, not arbitrary
  // world-space actor offsets. This exposes the cleft while retaining context.
  const direction = new THREE.Vector3(1.15, 0.65, 1.35).normalize();
  const position = options.roi.center.clone().addScaledVector(direction, distance);
  return { position, target: options.roi.center.clone(), fov, distance, roiRadius: options.roi.radius };
}

/**
 * Defines the bounded front-facing protein window around the deposited
 * nucleic-acid active region. The direction is expressed in the M1 scene
 * frame and matches the deterministic three-quarter inspection direction.
 */
export function deriveTranscriptionActiveSiteCutaway(options: {
  roi: TranscriptionActiveSiteRoi;
  scale: number;
  paddingAngstrom?: number;
}): TranscriptionActiveSiteCutaway {
  const paddingAngstrom = options.paddingAngstrom ?? TRANSCRIPTION_CUTAWAY_PADDING_ANGSTROM;
  if (!Number.isFinite(options.scale) || options.scale <= 0) throw new Error("TRANSCRIPTION_CUTAWAY_SCALE_INVALID");
  if (!Number.isFinite(paddingAngstrom) || paddingAngstrom <= 0) throw new Error("TRANSCRIPTION_CUTAWAY_PADDING_INVALID");
  const bounds = options.roi.nucleicBounds.clone().expandByScalar(paddingAngstrom * options.scale);
  const center = bounds.getCenter(new THREE.Vector3());
  const halfExtent = bounds.getSize(new THREE.Vector3()).multiplyScalar(0.5);
  const viewDirection = new THREE.Vector3(1.15, 0.65, 1.35).normalize();
  return { center, halfExtent, bounds, viewDirection, paddingAngstrom };
}

export function pointIsInsideTranscriptionCutaway(point: THREE.Vector3, cutaway: TranscriptionActiveSiteCutaway) {
  const local = point.clone().sub(cutaway.center);
  return Math.abs(local.x) <= cutaway.halfExtent.x
    && Math.abs(local.y) <= cutaway.halfExtent.y
    && Math.abs(local.z) <= cutaway.halfExtent.z
    && local.dot(cutaway.viewDirection) > 0;
}

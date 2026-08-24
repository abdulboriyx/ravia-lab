import * as THREE from "three";

/**
 * DNA visual grammar → RNA adaptation
 *
 * The accepted DNA view uses restrained, repeated molecular units, a quiet
 * backbone, compact base geometry, and rough materials that let lighting carry
 * the form. RNA keeps that scale and finish, but adapts it to one flexible
 * strand: each sugar is a compact body, each phosphate is a small linker in a
 * continuous chain, and each base stays attached close to its sugar. The path
 * is gently irregular rather than a periodic helix.
 */
export const rnaVisualTokens = {
  backbone: "#667f86",
  sugar: "#78959a",
  phosphate: "#b28b5b",
  base: {
    A: "#8daab1",
    U: "#b29b73",
    G: "#a4879b",
    C: "#8ca28d",
  },
  markerLight: "#24343a",
  markerDark: "#dce9eb",
} as const;

export type RnaBaseIdentity = "A" | "U" | "G" | "C";
export type RnaStrandDirection = "5-to-3" | "3-to-5";
export type RnaPoint = readonly [number, number, number];

export type RnaNucleotideVisual = {
  index: number;
  base: RnaBaseIdentity;
  position: RnaPoint;
  tangent: RnaPoint;
  normal: RnaPoint;
  binormal: RnaPoint;
  sugarPosition: RnaPoint;
  phosphatePosition: RnaPoint;
  basePosition: RnaPoint;
  orientation: THREE.Quaternion;
};

export type RnaVisualStrand = {
  fidelity: "S2_SCHEMATIC";
  direction: RnaStrandDirection;
  nucleotides: RnaNucleotideVisual[];
  backboneLinks: Array<{ from: RnaPoint; to: RnaPoint }>;
  fivePrimeIndex: number;
  threePrimeIndex: number;
};

export type RnaVisualStrandInput = {
  sequence: readonly RnaBaseIdentity[];
  positions?: readonly RnaPoint[];
  direction?: RnaStrandDirection;
  visibleCount?: number;
};

const vector = (value: RnaPoint) => new THREE.Vector3(value[0], value[1], value[2]);
const tuple = (value: THREE.Vector3): RnaPoint => [value.x, value.y, value.z];

// Hand-authored control offsets make the default conformation flexible without
// introducing a periodic sinusoid or random per-nucleotide rotations.
const pathControls: readonly RnaPoint[] = [
  [-2.35, -0.02, 0.00], [-1.92, 0.10, 0.04], [-1.48, 0.03, 0.13],
  [-1.04, -0.11, 0.08], [-0.59, -0.05, -0.03], [-0.14, 0.08, -0.10],
  [0.32, 0.16, -0.01], [0.78, 0.04, 0.11], [1.23, -0.10, 0.06],
  [1.68, -0.04, -0.05], [2.12, 0.09, 0.01], [2.48, 0.02, 0.08],
];

function stablePath(count: number): RnaPoint[] {
  if (count === 0) return [];
  if (count === 1) return [[0, 0, 0]];
  return Array.from({ length: count }, (_, index) => {
    const position = index * (pathControls.length - 1) / (count - 1);
    const left = Math.floor(position);
    const right = Math.min(pathControls.length - 1, left + 1);
    const amount = position - left;
    const a = vector(pathControls[left]!);
    const b = vector(pathControls[right]!);
    return tuple(a.lerp(b, amount));
  });
}

function chooseInitialNormal(tangent: THREE.Vector3) {
  const reference = Math.abs(tangent.dot(new THREE.Vector3(0, 1, 0))) > 0.88
    ? new THREE.Vector3(0, 0, 1)
    : new THREE.Vector3(0, 1, 0);
  return reference.clone().sub(tangent.clone().multiplyScalar(reference.dot(tangent))).normalize();
}

/** Parallel-transport-like frames keep attached bases from flipping. */
function transportedFrames(points: readonly RnaPoint[]) {
  const frames: Array<{ tangent: THREE.Vector3; normal: THREE.Vector3; binormal: THREE.Vector3; orientation: THREE.Quaternion }> = [];
  let previousNormal: THREE.Vector3 | undefined;
  points.forEach((point, index) => {
    const previous = vector(points[Math.max(0, index - 1)]!);
    const next = vector(points[Math.min(points.length - 1, index + 1)]!);
    const tangent = next.sub(previous);
    if (tangent.lengthSq() < 1e-8) tangent.set(1, 0, 0);
    tangent.normalize();
    let normal = previousNormal
      ? previousNormal.clone().sub(tangent.clone().multiplyScalar(previousNormal.dot(tangent)))
      : chooseInitialNormal(tangent);
    if (normal.lengthSq() < 1e-8) normal = chooseInitialNormal(tangent);
    normal.normalize();
    const binormal = tangent.clone().cross(normal).normalize();
    normal = binormal.clone().cross(tangent).normalize();
    previousNormal = normal;
    const basis = new THREE.Matrix4().makeBasis(tangent, normal, binormal);
    frames.push({ tangent, normal, binormal, orientation: new THREE.Quaternion().setFromRotationMatrix(basis) });
  });
  return frames;
}

export function buildRnaVisualStrand(input: RnaVisualStrandInput): RnaVisualStrand {
  const direction = input.direction ?? "5-to-3";
  const count = Math.max(0, Math.min(input.sequence.length, input.visibleCount ?? input.sequence.length));
  const sequence = input.sequence.slice(0, count);
  if (sequence.some((base) => !["A", "U", "G", "C"].includes(base))) {
    throw new Error("RNA visual input only accepts A, U, G, and C bases");
  }
  const points = input.positions?.slice(0, count) ?? stablePath(count);
  if (points.length !== count) throw new Error("RNA visual positions must match the visible nucleotide count");
  if (points.some((point) => point.length !== 3 || point.some((value) => !Number.isFinite(value)))) {
    throw new Error("RNA visual positions must be finite 3D points");
  }
  const frames = transportedFrames(points);
  const nucleotides = sequence.map((base, index) => {
    const frame = frames[index]!;
    const position = vector(points[index]!);
    const sugarPosition = position.clone();
    const phosphatePosition = position.clone().addScaledVector(frame.tangent, 0.14).addScaledVector(frame.normal, -0.035);
    const basePosition = position.clone().addScaledVector(frame.normal, 0.145).addScaledVector(frame.binormal, 0.012);
    return {
      index, base, position: points[index]!, tangent: tuple(frame.tangent), normal: tuple(frame.normal),
      binormal: tuple(frame.binormal), sugarPosition: tuple(sugarPosition),
      phosphatePosition: tuple(phosphatePosition), basePosition: tuple(basePosition), orientation: frame.orientation,
    } satisfies RnaNucleotideVisual;
  });
  return {
    fidelity: "S2_SCHEMATIC", direction, nucleotides,
    backboneLinks: nucleotides.slice(0, -1).map((nucleotide, index) => ({ from: nucleotide.phosphatePosition, to: nucleotides[index + 1]!.sugarPosition })),
    fivePrimeIndex: direction === "5-to-3" ? 0 : Math.max(0, count - 1),
    threePrimeIndex: direction === "5-to-3" ? Math.max(0, count - 1) : 0,
  };
}

import * as THREE from "three";

export const rnaVisualTokens = {
  backbone: "#4fae98",
  sugar: "#58c6a2",
  phosphate: "#d49b57",
  base: {
    A: "#66b8db",
    U: "#e4b36b",
    G: "#c885a8",
    C: "#8ec68a",
  },
  markerLight: "#26343b",
  markerDark: "#eef7fa",
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

function stablePath(count: number): RnaPoint[] {
  return Array.from({ length: count }, (_, index) => [
    (index - (count - 1) / 2) * 0.46,
    Math.sin(index * 0.72) * 0.12,
    Math.cos(index * 0.55) * 0.08,
  ] as RnaPoint);
}

function frameAt(points: readonly RnaPoint[], index: number) {
  const previous = vector(points[Math.max(0, index - 1)]!);
  const next = vector(points[Math.min(points.length - 1, index + 1)]!);
  const tangent = next.sub(previous).normalize();
  const reference = Math.abs(tangent.dot(new THREE.Vector3(0, 0, 1))) > 0.9
    ? new THREE.Vector3(0, 1, 0)
    : new THREE.Vector3(0, 0, 1);
  const normal = reference.clone().cross(tangent).normalize();
  const binormal = tangent.clone().cross(normal).normalize();
  const basis = new THREE.Matrix4().makeBasis(tangent, normal, binormal);
  return { tangent, normal, binormal, orientation: new THREE.Quaternion().setFromRotationMatrix(basis) };
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
  const nucleotides = sequence.map((base, index) => {
    const frame = frameAt(points, index);
    const position = vector(points[index]!);
    const sugarPosition = position.clone();
    const phosphatePosition = position.clone().addScaledVector(frame.tangent, 0.16).addScaledVector(frame.normal, -0.06);
    const basePosition = position.clone().addScaledVector(frame.normal, 0.15);
    return {
      index,
      base,
      position: points[index]!,
      tangent: tuple(frame.tangent),
      normal: tuple(frame.normal),
      binormal: tuple(frame.binormal),
      sugarPosition: tuple(sugarPosition),
      phosphatePosition: tuple(phosphatePosition),
      basePosition: tuple(basePosition),
      orientation: frame.orientation,
    } satisfies RnaNucleotideVisual;
  });
  return {
    fidelity: "S2_SCHEMATIC",
    direction,
    nucleotides,
    backboneLinks: nucleotides.slice(0, -1).map((nucleotide, index) => ({
      from: nucleotide.phosphatePosition,
      to: nucleotides[index + 1]!.sugarPosition,
    })),
    fivePrimeIndex: direction === "5-to-3" ? 0 : Math.max(0, count - 1),
    threePrimeIndex: direction === "5-to-3" ? Math.max(0, count - 1) : 0,
  };
}

import * as THREE from "three";

export type StructureContextCell = { position: THREE.Vector3; weight: number };
export type StructureDerivedContextGeometry = {
  coarseCells: StructureContextCell[];
  localCells: StructureContextCell[];
  coarseCellSize: number;
  localCellSize: number;
  bounds: { min: THREE.Vector3; max: THREE.Vector3 };
};

function cellsFor(points: readonly THREE.Vector3[], cellSize: number) {
  const cells = new Map<string, { sum: THREE.Vector3; count: number }>();
  for (const point of points) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(point.z)) continue;
    const key = `${Math.floor(point.x / cellSize)}:${Math.floor(point.y / cellSize)}:${Math.floor(point.z / cellSize)}`;
    const cell = cells.get(key) ?? { sum: new THREE.Vector3(), count: 0 };
    cell.sum.add(point);
    cell.count += 1;
    cells.set(key, cell);
  }
  return [...cells.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, cell]) => ({ position: cell.sum.multiplyScalar(1 / cell.count), weight: cell.count }));
}

export function deriveStructureDerivedContext(
  points: readonly THREE.Vector3[],
  localCenter: THREE.Vector3,
  options: { coarseCellSize?: number; localCellSize?: number; localRadius?: number } = {}
): StructureDerivedContextGeometry {
  const coarseCellSize = options.coarseCellSize ?? 0.18;
  const localCellSize = options.localCellSize ?? 0.1;
  const localRadius = options.localRadius ?? 0.85;
  const finite = points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z));
  if (!finite.length) throw new Error("Structure context requires finite coordinate points");
  const min = finite.reduce((value, point) => value.min(point), finite[0].clone());
  const max = finite.reduce((value, point) => value.max(point), finite[0].clone());
  const local = finite.filter((point) => point.distanceToSquared(localCenter) <= localRadius * localRadius);
  return { coarseCells: cellsFor(finite, coarseCellSize), localCells: cellsFor(local, localCellSize), coarseCellSize, localCellSize, bounds: { min, max } };
}

export function selectStructureContextCells(
  context: StructureDerivedContextGeometry,
  detail: "hidden" | "minimal" | "coarse" | "local-enhanced",
  roi: THREE.Vector3
) {
  if (detail === "hidden") return [];
  const cutawayRadius = detail === "local-enhanced" ? 0.2 : 0.14;
  const base = detail === "minimal" ? context.coarseCells.filter((_, index) => index % 2 === 0) : context.coarseCells;
  const visible = base.filter((cell) => cell.position.distanceToSquared(roi) > cutawayRadius * cutawayRadius);
  return detail === "local-enhanced"
    ? [...visible, ...context.localCells.filter((cell) => cell.position.distanceToSquared(roi) > cutawayRadius * cutawayRadius)]
    : visible;
}

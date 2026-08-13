import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { selectStructureContextCells, type StructureDerivedContextGeometry } from "./StructureDerivedContextGeometry.ts";

export function StructureDerivedContextPrimitive({
  context,
  detail,
  roi,
  color,
  opacity,
}: {
  context: StructureDerivedContextGeometry;
  detail: "hidden" | "minimal" | "coarse" | "local-enhanced";
  roi: THREE.Vector3;
  color: string;
  opacity: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const cells = useMemo(() => selectStructureContextCells(context, detail, roi), [context, detail, roi]);
  useEffect(() => {
    cells.forEach((cell, index) => {
      dummy.position.copy(cell.position);
      // Overlapping voxel cells create a quiet coordinate-derived mass instead
      // of an isolated-residue/bubble field. Cell centers remain the actual
      // deposited-coordinate cluster centroids.
      const cellSize = detail === "local-enhanced" && cell.weight <= 2
        ? context.localCellSize
        : context.coarseCellSize;
      const extent = cellSize * (detail === "local-enhanced" ? 1.12 : 1.2);
      dummy.scale.setScalar(extent);
      dummy.updateMatrix();
      ref.current?.setMatrixAt(index, dummy.matrix);
    });
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, [cells, context.coarseCellSize, context.localCellSize, detail, dummy]);
  if (!cells.length) return null;
  return <instancedMesh ref={ref} args={[undefined, undefined, cells.length]} frustumCulled={false}>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color={color} transparent opacity={opacity} depthWrite={false} roughness={0.94} metalness={0} flatShading />
  </instancedMesh>;
}

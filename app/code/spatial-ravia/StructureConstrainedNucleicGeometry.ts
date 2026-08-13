import * as THREE from "three";

export type StructureConstrainedResidue = {
  position: THREE.Vector3;
  labelSeqId?: number;
  residueName?: string;
};

export function createStructureConstrainedBackbone(points: readonly THREE.Vector3[]) {
  const finite = points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z));
  if (finite.length < 2) return null;
  const path = new THREE.CurvePath<THREE.Vector3>();
  for (let index = 1; index < finite.length; index += 1) path.add(new THREE.LineCurve3(finite[index - 1].clone(), finite[index].clone()));
  return path;
}

export function structureConstrainedResiduePositions(residues: readonly StructureConstrainedResidue[]) {
  return residues.map((residue) => residue.position.clone()).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z));
}

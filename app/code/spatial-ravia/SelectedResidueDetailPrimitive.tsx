import * as THREE from "three";
import { atomColor, atomRadius, deriveConservativeAtomBonds, type SelectedMolecularAtom } from "./SelectedResidueDetailGeometry.ts";

function Bond({ left, right, opacity, radius }: { left: SelectedMolecularAtom; right: SelectedMolecularAtom; opacity: number; radius: number }) {
  const midpoint = left.position.clone().add(right.position).multiplyScalar(0.5);
  const direction = right.position.clone().sub(left.position);
  return <mesh position={midpoint} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize())}>
    <cylinderGeometry args={[radius, radius, direction.length(), 6]} />
    <meshStandardMaterial color="#9da3a1" transparent opacity={opacity} roughness={0.56} />
  </mesh>;
}

export function SelectedResidueDetailPrimitive({ atoms, opacity = 1, highlighted = false, reactionAtomIndices = [], atomScale = 0.18, bondRadius = 0.0035, supportingOpacity = 0.3 }: {
  atoms: readonly SelectedMolecularAtom[];
  opacity?: number;
  highlighted?: boolean;
  reactionAtomIndices?: readonly number[];
  atomScale?: number;
  bondRadius?: number;
  supportingOpacity?: number;
}) {
  const bonds = deriveConservativeAtomBonds(atoms);
  const reactionAtoms = new Set(reactionAtomIndices);
  const isReactionAtom = (atom: SelectedMolecularAtom) => reactionAtoms.has(atoms.indexOf(atom));
  return <group>
    {bonds.map(([left, right], index) => {
      const reactionBond = isReactionAtom(left) || isReactionAtom(right);
      return <Bond key={`${left.atomName}-${right.atomName}-${index}`} left={left} right={right} radius={bondRadius} opacity={opacity * (reactionBond ? 0.82 : supportingOpacity * 0.72)} />;
    })}
    {atoms.map((atom, index) => {
      const active = reactionAtoms.has(index);
      const atomOpacity = opacity * (active ? 1 : supportingOpacity);
      return <mesh key={`${atom.atomName}-${index}`} position={atom.position}>
      <sphereGeometry args={[atomRadius(atom.element) * atomScale * (active ? 1 : 0.86), 12, 10]} />
      <meshStandardMaterial color={atomColor(atom.element)} emissive={highlighted && active ? atomColor(atom.element) : "#000000"} emissiveIntensity={highlighted && active ? 0.12 : 0} transparent={atomOpacity < 1} opacity={atomOpacity} roughness={0.48} />
      </mesh>;
    })}
  </group>;
}

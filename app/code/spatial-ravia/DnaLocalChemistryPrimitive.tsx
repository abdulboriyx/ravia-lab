"use client";

import * as THREE from "three";
import { atomColor, atomRadius } from "./SelectedResidueDetailGeometry.ts";
import type { DnaLocalChemistryPlan, LocalChemistryAtom, LocalChemistryBond } from "./DnaLocalChemistryRepresentation.ts";

function atomOpacity(atom: LocalChemistryAtom, contextOpacity: number) {
  return atom.role === "context" ? contextOpacity : atom.role === "lesion" ? 1 : 0.94;
}

function LocalBond({ bond, atoms }: { bond: LocalChemistryBond; atoms: ReadonlyMap<string, LocalChemistryAtom> }) {
  const left = atoms.get(bond.from)!;
  const right = atoms.get(bond.to)!;
  const start = new THREE.Vector3(...left.position);
  const end = new THREE.Vector3(...right.position);
  const direction = end.clone().sub(start);
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const hydrogen = bond.kind === "hydrogen";
  const lesion = bond.kind === "lesion-crosslink";
  return <mesh position={midpoint} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize())}>
    <cylinderGeometry args={[hydrogen ? 0.018 : lesion ? 0.035 : 0.027, hydrogen ? 0.018 : lesion ? 0.035 : 0.027, direction.length(), hydrogen ? 6 : 8]} />
    <meshStandardMaterial color={hydrogen ? "#62b8d2" : lesion ? "#d17558" : "#7f8990"} transparent opacity={hydrogen ? 0.82 : lesion ? 0.98 : 0.76} roughness={hydrogen ? 0.3 : 0.5} />
  </mesh>;
}

/** Local ball-and-stick chemistry only; callers provide the camera from the plan. */
export function DnaLocalChemistryPrimitive({ plan }: { plan: DnaLocalChemistryPlan }) {
  const atoms = new Map(plan.atoms.map((atom) => [atom.id, atom]));
  return <group>
    {plan.bonds.map((bond) => <LocalBond key={bond.id} bond={bond} atoms={atoms} />)}
    {plan.atoms.map((atom) => {
      const opacity = atomOpacity(atom, plan.contextOpacity);
      return <mesh key={atom.id} position={atom.position}>
        <sphereGeometry args={[atomRadius(atom.element) * 3.1, 14, 12]} />
        <meshStandardMaterial color={atomColor(atom.element)} emissive={atom.role === "lesion" ? "#7c2f20" : "#000000"} emissiveIntensity={atom.role === "lesion" ? 0.18 : 0} transparent opacity={opacity} roughness={0.42} />
      </mesh>;
    })}
  </group>;
}

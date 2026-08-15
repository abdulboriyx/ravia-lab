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
  const opacity = bond.state === "absent" ? 0 : bond.state === "breaking" ? 0.35 : hydrogen ? 0.82 : lesion ? 0.98 : 0.76;
  const material = <meshStandardMaterial color={hydrogen ? "#62b8d2" : lesion ? "#d17558" : "#7f8990"} transparent opacity={opacity} roughness={hydrogen ? 0.3 : 0.5} />;
  if (hydrogen) {
    return <group>
      {[0.2, 0.5, 0.8].map((start) => {
        const segmentStart = left.position.map((value, index) => value + direction.toArray()[index] * start) as [number, number, number];
        const segmentEnd = left.position.map((value, index) => value + direction.toArray()[index] * Math.min(1, start + 0.14)) as [number, number, number];
        const segmentDirection = new THREE.Vector3(...segmentEnd).sub(new THREE.Vector3(...segmentStart));
        return <mesh key={start} position={new THREE.Vector3(...segmentStart).add(new THREE.Vector3(...segmentEnd)).multiplyScalar(0.5)} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), segmentDirection.clone().normalize())}>
          <cylinderGeometry args={[0.018, 0.018, segmentDirection.length(), 6]} />
          {material}
        </mesh>;
      })}
    </group>;
  }
  return <mesh position={midpoint} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize())}>
    <cylinderGeometry args={[lesion ? 0.035 : 0.027, lesion ? 0.035 : 0.027, direction.length(), 8]} />
    {material}
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

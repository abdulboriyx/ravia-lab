import * as THREE from "three";

export type SelectedMolecularAtom = { position: THREE.Vector3; element: string; atomName: string; residueName: string };

const covalentRadius: Record<string, number> = { C: 0.076, N: 0.071, O: 0.066, P: 0.107, S: 0.105 };

export function atomColor(element: string) {
  return ({ C: "#b8b3aa", N: "#6f9fc3", O: "#c97d72", P: "#d0aa68", S: "#d4bd63" } as Record<string, string>)[element.toUpperCase()] ?? "#c5c8c5";
}

export function atomRadius(element: string) {
  return covalentRadius[element.toUpperCase()] ?? 0.065;
}

/** Nearest terminal atoms are a visual reaction-group proxy, not named catalytic atoms. */
export function selectReactionAtomIndices(atoms: readonly SelectedMolecularAtom[], anchor: THREE.Vector3, count = 4) {
  return atoms
    .map((atom, index) => ({ index, distance: atom.position.distanceToSquared(anchor) }))
    .sort((left, right) => left.distance - right.distance)
    .slice(0, Math.min(count, atoms.length))
    .map(({ index }) => index);
}

export function deriveConservativeAtomBonds(atoms: readonly SelectedMolecularAtom[]) {
  const bonds: Array<[SelectedMolecularAtom, SelectedMolecularAtom]> = [];
  for (let leftIndex = 0; leftIndex < atoms.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < atoms.length; rightIndex += 1) {
      const left = atoms[leftIndex], right = atoms[rightIndex];
      const limit = (covalentRadius[left.element.toUpperCase()] ?? 0.075) + (covalentRadius[right.element.toUpperCase()] ?? 0.075) + 0.035;
      const distance = left.position.distanceTo(right.position);
      if (distance > 0.04 && distance <= limit) bonds.push([left, right]);
    }
  }
  return bonds;
}

export function centerOfSelectedAtoms(atoms: readonly SelectedMolecularAtom[]) {
  if (!atoms.length) return null;
  return atoms.reduce((sum, atom) => sum.add(atom.position), new THREE.Vector3()).multiplyScalar(1 / atoms.length);
}

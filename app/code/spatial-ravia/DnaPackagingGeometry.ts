import * as THREE from "three";

export type PackagingMode = "nucleosome" | "chromatin";
export type NucleosomeUnit = { center: readonly [number, number, number]; rotationY: number };

export function derivePackagingMode(prompt: string): PackagingMode {
  return /chromatin|packing|linker|euchromatin|heterochromatin|chromosome|array/i.test(prompt) ? "chromatin" : "nucleosome";
}

export function nucleosomeUnits(mode: PackagingMode): NucleosomeUnit[] {
  return mode === "nucleosome" ? [{ center: [0, 0, 0], rotationY: 0 }] : [
    { center: [-5.5, 0.55, 0], rotationY: -0.18 }, { center: [0, -0.25, 0], rotationY: 0.1 },
    { center: [5.5, 0.48, 0], rotationY: -0.14 }, { center: [11, -0.1, 0], rotationY: 0.12 },
  ];
}

/** Canonical pedagogical duplex path wrapped 1.65 turns around a histone-like core. */
export function wrappedDnaPaths(unit: NucleosomeUnit, turns = 1.65) {
  const pointsA: THREE.Vector3[] = []; const pointsB: THREE.Vector3[] = [];
  const rungs: Array<readonly [THREE.Vector3, THREE.Vector3]> = []; const samples = 56;
  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples; const angle = -Math.PI * turns * 2 * t + unit.rotationY;
    const x = Math.cos(angle) * 1.65 + unit.center[0]; const z = Math.sin(angle) * 1.65 + unit.center[2];
    const y = (t - 0.5) * 2.45 + unit.center[1]; const dx = Math.cos(angle) * 0.17; const dz = Math.sin(angle) * 0.17;
    const a = new THREE.Vector3(x + dx, y, z + dz); const b = new THREE.Vector3(x - dx, y, z - dz);
    pointsA.push(a); pointsB.push(b); if (index % 4 === 0) rungs.push([a, b]);
  }
  return { pointsA, pointsB, rungs };
}

export function linkerPath(left: NucleosomeUnit, right: NucleosomeUnit) {
  const start = new THREE.Vector3(left.center[0] + 1.55, left.center[1] + 1.15, left.center[2]);
  const end = new THREE.Vector3(right.center[0] - 1.55, right.center[1] - 1.15, right.center[2]);
  return new THREE.CatmullRomCurve3([start, start.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 0.6, 0)), end]).getPoints(16);
}

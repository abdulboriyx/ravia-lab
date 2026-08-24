"use client";

import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useMemo } from "react";
import { rnaVisualTokens, buildRnaVisualStrand, type RnaNucleotideVisual, type RnaStrandDirection, type RnaVisualStrandInput } from "./rna-canonical-visual";

type Theme = "light" | "dark";

function RnaBond({ from, to, color = rnaVisualTokens.backbone, radius = 0.022 }: { from: readonly [number, number, number]; to: readonly [number, number, number]; color?: string; radius?: number }) {
  const geometry = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const direction = end.clone().sub(start);
    if (direction.lengthSq() < 1e-8) return null;
    return {
      midpoint: start.clone().add(end).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()),
      length: start.distanceTo(end),
    };
  }, [from, to]);
  if (!geometry) return null;
  return <mesh position={geometry.midpoint} quaternion={geometry.quaternion}>
    <cylinderGeometry args={[radius, radius, geometry.length, 8]} />
    <meshStandardMaterial color={color} roughness={0.72} />
  </mesh>;
}

export function RnaNucleotide3D({ nucleotide }: { nucleotide: RnaNucleotideVisual }) {
  return <group position={nucleotide.position} quaternion={nucleotide.orientation}>
    <mesh>
      <dodecahedronGeometry args={[0.095, 0]} />
      <meshStandardMaterial color={rnaVisualTokens.sugar} roughness={0.78} metalness={0.015} />
    </mesh>
    <RnaBond from={[0, 0, 0]} to={[0.14, -0.035, 0]} color={rnaVisualTokens.backbone} radius={0.018} />
    <mesh position={[0.14, -0.035, 0]}>
      <octahedronGeometry args={[0.045, 0]} />
      <meshStandardMaterial color={rnaVisualTokens.phosphate} roughness={0.76} metalness={0.01} />
    </mesh>
    <RnaBond from={[0, 0.035, 0]} to={[0, 0.125, 0.01]} color={rnaVisualTokens.backbone} radius={0.014} />
    <mesh position={[0, 0.145, 0.012]} rotation={[0, 0, Math.PI / 6]}>
      <cylinderGeometry args={[0.067, 0.067, 0.028, 6]} />
      <meshStandardMaterial color={rnaVisualTokens.base[nucleotide.base]} roughness={0.72} metalness={0.01} />
    </mesh>
  </group>;
}

export function RnaStrand3D({ input, theme = "dark", showPolarity = true }: { input: RnaVisualStrandInput; theme?: Theme; showPolarity?: boolean }) {
  const strand = useMemo(() => buildRnaVisualStrand(input), [input]);
  const markerColor = theme === "light" ? rnaVisualTokens.markerLight : rnaVisualTokens.markerDark;
  const fivePrime = strand.nucleotides[strand.fivePrimeIndex];
  const threePrime = strand.nucleotides[strand.threePrimeIndex];
  const markerOffset = strand.direction === "5-to-3" ? -0.2 : 0.2;
  return <group aria-label="canonical molecular RNA strand">
    {strand.backboneLinks.map((link, index) => <RnaBond key={`backbone-${index}`} from={link.from} to={link.to} />)}
    {strand.nucleotides.map((nucleotide) => <RnaNucleotide3D key={nucleotide.index} nucleotide={nucleotide} />)}
    {showPolarity && fivePrime && threePrime && <>
      <Text position={[fivePrime.position[0], fivePrime.position[1] + markerOffset, fivePrime.position[2] + 0.08]} fontSize={0.14} color={markerColor} anchorX="center">5′</Text>
      <Text position={[threePrime.position[0], threePrime.position[1] + markerOffset, threePrime.position[2] + 0.08]} fontSize={0.14} color={markerColor} anchorX="center">3′</Text>
    </>}
  </group>;
}

export type { RnaStrandDirection };

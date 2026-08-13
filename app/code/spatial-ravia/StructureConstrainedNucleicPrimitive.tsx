import { useMemo } from "react";
import * as THREE from "three";
import { createStructureConstrainedBackbone, structureConstrainedResiduePositions, type StructureConstrainedResidue } from "./StructureConstrainedNucleicGeometry.ts";
export type { StructureConstrainedResidue } from "./StructureConstrainedNucleicGeometry.ts";

export function StructureConstrainedNucleicPrimitive({
  trace,
  residues = [],
  color,
  opacity = 1,
  radius,
  residueRadius,
  emphasis = false,
  functionalAnchors = [],
  functionalRadius,
  functionalOpacity = 1,
}: {
  trace: readonly THREE.Vector3[];
  residues?: readonly StructureConstrainedResidue[];
  color: string;
  opacity?: number;
  radius: number;
  residueRadius: number;
  emphasis?: boolean;
  functionalAnchors?: readonly THREE.Vector3[];
  functionalRadius?: number;
  functionalOpacity?: number;
}) {
  const backbone = useMemo(() => createStructureConstrainedBackbone(trace), [trace]);
  const positions = useMemo(() => structureConstrainedResiduePositions(residues), [residues]);
  if (!backbone) return null;
  return <group>
    <mesh>
      <tubeGeometry args={[backbone, Math.max(12, trace.length * 2), radius, 6, false]} />
      <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} roughness={0.68} />
    </mesh>
    {functionalAnchors.map((anchor, index) => {
      const nearest = trace.reduce((best, point) => point.distanceToSquared(anchor) < best.distanceToSquared(anchor) ? point : best, trace[0]);
      const next = trace.find((point) => point !== nearest && point.distanceToSquared(nearest) < 0.045) ?? nearest;
      if (next === nearest) return null;
      return <mesh key={`functional-arm-${index}`}>
        <tubeGeometry args={[new THREE.LineCurve3(nearest.clone(), next.clone()), 4, functionalRadius ?? radius * 1.25, 6, false]} />
        <meshStandardMaterial color={color} transparent={functionalOpacity < 1} opacity={functionalOpacity} emissive={emphasis ? color : "#000000"} emissiveIntensity={emphasis ? 0.12 : 0} roughness={0.5} />
      </mesh>;
    })}
    {positions.map((position, index) => (
      <mesh key={index} position={position}>
        <sphereGeometry args={[residueRadius, 10, 8]} />
        <meshStandardMaterial color={color} emissive={emphasis ? color : "#000000"} emissiveIntensity={emphasis ? 0.3 : 0} transparent={opacity < 1} opacity={opacity} roughness={0.56} />
      </mesh>
    ))}
  </group>;
}

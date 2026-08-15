"use client";

import { useMemo, useState } from "react";
import * as THREE from "three";
import {
  deriveTranscriptionRnapPresentation,
  schematicRnapFallbackShape,
  transcriptionRnapPresentationPolicy,
  type RnapPresentationGeometry,
} from "./biology-transcription-rnap-presentation.ts";
import { resolveTranscriptionStructureGrounding, createTranscriptionStructureTransform } from "./biology-transcription-structure-grounding.ts";
import type { StructureDerivedGeometry } from "./biology-structure-grounding.ts";
import { StructureDerivedPrimitive } from "./StructureDerivedPrimitive.tsx";

type Props = {
  position: THREE.Vector3;
  opacity: number;
  scale: number;
};

export function TranscriptionRnapPresentation({ position, opacity, scale }: Props) {
  const entry = resolveTranscriptionStructureGrounding();
  const [geometry, setGeometry] = useState<StructureDerivedGeometry | null>(null);
  const presentation = useMemo(() => {
    if (!geometry) return null;
    try {
      return deriveTranscriptionRnapPresentation(geometry);
    } catch {
      return null;
    }
  }, [geometry]);
  const transform = useMemo(() => {
    if (!geometry) return null;
    const active = geometry.anchors.find((anchor) => anchor.id === "active-center");
    const upstream = geometry.anchors.find((anchor) => anchor.id === "upstream-dna");
    const downstream = geometry.anchors.find((anchor) => anchor.id === "downstream-dna");
    if (!active || !upstream || !downstream) return null;
    const sourceDirection = downstream.point.clone().sub(upstream.point);
    if (sourceDirection.lengthSq() < 1e-8) return null;
    return createTranscriptionStructureTransform({
      sourceAnchor: { point: active.point, direction: sourceDirection },
      targetAnchor: position,
      targetDirection: new THREE.Vector3(1, 0, 0),
      scale: transcriptionRnapPresentationPolicy.groundedWorldScale * scale,
    });
  }, [geometry, position, scale]);

  if (!entry) return <SchematicRnapBody position={position} opacity={opacity} scale={scale} />;
  return <>
    <StructureDerivedPrimitive
      entry={entry}
      position={position}
      visible={false}
      onResolved={({ geometry: resolved }) => setGeometry(resolved)}
    />
    {presentation && transform
      ? <GroundedRnapBody presentation={presentation} position={transform.position} quaternion={transform.quaternion} scale={transform.scale} opacity={opacity} />
      : <SchematicRnapBody position={position} opacity={opacity} scale={scale} />}
  </>;
}

function GroundedRnapBody({
  presentation,
  position,
  quaternion,
  scale,
  opacity,
}: {
  presentation: RnapPresentationGeometry;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: number;
  opacity: number;
}) {
  const channelQuaternion = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), presentation.cleft.axis),
    [presentation.cleft.axis],
  );
  return <group position={position} quaternion={quaternion} scale={scale}>
    {presentation.lobes.map((lobe, index) => (
      <mesh key={index} position={lobe.center} scale={lobe.radii}>
        <sphereGeometry args={[1, 22, 16]} />
        <meshStandardMaterial
          color="#5f7882"
          roughness={0.84}
          metalness={0.01}
          transparent={opacity < 0.98}
          opacity={Math.min(0.94, opacity)}
        />
      </mesh>
    ))}
    {/* A shallow, open channel cue. The residue-derived lobes avoid this corridor,
        so DNA remains physically visible instead of being hidden by a shell. */}
    <mesh position={presentation.cleft.center} quaternion={channelQuaternion} renderOrder={1}>
      <cylinderGeometry args={[presentation.cleft.radius, presentation.cleft.radius, presentation.cleft.length, 20]} />
      <meshStandardMaterial color="#23343a" roughness={0.92} transparent depthWrite={false} opacity={Math.min(0.32, opacity * 0.36)} />
    </mesh>
  </group>;
}

function SchematicRnapBody({ position, opacity, scale }: Props) {
  return <group position={position} scale={scale}>
    {/* Compact, intentionally schematic fallback: one clamped enzyme form with
        a readable central channel, never a stack of disconnected capsules. */}
    <mesh scale={schematicRnapFallbackShape.bodyScale}>
      <sphereGeometry args={[schematicRnapFallbackShape.bodyRadius, 24, 18]} />
      <meshStandardMaterial color="#718992" roughness={0.78} transparent={opacity < 0.99} opacity={opacity} />
    </mesh>
    <mesh rotation={[0, 0, Math.PI / 2]} renderOrder={1}>
      <cylinderGeometry args={[
        schematicRnapFallbackShape.cleftRadius,
        schematicRnapFallbackShape.cleftRadius,
        schematicRnapFallbackShape.cleftLength,
        20,
      ]} />
      <meshStandardMaterial color="#23343a" roughness={0.92} transparent depthWrite={false} opacity={Math.min(0.32, opacity * 0.36)} />
    </mesh>
  </group>;
}

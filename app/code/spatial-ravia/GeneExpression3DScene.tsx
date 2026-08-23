"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { useMemo } from "react";
import { TranscriptionDnaTemplate } from "./TranscriptionDnaTemplate";
import { TranscriptionRnapPresentation } from "./TranscriptionRnapPresentation";
import type { GeneExpressionProductionProjectionV1 } from "./gene-expression-production";

type Props = { projection: GeneExpressionProductionProjectionV1 };

function NuclearContext3D() {
  return <group aria-label="nuclear context">
    <mesh scale={[5.9, 3.7, 2.55]} rotation={[0.08, 0.12, -0.08]}>
      <sphereGeometry args={[1, 48, 32]} />
      <meshBasicMaterial color="#4e8394" transparent opacity={0.045} side={THREE.DoubleSide} wireframe />
    </mesh>
    <mesh scale={[5.3, 3.25, 2.25]} rotation={[0.08, 0.12, -0.08]}>
      <sphereGeometry args={[1, 40, 28]} />
      <meshBasicMaterial color="#82c6ce" transparent opacity={0.035} side={THREE.BackSide} />
    </mesh>
    <Text position={[-4.7, 2.8, -0.2]} fontSize={0.16} color="#92bbc2" anchorX="left" anchorY="middle">NUCLEUS</Text>
  </group>;
}

function PromoterRegion3D() {
  return <group position={[-2.5, 0.04, 0.12]}>
    <mesh rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[0.18, 0.035, 10, 24]} />
      <meshStandardMaterial color="#e7b66e" emissive="#7a5222" emissiveIntensity={0.35} roughness={0.58} />
    </mesh>
    <Text position={[0, 0.33, 0.04]} fontSize={0.13} color="#e6c68c" anchorX="center">promoter</Text>
  </group>;
}

function NascentRNA3D({ length }: { length: number }) {
  const points = useMemo(() => {
    const count = Math.max(2, Math.min(7, length + 1));
    return Array.from({ length: count }, (_, index) => {
      const t = index / (count - 1);
      return new THREE.Vector3(
        0.06 + Math.sin(t * Math.PI * 1.15) * 0.34 + t * 0.48,
        -0.25 - t * 0.72,
        0.22 + Math.cos(t * Math.PI) * 0.18 + t * 0.32,
      );
    });
  }, [length]);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  if (length <= 0) return null;
  const end = points[points.length - 1]!;
  return <group aria-label="nascent RNA">
    <mesh>
      <tubeGeometry args={[curve, Math.max(16, points.length * 8), 0.055, 10, false]} />
      <meshStandardMaterial color="#5ed1b0" emissive="#1d6d5a" emissiveIntensity={0.22} roughness={0.64} metalness={0.01} />
    </mesh>
    <mesh position={end}>
      <sphereGeometry args={[0.09, 16, 12]} />
      <meshStandardMaterial color="#b9f3db" emissive="#4fd8af" emissiveIntensity={0.4} roughness={0.42} />
    </mesh>
    <Text position={end.clone().add(new THREE.Vector3(0.16, -0.02, 0.02))} fontSize={0.14} color="#a9f2d6" anchorX="left">5′</Text>
    <Text position={[0.55, -0.98, 0.36]} fontSize={0.14} color="#8ee9ca" anchorX="center">nascent RNA</Text>
  </group>;
}

function TranscriptionMechanism3D({ projection }: Props) {
  const bubbleOpen = projection.dna.transcriptionBubble === "OPEN";
  const polymeraseState = projection.transcription.polymeraseState;
  const engaged = polymeraseState !== "AVAILABLE";
  const polymerasePosition = engaged ? new THREE.Vector3(0, 0, 0.08) : new THREE.Vector3(-1.65, 0.32, 0.18);
  const polymeraseScale = engaged ? 1.55 : 1.05;
  return <group>
    <NuclearContext3D />
    <group rotation={[0.12, -0.2, 0]}>
      <TranscriptionDnaTemplate hasRnap={engaged} hasNascentRna={false} bubbleOpen={bubbleOpen} />
      <PromoterRegion3D />
      <TranscriptionRnapPresentation position={polymerasePosition} scale={polymeraseScale} opacity={engaged ? 0.98 : 0.58} />
      <NascentRNA3D length={projection.transcription.visibleRnaLength} />
      <Text position={[-3.5, -0.72, 0.12]} fontSize={0.14} color="#9ed6f1" anchorX="center">template · 3′ → 5′</Text>
      <Text position={[2.6, 0.88, 0.12]} fontSize={0.14} color="#dcb4d8" anchorX="center">coding strand</Text>
      {bubbleOpen && <Text position={[0, 0.92, 0.28]} fontSize={0.16} color="#ffd18c" anchorX="center">transcription bubble</Text>}
    </group>
  </group>;
}

export function GeneExpression3DScene({ projection }: Props) {
  return <div className="geneExpression3DCanvas" data-3d-transcription-scene="true" data-transcription-bubble={projection.dna.transcriptionBubble} data-polymerase-state={projection.transcription.polymeraseState} data-rna-length={projection.transcription.visibleRnaLength}>
    <Canvas shadows dpr={[1, 2]} camera={{ position: [4.5, 2.7, 6.4], fov: 38 }}>
      <color attach="background" args={["#050b13"]} />
      <fog attach="fog" args={["#050b13", 6, 13]} />
      <ambientLight intensity={0.72} color="#b7d8df" />
      <directionalLight castShadow position={[3.5, 5, 5]} intensity={2.2} color="#fff0d1" />
      <pointLight position={[-2, 1.4, 2]} intensity={1.8} distance={8} color="#5ca5c2" />
      <TranscriptionMechanism3D projection={projection} />
      <OrbitControls enablePan={false} enableDamping dampingFactor={0.08} minDistance={4.2} maxDistance={9} />
    </Canvas>
  </div>;
}

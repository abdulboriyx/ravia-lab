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
    <mesh scale={[6.8, 4.3, 3.1]} rotation={[0.08, 0.12, -0.08]} renderOrder={-2}>
      <sphereGeometry args={[1, 48, 32]} />
      <meshBasicMaterial color="#173541" transparent opacity={0.16} side={THREE.BackSide} depthWrite={false} />
    </mesh>
    <mesh scale={[6.95, 4.42, 3.2]} rotation={[0.08, 0.12, -0.08]} renderOrder={-1}>
      <sphereGeometry args={[1, 48, 32]} />
      <meshBasicMaterial color="#5a9eac" transparent opacity={0.08} side={THREE.FrontSide} depthWrite={false} />
    </mesh>
  </group>;
}

function PromoterRegion3D() {
  return <group position={[-2.5, 0.04, 0.12]}>
    <mesh rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[0.18, 0.035, 10, 24]} />
      <meshStandardMaterial color="#d6a85e" emissive="#5f3c18" emissiveIntensity={0.24} roughness={0.62} />
    </mesh>
  </group>;
}

function BubbleEnvelope3D({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return <mesh position={[0, 0, 0.04]} scale={[0.88, 0.52, 0.48]} renderOrder={0}>
    <sphereGeometry args={[1, 32, 20]} />
    <meshStandardMaterial color="#c98d43" emissive="#6d3e19" emissiveIntensity={0.34} transparent opacity={0.12} roughness={0.76} depthWrite={false} side={THREE.DoubleSide} />
  </mesh>;
}

function PolymeraseHero3D({ engaged, position, scale }: { engaged: boolean; position: THREE.Vector3; scale: number }) {
  return <group position={position} scale={scale}>
    <mesh scale={[1.24, 0.86, 0.78]} castShadow>
      <icosahedronGeometry args={[0.62, 3]} />
      <meshStandardMaterial color="#9b514d" roughness={0.72} metalness={0.02} transparent={!engaged} opacity={engaged ? 0.98 : 0.72} />
    </mesh>
    <mesh position={[-0.28, 0.22, 0.08]} scale={[0.72, 0.56, 0.62]} castShadow>
      <sphereGeometry args={[0.62, 24, 18]} />
      <meshStandardMaterial color="#d18b58" roughness={0.65} transparent={!engaged} opacity={engaged ? 0.98 : 0.72} />
    </mesh>
    <mesh position={[0.3, 0.18, -0.04]} scale={[0.74, 0.62, 0.68]} castShadow>
      <sphereGeometry args={[0.62, 24, 18]} />
      <meshStandardMaterial color="#754653" roughness={0.68} transparent={!engaged} opacity={engaged ? 0.98 : 0.72} />
    </mesh>
    <mesh rotation={[0, Math.PI / 2, 0]} position={[0, -0.04, 0.08]}>
      <torusGeometry args={[0.46, 0.075, 16, 36, Math.PI * 1.52]} />
      <meshStandardMaterial color="#e4b473" emissive="#6d3d1c" emissiveIntensity={engaged ? 0.38 : 0.14} roughness={0.56} />
    </mesh>
    <mesh rotation={[0, 0, Math.PI / 2]} position={[0, -0.02, 0.09]}>
      <cylinderGeometry args={[0.16, 0.16, 1.2, 24]} />
      <meshStandardMaterial color="#2a2029" roughness={0.88} />
    </mesh>
    <mesh position={[0, -0.28, 0.12]} scale={[0.32, 0.16, 0.22]}>
      <sphereGeometry args={[1, 20, 14]} />
      <meshStandardMaterial color="#f0c875" emissive="#9b5d20" emissiveIntensity={engaged ? 0.55 : 0.2} roughness={0.44} />
    </mesh>
    <TranscriptionRnapPresentation position={new THREE.Vector3(0, 0, 0)} scale={0.92} opacity={engaged ? 0.34 : 0.2} />
    <Text position={[0, 1.05, 0.15]} fontSize={0.2} color="#f4d7be" anchorX="center">Pol II</Text>
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
      <meshStandardMaterial color="#52cda9" emissive="#164f43" emissiveIntensity={0.18} roughness={0.5} metalness={0.04} />
    </mesh>
    <mesh position={end}>
      <sphereGeometry args={[0.09, 16, 12]} />
      <meshStandardMaterial color="#b9f3db" emissive="#4fd8af" emissiveIntensity={0.4} roughness={0.42} />
    </mesh>
    <Text position={end.clone().add(new THREE.Vector3(0.16, -0.02, 0.02))} fontSize={0.14} color="#a9f2d6" anchorX="left">5′</Text>
    <Text position={[0.72, -0.98, 0.36]} fontSize={0.18} color="#a4f0d5" anchorX="center">nascent RNA</Text>
  </group>;
}

function TranscriptionMechanism3D({ projection }: Props) {
  const bubbleOpen = projection.dna.transcriptionBubble === "OPEN";
  const polymeraseState = projection.transcription.polymeraseState;
  const engaged = polymeraseState !== "AVAILABLE";
  const polymerasePosition = engaged ? new THREE.Vector3(0, 0, 0.1) : new THREE.Vector3(-1.75, 0.42, 0.28);
  const polymeraseScale = engaged ? 1.32 : 1.12;
  return <group>
    <NuclearContext3D />
    <group rotation={[0.16, -0.28, 0]} scale={1.35}>
      <BubbleEnvelope3D visible={bubbleOpen} />
      <group scale={1.32}>
        <TranscriptionDnaTemplate hasRnap={engaged} hasNascentRna={false} bubbleOpen={bubbleOpen} />
      </group>
      <PromoterRegion3D />
      <PolymeraseHero3D engaged={engaged} position={polymerasePosition} scale={polymeraseScale} />
      <NascentRNA3D length={projection.transcription.visibleRnaLength} />
      <Text position={[-2.9, 0.72, 0.12]} fontSize={0.18} color="#b8e3f5" anchorX="center">DNA</Text>
    </group>
  </group>;
}

export function GeneExpression3DScene({ projection }: Props) {
  return <div className="geneExpression3DCanvas" data-3d-transcription-scene="true" data-transcription-bubble={projection.dna.transcriptionBubble} data-polymerase-state={projection.transcription.polymeraseState} data-rna-length={projection.transcription.visibleRnaLength}>
    <Canvas shadows dpr={[1, 2]} camera={{ position: [3.6, 2.25, 4.7], fov: 34 }}>
      <color attach="background" args={["#050b13"]} />
      <fog attach="fog" args={["#050b13", 4, 10]} />
      <ambientLight intensity={0.48} color="#b7d8df" />
      <directionalLight castShadow position={[3.5, 5, 5]} intensity={2.8} color="#fff0d1" />
      <directionalLight position={[-4, 1.5, -2]} intensity={1.2} color="#4c93b5" />
      <pointLight position={[0, -1.2, 2.6]} intensity={1.4} distance={7} color="#6bd5bd" />
      <TranscriptionMechanism3D projection={projection} />
      <OrbitControls enablePan={false} enableDamping dampingFactor={0.08} minDistance={4.2} maxDistance={9} />
    </Canvas>
  </div>;
}

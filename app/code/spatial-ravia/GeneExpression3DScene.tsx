"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { useMemo } from "react";
import { TranscriptionDnaTemplate } from "./TranscriptionDnaTemplate";
import { TranscriptionRnapPresentation } from "./TranscriptionRnapPresentation";
import type { GeneExpressionProductionProjectionV1 } from "./gene-expression-production";
import { isValidTranscriptionPresentationState, type TranscriptionPresentationStateV1 } from "./transcription-presentation-state";
import { spatialRaviaThemePresentation, type SpatialRaviaTheme } from "./spatial-ravia-theme";

type Props = { projection: GeneExpressionProductionProjectionV1; presentation: TranscriptionPresentationStateV1; theme: SpatialRaviaTheme };
type SceneProps = { projection: GeneExpressionProductionProjectionV1; presentation?: TranscriptionPresentationStateV1; theme: SpatialRaviaTheme };

const sceneXFromProgress = (progress: number) => -2.8 + Math.max(0, Math.min(1, progress)) * 5.6;

function NuclearContext3D({ theme }: Pick<Props, "theme">) {
  const colors = spatialRaviaThemePresentation[theme];
  return <group aria-label="nuclear context">
    <mesh scale={[6.8, 4.3, 3.1]} rotation={[0.08, 0.12, -0.08]} renderOrder={-2}>
      <sphereGeometry args={[1, 48, 32]} />
      <meshBasicMaterial color={colors.canvasFog} transparent opacity={theme === "dark" ? 0.16 : 0.1} side={THREE.BackSide} depthWrite={false} />
    </mesh>
    <mesh scale={[6.95, 4.42, 3.2]} rotation={[0.08, 0.12, -0.08]} renderOrder={-1}>
      <sphereGeometry args={[1, 48, 32]} />
      <meshBasicMaterial color={colors.sceneFill} transparent opacity={theme === "dark" ? 0.08 : 0.05} side={THREE.FrontSide} depthWrite={false} />
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

function BubbleEnvelope3D({ openFraction, center }: { openFraction: number; center: number }) {
  if (openFraction <= 0.01) return null;
  return <mesh position={[sceneXFromProgress(center), 0, 0.04]} scale={[0.56 + openFraction * 0.42, 0.38 + openFraction * 0.14, 0.48]} renderOrder={0}>
    <sphereGeometry args={[1, 32, 20]} />
    <meshStandardMaterial color="#c98d43" emissive="#6d3e19" emissiveIntensity={0.34} transparent opacity={0.12} roughness={0.76} depthWrite={false} side={THREE.DoubleSide} />
  </mesh>;
}

function PolymeraseHero3D({ engaged, position, scale, theme }: { engaged: boolean; position: THREE.Vector3; scale: number; theme: SpatialRaviaTheme }) {
  const colors = spatialRaviaThemePresentation[theme];
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
    <Text position={[0, 1.05, 0.15]} fontSize={0.2} color={colors.labelPrimary} anchorX="center">Pol II</Text>
  </group>;
}

function NascentRNA3D({ length, anchorProgress, theme }: { length: number; anchorProgress: number; theme: SpatialRaviaTheme }) {
  const colors = spatialRaviaThemePresentation[theme];
  const points = useMemo(() => {
    const count = Math.max(2, Math.min(11, Math.ceil(length) + 1));
    const anchorX = sceneXFromProgress(anchorProgress);
    const extent = Math.min(1.35, 0.35 + length * 0.12);
    return Array.from({ length: count }, (_, index) => {
      const t = index / (count - 1);
      return new THREE.Vector3(
        anchorX + Math.sin(t * Math.PI * 1.15) * 0.24 + t * extent * 0.34,
        -0.25 - t * (0.46 + Math.min(0.5, length * 0.05)),
        0.22 + Math.cos(t * Math.PI) * 0.14 + t * 0.24,
      );
    });
  }, [anchorProgress, length]);
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
    <Text position={end.clone().add(new THREE.Vector3(0.16, -0.02, 0.02))} fontSize={0.14} color={colors.labelPrimary} anchorX="left">5′</Text>
    <Text position={[0.72, -0.98, 0.36]} fontSize={0.18} color={colors.labelPrimary} anchorX="center">nascent RNA</Text>
  </group>;
}

function TranscriptionMechanism3D({ projection, presentation, theme }: Props) {
  const colors = spatialRaviaThemePresentation[theme];
  const engaged = presentation.polymeraseEngagement > 0.01;
  const polymerasePosition = new THREE.Vector3(sceneXFromProgress(presentation.polymeraseGenePosition), engaged ? 0 : 0.42, 0.1);
  const polymeraseScale = 1.12 + presentation.polymeraseEngagement * 0.2;
  return <group>
    <NuclearContext3D theme={theme} />
    <group rotation={[0.16, -0.28, 0]} scale={1.35}>
      <BubbleEnvelope3D openFraction={presentation.bubbleOpenFraction} center={presentation.bubbleCenter} />
      <group scale={1.32}>
        <TranscriptionDnaTemplate
          hasRnap={engaged}
          hasNascentRna={false}
          bubbleOpen={presentation.bubbleOpenFraction > 0.01}
          bubbleCenterNormalized={presentation.bubbleCenter}
          bubbleOpenFraction={presentation.bubbleOpenFraction}
          bubbleWidth={presentation.bubbleWidth}
        />
      </group>
      <PromoterRegion3D />
      <PolymeraseHero3D engaged={engaged} position={polymerasePosition} scale={polymeraseScale} theme={theme} />
      <NascentRNA3D length={presentation.nascentRnaVisualLength} anchorProgress={presentation.nascentRnaAnchor} theme={theme} />
      <Text position={[-2.9, 0.72, 0.12]} fontSize={0.18} color={colors.labelPrimary} anchorX="center">DNA</Text>
    </group>
  </group>;
}

export function GeneExpression3DScene({ projection, presentation, theme }: SceneProps) {
  if (!isValidTranscriptionPresentationState(presentation)) {
    return <section className="spatialRaviaStatus" role="alert" data-error-code="TRANSCRIPTION_PRESENTATION_STATE_INVALID"><strong>TRANSCRIPTION_PRESENTATION_STATE_INVALID</strong>{process.env.NODE_ENV !== "production" && <div>GeneExpression3DScene received no complete presentation state.</div>}</section>;
  }
  const colors = spatialRaviaThemePresentation[theme];
  return <div className="geneExpression3DCanvas" data-3d-transcription-scene="true" data-transcription-bubble={projection.dna.transcriptionBubble} data-bubble-open-fraction={presentation.bubbleOpenFraction.toFixed(3)} data-polymerase-state={projection.transcription.polymeraseState} data-polymerase-position={presentation.polymeraseGenePosition.toFixed(3)} data-rna-length={presentation.nascentRnaVisualLength.toFixed(3)}>
    <Canvas shadows dpr={[1, 2]} camera={{ position: [3.6, 2.25, 4.7], fov: 34 }}>
      <color attach="background" args={[colors.canvasBackground]} />
      <fog attach="fog" args={[colors.canvasFog, 6.2, 13]} />
      <ambientLight intensity={theme === "dark" ? 0.48 : 0.72} color={colors.sceneAmbient} />
      <directionalLight castShadow position={[3.5, 5, 5]} intensity={theme === "dark" ? 2.8 : 2.35} color={colors.sceneKey} />
      <directionalLight position={[-4, 1.5, -2]} intensity={theme === "dark" ? 1.2 : 0.9} color={colors.sceneFill} />
      <pointLight position={[0, -1.2, 2.6]} intensity={1.4} distance={7} color="#6bd5bd" />
      <TranscriptionMechanism3D projection={projection} presentation={presentation} theme={theme} />
      <OrbitControls enablePan={false} enableDamping dampingFactor={0.08} minDistance={4.2} maxDistance={9} />
    </Canvas>
  </div>;
}

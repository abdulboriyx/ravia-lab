"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { useMemo } from "react";
import { TranscriptionDnaTemplate } from "./TranscriptionDnaTemplate";
import { TranscriptionRnapPresentation } from "./TranscriptionRnapPresentation";
import { sampleTranscriptionMolecularRna, type TranscriptionRnaUnit } from "./transcription-molecular-actors";
import type { GeneExpressionProductionProjectionV1 } from "./gene-expression-production";
import { isValidTranscriptionPresentationState, type TranscriptionPresentationStateV1 } from "./transcription-presentation-state";
import { normalizeSpatialRaviaTheme, spatialRaviaThemePresentation, type SpatialRaviaTheme } from "./spatial-ravia-theme";

type Props = { projection: GeneExpressionProductionProjectionV1; presentation: TranscriptionPresentationStateV1; theme: SpatialRaviaTheme };
type SceneProps = { projection: GeneExpressionProductionProjectionV1; presentation?: TranscriptionPresentationStateV1; theme: SpatialRaviaTheme };

const sceneXFromProgress = (progress: number) => -2.8 + Math.max(0, Math.min(1, progress)) * 5.6;

function NuclearContext3D({ theme }: Pick<Props, "theme">) {
  const normalizedTheme = normalizeSpatialRaviaTheme(theme);
  const colors = spatialRaviaThemePresentation[normalizedTheme];
  return <group aria-label="nuclear context">
    <mesh scale={[6.8, 4.3, 3.1]} rotation={[0.08, 0.12, -0.08]} renderOrder={-2}>
      <sphereGeometry args={[1, 48, 32]} />
      <meshBasicMaterial color={colors.canvasFog} transparent opacity={normalizedTheme === "dark" ? 0.16 : 0.1} side={THREE.BackSide} depthWrite={false} />
    </mesh>
    <mesh scale={[6.95, 4.42, 3.2]} rotation={[0.08, 0.12, -0.08]} renderOrder={-1}>
      <sphereGeometry args={[1, 48, 32]} />
      <meshBasicMaterial color={colors.sceneFill} transparent opacity={normalizedTheme === "dark" ? 0.08 : 0.05} side={THREE.FrontSide} depthWrite={false} />
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

function MolecularBond({ from, to, color, radius = 0.018, opacity = 1 }: { from: readonly [number, number, number]; to: readonly [number, number, number]; color: string; radius?: number; opacity?: number }) {
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
    <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} roughness={0.72} />
  </mesh>;
}

function RnaNucleotideActor({ unit }: { unit: TranscriptionRnaUnit }) {
  const baseColor = unit.base === "U" ? "#e4b36b" : unit.base === "A" ? "#66b8db" : unit.base === "G" ? "#c885a8" : "#8ec68a";
  return <group position={unit.position}>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.075, 0.018, 8, 12]} />
      <meshStandardMaterial color="#58c6a2" roughness={0.62} />
    </mesh>
    <mesh position={[0.13, -0.08, -0.015]}>
      <sphereGeometry args={[0.038, 10, 8]} />
      <meshStandardMaterial color="#d49b57" roughness={0.7} />
    </mesh>
    <mesh position={[0, 0.14, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.065, 0.065, 0.026, 6]} />
      <meshStandardMaterial color={baseColor} roughness={0.64} emissive={unit.inHybrid ? "#8c5d2f" : "#000000"} emissiveIntensity={unit.inHybrid ? 0.22 : 0} />
    </mesh>
  </group>;
}

function PolIIComplex3D({ engaged, position }: { engaged: boolean; position: THREE.Vector3 }) {
  return <group aria-label="RNA polymerase II molecular complex">
    <TranscriptionRnapPresentation position={position} scale={1} opacity={engaged ? 1 : 0.48} />
  </group>;
}

function MolecularNascentRNA3D({ presentation }: { presentation: TranscriptionPresentationStateV1 }) {
  const rna = useMemo(() => sampleTranscriptionMolecularRna(presentation), [presentation]);
  if (rna.units.length === 0) return null;
  return <group aria-label="nascent RNA molecular polymer">
    {rna.backboneSegments.map((segment, index) => <MolecularBond key={`backbone-${index}`} from={segment.from} to={segment.to} color="#58c6a2" radius={0.022} />)}
    {rna.hybridPairs.map((pair) => <MolecularBond key={`hybrid-${pair.rnaUnitIndex}`} from={pair.rnaPosition} to={pair.dnaPosition} color="#e4b36b" radius={0.014} opacity={0.8} />)}
    {rna.units.map((unit) => <RnaNucleotideActor key={unit.index} unit={unit} />)}
  </group>;
}

function TranscriptionMechanism3D({ projection, presentation, theme }: Props) {
  const normalizedTheme = normalizeSpatialRaviaTheme(theme);
  const colors = spatialRaviaThemePresentation[normalizedTheme];
  const engaged = presentation.polymeraseEngagement > 0.01;
  const polymerasePosition = new THREE.Vector3(sceneXFromProgress(presentation.polymeraseGenePosition), engaged ? 0 : 0.42, 0.1);
  return <group>
    <NuclearContext3D theme={normalizedTheme} />
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
      <PolIIComplex3D engaged={engaged} position={polymerasePosition} />
      <MolecularNascentRNA3D presentation={presentation} />
      <Text position={[-2.9, 0.72, 0.12]} fontSize={0.18} color={colors.labelPrimary} anchorX="center">DNA</Text>
    </group>
  </group>;
}

export function GeneExpression3DScene({ projection, presentation, theme }: SceneProps) {
  if (!isValidTranscriptionPresentationState(presentation)) {
    return <section className="spatialRaviaStatus" role="alert" data-error-code="TRANSCRIPTION_PRESENTATION_STATE_INVALID"><strong>TRANSCRIPTION_PRESENTATION_STATE_INVALID</strong>{process.env.NODE_ENV !== "production" && <div>GeneExpression3DScene received no complete presentation state.</div>}</section>;
  }
  const normalizedTheme = normalizeSpatialRaviaTheme(theme);
  const colors = spatialRaviaThemePresentation[normalizedTheme];
  return <div className="geneExpression3DCanvas" data-3d-transcription-scene="true" data-transcription-bubble={projection.dna.transcriptionBubble} data-bubble-open-fraction={presentation.bubbleOpenFraction.toFixed(3)} data-polymerase-state={projection.transcription.polymeraseState} data-polymerase-position={presentation.polymeraseGenePosition.toFixed(3)} data-rna-length={presentation.nascentRnaVisualLength.toFixed(3)}>
    <Canvas shadows dpr={[1, 2]} camera={{ position: [3.6, 2.25, 4.7], fov: 34 }}>
      <color attach="background" args={[colors.canvasBackground]} />
      <fog attach="fog" args={[colors.canvasFog, 6.2, 13]} />
      <ambientLight intensity={normalizedTheme === "dark" ? 0.48 : 0.72} color={colors.sceneAmbient} />
      <directionalLight castShadow position={[3.5, 5, 5]} intensity={normalizedTheme === "dark" ? 2.8 : 2.35} color={colors.sceneKey} />
      <directionalLight position={[-4, 1.5, -2]} intensity={normalizedTheme === "dark" ? 1.2 : 0.9} color={colors.sceneFill} />
      <pointLight position={[0, -1.2, 2.6]} intensity={1.4} distance={7} color="#6bd5bd" />
      <TranscriptionMechanism3D projection={projection} presentation={presentation} theme={theme} />
      <OrbitControls enablePan={false} enableDamping dampingFactor={0.08} minDistance={4.2} maxDistance={9} />
    </Canvas>
  </div>;
}

"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { useMemo } from "react";
import { TranscriptionDnaTemplate } from "./TranscriptionDnaTemplate";
import { StructureDerivedPrimitive } from "./StructureDerivedPrimitive";
import { resolveTranscriptionStructureGrounding } from "./biology-transcription-structure-grounding";
import { transcriptionStructuralScalePolicy } from "./transcription-structural-actors";
import type { GeneExpressionProductionProjectionV1 } from "./gene-expression-production";
import { isValidTranscriptionPresentationState, type TranscriptionPresentationStateV1 } from "./transcription-presentation-state";
import { normalizeSpatialRaviaTheme, spatialRaviaThemePresentation, type SpatialRaviaTheme } from "./spatial-ravia-theme";
import { RnaStrand3D } from "./RnaMolecularStrand3D";
import { deriveFreeRnaContinuation } from "./transcription-free-rna-continuation";
import { deriveTranscriptionMechanismVisualState } from "./transcription-mechanism-presentation";

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

function PolIIComplex3D({ engaged, position }: { engaged: boolean; position: THREE.Vector3 }) {
  // The primary body is now owned by the deposited Mol* layer. Keep this
  // group as a structured anchor for exact-time overlays only; it deliberately
  // mounts no hand-authored protein geometry.
  return <group aria-label="deposited bacterial RNA polymerase structural anchor" position={position} visible={false} />;
}

function TranscriptionMechanism3D({ projection, presentation, theme }: Props) {
  const normalizedTheme = normalizeSpatialRaviaTheme(theme);
  const colors = spatialRaviaThemePresentation[normalizedTheme];
  const engaged = presentation.polymeraseEngagement > 0.01;
  const polymerasePosition = new THREE.Vector3(sceneXFromProgress(presentation.polymeraseGenePosition), engaged ? 0 : 0.42, 0.1);
  const freeRna = useMemo(() => deriveFreeRnaContinuation({
    canonicalVisibleLength: presentation.nascentRnaVisualLength,
    exitAnchor: [sceneXFromProgress(presentation.nascentRnaAnchor), -0.22, 0.18],
    exitDirection: [1, 0, 0],
  }), [presentation.nascentRnaAnchor, presentation.nascentRnaVisualLength]);
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
      {freeRna.strand && <RnaStrand3D input={{ sequence: freeRna.strand.nucleotides.map((nucleotide) => nucleotide.base), positions: freeRna.positions, direction: "5-to-3" }} showPolarity={false} />}
      <Text position={[-2.9, 0.72, 0.12]} fontSize={0.18} color={colors.labelPrimary} anchorX="center">DNA</Text>
    </group>
  </group>;
}

export function GeneExpression3DScene({ projection, presentation, theme }: SceneProps) {
  const structuralManifest = useMemo(() => resolveTranscriptionStructureGrounding(), []);
  if (!isValidTranscriptionPresentationState(presentation)) {
    return <section className="spatialRaviaStatus" role="alert" data-error-code="TRANSCRIPTION_PRESENTATION_STATE_INVALID"><strong>TRANSCRIPTION_PRESENTATION_STATE_INVALID</strong>{process.env.NODE_ENV !== "production" && <div>GeneExpression3DScene received no complete presentation state.</div>}</section>;
  }
  if (!structuralManifest) {
    return <section className="spatialRaviaStatus" role="alert" data-error-code="TRANSCRIPTION_STRUCTURAL_SOURCE_UNSUPPORTED"><strong>TRANSCRIPTION_STRUCTURAL_SOURCE_UNSUPPORTED</strong></section>;
  }
  const normalizedTheme = normalizeSpatialRaviaTheme(theme);
  const colors = spatialRaviaThemePresentation[normalizedTheme];
  const mechanismState = deriveTranscriptionMechanismVisualState(presentation);
  const freeTail = deriveFreeRnaContinuation({ canonicalVisibleLength: presentation.nascentRnaVisualLength, exitAnchor: [0, 0, 0], exitDirection: [1, 0, 0] });
  return <div className="geneExpression3DCanvas" data-3d-transcription-scene="true" data-transcription-stage={mechanismState.stage} data-polymerase-presentation={mechanismState.polymeraseMode} data-teaching-label={mechanismState.teachingLabel} data-molecular-viewport-owner="r3f" data-camera-owner="r3f" data-structural-scale={transcriptionStructuralScalePolicy.angstromToScene} data-transcription-bubble={projection.dna.transcriptionBubble} data-bubble-open-fraction={presentation.bubbleOpenFraction.toFixed(3)} data-polymerase-state={projection.transcription.polymeraseState} data-polymerase-position={presentation.polymeraseGenePosition.toFixed(3)} data-rna-length={presentation.nascentRnaVisualLength.toFixed(3)} data-rna-tail-count={freeTail.tailCount} data-rna-tail-fidelity={freeTail.fidelity} data-rna-boundary="6ALH:R:11" data-rna-exit-evidence={freeTail.exitEvidence}>
    <Canvas shadows dpr={[1, 2]} camera={{ position: [3.6, 2.25, 4.7], fov: 34 }}>
      <color attach="background" args={[colors.canvasBackground]} />
      <fog attach="fog" args={[colors.canvasFog, 6.2, 13]} />
      <ambientLight intensity={normalizedTheme === "dark" ? 0.48 : 0.72} color={colors.sceneAmbient} />
      <directionalLight castShadow position={[3.5, 5, 5]} intensity={normalizedTheme === "dark" ? 2.8 : 2.35} color={colors.sceneKey} />
      <directionalLight position={[-4, 1.5, -2]} intensity={normalizedTheme === "dark" ? 1.2 : 0.9} color={colors.sceneFill} />
      <pointLight position={[0, -1.2, 2.6]} intensity={1.4} distance={7} color="#6bd5bd" />
      <StructureDerivedPrimitive entry={structuralManifest} position={new THREE.Vector3(0, 0, 0)} scale={transcriptionStructuralScalePolicy.angstromToScene} visible fallback={null} />
      <TranscriptionMechanism3D projection={projection} presentation={presentation} theme={theme} />
      <OrbitControls enablePan={false} enableDamping dampingFactor={0.08} minDistance={4.2} maxDistance={9} />
    </Canvas>
    <div className="transcriptionStructuralNotice" role="note">STRUCTURAL ACTOR · 6ALH · BACTERIAL RNAP · E0_DEPOSITED · SHARED R3F FRAME</div>
  </div>;
}

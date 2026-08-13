"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { BiologySceneSpec } from "./biology-scene-spec";
import { ProteinComplexPrimitive } from "./ProteinComplexPrimitive";
import {
  dnaPolymeraseComplexDefinition,
  rnaPolymeraseComplexDefinition,
  sigmaFactorComplexDefinition,
} from "./ProteinComplexDefinitions";
import {
  getActionPotentialMotionState,
  getReplicationMotionState,
  getSignalingMotionState,
  getTranslationMotionState,
  getTranscriptionMotionState,
  type ActionPotentialMotionState,
  type ReplicationMotionState,
  type TranslationMotionState,
  type TranscriptionMotionState,
} from "./biology-motion-state";
import { deriveFiniteReplicationDirection, sampleReplicationFork } from "./biology-replication-geometry";
import {
  getReplicationStructureProvenance,
  createStructureTransform,
  resolveReplicationStructureGrounding,
} from "./biology-replication-structure-grounding";
import { StructureDerivedPrimitive } from "./StructureDerivedPrimitive";
import type { StructureDerivedGeometry, StructureManifestEntry } from "./biology-structure-grounding";
import { createTranscriptionStructureTransform, resolveTranscriptionStructureGrounding } from "./biology-transcription-structure-grounding";
import { sampleTranslationGeometry } from "./biology-translation-geometry";
import { loadGroundedTranslation, type GroundedTranslation, type GroundedTranslationSite } from "./biology-translation-structure-grounding.ts";
import { deriveTranslationVisualState } from "./biology-translation-visual-state.ts";
import { deriveTranslationDisplayIntent, type TranslationDisplayIntent } from "./biology-translation-display-intent.ts";
import {
  deriveTranslationRepresentationPlan,
  deriveTransferOwnershipLabelAnchors,
  getTranslationActorOpacity,
  translationVisualScalePolicy,
  type TranslationCameraFrame,
} from "./biology-translation-representation-plan.ts";
import { StructureConstrainedNucleicPrimitive } from "./StructureConstrainedNucleicPrimitive.tsx";
import type { StructureConstrainedResidue } from "./StructureConstrainedNucleicGeometry.ts";
import { createStructureConstrainedPeptidePath, deriveTransferCarrierPresentation, deriveTranslationTrnaTransforms, transformSitePoint } from "./biology-translation-actor-geometry.ts";
import { StructureDerivedContextPrimitive } from "./StructureDerivedContextPrimitive.tsx";
import { SelectedResidueDetailPrimitive } from "./SelectedResidueDetailPrimitive.tsx";
import { selectReactionAtomIndices } from "./SelectedResidueDetailGeometry.ts";
import { deriveFocusedTimelineWindow } from "./biology-translation-timeline-focus.ts";
import {
  getTranscriptionPathFrame,
  sampleMechanisticDnaHelix,
  sampleMutableRnaExitPath,
} from "./biology-transcription-geometry";
import {
  deriveTranscriptionDnaRegionAnnotation,
  transcriptionVisualScalePolicy,
} from "./biology-transcription-representation";
import {
  createMutableTubeGeometry,
  updateMutableTubeGeometry,
} from "./MutablePolymerGeometry";
import {
  getSpatialRaviaCameraPreset,
  spatialRaviaColors,
  spatialRaviaMaterialDefaults,
  spatialRaviaScale,
} from "./SpatialRaviaVisualSystem";
import { resolveSpatialPlacements } from "./biology-spatial-resolver";
import { SpatialTimelineControls } from "./SpatialTimelineControls";
import { useBiologyTimeline } from "./useBiologyTimeline";
import { spatialRaviaThemePresentation, type SpatialRaviaTheme } from "./spatial-ravia-theme";
import { MolstarStructurePresentationAdapter } from "./MolstarStructurePresentationAdapter";
import { deriveDnaPresentationPlan } from "./biology-dna-presentation";
import { TranscriptionDnaTemplate } from "./TranscriptionDnaTemplate";
import { deriveTranscriptionTemplatePlan } from "./biology-transcription-template";

type Props = {
  scene: BiologySceneSpec;
  theme?: SpatialRaviaTheme;
};

function HelixStrand({
  phase,
  startY,
  endY,
  radius,
}: {
  phase: number;
  startY: number;
  endY: number;
  radius: number;
}) {
  const points: THREE.Vector3[] = [];
  const steps = 80;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = THREE.MathUtils.lerp(startY, endY, t);
    const angle = t * Math.PI * 6 + phase;

    points.push(
      new THREE.Vector3(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      )
    );
  }

  const curve = new THREE.CatmullRomCurve3(points);

  return (
    <mesh>
      <tubeGeometry args={[curve, 120, 0.06, 12, false]} />
      <meshStandardMaterial />
    </mesh>
  );
}

function createSeparatedStrandCurve(side: -1 | 1) {
  const points = [
    new THREE.Vector3(side * 0.25, 0, 0),
    new THREE.Vector3(side * 0.5, 0.6, 0),
    new THREE.Vector3(side * 0.9, 1.4, 0),
    new THREE.Vector3(side * 1.2, 2.2, 0),
  ];

  return new THREE.CatmullRomCurve3(points);
}

function SeparatedStrand({ side }: { side: -1 | 1 }) {
  const curve = createSeparatedStrandCurve(side);

  return (
    <mesh>
      <tubeGeometry args={[curve, 60, 0.06, 12, false]} />
      <meshStandardMaterial />
    </mesh>
  );
}

function DNAFork() {
  return (
    <group>
      <HelixStrand
        phase={0}
        startY={-2.5}
        endY={0}
        radius={0.28}
      />

      <HelixStrand
        phase={Math.PI}
        startY={-2.5}
        endY={0}
        radius={0.28}
      />

      <SeparatedStrand side={-1} />
      <SeparatedStrand side={1} />

      <Text position={[0, -2.9, 0]} fontSize={0.22}>
        Double-stranded DNA
      </Text>

      <Text position={[0, 2.7, 0]} fontSize={0.22}>
        Separated ssDNA
      </Text>
    </group>
  );
}

function LinearDnaSegment({
  showBubble = false,
  showStrands = false,
}: {
  showBubble?: boolean;
  showStrands?: boolean;
}) {
  const topBefore = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.4, 0.16, 0),
    new THREE.Vector3(-0.82, 0.16, 0),
  ]);
  const bottomBefore = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.4, -0.16, 0),
    new THREE.Vector3(-0.82, -0.16, 0),
  ]);
  const topAfter = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.18, 0.16, 0),
    new THREE.Vector3(2.4, 0.16, 0),
  ]);
  const bottomAfter = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.18, -0.16, 0),
    new THREE.Vector3(2.4, -0.16, 0),
  ]);
  const topBubble = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.82, 0.16, 0),
    new THREE.Vector3(-0.55, 0.36, 0),
    new THREE.Vector3(-0.2, 0.34, 0),
    new THREE.Vector3(0.18, 0.16, 0),
  ]);
  const bottomBubble = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.82, -0.16, 0),
    new THREE.Vector3(-0.55, -0.36, 0),
    new THREE.Vector3(-0.2, -0.34, 0),
    new THREE.Vector3(0.18, -0.16, 0),
  ]);

  const curves = showBubble
    ? [topBefore, bottomBefore, topBubble, bottomBubble, topAfter, bottomAfter]
    : [
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-2.4, 0.16, 0),
          new THREE.Vector3(2.4, 0.16, 0),
        ]),
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-2.4, -0.16, 0),
          new THREE.Vector3(2.4, -0.16, 0),
        ]),
      ];

  return (
    <group>
      {curves.map((curve, index) => (
        <mesh key={index}>
          <tubeGeometry args={[curve, 48, 0.045, 10, false]} />
          <meshStandardMaterial color={index % 2 === 0 ? "#93c5fd" : "#c4b5fd"} />
        </mesh>
      ))}

      {showStrands && (
        <>
          <Text position={[1.2, 0.42, 0]} fontSize={0.14}>
            coding strand
          </Text>
          <Text position={[1.05, -0.42, 0]} fontSize={0.14}>
            template strand read 3 prime to 5 prime
          </Text>
        </>
      )}
    </group>
  );
}

function RegionMarker({
  position,
  label,
  color,
  width = 0.5,
}: {
  position: THREE.Vector3;
  label: string;
  color: string;
  width?: number;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[width, 0.08, 0.08]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text position={[0, 0.26, 0]} fontSize={0.14}>
        {label}
      </Text>
    </group>
  );
}

function TranscriptionDnaRegionMarker({
  centerX,
  label,
  color,
  width,
}: {
  centerX: number;
  label: string;
  color: string;
  width: number;
}) {
  const annotation = useMemo(
    () => deriveTranscriptionDnaRegionAnnotation(centerX, width),
    [centerX, width]
  );
  const line = useMemo(
    () => new THREE.LineCurve3(annotation.start, annotation.end),
    [annotation]
  );
  const connector = useMemo(
    () => new THREE.LineCurve3(annotation.connectorStart, annotation.connectorEnd),
    [annotation]
  );

  return (
    <group>
      <mesh>
        <tubeGeometry args={[line, 12, transcriptionVisualScalePolicy.regionLineRadius, 6, false]} />
        <meshStandardMaterial color={color} transparent opacity={0.8} roughness={0.66} />
      </mesh>
      <mesh>
        <tubeGeometry args={[connector, 6, transcriptionVisualScalePolicy.regionLineRadius * 0.55, 5, false]} />
        <meshStandardMaterial color={color} transparent opacity={0.48} roughness={0.7} />
      </mesh>
      <Text
        position={annotation.labelPosition}
        fontSize={transcriptionVisualScalePolicy.annotationFontSize}
        fillOpacity={transcriptionVisualScalePolicy.annotationOpacity}
        color={color}
      >
        {label}
      </Text>
    </group>
  );
}

function DnaTerminalMarkers({
  labels,
}: {
  labels: readonly [string, string];
}) {
  const fivePrime = useMemo(
    () => getTranscriptionPathFrame(-2.35).position.clone().add(new THREE.Vector3(0, -0.34, 0.14)),
    []
  );
  const threePrime = useMemo(
    () => getTranscriptionPathFrame(2.35).position.clone().add(new THREE.Vector3(0, 0.34, 0.14)),
    []
  );

  return (
    <group>
      <Text position={fivePrime} fontSize={0.09} fillOpacity={0.7}>{labels[0]}</Text>
      <Text position={threePrime} fontSize={0.09} fillOpacity={0.7}>{labels[1]}</Text>
    </group>
  );
}

function RnaPolymerase({
  position,
  label,
  orientation,
  compactLabel = false,
}: {
  position: THREE.Vector3;
  label: string;
  orientation?: THREE.Quaternion;
  compactLabel?: boolean;
}) {
  return (
    <ProteinComplexPrimitive
      definition={rnaPolymeraseComplexDefinition}
      position={position}
      quaternion={orientation}
      state="open"
      label={label}
      compactLabel={compactLabel}
    />
  );
}

function GroundedRnaPolymerase({
  position,
  direction,
  fallback,
  label,
}: {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  fallback: ReactNode;
  label: string;
}) {
  const entry = resolveTranscriptionStructureGrounding();
  const [resolved, setResolved] = useState<{ geometry: StructureDerivedGeometry } | null>(null);
  const transform = useMemo(() => {
    if (!resolved || !entry) return null;
    const active = resolved.geometry.anchors.find((anchor) => anchor.id === "active-center");
    const upstream = resolved.geometry.anchors.find((anchor) => anchor.id === "upstream-dna");
    const downstream = resolved.geometry.anchors.find((anchor) => anchor.id === "downstream-dna");
    if (!active || !upstream || !downstream) return null;
    const sourceDirection = downstream.point.clone().sub(upstream.point);
    if (sourceDirection.lengthSq() < 1e-9 || direction.lengthSq() < 1e-9) return null;
    return createTranscriptionStructureTransform({
      sourceAnchor: { point: active.point, direction: sourceDirection },
      targetAnchor: position,
      targetDirection: direction,
      scale: 0.018,
    });
  }, [direction, entry, position, resolved]);

  if (!entry) return <>{fallback}</>;
  return (
    <>
      <StructureDerivedPrimitive
        entry={entry}
        position={transform?.position ?? position}
        quaternion={transform?.quaternion}
        scale={transform?.scale ?? 0.018}
        visible={false}
        onResolved={(result) => setResolved({ geometry: result.geometry })}
      />
      {resolved
        ? <RnaPolymerase position={transform?.position ?? position} orientation={transform?.quaternion} label={label} compactLabel />
        : fallback}
    </>
  );
}

function RnaTranscript({ position }: { position: THREE.Vector3 }) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.22, -0.18, 0),
    new THREE.Vector3(-0.48, -0.26, 0),
    new THREE.Vector3(-0.78, -0.38, 0),
  ]);

  return (
    <group position={position}>
      <mesh>
        <tubeGeometry args={[curve, 36, transcriptionVisualScalePolicy.rnaBackboneRadius, 8, false]} />
        <meshStandardMaterial color="#69d6b3" roughness={0.64} />
      </mesh>
      <Text position={[-0.55, -0.58, 0]} fontSize={transcriptionVisualScalePolicy.annotationFontSize} fillOpacity={0.7}>
        RNA transcript
      </Text>
    </group>
  );
}

function AnimatedTranscriptionDna({
  motion,
  showStrands = false,
}: {
  motion: TranscriptionMotionState;
  showStrands?: boolean;
}) {
  const samples = useMemo(() => sampleMechanisticDnaHelix({ motion }), [motion]);
  const strandA = useMemo(() => samples.map((sample) => sample.strandA), [samples]);
  const strandB = useMemo(() => samples.map((sample) => sample.strandB), [samples]);

  return (
    <group>
      <MutableTubeMesh
        points={strandA}
        radius={transcriptionVisualScalePolicy.dnaBackboneRadius}
        radialSegments={8}
        color="#b8d8ea"
        roughness={0.56}
        metalness={0.03}
      />
      <MutableTubeMesh
        points={strandB}
        radius={transcriptionVisualScalePolicy.dnaBackboneRadius}
        radialSegments={8}
        color="#d3c7ee"
        roughness={0.58}
        metalness={0.03}
      />
      <InstancedBasePairs samples={samples} stride={4} />
      {showStrands && (
        <>
          <Text position={[1.72, 0.34, 0.14]} fontSize={transcriptionVisualScalePolicy.annotationFontSize} fillOpacity={0.68}>
            DNA
          </Text>
        </>
      )}
    </group>
  );
}

function MutableTubeMesh({
  points,
  activeSampleCount = points.length,
  radius,
  radialSegments,
  color,
  opacity = 1,
  roughness = 0.6,
  metalness = 0,
}: {
  points: THREE.Vector3[];
  activeSampleCount?: number;
  radius: number;
  radialSegments: number;
  color: string;
  opacity?: number;
  roughness?: number;
  metalness?: number;
}) {
  const tube = useMemo(
    () =>
      createMutableTubeGeometry({
        sampleCount: points.length,
        radialSegments,
        radius,
      }),
    [points.length, radialSegments, radius]
  );

  useLayoutEffect(() => {
    updateMutableTubeGeometry({ handle: tube, points, activeSampleCount });
  }, [activeSampleCount, points, tube]);

  return (
    <mesh geometry={tube.geometry} frustumCulled={false}>
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        roughness={roughness}
        metalness={metalness}
      />
    </mesh>
  );
}

function InstancedBasePairs({
  samples,
  stride,
}: {
  samples: ReturnType<typeof sampleMechanisticDnaHelix>;
  stride: number;
}) {
  const pairs = useMemo(
    () => samples.filter((sample, index) => index % stride === 0 && sample.opening < 0.16),
    [samples, stride]
  );
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matrix = useMemo(() => new THREE.Matrix4(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    pairs.forEach((sample, index) => {
      const midpoint = sample.basePairStart
        .clone()
        .add(sample.basePairEnd)
        .multiplyScalar(0.5);
      const direction = sample.basePairEnd.clone().sub(sample.basePairStart);
      const length = direction.length();
      const quaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.clone().normalize()
      );
      matrix.compose(
        midpoint,
        quaternion,
        new THREE.Vector3(1, length, 1)
      );
      mesh.setMatrixAt(index, matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  }, [matrix, pairs]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, pairs.length]}>
      <cylinderGeometry args={[transcriptionVisualScalePolicy.basePairRadius, transcriptionVisualScalePolicy.basePairRadius, 1, 6]} />
      <meshStandardMaterial color="#d8d1b8" transparent opacity={0.6} roughness={0.78} />
    </instancedMesh>
  );
}

function AnimatedRnaTranscript({
  motion,
}: {
  motion: TranscriptionMotionState;
}) {
  const path = useMemo(() => sampleMutableRnaExitPath({ motion }), [motion]);
  const points = path.points;
  const lastPoint =
    points[Math.max(Math.min(path.activeSampleCount - 1, points.length - 1), 0)];

  return (
    <group>
      <MutableTubeMesh
        points={points}
        activeSampleCount={path.activeSampleCount}
        radius={transcriptionVisualScalePolicy.rnaBackboneRadius}
        radialSegments={8}
        color="#69d6b3"
        opacity={motion.rnaOpacity}
        roughness={0.64}
      />
      {path.activeSampleCount > 0 && (
        <mesh position={lastPoint}>
          <sphereGeometry args={[transcriptionVisualScalePolicy.rnaTerminalRadius, 12, 10]} />
          <meshStandardMaterial color="#b8f3dd" roughness={0.62} />
        </mesh>
      )}
    </group>
  );
}

function SigmaFactor({ position }: { position: THREE.Vector3 }) {
  return (
    <ProteinComplexPrimitive
      definition={sigmaFactorComplexDefinition}
      position={position}
      label="sigma"
      compactLabel
    />
  );
}

function TranscriptionDirectionMarkers({
  rna5Prime,
  rna3Prime,
  template3Prime,
  template5Prime,
}: {
  rna5Prime?: THREE.Vector3;
  rna3Prime?: THREE.Vector3;
  template3Prime?: THREE.Vector3;
  template5Prime?: THREE.Vector3;
}) {
  return (
    <group>
      {rna5Prime && (
        <Text position={rna5Prime} fontSize={0.14}>
          RNA 5 prime
        </Text>
      )}
      {rna3Prime && (
        <Text position={rna3Prime} fontSize={0.14}>
          RNA 3 prime growing end
        </Text>
      )}
      {template3Prime && (
        <Text position={template3Prime} fontSize={0.14}>
          template 3 prime
        </Text>
      )}
      {template5Prime && (
        <Text position={template5Prime} fontSize={0.14}>
          template 5 prime
        </Text>
      )}
    </group>
  );
}

function MrnaStrand() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.1, -0.34, 0),
    new THREE.Vector3(-0.8, -0.34, 0),
    new THREE.Vector3(0.8, -0.34, 0),
    new THREE.Vector3(2.1, -0.34, 0),
  ]);

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 64, spatialRaviaScale.polymerRadius, 10, false]} />
        <meshStandardMaterial color={spatialRaviaColors.mrna} {...spatialRaviaMaterialDefaults.polymer} />
      </mesh>
      <Text position={[-1.95, -0.72, 0]} fontSize={0.1} fillOpacity={0.72}>
        mRNA
      </Text>
    </group>
  );
}

function RibosomeBody({ label }: { label: string }) {
  return (
    <group>
      <mesh position={[-0.08, 0.52, 0.05]} scale={[1.18, 0.82, 0.72]}>
        <sphereGeometry args={[0.78, 36, 22]} />
        <meshStandardMaterial color={spatialRaviaColors.proteinLight} {...spatialRaviaMaterialDefaults.protein} />
      </mesh>
      <mesh position={[0.22, 0.62, -0.2]} scale={[0.78, 0.52, 0.62]}>
        <sphereGeometry args={[0.58, 28, 18]} />
        <meshStandardMaterial color="#b8ad9e" {...spatialRaviaMaterialDefaults.protein} />
      </mesh>
      <mesh position={[-0.44, 0.24, 0.18]} scale={[0.64, 0.5, 0.48]}>
        <sphereGeometry args={[0.55, 28, 18]} />
        <meshStandardMaterial color="#a99f92" {...spatialRaviaMaterialDefaults.protein} />
      </mesh>
      <mesh position={[0, -0.08, 0.02]} scale={[1.55, 0.43, 0.5]}>
        <sphereGeometry args={[0.72, 36, 20]} />
        <meshStandardMaterial color="#91a2a8" roughness={0.8} metalness={0.015} />
      </mesh>
      <mesh position={[0, 0.13, 0.5]} scale={[1.5, 0.16, 0.16]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={spatialRaviaColors.cavity} transparent opacity={0.5} roughness={0.92} />
      </mesh>
      <mesh position={[-0.18, 0.82, 0.34]} rotation={[0.15, 0, -0.36]}>
        <cylinderGeometry args={[0.1, 0.16, 0.84, 18]} />
        <meshStandardMaterial color={spatialRaviaColors.proteinDark} roughness={0.84} />
      </mesh>
      <mesh position={[-0.34, 0.92, 0.42]} rotation={[0.35, 0.2, -0.55]}>
        <torusGeometry args={[0.18, 0.035, 10, 26]} />
        <meshStandardMaterial color={spatialRaviaColors.cavity} transparent opacity={0.58} roughness={0.88} />
      </mesh>
      <Text position={[0, 1.38, 0.18]} fontSize={0.105} fillOpacity={0.78}>
        {label}
      </Text>
    </group>
  );
}

function RibosomeSite({
  position,
  label,
  color = spatialRaviaColors.stateMarker,
  opacity = 0.84,
}: {
  position: THREE.Vector3;
  label: string;
  color?: string;
  opacity?: number;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.34, spatialRaviaScale.siteMarkerHeight, 0.05]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.72} />
      </mesh>
      <Text position={[0, -0.17, 0.03]} fontSize={0.11} fillOpacity={0.88}>
        {label}
      </Text>
    </group>
  );
}

function TrnaShape({
  position,
  label,
  color = "#60a5fa",
  charged = false,
  carriesPeptide = false,
  opacity = 1,
  rotation = [0, 0, 0],
}: {
  position: THREE.Vector3;
  label: string;
  color?: string;
  charged?: boolean;
  carriesPeptide?: boolean;
  opacity?: number;
  rotation?: [number, number, number];
}) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.18, -0.34, 0.03),
    new THREE.Vector3(-0.12, -0.02, 0.06),
    new THREE.Vector3(0.1, 0.02, 0.02),
    new THREE.Vector3(0.18, 0.42, -0.02),
  ]);

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <tubeGeometry args={[curve, 30, 0.04, 8, false]} />
        <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} roughness={0.76} metalness={0.015} />
      </mesh>
      <mesh position={[-0.2, -0.36, 0.02]} rotation={[0, 0, -0.08]}>
        <boxGeometry args={[0.24, 0.045, 0.045]} />
        <meshStandardMaterial color={spatialRaviaColors.anticodon} transparent={opacity < 1} opacity={opacity} roughness={0.68} />
      </mesh>
      <mesh position={[0.18, 0.42, -0.02]}>
        <sphereGeometry args={[0.052, 12, 10]} />
        <meshStandardMaterial color={spatialRaviaColors.trna} transparent={opacity < 1} opacity={opacity} roughness={0.7} />
      </mesh>
      {charged && (
        <mesh position={[0.2, 0.54, -0.02]}>
          <sphereGeometry args={[spatialRaviaScale.aminoAcidRadius, 16, 12]} />
          <meshStandardMaterial color={spatialRaviaColors.stateMarker} transparent={opacity < 1} opacity={opacity} roughness={0.64} />
        </mesh>
      )}
      {carriesPeptide && (
        <mesh position={[0.17, 0.58, 0.02]}>
          <sphereGeometry args={[0.06, 14, 12]} />
          <meshStandardMaterial color={spatialRaviaColors.polypeptide} transparent={opacity < 1} opacity={opacity} roughness={0.68} />
        </mesh>
      )}
      {label && (
        <Text position={[0, 0.72, 0]} fontSize={0.075} fillOpacity={0.68}>
          {label}
        </Text>
      )}
    </group>
  );
}

function AminoAcid({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[spatialRaviaScale.aminoAcidRadius, 18, 14]} />
        <meshStandardMaterial color={spatialRaviaColors.stateMarker} {...spatialRaviaMaterialDefaults.smallMolecule} />
      </mesh>
    </group>
  );
}

function CodonMarker({
  position,
  label,
  color = "#fbbf24",
}: {
  position: THREE.Vector3;
  label: string;
  color?: string;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.3, 0.045, 0.055]} />
        <meshStandardMaterial color={color} transparent opacity={0.82} roughness={0.72} />
      </mesh>
      <Text position={[0, -0.15, 0.02]} fontSize={0.072} fillOpacity={0.72}>
        {label}
      </Text>
    </group>
  );
}

function Polypeptide({ position }: { position: THREE.Vector3 }) {
  const beads = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.12, 0.18, 0.04),
    new THREE.Vector3(-0.24, 0.36, 0.02),
    new THREE.Vector3(-0.4, 0.52, 0.06),
  ];

  return (
    <group position={position}>
      {beads.map((bead, index) => (
        <mesh key={index} position={bead}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color={spatialRaviaColors.polypeptide} roughness={0.68} />
        </mesh>
      ))}
    </group>
  );
}

function ReleaseFactor({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      <mesh scale={[0.75, 1.1, 0.48]}>
        <sphereGeometry args={[0.22, 22, 16]} />
        <meshStandardMaterial color={spatialRaviaColors.proteinActive} roughness={0.74} metalness={0.02} />
      </mesh>
      <mesh position={[0.08, -0.12, 0.05]} scale={[0.55, 0.42, 0.42]}>
        <sphereGeometry args={[0.18, 18, 12]} />
        <meshStandardMaterial color={spatialRaviaColors.proteinDark} roughness={0.8} />
      </mesh>
    </group>
  );
}

function TranslationDirectionMarkers({
  mrna5Prime,
  mrna3Prime,
  nTerminus,
  cTerminus,
}: {
  mrna5Prime?: THREE.Vector3;
  mrna3Prime?: THREE.Vector3;
  nTerminus?: THREE.Vector3;
  cTerminus?: THREE.Vector3;
}) {
  return (
    <group>
      {mrna5Prime && (
        <Text position={mrna5Prime} fontSize={0.13}>
          mRNA 5 prime
        </Text>
      )}
      {mrna3Prime && (
        <Text position={mrna3Prime} fontSize={0.13}>
          mRNA 3 prime
        </Text>
      )}
      {nTerminus && (
        <Text position={nTerminus} fontSize={0.12}>
          N terminus
        </Text>
      )}
      {cTerminus && (
        <Text position={cTerminus} fontSize={0.12}>
          C terminus grows
        </Text>
      )}
    </group>
  );
}

function GroundedResidueCloud({ points, color, opacity = 0.38 }: { points: THREE.Vector3[]; color: string; opacity?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    points.forEach((point, index) => { dummy.position.copy(point); dummy.scale.setScalar(translationVisualScalePolicy.ribosomeContextPointRadius); dummy.updateMatrix(); ref.current?.setMatrixAt(index, dummy.matrix); });
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, [dummy, points]);
  return <instancedMesh ref={ref} args={[undefined, undefined, points.length]} frustumCulled={false}><sphereGeometry args={[1, 7, 7]} /><meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.82} depthWrite={false} /></instancedMesh>;
}

function applyTranslationCameraFrame(
  camera: THREE.Camera,
  controls: unknown,
  frame: TranslationCameraFrame
) {
  camera.position.copy(frame.position);
  if ("fov" in camera) {
    const perspective = camera as THREE.PerspectiveCamera;
    perspective.near = frame.near;
    perspective.far = frame.far;
    perspective.fov = frame.fov;
    perspective.updateProjectionMatrix();
  }
  const orbit = controls as { target?: THREE.Vector3; update?: () => void } | undefined;
  if (orbit?.target) orbit.target.copy(frame.target);
  camera.lookAt(frame.target);
  orbit?.update?.();
}

function TranslationCameraRig({ frame, controls, resetVersion }: { frame: TranslationCameraFrame; controls: OrbitControlsImpl | null; resetVersion: number }) {
  const { camera } = useThree();
  const appliedFrameRef = useRef<string | null>(null);
  const frameId = `${frame.position.toArray().join(",")}|${frame.target.toArray().join(",")}|${frame.fov}|${frame.near}|${frame.far}|${resetVersion}`;
  useLayoutEffect(() => {
    if (!controls || appliedFrameRef.current === frameId) return;
    applyTranslationCameraFrame(camera, controls, frame);
    appliedFrameRef.current = frameId;
  }, [camera, controls, frame, frameId]);
  return null;
}

function TransferOwnershipLabel({ position, label, role, color, foreground }: { position: THREE.Vector3; label: "A" | "P"; role: string; color: string; foreground: string }) {
  return <group position={position}>
    <Text position={[0, 0.026, 0]} fontSize={0.075} color={color} anchorX="center" anchorY="middle" renderOrder={20} material-depthTest={false}>{label}</Text>
    <Text position={[0, -0.042, 0]} fontSize={0.024} color={foreground} anchorX="center" anchorY="middle" renderOrder={20} material-depthTest={false}>{role}</Text>
  </group>;
}

function GroundedTrna({ source, position, quaternion, color, opacity = 1, anticodonResidues = [], acceptorResidues = [], showPayload = false, payloadOpacity = 1, showPeptide = false, backboneRadius = translationVisualScalePolicy.trnaBackboneRadius }: { source: GroundedTranslationSite; position: THREE.Vector3; quaternion: THREE.Quaternion; color: string; opacity?: number; anticodonResidues?: StructureConstrainedResidue[]; acceptorResidues?: StructureConstrainedResidue[]; showPayload?: boolean; payloadOpacity?: number; showPeptide?: boolean; backboneRadius?: number }) {
  const local = useMemo(() => {
    const inverse = source.quaternion.clone().invert();
    const localize = (residues: StructureConstrainedResidue[]) => residues.map((residue) => ({ ...residue, position: residue.position.clone().sub(source.position).applyQuaternion(inverse) }));
    return {
      trace: source.trace.map((point) => point.clone().sub(source.position).applyQuaternion(inverse)),
      acceptor: source.acceptor.clone().sub(source.position).applyQuaternion(inverse),
      anticodonResidues: localize(anticodonResidues),
      acceptorResidues: localize(acceptorResidues),
    };
  }, [source, anticodonResidues, acceptorResidues]);
  return <group position={position} quaternion={quaternion}>
    <StructureConstrainedNucleicPrimitive trace={local.trace} residues={[...local.anticodonResidues, ...local.acceptorResidues]} color={color} opacity={opacity} radius={backboneRadius} residueRadius={translationVisualScalePolicy.selectedResidueGlyphRadius} emphasis={local.anticodonResidues.length > 0 || local.acceptorResidues.length > 0} functionalAnchors={[local.acceptor, ...local.anticodonResidues.map((residue) => residue.position)]} functionalRadius={backboneRadius * 1.35} functionalOpacity={Math.min(1, opacity + 0.12)} />
    {showPayload && <mesh position={local.acceptor}><sphereGeometry args={[translationVisualScalePolicy.aminoAcidGlyphRadius, 14, 12]} /><meshStandardMaterial color={spatialRaviaColors.stateMarker} emissive={spatialRaviaColors.stateMarker} emissiveIntensity={0.24} transparent={payloadOpacity < 1} opacity={payloadOpacity} /></mesh>}
    {showPeptide && <mesh position={local.acceptor}><sphereGeometry args={[0.06, 14, 12]} /><meshStandardMaterial color={spatialRaviaColors.polypeptide} /></mesh>}
  </group>;
}

function GroundedTranslationMachine({ motion, fallback, displayIntent, controls, cameraResetVersion, theme = "light", renderStructuralActors = true, ...flags }: {
  motion: TranslationMotionState; fallback: ReactNode; displayIntent: TranslationDisplayIntent; controls: OrbitControlsImpl | null; cameraResetVersion: number; theme?: SpatialRaviaTheme; renderStructuralActors?: boolean; showInitiation: boolean; showEntry: boolean; showRecognition: boolean; showPeptide: boolean; showTranslocation: boolean; showTermination: boolean; showDirectionality: boolean;
}) {
  const [grounding, setGrounding] = useState<GroundedTranslation | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { let active = true; loadGroundedTranslation().then((value) => { if (active) setGrounding(value); }).catch(() => { if (active) setFailed(true); }); return () => { active = false; }; }, []);
  if (!grounding) return failed ? <>{fallback}</> : null;
  const { a, p, e } = grounding.sites;
  const visual = deriveTranslationVisualState(motion);
  const plan = deriveTranslationRepresentationPlan(grounding, motion, displayIntent);
  // Transfer ROI contains only cached grounded terminal atoms and the PTC, so
  // the resulting frame is invariant across before/during/after motion.
  const cameraFrame = plan.camera;
  const translocation = motion.translocationProgress;
  const incoming = a.position.clone().add(new THREE.Vector3(0.8, 0.9, 0.55)).lerp(a.position, motion.incomingTrnaProgress);
  const trnaTransforms = deriveTranslationTrnaTransforms(grounding, motion);
  const pMoving = trnaTransforms.peptidylPosition;
  const eMoving = trnaTransforms.exitingPosition;
  const exiting = e.position.clone().lerp(e.position.clone().add(new THREE.Vector3(-0.9, 0.65, 0.45)), motion.exitingTrnaProgress);
  const incomingAnticodon = transformSitePoint(a, a.anticodon, incoming, a.quaternion);
  const peptide = createStructureConstrainedPeptidePath(grounding, motion, { transferFocus: displayIntent === "transfer" });
  const transferPresentation = deriveTransferCarrierPresentation(motion);
  const transferFocus = displayIntent === "transfer";
  const ownershipLabels = deriveTransferOwnershipLabelAnchors(grounding, cameraFrame);
  const aReactionAtoms = selectReactionAtomIndices(grounding.activeAtoms.acceptor.a, a.acceptor);
  const pReactionAtoms = selectReactionAtomIndices(grounding.activeAtoms.acceptor.p, p.acceptor);
  const anticodonAtoms = selectReactionAtomIndices(grounding.activeAtoms.anticodon.a, a.anticodon, 5);
  const codonAtoms = selectReactionAtomIndices(grounding.activeAtoms.codon, grounding.codonContact, 5);
  const transferInProgress = transferFocus && transferPresentation.stage === "during";
  const transferRole = transferPresentation.stage === "before" ? { a: "AMINO ACID", p: "PEPTIDE" } : transferPresentation.stage === "during" ? { a: "RECIPIENT", p: "DONOR" } : { a: "PEPTIDE", p: "DEACYLATED" };
  const sceneTheme = spatialRaviaThemePresentation[theme];
  return <group>
    <TranslationCameraRig frame={cameraFrame} controls={controls} resetVersion={cameraResetVersion} />
    {renderStructuralActors && plan.context.largeSubunit.detail !== "hidden" && (grounding.ribosome.context
      ? <StructureDerivedContextPrimitive context={grounding.ribosome.context.large} detail={plan.context.largeSubunit.detail} roi={plan.roi.center} color="#b8ad9e" opacity={plan.context.largeSubunit.opacity} />
      : <GroundedResidueCloud points={grounding.ribosome.large} color="#b8ad9e" opacity={plan.context.largeSubunit.opacity} />)}
    {renderStructuralActors && plan.context.smallSubunit.detail !== "hidden" && (grounding.ribosome.context
      ? <StructureDerivedContextPrimitive context={grounding.ribosome.context.small} detail={plan.context.smallSubunit.detail} roi={plan.roi.center} color="#91a2a8" opacity={plan.context.smallSubunit.opacity} />
      : <GroundedResidueCloud points={grounding.ribosome.small} color="#91a2a8" opacity={plan.context.smallSubunit.opacity} />)}
    {renderStructuralActors && grounding.mrna.length > 1 && <StructureConstrainedNucleicPrimitive trace={grounding.mrna} residues={plan.activeSite.codon ? plan.activeSite.residues.codon : []} color={spatialRaviaColors.mrna} opacity={plan.context.mrna.opacity} radius={plan.scale.mrnaBackboneRadius} residueRadius={plan.scale.selectedResidueGlyphRadius} emphasis={plan.activeSite.codon} functionalAnchors={plan.activeSite.codon ? plan.activeSite.residues.codon.map((residue) => residue.position) : []} functionalRadius={plan.scale.mrnaBackboneRadius * 1.3} />}
    {plan.annotations.sites && <><RibosomeSite position={e.position} label="E" color={spatialRaviaColors.trnaEmpty} opacity={visual.activeSites.e} /><RibosomeSite position={p.position} label="P" color={spatialRaviaColors.trnaPeptidyl} opacity={visual.activeSites.p} /><RibosomeSite position={a.position} label="A" color={spatialRaviaColors.trnaIncoming} opacity={visual.activeSites.a} /></>}
    {plan.activeSite.codon && <><CodonMarker position={grounding.codonContact} label={flags.showTermination ? "stop" : "codon"} color={flags.showTermination ? spatialRaviaColors.dangerState : spatialRaviaColors.codon} />
      <mesh position={grounding.codonContact}><sphereGeometry args={[translationVisualScalePolicy.selectedResidueGlyphRadius, 14, 12]} /><meshStandardMaterial color={spatialRaviaColors.codon} emissive={spatialRaviaColors.codon} emissiveIntensity={0.32} /></mesh></>}
    {renderStructuralActors && transferFocus && <>
      <GroundedTrna source={a} position={a.position} quaternion={a.quaternion} color={spatialRaviaColors.trnaIncoming} opacity={1} backboneRadius={0.017} anticodonResidues={plan.activeSite.anticodon ? plan.activeSite.residues.anticodon.a : []} acceptorResidues={plan.activeSite.residues.acceptor.a} showPayload={transferPresentation.stage !== "after"} payloadOpacity={transferPresentation.stage === "during" ? 0.72 : 1} />
      <GroundedTrna source={p} position={p.position} quaternion={p.quaternion} color={spatialRaviaColors.trnaPeptidyl} opacity={transferPresentation.stage === "after" ? 0.48 : 0.88} backboneRadius={0.017} acceptorResidues={plan.activeSite.residues.acceptor.p} />
    </>}
    {renderStructuralActors && !transferFocus && <>
      {flags.showEntry && !flags.showTermination && motion.incomingTrnaProgress > 0.03 && plan.actors.aTrna !== "hidden" && <GroundedTrna source={a} position={incoming} quaternion={a.quaternion} color={spatialRaviaColors.trnaIncoming} opacity={getTranslationActorOpacity(plan, "aTrna")} anticodonResidues={plan.activeSite.anticodon ? plan.activeSite.residues.anticodon.a : []} acceptorResidues={plan.activeSite.acceptorEnds ? plan.activeSite.residues.acceptor.a : []} showPayload={visual.incomingCharged} />}
      {!visual.peptidylOnA && (flags.showInitiation || flags.showPeptide || motion.pSiteOccupancy.occupied) && plan.actors.pTrna !== "hidden" && <GroundedTrna source={p} position={p.position} quaternion={p.quaternion} color={spatialRaviaColors.trnaPeptidyl} opacity={Math.min(visual.activeSites.p, getTranslationActorOpacity(plan, "pTrna"))} acceptorResidues={plan.activeSite.acceptorEnds ? plan.activeSite.residues.acceptor.p : []} showPeptide={visual.peptidylOnP && plan.activeSite.peptideCarrier} />}
      {visual.peptidylOnA && plan.actors.aTrna !== "hidden" && <GroundedTrna source={a} position={pMoving} quaternion={trnaTransforms.peptidylQuaternion} color={spatialRaviaColors.trnaIncoming} opacity={Math.min(visual.activeSites.p, getTranslationActorOpacity(plan, "aTrna"))} acceptorResidues={plan.activeSite.acceptorEnds ? plan.activeSite.residues.acceptor.a : []} showPeptide />}
    </>}
    {renderStructuralActors && plan.actors.eTrna !== "hidden" && flags.showTranslocation && translocation > 0.12 && <GroundedTrna source={p} position={motion.exitingTrnaProgress > 0 ? exiting : eMoving} quaternion={motion.exitingTrnaProgress > 0 ? trnaTransforms.exitingQuaternion : trnaTransforms.exitingQuaternion} color={spatialRaviaColors.trnaEmpty} opacity={Math.min(Math.max(0.36, 0.72 - motion.exitingTrnaProgress * 0.45), getTranslationActorOpacity(plan, "eTrna"))} />}
    {plan.annotations.codon && plan.annotations.anticodon && <>
      <mesh><tubeGeometry args={[new THREE.LineCurve3(grounding.codonContact, incomingAnticodon), 8, 0.012, 6, false]} /><meshStandardMaterial color={spatialRaviaColors.anticodon} transparent opacity={0.72} /></mesh>
      <Text position={grounding.codonContact.clone().add(new THREE.Vector3(0, -0.12, 0))} fontSize={0.07}>CODON</Text>
      <Text position={incomingAnticodon.clone().add(new THREE.Vector3(0, 0.1, 0))} fontSize={0.07}>ANTICODON</Text>
    </>}
    {plan.annotations.ptc && <><mesh position={grounding.peptidylTransferCenter}><sphereGeometry args={[plan.scale.ptcGlyphRadius, 14, 12]} /><meshStandardMaterial color={spatialRaviaColors.stateMarker} emissive={spatialRaviaColors.stateMarker} emissiveIntensity={0.56} /></mesh>{plan.annotations.peptideTransfer && !transferFocus && <Text position={grounding.peptidylTransferCenter.clone().add(new THREE.Vector3(0, 0.14, 0))} fontSize={plan.scale.labelFontSize} color={sceneTheme.foreground}>PEPTIDE TRANSFER</Text>}</>}
    {renderStructuralActors && displayIntent === "transfer" && <>
      <SelectedResidueDetailPrimitive atoms={grounding.activeAtoms.acceptor.a} reactionAtomIndices={aReactionAtoms} highlighted opacity={0.98} atomScale={plan.scale.activeAtomScale} bondRadius={plan.scale.activeBondRadius} supportingOpacity={plan.scale.supportingAtomOpacity} />
      <SelectedResidueDetailPrimitive atoms={grounding.activeAtoms.acceptor.p} reactionAtomIndices={pReactionAtoms} highlighted opacity={0.98} atomScale={plan.scale.activeAtomScale} bondRadius={plan.scale.activeBondRadius} supportingOpacity={plan.scale.supportingAtomOpacity} />
      <TransferOwnershipLabel position={ownershipLabels.a} label="A" role={transferRole.a} color={spatialRaviaColors.trnaIncoming} foreground={sceneTheme.foreground} />
      <TransferOwnershipLabel position={ownershipLabels.p} label="P" role={transferRole.p} color={spatialRaviaColors.trnaPeptidyl} foreground={sceneTheme.foreground} />
      {transferInProgress && <mesh><tubeGeometry args={[new THREE.QuadraticBezierCurve3(p.acceptor, p.acceptor.clone().lerp(a.acceptor, 0.5).add(new THREE.Vector3(0.015, 0.025, 0)), peptide.carrier.root), 8, 0.003, 5, false]} /><meshStandardMaterial color={spatialRaviaColors.stateMarker} emissive={spatialRaviaColors.stateMarker} emissiveIntensity={0.18} transparent opacity={0.82} /></mesh>}
    </>}
    {renderStructuralActors && plan.activeSite.anticodon && grounding.activeAtoms.anticodon.a.length > 0 && <SelectedResidueDetailPrimitive atoms={grounding.activeAtoms.anticodon.a} reactionAtomIndices={anticodonAtoms} highlighted opacity={0.82} atomScale={plan.scale.activeAtomScale} bondRadius={plan.scale.activeBondRadius} supportingOpacity={plan.scale.supportingAtomOpacity} />}
    {renderStructuralActors && plan.activeSite.codon && grounding.activeAtoms.codon.length > 0 && <SelectedResidueDetailPrimitive atoms={grounding.activeAtoms.codon} reactionAtomIndices={codonAtoms} highlighted opacity={0.82} atomScale={plan.scale.activeAtomScale} bondRadius={plan.scale.activeBondRadius} supportingOpacity={plan.scale.supportingAtomOpacity} />}
    {flags.showPeptide && plan.actors.peptide !== "hidden" && <MutableTubeMesh points={peptide.points} activeSampleCount={displayIntent === "transfer" ? Math.min(6, peptide.points.length) : Math.min(peptide.points.length, Math.max(3, Math.round(3 + motion.peptideLength * 12)))} radius={displayIntent === "transfer" ? plan.scale.transferExternalPeptideRadius : plan.scale.peptideBackboneRadius} radialSegments={6} color={spatialRaviaColors.polypeptide} opacity={displayIntent === "transfer" ? 0.52 : 1} roughness={0.62} />}
    {flags.showTermination && plan.actors.releaseFactor !== "hidden" && <ReleaseFactor position={a.position.clone().add(new THREE.Vector3(0, 0.55, 0.18))} />}
  </group>;
}

function LegacyAnimatedTranslationMachine({
  motion,
  ribosomeLabel,
  showInitiation,
  showEntry,
  showRecognition,
  showPeptide,
  showTranslocation,
  showTermination,
  showDirectionality,
}: {
  motion: TranslationMotionState;
  ribosomeLabel: string;
  showInitiation: boolean;
  showEntry: boolean;
  showRecognition: boolean;
  showPeptide: boolean;
  showTranslocation: boolean;
  showTermination: boolean;
  showDirectionality: boolean;
}) {
  const samples = useMemo(() => sampleTranslationGeometry(motion), [motion]);
  const showIncomingTrna =
    showEntry &&
    !showTermination &&
    motion.incomingTrnaProgress > 0.03 &&
    motion.aSiteOccupancy.trna !== "release-factor";
  const showPTrna =
    showInitiation ||
    showPeptide ||
    showTranslocation ||
    motion.pSiteOccupancy.occupied;
  const showETrna =
    showTranslocation &&
    (motion.eSiteOccupancy.occupied || motion.exitingTrnaProgress > 0.02);
  const exitingOpacity = Math.max(0, 1 - motion.exitingTrnaProgress * 0.85);

  return (
    <group>
      <RibosomeBody label={ribosomeLabel} />
      <MutableTubeMesh
        points={samples.mrna}
        activeSampleCount={samples.mrnaActiveSampleCount}
        radius={spatialRaviaScale.polymerRadius}
        radialSegments={9}
        color={spatialRaviaColors.mrna}
        roughness={0.68}
      />
      <RibosomeSite position={samples.eSite} label="E" />
      <RibosomeSite position={samples.pSite} label="P" />
      <RibosomeSite position={samples.aSite} label="A" />
      <CodonMarker position={samples.codonE} label="" color={spatialRaviaColors.codon} />
      <CodonMarker position={samples.codonP} label={showInitiation ? "start" : ""} color={spatialRaviaColors.codon} />
      <CodonMarker
        position={samples.codonA}
        label={showTermination ? "stop" : "codon"}
        color={showTermination ? spatialRaviaColors.dangerState : spatialRaviaColors.codon}
      />
      {showRecognition && (
        <mesh position={samples.codonA.clone().add(new THREE.Vector3(0, 0.22, 0.04))}>
          <boxGeometry args={[0.24, 0.035, 0.035]} />
          <meshStandardMaterial color={spatialRaviaColors.anticodon} transparent opacity={0.78} roughness={0.7} />
        </mesh>
      )}
      {showIncomingTrna && (
        <TrnaShape
          position={samples.incomingTrnaPosition}
          label=""
          color={spatialRaviaColors.trnaIncoming}
          charged={motion.peptideTransferProgress < 0.55}
          carriesPeptide={motion.peptideTransferProgress >= 0.55}
          rotation={[0.08, -0.28, -0.18]}
        />
      )}
      {showPTrna && (
        <TrnaShape
          position={samples.pSiteTrnaPosition}
          label={motion.pSiteOccupancy.trna === "initiator" ? "initiator" : ""}
          color={spatialRaviaColors.trnaPeptidyl}
          carriesPeptide={motion.pSiteOccupancy.carriesPeptide}
          rotation={[0, 0.04, 0]}
        />
      )}
      {showETrna && (
        <TrnaShape
          position={motion.exitingTrnaProgress > 0 ? samples.exitingTrnaPosition : samples.eSiteTrnaPosition}
          label=""
          color={spatialRaviaColors.trnaEmpty}
          opacity={exitingOpacity}
          rotation={[0.02, 0.22, 0.28]}
        />
      )}
      {showTermination && <ReleaseFactor position={samples.releaseFactorPosition} />}
      {showPeptide && (
        <MutableTubeMesh
          points={samples.polypeptide}
          activeSampleCount={samples.polypeptideActiveSampleCount}
          radius={spatialRaviaScale.peptideRadius}
          radialSegments={9}
          color={spatialRaviaColors.polypeptide}
          roughness={0.62}
        />
      )}
      {showDirectionality && (
        <>
          <Text position={[-2.08, -0.62, 0.04]} fontSize={0.09}>
            5 prime
          </Text>
          <Text position={[1.88, -0.62, 0.04]} fontSize={0.09}>
            3 prime
          </Text>
          <Text position={[-0.66, 1.62, 0.48]} fontSize={0.09}>
            peptide grows N to C
          </Text>
        </>
      )}
    </group>
  );
}

function AnimatedTranslationMachine(props: Parameters<typeof LegacyAnimatedTranslationMachine>[0] & { displayIntent: TranslationDisplayIntent; controls: OrbitControlsImpl | null; cameraResetVersion: number; theme?: SpatialRaviaTheme; renderStructuralActors?: boolean }) {
  return <GroundedTranslationMachine {...props} fallback={<LegacyAnimatedTranslationMachine {...props} />} />;
}

function PlasmaMembrane() {
  return (
    <group>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[4.8, 0.08, 0.22]} />
        <meshStandardMaterial color={spatialRaviaColors.membraneOuter} {...spatialRaviaMaterialDefaults.membrane} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[4.8, 0.08, 0.22]} />
        <meshStandardMaterial color={spatialRaviaColors.membraneInner} {...spatialRaviaMaterialDefaults.membrane} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[4.8, 0.1, 0.18]} />
        <meshStandardMaterial color={spatialRaviaColors.membraneCore} transparent opacity={0.42} roughness={0.86} />
      </mesh>
      {[-2.1, -1.5, -0.9, -0.3, 0.3, 0.9, 1.5, 2.1].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.18, 0.08]}>
            <sphereGeometry args={[0.045, 10, 8]} />
            <meshStandardMaterial color={spatialRaviaColors.membraneOuter} roughness={0.78} />
          </mesh>
          <mesh position={[x, -0.18, -0.08]}>
            <sphereGeometry args={[0.045, 10, 8]} />
            <meshStandardMaterial color={spatialRaviaColors.membraneInner} roughness={0.78} />
          </mesh>
        </group>
      ))}
      <Text position={[-2.2, 1.1, 0]} fontSize={0.12} fillOpacity={0.72}>
        extracellular
      </Text>
      <Text position={[-2.2, -1.15, 0]} fontSize={0.12} fillOpacity={0.72}>
        cytoplasm
      </Text>
    </group>
  );
}

function MechanisticSceneLighting() {
  return (
    <>
      <ambientLight intensity={0.72} />
      <hemisphereLight
        args={[spatialRaviaColors.annotation, spatialRaviaColors.background, 0.52]}
      />
      <directionalLight position={[4.2, 5.4, 4.4]} intensity={1.85} />
      <directionalLight position={[-3.4, 2.2, -4.6]} intensity={0.72} />
      <directionalLight position={[0.5, 2.6, -5.2]} intensity={0.38} />
    </>
  );
}

function SignalingLigand({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial
          color={spatialRaviaColors.proteinActive}
          {...spatialRaviaMaterialDefaults.smallMolecule}
        />
      </mesh>
      <Text position={[0.35, 0.08, 0]} fontSize={0.1} fillOpacity={0.7}>
        ligand
      </Text>
    </group>
  );
}

function TransmembraneReceptor({
  position,
  label,
  phosphorylated = false,
}: {
  position: THREE.Vector3;
  label: string;
  phosphorylated?: boolean;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.58, 0]}>
        <sphereGeometry args={[0.2, 24, 24]} />
        <meshStandardMaterial color={spatialRaviaColors.proteinLight} {...spatialRaviaMaterialDefaults.protein} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.07, 0.07, 1.2, 16]} />
        <meshStandardMaterial color={spatialRaviaColors.protein} {...spatialRaviaMaterialDefaults.protein} />
      </mesh>
      <mesh position={[0, -0.64, 0]}>
        <boxGeometry args={[0.26, 0.22, 0.16]} />
        <meshStandardMaterial color={spatialRaviaColors.proteinDark} {...spatialRaviaMaterialDefaults.protein} />
      </mesh>
      {phosphorylated && (
        <>
          <mesh position={[0.16, -0.86, 0.04]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color={spatialRaviaColors.stateMarker} {...spatialRaviaMaterialDefaults.smallMolecule} />
          </mesh>
          <mesh position={[-0.16, -0.82, 0.04]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color={spatialRaviaColors.stateMarker} {...spatialRaviaMaterialDefaults.smallMolecule} />
          </mesh>
        </>
      )}
      <Text position={[0, -1.08, 0]} fontSize={0.085} fillOpacity={0.7}>
        {label}
      </Text>
    </group>
  );
}

function SignalingProtein({
  position,
  label,
  color = "#22c55e",
  scale = 1,
}: {
  position: THREE.Vector3;
  label: string;
  color?: string;
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[0.16, 22, 18]} />
        <meshStandardMaterial color={color} {...spatialRaviaMaterialDefaults.protein} />
      </mesh>
      <Text position={[0.28, 0.04, 0]} fontSize={0.085} fillOpacity={0.72}>
        {label}
      </Text>
    </group>
  );
}

function signalingPosition(
  start: THREE.Vector3,
  end: THREE.Vector3,
  progress: number
) {
  return new THREE.Vector3().lerpVectors(start, end, progress);
}

function SignalingStateMarker({
  position,
  active,
}: {
  position: THREE.Vector3;
  active: number;
}) {
  if (active <= 0.03) return null;

  return (
    <mesh position={position} scale={THREE.MathUtils.lerp(0.65, 1, active)}>
      <sphereGeometry args={[0.055, 14, 12]} />
      <meshStandardMaterial
        color={spatialRaviaColors.stateMarker}
        {...spatialRaviaMaterialDefaults.smallMolecule}
      />
    </mesh>
  );
}

function IonCloud({
  position,
  label,
  color,
}: {
  position: THREE.Vector3;
  label: string;
  color: string;
}) {
  return (
    <group position={position}>
      {[
        [-0.18, 0.12, 0],
        [0.08, 0.18, 0.04],
        [0.22, -0.06, -0.02],
        [-0.04, -0.18, 0.03],
      ].map(([x, y, z], index) => (
        <mesh key={index} position={[x, y, z]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color={color} {...spatialRaviaMaterialDefaults.smallMolecule} />
        </mesh>
      ))}
      <Text position={[0.36, 0.02, 0]} fontSize={0.09} fillOpacity={0.7}>
        {label}
      </Text>
    </group>
  );
}

function VoltageGatedChannel({
  position,
  label,
  state,
  color,
  openAmount,
}: {
  position: THREE.Vector3;
  label: string;
  state: string;
  color: string;
  openAmount?: number;
}) {
  const open = state.includes("open") || state === "opening";
  const inactivated = state.includes("inactivated");
  const poreScale = THREE.MathUtils.lerp(0.22, 1, openAmount ?? (open ? 1 : 0));

  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.15, 0.025, 10, 24]} />
        <meshStandardMaterial color={spatialRaviaColors.proteinLight} {...spatialRaviaMaterialDefaults.protein} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.12, 0.12, 0.92, 20]} />
        <meshStandardMaterial color={color} transparent opacity={0.46 + poreScale * 0.34} roughness={0.76} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0, 0.13]} scale={[1, Math.max(0.12, 1 - poreScale), 1]}>
        <boxGeometry args={[0.28, 0.1, 0.06]} />
        <meshStandardMaterial color={spatialRaviaColors.proteinLight} {...spatialRaviaMaterialDefaults.protein} />
      </mesh>
      <mesh position={[0, 0.3, 0.02]} scale={[1, 0.45 + poreScale * 0.55, 1]}>
        <boxGeometry args={[0.18, 0.08, 0.08]} />
        <meshStandardMaterial color={spatialRaviaColors.protein} transparent opacity={0.72} {...spatialRaviaMaterialDefaults.protein} />
      </mesh>
      <mesh position={[0, -0.3, 0.02]} scale={[1, 0.45 + poreScale * 0.55, 1]}>
        <boxGeometry args={[0.18, 0.08, 0.08]} />
        <meshStandardMaterial color={spatialRaviaColors.protein} transparent opacity={0.72} {...spatialRaviaMaterialDefaults.protein} />
      </mesh>
      {!open && (openAmount ?? 0) < 0.2 && (
        <mesh position={[0, 0, 0.12]}>
          <boxGeometry args={[0.28, 0.06, 0.06]} />
          <meshStandardMaterial color={spatialRaviaColors.proteinDark} {...spatialRaviaMaterialDefaults.protein} />
        </mesh>
      )}
      {inactivated && (
        <mesh position={[0, 0.28, 0.18]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color={spatialRaviaColors.dangerState} {...spatialRaviaMaterialDefaults.smallMolecule} />
        </mesh>
      )}
      <Text position={[0, -0.72, 0]} fontSize={0.085} fillOpacity={0.7}>
        {label}
      </Text>
      <Text position={[0, -0.9, 0]} fontSize={0.07} fillOpacity={0.65}>
        {state}
      </Text>
    </group>
  );
}

function IonFlux({
  position,
  label,
  direction,
  color,
  activity = 1,
  progress = 0,
}: {
  position: THREE.Vector3;
  label: string;
  direction: "inward" | "outward";
  color: string;
  activity?: number;
  progress?: number;
}) {
  const arrowY = direction === "inward" ? -0.34 : 0.34;
  const opacity = THREE.MathUtils.clamp(activity, 0, 1);
  const startY = direction === "inward" ? 0.44 : -0.44;
  const endY = direction === "inward" ? -0.44 : 0.44;

  if (opacity <= 0.03) {
    return null;
  }

  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.54, 12]} />
        <meshStandardMaterial color={color} transparent opacity={0.35 + opacity * 0.45} />
      </mesh>
      <mesh position={[0, arrowY, 0]} rotation={[direction === "inward" ? Math.PI : 0, 0, 0]}>
        <coneGeometry args={[0.09, 0.18, 16]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} />
      </mesh>
      {[0, 0.33, 0.66].map((offset, index) => {
        const particleProgress = (progress + offset) % 1;
        const y = THREE.MathUtils.lerp(startY, endY, particleProgress);
        return (
          <mesh key={index} position={[0, y, 0.08 + index * 0.04]}>
            <sphereGeometry args={[0.055, 14, 14]} />
            <meshStandardMaterial color={color} transparent opacity={opacity} />
          </mesh>
        );
      })}
      <Text position={[0.34, 0, 0]} fontSize={0.1}>
        {label}
      </Text>
    </group>
  );
}

function MembraneVoltageIndicator({
  phase,
  voltage,
  voltageMv,
  normalizedVoltage,
}: {
  phase?: string;
  voltage?: string;
  voltageMv?: number;
  normalizedVoltage?: number;
}) {
  const gaugeHeight = 0.36;
  const markerY = THREE.MathUtils.lerp(
    -gaugeHeight / 2,
    gaugeHeight / 2,
    THREE.MathUtils.clamp(normalizedVoltage ?? 0.15, 0, 1)
  );

  return (
    <group position={[-2.05, 0.08, 0.24]}>
      <mesh>
        <boxGeometry args={[0.68, 0.5, 0.08]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[-0.25, 0, 0.1]}>
        <boxGeometry args={[0.04, gaugeHeight, 0.04]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>
      <mesh position={[-0.25, markerY, 0.14]}>
        <boxGeometry args={[0.12, 0.035, 0.05]} />
        <meshStandardMaterial color="#facc15" />
      </mesh>
      <Text position={[0, 0.12, 0.08]} fontSize={0.09}>
        membrane voltage
      </Text>
      <Text position={[0, -0.04, 0.08]} fontSize={0.08}>
        {phase ?? "phase"}
      </Text>
      <Text position={[0, -0.18, 0.08]} fontSize={0.075}>
        {voltageMv === undefined ? voltage ?? "representative" : `${Math.round(voltageMv)} mV`}
      </Text>
    </group>
  );
}

function ActionPotentialPhasePanel({
  scene,
  activePhaseId,
}: {
  scene: BiologySceneSpec;
  activePhaseId?: string;
}) {
  if (!scene.temporal) {
    return null;
  }

  const currentPhase = scene.temporal.phases.find(
    (phase) => phase.id === (activePhaseId ?? scene.temporal?.currentPhase)
  );

  return (
    <group position={[1.78, 1.18, 0.18]}>
      {scene.temporal.phases.map((phase) => (
        <group key={phase.id} position={[0, -phase.order * 0.16, 0]}>
          <mesh>
            <boxGeometry args={[0.1, 0.06, 0.04]} />
            <meshStandardMaterial
              color={phase.id === (activePhaseId ?? scene.temporal?.currentPhase) ? "#facc15" : "#4b5563"}
            />
          </mesh>
          <Text position={[0.42, 0, 0]} fontSize={0.075}>
            {phase.label}
          </Text>
        </group>
      ))}
      {currentPhase && (
        <Text position={[0.4, -1.26, 0]} fontSize={0.075}>
          {currentPhase.dominantFlux}
        </Text>
      )}
    </group>
  );
}

function Nucleus({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.38, 32, 20]} />
        <meshStandardMaterial color="#f9a8d4" transparent opacity={0.72} />
      </mesh>
      <Text position={[0, 0.55, 0]} fontSize={0.12}>
        nucleus
      </Text>
    </group>
  );
}

function Helicase() {
  return (
    <group position={[0, 0.15, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.18, 24, 64]} />
        <meshStandardMaterial />
      </mesh>

      <Text position={[0, 0.85, 0]} fontSize={0.24}>
        Helicase
      </Text>
    </group>
  );
}

function StrandBindingProteins({
  type,
}: {
  type: "rpa" | "ssb" | "generic";
}) {
  const label =
    type === "rpa"
      ? "RPA"
      : type === "ssb"
      ? "SSB"
      : "ssDNA-binding protein";

  const leftCurve = createSeparatedStrandCurve(-1);
  const rightCurve = createSeparatedStrandCurve(1);

  const bindingSites = [0.32, 0.55, 0.78];

  const positions: THREE.Vector3[] = [
    ...bindingSites.map((t) => leftCurve.getPoint(t)),
    ...bindingSites.map((t) => rightCurve.getPoint(t)),
  ];
  
  return (
    <group>
      {positions.map((position, index) => (
        <mesh
          key={index}
          position={[position.x, position.y, position.z]}
        >
          <sphereGeometry args={[0.17, 24, 24]} />
          <meshStandardMaterial />
        </mesh>
      ))}

      <Text position={[1.55, 1.45, 0]} fontSize={0.2}>
        {label}
      </Text>
    </group>
  );
}

function Topoisomerase({
  position,
}: {
  position: THREE.Vector3;
}) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshStandardMaterial />
      </mesh>

      <Text position={[0.6, 0, 0]} fontSize={0.2}>
        Topoisomerase
      </Text>
    </group>
  );
}

function Primase({
  position,
}: {
  position: THREE.Vector3;
}) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial />
      </mesh>

      <Text position={[0.55, 0, 0]} fontSize={0.2}>
        Primase
      </Text>
    </group>
  );
}

function RnaPrimer({
  position,
  label = "RNA primer",
  labelOffset = [0.5, 0.45, 0],
}: {
  position: THREE.Vector3;
  label?: string;
  labelOffset?: [number, number, number];
}) {
  const points = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.18, 0.18, 0),
    new THREE.Vector3(0.36, 0.34, 0),
  ];

  const curve = new THREE.CatmullRomCurve3(points);

  return (
    <group position={position}>
      <mesh>
        <tubeGeometry args={[curve, 30, 0.05, 10, false]} />
        <meshStandardMaterial />
      </mesh>

      <Text position={labelOffset} fontSize={0.14}>
        {label}
      </Text>
    </group>
  );
}

function Polymerase({
  position,
  rotation,
  compactLabel = false,
  structureGrounded = false,
  direction,
  templateJoinPoint,
  productJoinPoint,
}: {
  position: THREE.Vector3;
  rotation?: [number, number, number];
  compactLabel?: boolean;
  structureGrounded?: boolean;
  direction?: THREE.Vector3;
  templateJoinPoint?: THREE.Vector3;
  productJoinPoint?: THREE.Vector3;
}) {
  const entry = structureGrounded ? resolveReplicationStructureGrounding("dna-polymerase") : null;
  const [resolved, setResolved] = useState<{
    geometry: StructureDerivedGeometry;
    entry: StructureManifestEntry;
  } | null>(null);
  const transform = useMemo(() => {
    if (!entry || !resolved || !direction) return null;
    const center = resolved.geometry.anchors.find((anchor) => anchor.id === "dna-center");
    const entryAnchor = resolved.geometry.anchors.find((anchor) => anchor.id === "template-entry");
    const exitAnchor = resolved.geometry.anchors.find((anchor) => anchor.id === "product-exit");
    const entryToExit = entryAnchor && exitAnchor
      ? exitAnchor.point.clone().sub(entryAnchor.point)
      : null;
    // A short deposited DNA fragment can have coincident endpoint anchors.
    // Preserve the structure-derived center axis in that degenerate case
    // instead of normalizing to NaN and taking down the whole scene.
    const sourceDirection = entryToExit && Number.isFinite(entryToExit.lengthSq()) && entryToExit.lengthSq() >= 1e-12
      ? entryToExit.normalize()
      : center?.direction.clone() ?? new THREE.Vector3(1, 0, 0);
    if (!center) return null;
    return createStructureTransform({
      grounding: entry,
      sourceAnchor: { point: center.point, direction: sourceDirection },
      targetAnchor: position,
      targetDirection: direction,
      scale: 0.022,
    });
  }, [direction, entry, position, resolved]);

  const transformedTemplateAnchor = useMemo(() => {
    if (!transform || !resolved) return null;
    const anchor = resolved.geometry.anchors.find((candidate) => candidate.id === "template-entry");
    return anchor ? transformPoint(anchor.point, transform) : null;
  }, [resolved, transform]);
  const transformedProductAnchor = useMemo(() => {
    if (!transform || !resolved) return null;
    const anchor = resolved.geometry.anchors.find((candidate) => candidate.id === "product-exit");
    return anchor ? transformPoint(anchor.point, transform) : null;
  }, [resolved, transform]);

  return (
    <group position={structureGrounded ? undefined : position}>
      {structureGrounded && entry && (
        <>
          <StructureDerivedPrimitive
            entry={entry}
            position={transform?.position ?? position}
            quaternion={transform?.quaternion}
            scale={transform?.scale ?? 0.022}
            fallback={
              <ProteinComplexPrimitive
                definition={dnaPolymeraseComplexDefinition}
                position={position}
                rotation={rotation ?? [0, 0, -0.38]}
                state="active"
                scale={0.92}
              />
            }
            onResolved={(result) => setResolved({ geometry: result.geometry, entry })}
          />
          {transformedTemplateAnchor && templateJoinPoint && (
            <BridgeTube
              start={transformedTemplateAnchor}
              end={templateJoinPoint}
              color={spatialRaviaColors.basePair}
              radius={0.035}
            />
          )}
          {transformedProductAnchor && productJoinPoint && (
            <BridgeTube
              start={transformedProductAnchor}
              end={productJoinPoint}
              color="#7dd3fc"
              radius={0.035}
            />
          )}
        </>
      )}
      {!structureGrounded && (
        <ProteinComplexPrimitive
          definition={dnaPolymeraseComplexDefinition}
          position={new THREE.Vector3(0, 0, 0)}
          rotation={rotation ?? [0, 0, -0.38]}
          state="active"
          scale={0.92}
        />
      )}
      {!compactLabel && (
        <Text position={[-0.25, -0.42, 0]} fontSize={0.16}>
          DNA polymerase
        </Text>
      )}
    </group>
  );
}

function DaughterStrand({
  position,
  side,
  label,
  segments = 1,
}: {
  position: THREE.Vector3;
  side: -1 | 1;
  label: string;
  segments?: number;
}) {
  const fragmentOffsets = Array.from(
    { length: segments },
    (_, index) => index * 0.34
  );

  return (
    <group position={position}>
      {fragmentOffsets.map((offset) => {
        const points = [
          new THREE.Vector3(0, offset, 0.08),
          new THREE.Vector3(side * 0.12, offset + 0.22, 0.08),
          new THREE.Vector3(side * 0.22, offset + 0.42, 0.08),
        ];

        const curve = new THREE.CatmullRomCurve3(points);

        return (
          <mesh key={offset}>
            <tubeGeometry args={[curve, 28, 0.045, 10, false]} />
            <meshStandardMaterial color="#7dd3fc" />
          </mesh>
        );
      })}

      <Text position={[side * 0.9, 0.78, 0]} fontSize={0.15}>
        {label}
      </Text>
    </group>
  );
}

function OkazakiFragment({ position }: { position: THREE.Vector3 }) {
  const points = [
    new THREE.Vector3(-0.16, 0, 0.14),
    new THREE.Vector3(0.04, 0.18, 0.14),
    new THREE.Vector3(0.22, 0.34, 0.14),
  ];
  const curve = new THREE.CatmullRomCurve3(points);

  return (
    <group position={position}>
      <mesh>
        <tubeGeometry args={[curve, 24, 0.06, 10, false]} />
        <meshStandardMaterial color="#38bdf8" />
      </mesh>

      <Text position={[-0.1, 0.64, 0]} fontSize={0.16}>
        Okazaki fragment
      </Text>
    </group>
  );
}

function Ligase({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial color="#fb7185" />
      </mesh>

      <Text position={[0.82, 0.08, 0]} fontSize={0.16}>
        Ligase seals nick
      </Text>
    </group>
  );
}

function BridgeTube({
  start,
  end,
  color,
  radius = 0.05,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  radius?: number;
}) {
  const curve = useMemo(() => {
    const midpoint = start.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 0, 0.05));
    return new THREE.CatmullRomCurve3([start.clone(), midpoint, end.clone()]);
  }, [end, start]);

  return (
    <mesh>
      <tubeGeometry args={[curve, 18, radius, 8, false]} />
      <meshStandardMaterial color={color} roughness={0.55} />
    </mesh>
  );
}

function transformPoint(
  point: THREE.Vector3,
  transform: { position: THREE.Vector3; quaternion: THREE.Quaternion; scale: number }
) {
  return point
    .clone()
    .multiplyScalar(transform.scale)
    .applyQuaternion(transform.quaternion)
    .add(transform.position);
}

function DirectionMarkers({
  template5Prime,
  template3Prime,
}: {
  template5Prime?: THREE.Vector3;
  template3Prime?: THREE.Vector3;
}) {
  return (
    <group>
      {template5Prime && (
        <Text position={template5Prime} fontSize={0.2}>
          5 prime
        </Text>
      )}

      {template3Prime && (
        <Text position={template3Prime} fontSize={0.2}>
          3 prime
        </Text>
      )}

      <Text position={[0, 0.52, 0.25]} fontSize={0.18}>
        daughter synthesis runs 5 prime to 3 prime
      </Text>
    </group>
  );
}

function AnimatedReplicationHelicase({
  position,
  structureGrounded = false,
  duplexJoinPoint,
  ssdnaJoinPoint,
}: {
  position: THREE.Vector3;
  structureGrounded?: boolean;
  duplexJoinPoint?: THREE.Vector3;
  ssdnaJoinPoint?: THREE.Vector3;
}) {
  const entry = structureGrounded ? resolveReplicationStructureGrounding("replicative-helicase") : null;
  const [resolved, setResolved] = useState<{
    geometry: StructureDerivedGeometry;
    entry: StructureManifestEntry;
  } | null>(null);
  const transform = useMemo(() => {
    if (!entry || !resolved) return null;
    const center = resolved.geometry.anchors.find((anchor) => anchor.id === "channel-center");
    if (!center) return null;
    return createStructureTransform({
      grounding: entry,
      sourceAnchor: { point: center.point, direction: center.direction },
      targetAnchor: position,
      targetDirection: new THREE.Vector3(1, 0, 0),
      scale: 0.016,
    });
  }, [entry, position, resolved]);

  const transformedDuplexEntry = useMemo(() => {
    if (!transform || !resolved) return null;
    const anchor = resolved.geometry.anchors.find((candidate) => candidate.id === "duplex-entry");
    return anchor ? transformPoint(anchor.point, transform) : null;
  }, [resolved, transform]);
  const transformedSsdnaExit = useMemo(() => {
    if (!transform || !resolved) return null;
    const anchor = resolved.geometry.anchors.find((candidate) => candidate.id === "ssdna-exit");
    return anchor ? transformPoint(anchor.point, transform) : null;
  }, [resolved, transform]);

  if (structureGrounded && entry) {
    return (
      <>
        <StructureDerivedPrimitive
          entry={entry}
          position={transform?.position ?? position}
          quaternion={transform?.quaternion}
          scale={transform?.scale ?? 0.016}
          fallback={
            <group position={position}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.34, 0.11, 22, 48]} />
                <meshStandardMaterial color="#e5e7eb" roughness={0.55} />
              </mesh>
              <mesh position={[0, 0, 0.1]}>
                <cylinderGeometry args={[0.16, 0.16, 0.28, 20]} />
                <meshStandardMaterial color="#cbd5e1" roughness={0.62} />
              </mesh>
            </group>
          }
          onResolved={(result) => setResolved({ geometry: result.geometry, entry })}
        />
        {transformedDuplexEntry && duplexJoinPoint && (
          <BridgeTube start={transformedDuplexEntry} end={duplexJoinPoint} color={spatialRaviaColors.basePair} />
        )}
        {transformedSsdnaExit && ssdnaJoinPoint && (
          <BridgeTube start={transformedSsdnaExit} end={ssdnaJoinPoint} color={spatialRaviaColors.basePair} />
        )}
      </>
    );
  }

  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.34, 0.11, 22, 48]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.16, 0.16, 0.28, 20]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.62} />
      </mesh>
    </group>
  );
}

function AnimatedPrimase({
  position,
  visible,
}: {
  position: THREE.Vector3;
  visible: boolean;
}) {
  if (!visible) {
    return null;
  }

  return (
    <group position={position}>
      <mesh scale={[1.1, 0.74, 0.78]}>
        <sphereGeometry args={[0.2, 24, 16]} />
        <meshStandardMaterial color="#d8b4fe" roughness={0.62} />
      </mesh>
      <Text position={[0.36, 0.2, 0]} fontSize={0.085}>
        primase
      </Text>
    </group>
  );
}

function AnimatedReplicationFork({
  motion,
  showLeading,
  showLagging,
  showHelicase,
  showPrimase,
  showLigase,
  showDirectionality,
}: {
  motion: ReplicationMotionState;
  showLeading: boolean;
  showLagging: boolean;
  showHelicase: boolean;
  showPrimase: boolean;
  showLigase: boolean;
  showDirectionality: boolean;
}) {
  const samples = useMemo(() => sampleReplicationFork({ motion }), [motion]);
  const structureGrounding = useMemo(() => getReplicationStructureProvenance(), []);
  const useStructureGrounding = structureGrounding.length >= 2;
  // Fork samples can intentionally coincide at a phase boundary. Do not
  // normalize that zero vector: it becomes NaN and invalidates the grounded
  // polymerase alignment. These directions only orient the deposited context.
  const leadingDirection = deriveFiniteReplicationDirection(
    samples.leadingTemplate[0],
    samples.leadingTemplate[8],
    new THREE.Vector3(1, 0, 0)
  );
  const laggingDirection = deriveFiniteReplicationDirection(
    samples.laggingTemplate[0],
    samples.laggingTemplate[8],
    new THREE.Vector3(-1, 0, 0)
  );

  return (
    <group>
      <MutableTubeMesh
        points={samples.parentalA}
        radius={0.052}
        radialSegments={10}
        color="#b8d8ea"
      />
      <MutableTubeMesh
        points={samples.parentalB}
        radius={0.052}
        radialSegments={10}
        color="#d3c7ee"
      />
      <MutableTubeMesh
        points={samples.leadingTemplate}
        radius={0.046}
        radialSegments={10}
        color="#b8d8ea"
      />
      <MutableTubeMesh
        points={samples.laggingTemplate}
        radius={0.046}
        radialSegments={10}
        color="#d3c7ee"
      />
      {showLeading && (
        <MutableTubeMesh
          points={samples.leadingDaughter}
          activeSampleCount={samples.leadingActiveSampleCount}
          radius={0.046}
          radialSegments={10}
          color="#7dd3fc"
        />
      )}
      {showLagging &&
        samples.fragments.map((fragment) => (
          <group key={fragment.index}>
            <MutableTubeMesh
              points={fragment.primer}
              activeSampleCount={fragment.primerActiveSampleCount}
              radius={0.038}
              radialSegments={8}
              color="#6ee7b7"
            />
            <MutableTubeMesh
              points={fragment.fragment}
              activeSampleCount={fragment.fragmentActiveSampleCount}
              radius={0.044}
              radialSegments={8}
              color={fragment.ligated ? "#bae6fd" : "#38bdf8"}
            />
          </group>
        ))}
      {showHelicase && (
        <AnimatedReplicationHelicase
          position={samples.helicasePosition}
          structureGrounded={useStructureGrounding}
          duplexJoinPoint={samples.parentalA[0]}
          ssdnaJoinPoint={samples.leadingTemplate[0]}
        />
      )}
      {showLeading && (
        <Polymerase
          position={samples.leadingPolymerasePosition}
          rotation={[0, 0, -0.25]}
          compactLabel
          structureGrounded={useStructureGrounding}
          direction={leadingDirection}
          templateJoinPoint={samples.leadingTemplate[10]}
          productJoinPoint={
            samples.leadingDaughter[Math.max(0, samples.leadingActiveSampleCount - 1)]
          }
        />
      )}
      {showLagging && (
        <Polymerase
          position={samples.laggingPolymerasePosition}
          rotation={[0, 0, 0.55]}
          compactLabel
          structureGrounded={useStructureGrounding}
          direction={laggingDirection}
          templateJoinPoint={samples.laggingTemplate[8]}
          productJoinPoint={
            samples.fragments[motion.laggingCycleIndex]?.fragment[
              Math.max(
                0,
                (samples.fragments[motion.laggingCycleIndex]?.fragmentActiveSampleCount ?? 1) - 1
              )
            ]
          }
        />
      )}
      <AnimatedPrimase
        position={samples.primasePosition}
        visible={showPrimase && motion.activePrimerProgress > 0.05}
      />
      {showLigase && motion.ligationProgress > 0.05 && (
        <Ligase position={samples.ligasePosition} />
      )}
      <Text position={[-1.75, -1.22, 0.26]} fontSize={0.105}>
        leading
      </Text>
      {showLagging && (
        <Text position={[-1.65, 1.26, 0.26]} fontSize={0.105}>
          lagging fragments
        </Text>
      )}
      {showDirectionality && (
        <Text position={[0.35, -1.46, 0.26]} fontSize={0.09}>
          daughter strands synthesize 5 prime to 3 prime
        </Text>
      )}
    </group>
  );
}


export default function MechanisticScene({ scene, theme = "light" }: Props) {
  const [translationControls, setTranslationControls] = useState<OrbitControlsImpl | null>(null);
  const translationDisplayIntent = deriveTranslationDisplayIntent(scene);
  const translationTimelineWindow = useMemo(
    () => deriveFocusedTimelineWindow(scene.temporal, translationDisplayIntent),
    [scene.temporal, translationDisplayIntent]
  );
  const timeline = useBiologyTimeline(scene.temporal, translationTimelineWindow);
  const transcriptionMotion = getTranscriptionMotionState(
    timeline.hasTemporal ? timeline.frame : null
  );
  const actionPotentialMotion = getActionPotentialMotionState(
    timeline.hasTemporal ? timeline.frame : null
  );
  const replicationMotion = getReplicationMotionState(
    timeline.hasTemporal ? timeline.frame : null
  );
  const translationMotion = getTranslationMotionState(
    timeline.hasTemporal ? timeline.frame : null
  );
  const signalingMotion = getSignalingMotionState(
    timeline.hasTemporal ? timeline.frame : null
  );
  const hasDNA = scene.entities.some((e) => e.id === "dna");
  const dnaPresentation = useMemo(
    () => (hasDNA ? deriveDnaPresentationPlan(scene) : null),
    [hasDNA, scene]
  );
  const isTranscriptionScene = scene.entities.some((e) =>
    [
      "rna-polymerase",
      "bacterial-rna-polymerase",
      "rna-polymerase-ii",
      "rna-transcript",
      "transcription-bubble",
      "promoter",
      "enhancer",
      "gene",
      "template-strand",
      "coding-strand",
      "terminator",
    ].includes(e.id)
  );
  const isTranslationScene = scene.entities.some((e) =>
    [
      "mrna",
      "ribosome",
      "small-ribosomal-subunit",
      "large-ribosomal-subunit",
      "codon",
      "trna",
      "anticodon",
      "amino-acid",
      "aminoacyl-trna",
      "a-site",
      "p-site",
      "e-site",
      "polypeptide",
      "start-codon",
      "stop-codon",
      "release-factor",
    ].includes(e.id)
  );
  // DNA-side transcription is deliberately procedural and bubble-first. The
  // full 6ALH coordinate presentation is unsuitable for this local template.
  const useMolstarStructuralPresentation = isTranslationScene;
  const isSignalingScene = scene.entities.some((e) =>
    [
      "plasma-membrane",
      "receptor-tyrosine-kinase",
      "receptor-dimer",
      "ligand",
      "ras",
      "raf",
      "mek",
      "erk",
    ].includes(e.id)
  );
  const isActionPotentialScene = scene.entities.some((e) =>
    [
      "voltage-gated-sodium-channel",
      "voltage-gated-potassium-channel",
      "sodium-ion",
      "potassium-ion",
      "membrane-potential",
    ].includes(e.id)
  );
  const isReplicationScene =
    !isTranscriptionScene &&
    !isTranslationScene &&
    !isSignalingScene &&
    !isActionPotentialScene &&
    scene.entities.some((e) =>
      [
        "fork",
        "helicase",
        "leading-template",
        "lagging-template",
        "daughter-leading-strand",
        "daughter-lagging-strand",
        "okazaki-fragment",
      ].includes(e.id)
    );
  const isAnimatedTranslationScene =
    isTranslationScene && timeline.hasTemporal && scene.renderMode === "mechanistic-3d";
  const hasMrna = scene.entities.some((e) => e.id === "mrna");

  const hasHelicase = scene.entities.some(
    (e) => e.id === "helicase"
  );

  const hasRPA = scene.entities.some((e) => e.id === "rpa");

  const hasSSB = scene.entities.some((e) => e.id === "ssb");

  const hasGenericBindingProtein = scene.entities.some(
    (e) => e.id === "ssdna-binding-protein"
  );

  const hasTopoisomerase = scene.entities.some(
  (e) => e.id === "topoisomerase"
   );

  const topoisomeraseActsAhead = scene.relations.some(
  (r) =>
    r.subject === "topoisomerase" &&
    r.relation === "acts_ahead_of" &&
    r.object === "helicase"
);

  const bindingProteinType: "rpa" | "ssb" | "generic" | null =
    hasRPA
      ? "rpa"
      : hasSSB
      ? "ssb"
      : hasGenericBindingProtein
      ? "generic"
      : null;
   const placements = resolveSpatialPlacements(scene);
      const primasePlacement = placements.find(
      (p) => p.entityId === "primase"
      );

      const primerPlacement = placements.find(
      (p) => p.entityId === "rna-primer"
      );

   const topoisomerasePlacement = placements.find(
     (p) => p.entityId === "topoisomerase"
);

      const hasPrimase = scene.entities.some(
      (e) => e.id === "primase"
      );

      const hasRnaPrimer = scene.entities.some(
      (e) => e.id === "rna-primer"
      );

  const polymerasePlacement = placements.find(
    (p) => p.entityId === "polymerase"
  );

  const leadingPlacement = placements.find(
    (p) => p.entityId === "daughter-leading-strand"
  );

  const laggingPlacement = placements.find(
    (p) => p.entityId === "daughter-lagging-strand"
  );

  const leadingPrimerPlacement = placements.find(
    (p) => p.entityId === "rna-primer-leading"
  );

  const laggingPrimerPlacement = placements.find(
    (p) => p.entityId === "rna-primer-lagging"
  );

  const okazakiPlacement = placements.find(
    (p) => p.entityId === "okazaki-fragment"
  );

  const ligasePlacement = placements.find(
    (p) => p.entityId === "ligase"
  );

  const template5PrimePlacement = placements.find(
    (p) => p.entityId === "template-5-prime"
  );

  const template3PrimePlacement = placements.find(
    (p) => p.entityId === "template-3-prime"
  );
  const bubblePlacement = placements.find((p) => p.entityId === "transcription-bubble");
  const rnaPolymeraseEntity = scene.entities.find((e) =>
    ["rna-polymerase", "bacterial-rna-polymerase", "rna-polymerase-ii"].includes(e.id)
  );
  const rnaPolymerasePlacement = rnaPolymeraseEntity
    ? placements.find((p) => p.entityId === rnaPolymeraseEntity.id)
    : undefined;
  const rnaTranscriptPlacement = placements.find((p) => p.entityId === "rna-transcript");
  const transcriptionTemplate = isTranscriptionScene
    ? deriveTranscriptionTemplatePlan({ hasRnap: Boolean(rnaPolymeraseEntity), hasNascentRna: Boolean(rnaTranscriptPlacement) })
    : null;
  const sigmaPlacement = placements.find((p) => p.entityId === "sigma-factor");
  const rna5PrimePlacement = placements.find((p) => p.entityId === "rna-5-prime");
  const rna3PrimePlacement = placements.find((p) => p.entityId === "rna-3-prime");
  const ribosomeEntity = scene.entities.find((e) => e.id === "ribosome");
  const aSitePlacement = placements.find((p) => p.entityId === "a-site");
  const pSitePlacement = placements.find((p) => p.entityId === "p-site");
  const eSitePlacement = placements.find((p) => p.entityId === "e-site");
  const trnaPlacement = placements.find((p) => p.entityId === "trna");
  const initiatorTrnaPlacement = placements.find((p) => p.entityId === "initiator-trna");
  const aminoacylTrnaPlacement = placements.find((p) => p.entityId === "aminoacyl-trna");
  const aminoAcidPlacement = placements.find((p) => p.entityId === "amino-acid");
  const codonPlacement = placements.find((p) => p.entityId === "codon");
  const startCodonPlacement = placements.find((p) => p.entityId === "start-codon");
  const stopCodonPlacement = placements.find((p) => p.entityId === "stop-codon");
  const anticodonPlacement = placements.find((p) => p.entityId === "anticodon");
  const polypeptidePlacement = placements.find((p) => p.entityId === "polypeptide");
  const releaseFactorPlacement = placements.find((p) => p.entityId === "release-factor");
  const mrna5PrimePlacement = placements.find((p) => p.entityId === "mrna-5-prime");
  const mrna3PrimePlacement = placements.find((p) => p.entityId === "mrna-3-prime");
  const nTerminusPlacement = placements.find((p) => p.entityId === "n-terminus");
  const cTerminusPlacement = placements.find((p) => p.entityId === "c-terminus");
  const hasTranslationInitiation = scene.entities.some((e) => e.id === "start-codon" || e.id === "initiator-trna");
  const hasTranslationEntry = scene.entities.some((e) => e.id === "aminoacyl-trna" || e.id === "amino-acid");
  const hasTranslationRecognition = scene.entities.some((e) => e.id === "codon" || e.id === "anticodon");
  const hasTranslationPeptide = scene.entities.some((e) => e.id === "polypeptide");
  const hasTranslationTranslocation = scene.actions.some(
    (action) => action.action === "translocates" || action.action === "advances_one_codon"
  );
  const hasTranslationTermination = scene.entities.some((e) => e.id === "stop-codon" || e.id === "release-factor");
  const membranePlacement = placements.find((p) => p.entityId === "plasma-membrane");
  const ligandPlacement = placements.find((p) => p.entityId === "ligand");
  const rtkPlacement = placements.find((p) => p.entityId === "receptor-tyrosine-kinase");
  const monomerAPlacement = placements.find((p) => p.entityId === "receptor-monomer-a");
  const monomerBPlacement = placements.find((p) => p.entityId === "receptor-monomer-b");
  const phosphoPlacement = placements.find((p) => p.entityId === "phosphotyrosine-site");
  const phosphatePlacement = placements.find((p) => p.entityId === "phosphate-group");
  const adaptorPlacement = placements.find((p) => p.entityId === "adaptor-protein");
  const grb2Placement = placements.find((p) => p.entityId === "grb2");
  const sosPlacement = placements.find((p) => p.entityId === "sos");
  const rasPlacement = placements.find((p) => p.entityId === "ras");
  const rasGdpPlacement = placements.find((p) => p.entityId === "ras-gdp");
  const rasGtpPlacement = placements.find((p) => p.entityId === "ras-gtp");
  const rafPlacement = placements.find((p) => p.entityId === "raf");
  const mekPlacement = placements.find((p) => p.entityId === "mek");
  const erkPlacement = placements.find((p) => p.entityId === "erk");
  const nucleusPlacement = placements.find((p) => p.entityId === "nucleus");
  const responsePlacement = placements.find((p) => p.entityId === "cellular-response");
  const receptorPhosphorylated = scene.entities.some((e) => e.id === "phosphotyrosine-site");
  const receptorActivationProgress = timeline.hasTemporal
    ? signalingMotion.receptorActivationProgress
    : receptorPhosphorylated ? 1 : 0;
  const sodiumIonPlacement = placements.find((p) => p.entityId === "sodium-ion");
  const potassiumIonPlacement = placements.find((p) => p.entityId === "potassium-ion");
  const sodiumChannelPlacement = placements.find((p) => p.entityId === "voltage-gated-sodium-channel");
  const potassiumChannelPlacement = placements.find((p) => p.entityId === "voltage-gated-potassium-channel");
  const sodiumCurrentPlacement = placements.find((p) => p.entityId === "sodium-current");
  const potassiumCurrentPlacement = placements.find((p) => p.entityId === "potassium-current");
  const currentPhase = scene.temporal?.phases.find(
    (phase) => phase.id === (timeline.frame?.phaseId ?? scene.temporal?.currentPhase)
  );
  const sodiumChannelState =
    actionPotentialMotion.sodiumChannelState ??
    currentPhase?.states["voltage-gated-sodium-channel"] ??
    "closed";
  const potassiumChannelState =
    actionPotentialMotion.potassiumChannelState ??
    currentPhase?.states["voltage-gated-potassium-channel"] ??
    "closed";

  const hasPolymerase = scene.entities.some(
    (e) => e.id === "polymerase"
  );

  const hasLeadingStrand = scene.entities.some(
    (e) => e.id === "daughter-leading-strand"
  );

  const hasLaggingStrand = scene.entities.some(
    (e) => e.id === "daughter-lagging-strand"
  );

  const hasOkazakiFragment = scene.entities.some(
    (e) => e.id === "okazaki-fragment"
  );

  const hasLigase = scene.entities.some((e) => e.id === "ligase");

  const hasDirectionality = scene.relations.some(
    (r) => r.relation === "direction" && r.object === "5-to-3"
  );

      const primaseSynthesizesPrimer = scene.actions.some(
      (a) =>
      a.actor === "primase" &&
      a.action === "synthesizes" &&
      a.target === "rna-primer"
      );

  const defaultCameraPreset = getSpatialRaviaCameraPreset(
    isTranscriptionScene
      ? "transcription"
      : isReplicationScene
      ? "replication"
      : isAnimatedTranslationScene
      ? "translation"
      : isSignalingScene || isActionPotentialScene
      ? "membrane"
      : "default"
  );
  const cameraPreset = isTranscriptionScene
    ? { position: [3.9, 1.7, 4.8] as const, fov: transcriptionTemplate?.camera.fov ?? 30 }
    : dnaPresentation?.camera ?? defaultCameraPreset;

  const ligandAnimatedPosition =
    ligandPlacement && timeline.hasTemporal
      ? signalingPosition(
          new THREE.Vector3(-0.72, 1.82, 0.36),
          ligandPlacement.position,
          Math.max(signalingMotion.ligandApproachProgress, signalingMotion.ligandBound ? 1 : 0)
        )
      : ligandPlacement?.position;
  const monomerAAnimatedPosition =
    monomerAPlacement && timeline.hasTemporal
      ? signalingPosition(
          new THREE.Vector3(-0.52, 0, 0.25),
          new THREE.Vector3(-0.16, 0, 0.25),
          signalingMotion.dimerizationProgress
        )
      : monomerAPlacement?.position;
  const monomerBAnimatedPosition =
    monomerBPlacement && timeline.hasTemporal
      ? signalingPosition(
          new THREE.Vector3(0.52, 0, 0.25),
          new THREE.Vector3(0.16, 0, 0.25),
          signalingMotion.dimerizationProgress
        )
      : monomerBPlacement?.position;
  const adaptorAnimatedPosition =
    adaptorPlacement && timeline.hasTemporal
      ? signalingPosition(
          new THREE.Vector3(-1.05, -1.45, 0.26),
          adaptorPlacement.position,
          signalingMotion.adaptorRecruitmentProgress
        )
      : adaptorPlacement?.position;
  const grb2AnimatedPosition =
    grb2Placement && timeline.hasTemporal
      ? signalingPosition(
          new THREE.Vector3(-1.2, -1.35, 0.3),
          grb2Placement.position,
          signalingMotion.adaptorRecruitmentProgress
        )
      : grb2Placement?.position;
  const sosAnimatedPosition =
    sosPlacement && timeline.hasTemporal
      ? signalingPosition(
          new THREE.Vector3(-1.0, -1.65, 0.32),
          sosPlacement.position,
          signalingMotion.sosRecruitmentProgress
        )
      : sosPlacement?.position;
  const rasLabel = timeline.hasTemporal
    ? signalingMotion.rasState === "gtp"
      ? "Ras-GTP"
      : signalingMotion.rasState === "exchanging"
      ? "Ras GDP->GTP"
      : "Ras-GDP"
    : "Ras";
  const erkAnimatedPosition =
    erkPlacement && nucleusPlacement && timeline.hasTemporal
      ? signalingPosition(
          erkPlacement.position,
          new THREE.Vector3(2.68, -0.98, 0.22),
          signalingMotion.erkTranslocationProgress
        )
      : erkPlacement?.position;

  return (
    <div className="mechanisticSceneSurface">
      {timeline.hasTemporal && (
        <SpatialTimelineControls
          playing={timeline.playing}
          speed={timeline.speed}
          timeMs={timeline.timeMs}
          totalDurationMs={timeline.totalDurationMs}
          frame={timeline.frame}
          onPlay={timeline.play}
          onPause={timeline.pause}
          onRestart={timeline.restart}
          onSeek={timeline.seek}
          onSpeedChange={timeline.setSpeed}
        />
      )}
      <Canvas
        camera={{
          position: [...cameraPreset.position],
          fov: cameraPreset.fov,
        }}
      >
        <color attach="background" args={[spatialRaviaThemePresentation[theme].canvasBackground]} />
        <MechanisticSceneLighting />

        {(isSignalingScene || isActionPotentialScene) && membranePlacement && <PlasmaMembrane />}
        {isActionPotentialScene && (
          <MembraneVoltageIndicator
            phase={currentPhase?.label}
            voltage={currentPhase?.voltage}
            voltageMv={actionPotentialMotion.voltageMv}
            normalizedVoltage={actionPotentialMotion.voltageNormalized}
          />
        )}
        {sodiumIonPlacement && (
          <IonCloud position={sodiumIonPlacement.position} label="Na+ high outside" color={spatialRaviaColors.ionSodium} />
        )}
        {potassiumIonPlacement && (
          <IonCloud position={potassiumIonPlacement.position} label="K+ high inside" color={spatialRaviaColors.ionPotassium} />
        )}
        {sodiumChannelPlacement && (
          <VoltageGatedChannel
            position={sodiumChannelPlacement.position}
            label="VG Na+"
            state={sodiumChannelState}
            color={spatialRaviaColors.ionSodium}
            openAmount={actionPotentialMotion.sodiumChannelOpenAmount}
          />
        )}
        {potassiumChannelPlacement && (
          <VoltageGatedChannel
            position={potassiumChannelPlacement.position}
            label="VG K+"
            state={potassiumChannelState}
            color={spatialRaviaColors.ionPotassium}
            openAmount={actionPotentialMotion.potassiumChannelOpenAmount}
          />
        )}
        {sodiumCurrentPlacement && (
          <IonFlux
            position={sodiumCurrentPlacement.position}
            label="Na+ inward"
            direction="inward"
            color={spatialRaviaColors.ionSodium}
            activity={actionPotentialMotion.sodiumFluxActivity}
            progress={actionPotentialMotion.fluxProgress}
          />
        )}
        {potassiumCurrentPlacement && (
          <IonFlux
            position={potassiumCurrentPlacement.position}
            label="K+ outward"
            direction="outward"
            color={spatialRaviaColors.ionPotassium}
            activity={actionPotentialMotion.potassiumFluxActivity}
            progress={actionPotentialMotion.fluxProgress}
          />
        )}
        {isActionPotentialScene && (
          <ActionPotentialPhasePanel
            scene={scene}
            activePhaseId={timeline.frame?.phaseId}
          />
        )}
        {ligandAnimatedPosition && <SignalingLigand position={ligandAnimatedPosition} />}
        {rtkPlacement && !monomerAPlacement && (
          <TransmembraneReceptor
            position={rtkPlacement.position}
            label="RTK"
            phosphorylated={receptorActivationProgress > 0.2}
          />
        )}
        {monomerAAnimatedPosition && (
          <TransmembraneReceptor
            position={monomerAAnimatedPosition}
            label="RTK A"
            phosphorylated={receptorActivationProgress > 0.2}
          />
        )}
        {monomerBAnimatedPosition && (
          <TransmembraneReceptor
            position={monomerBAnimatedPosition}
            label="RTK B"
            phosphorylated={receptorActivationProgress > 0.2}
          />
        )}
        {phosphoPlacement && (!timeline.hasTemporal || receptorActivationProgress > 0.05) && <SignalingProtein position={phosphoPlacement.position} label="pY site" color={spatialRaviaColors.stateMarker} scale={0.8} />}
        {phosphatePlacement && (!timeline.hasTemporal || receptorActivationProgress > 0.22) && <SignalingProtein position={phosphatePlacement.position} label="phosphate" color={spatialRaviaColors.stateMarker} scale={0.72} />}
        {adaptorAnimatedPosition && (!timeline.hasTemporal || signalingMotion.adaptorRecruitmentProgress > 0.05) && <SignalingProtein position={adaptorAnimatedPosition} label="adaptor" color={spatialRaviaColors.proteinLight} />}
        {grb2AnimatedPosition && (!timeline.hasTemporal || signalingMotion.adaptorRecruitmentProgress > 0.05) && <SignalingProtein position={grb2AnimatedPosition} label="Grb2" color={spatialRaviaColors.protein} scale={0.9} />}
        {sosAnimatedPosition && (!timeline.hasTemporal || signalingMotion.sosRecruitmentProgress > 0.12) && <SignalingProtein position={sosAnimatedPosition} label="SOS" color={spatialRaviaColors.proteinActive} />}
        {rasPlacement && <SignalingProtein position={rasPlacement.position} label={rasLabel} color={signalingMotion.rasState === "gtp" ? spatialRaviaColors.proteinActive : spatialRaviaColors.proteinDark} />}
        {!timeline.hasTemporal && rasGdpPlacement && <SignalingProtein position={rasGdpPlacement.position} label="Ras-GDP" color={spatialRaviaColors.annotation} />}
        {!timeline.hasTemporal && rasGtpPlacement && <SignalingProtein position={rasGtpPlacement.position} label="Ras-GTP" color={spatialRaviaColors.proteinActive} />}
        {rafPlacement && <SignalingProtein position={rafPlacement.position} label="Raf" color={signalingMotion.rafActivationProgress > 0 ? spatialRaviaColors.proteinActive : spatialRaviaColors.proteinLight} />}
        {mekPlacement && <SignalingProtein position={mekPlacement.position} label="MEK" color={signalingMotion.mekActivationProgress > 0 ? spatialRaviaColors.proteinActive : spatialRaviaColors.protein} />}
        {erkAnimatedPosition && <SignalingProtein position={erkAnimatedPosition} label="ERK" color={signalingMotion.erkActivationProgress > 0 ? spatialRaviaColors.proteinActive : spatialRaviaColors.proteinDark} />}
        {nucleusPlacement && <Nucleus position={nucleusPlacement.position} />}
        {responsePlacement && (!timeline.hasTemporal || signalingMotion.responseState !== "absent") && <SignalingProtein position={responsePlacement.position} label="response" color={spatialRaviaColors.proteinActive} />}
        {rafPlacement && <SignalingStateMarker position={rafPlacement.position.clone().add(new THREE.Vector3(0.13, 0.18, 0.08))} active={signalingMotion.rafActivationProgress} />}
        {mekPlacement && <SignalingStateMarker position={mekPlacement.position.clone().add(new THREE.Vector3(0.13, 0.18, 0.08))} active={signalingMotion.mekActivationProgress} />}
        {erkAnimatedPosition && <SignalingStateMarker position={erkAnimatedPosition.clone().add(new THREE.Vector3(0.13, 0.18, 0.08))} active={signalingMotion.erkActivationProgress} />}

        {isAnimatedTranslationScene && ribosomeEntity && (
          <AnimatedTranslationMachine
            motion={translationMotion}
            ribosomeLabel={ribosomeEntity.name}
            displayIntent={translationDisplayIntent}
            controls={translationControls}
            cameraResetVersion={timeline.resetVersion}
            theme={theme}
            renderStructuralActors={!useMolstarStructuralPresentation}
            showInitiation={hasTranslationInitiation}
            showEntry={hasTranslationEntry || hasTranslationPeptide}
            showRecognition={hasTranslationRecognition || hasTranslationPeptide}
            showPeptide={hasTranslationPeptide}
            showTranslocation={hasTranslationTranslocation || hasTranslationPeptide}
            showTermination={hasTranslationTermination}
            showDirectionality={hasDirectionality}
          />
        )}

        {isTranslationScene && !isAnimatedTranslationScene && !useMolstarStructuralPresentation && hasMrna && <MrnaStrand />}

        {ribosomeEntity && isTranslationScene && !isAnimatedTranslationScene && !useMolstarStructuralPresentation && (
          <RibosomeBody label={ribosomeEntity.name} />
        )}

        {eSitePlacement && !isAnimatedTranslationScene && <RibosomeSite position={eSitePlacement.position} label="E" />}
        {pSitePlacement && !isAnimatedTranslationScene && <RibosomeSite position={pSitePlacement.position} label="P" />}
        {aSitePlacement && !isAnimatedTranslationScene && <RibosomeSite position={aSitePlacement.position} label="A" />}

        {codonPlacement && !isAnimatedTranslationScene && <CodonMarker position={codonPlacement.position} label="codon" />}
        {startCodonPlacement && !isAnimatedTranslationScene && (
          <CodonMarker position={startCodonPlacement.position} label="start codon" color="#22c55e" />
        )}
        {stopCodonPlacement && !isAnimatedTranslationScene && (
          <CodonMarker position={stopCodonPlacement.position} label="stop codon" color="#ef4444" />
        )}
        {anticodonPlacement && !isAnimatedTranslationScene && (
          <CodonMarker position={anticodonPlacement.position} label="anticodon" color="#38bdf8" />
        )}

        {initiatorTrnaPlacement && !isAnimatedTranslationScene && !useMolstarStructuralPresentation && (
          <TrnaShape position={initiatorTrnaPlacement.position} label="initiator tRNA" color="#818cf8" />
        )}
        {trnaPlacement && !aminoacylTrnaPlacement && !isAnimatedTranslationScene && !useMolstarStructuralPresentation && (
          <TrnaShape position={trnaPlacement.position} label="tRNA" />
        )}
        {aminoacylTrnaPlacement && !isAnimatedTranslationScene && !useMolstarStructuralPresentation && (
          <TrnaShape position={aminoacylTrnaPlacement.position} label="aminoacyl-tRNA" color="#22d3ee" />
        )}
        {aminoAcidPlacement && !isAnimatedTranslationScene && <AminoAcid position={aminoAcidPlacement.position} />}
        {polypeptidePlacement && !isAnimatedTranslationScene && <Polypeptide position={polypeptidePlacement.position} />}
        {releaseFactorPlacement && !isAnimatedTranslationScene && <ReleaseFactor position={releaseFactorPlacement.position} />}
        {isTranslationScene && !isAnimatedTranslationScene && (
          <TranslationDirectionMarkers
            mrna5Prime={mrna5PrimePlacement?.position}
            mrna3Prime={mrna3PrimePlacement?.position}
            nTerminus={nTerminusPlacement?.position}
            cTerminus={cTerminusPlacement?.position}
          />
        )}

        {hasDNA && isReplicationScene && timeline.hasTemporal && (
          <AnimatedReplicationFork
            motion={replicationMotion}
            showLeading={hasLeadingStrand || hasPolymerase}
            showLagging={hasLaggingStrand || hasOkazakiFragment || hasLigase}
            showHelicase={hasHelicase}
            showPrimase={hasPrimase || hasLaggingStrand || hasOkazakiFragment}
            showLigase={hasLigase}
            showDirectionality={hasDirectionality}
          />
        )}

        {hasDNA && !isReplicationScene && !isTranscriptionScene && !isTranslationScene && !isSignalingScene && !isActionPotentialScene && <DNAFork />}

        {hasDNA && isTranscriptionScene && (
          <TranscriptionDnaTemplate
            hasRnap={transcriptionTemplate?.rnap.visible ?? false}
            hasNascentRna={transcriptionTemplate?.nascentRna.visible ?? false}
          />
        )}

        {isTranscriptionScene && !useMolstarStructuralPresentation && dnaPresentation?.regions.map((region) => (
          <TranscriptionDnaRegionMarker
            key={region.id}
            centerX={region.center}
            label={region.label}
            color={
              region.kind === "enhancer" ? "#7aa6c2" :
              region.kind === "promoter" ? "#d9854d" :
              region.kind === "gene" ? "#71a98c" : "#9d8ac5"
            }
            width={region.width}
          />
        ))}

        {dnaPresentation && isTranscriptionScene && !useMolstarStructuralPresentation && (
          <DnaTerminalMarkers labels={dnaPresentation.terminalMarkers} />
        )}

        {bubblePlacement && (
          !timeline.hasTemporal && (
            <RegionMarker
              position={bubblePlacement.position}
              label="transcription bubble"
              color="#fde68a"
              width={0.72}
            />
          )
        )}


        {rnaPolymeraseEntity && transcriptionTemplate?.rnap.visible && (
          <RnaPolymerase
            position={new THREE.Vector3(0, 0.62, 0.16)}
            label={rnaPolymeraseEntity.name}
            compactLabel
          />
        )}

        {!useMolstarStructuralPresentation && sigmaPlacement && <SigmaFactor position={sigmaPlacement.position} />}

        {hasHelicase && !isReplicationScene && <Helicase />}

        {bindingProteinType && (
          <StrandBindingProteins type={bindingProteinType} />
        )}
        {hasTopoisomerase && topoisomerasePlacement && !isReplicationScene && (
            <Topoisomerase position={topoisomerasePlacement.position} />
            )}
      {hasPrimase && primasePlacement && !isReplicationScene && (
            <Primase position={primasePlacement.position} />
            )}

            {hasRnaPrimer && primaseSynthesizesPrimer && primerPlacement && !isReplicationScene && (
            <RnaPrimer position={primerPlacement.position} />
            )}

        {hasPolymerase && polymerasePlacement && !isReplicationScene && (
          <Polymerase position={polymerasePlacement.position} />
        )}

        {leadingPrimerPlacement && !isReplicationScene && (
          <RnaPrimer
            position={leadingPrimerPlacement.position}
            label="leading primer"
            labelOffset={[-0.56, 0.2, 0]}
          />
        )}

        {laggingPrimerPlacement && !isReplicationScene && (
          <RnaPrimer
            position={laggingPrimerPlacement.position}
            label="lagging primers"
            labelOffset={[0.76, -0.2, 0]}
          />
        )}

        {hasLeadingStrand && leadingPlacement && !isReplicationScene && (
          <DaughterStrand
            position={leadingPlacement.position}
            side={-1}
            label="leading strand"
          />
        )}

        {hasLaggingStrand && laggingPlacement && !isReplicationScene && (
          <DaughterStrand
            position={laggingPlacement.position}
            side={1}
            label="lagging strand"
            segments={3}
          />
        )}

        {hasOkazakiFragment && okazakiPlacement && !isReplicationScene && (
          <OkazakiFragment position={okazakiPlacement.position} />
        )}

        {hasLigase && ligasePlacement && !isReplicationScene && (
          <Ligase position={ligasePlacement.position} />
        )}

        {hasDirectionality && !isTranscriptionScene && (
          <DirectionMarkers
            template5Prime={template5PrimePlacement?.position}
            template3Prime={template3PrimePlacement?.position}
          />
        )}

        {isTranscriptionScene && !timeline.hasTemporal && (
          <TranscriptionDirectionMarkers
            rna5Prime={rna5PrimePlacement?.position}
            rna3Prime={rna3PrimePlacement?.position}
            template3Prime={template3PrimePlacement?.position}
            template5Prime={template5PrimePlacement?.position}
          />
        )}
        <OrbitControls
          makeDefault
          ref={setTranslationControls}
          target={dnaPresentation ? [...dnaPresentation.camera.target] : [0, 0, 0]}
        />
      </Canvas>
      {useMolstarStructuralPresentation && (
        <MolstarStructurePresentationAdapter
          kind={isTranslationScene ? "translation" : "transcription"}
          theme={theme}
          translationIntent={isTranslationScene ? translationDisplayIntent : undefined}
        />
      )}
    </div>
  );
}

"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { dnaVisualSystem } from "./DnaVisualSystem.ts";
import { deriveTranscriptionTemplatePlan, partitionTranscriptionDuplex, transcriptionDnaTemplateTransform } from "./biology-transcription-template.ts";

// Keep the longer paired–bubble–paired canonical segment in the same local
// transcription composition rather than letting it dominate the scene bounds.
const coordinateScale = 0.052;
function point(value: readonly [number, number, number]) {
  return new THREE.Vector3(value[0] * coordinateScale, value[1] * coordinateScale, value[2] * coordinateScale);
}

function Backbone({ points, color, opacity = 1 }: { points: THREE.Vector3[]; color: string; opacity?: number }) {
  // Curves are deliberately built per paired flank or bubble section. This
  // smooths coarse helix samples without allowing a spline to bridge across
  // the open interval and manufacture a global DNA loop.
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points, false, "centripetal", 0.1),
    [points]
  );
  const segments = Math.max(8, (points.length - 1) * 6);
  return <mesh>
    <tubeGeometry args={[curve, segments, 0.016, 8, false]} />
    <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} roughness={0.68} metalness={0.01} />
  </mesh>;
}

function PairedDuplexSection({
  samples,
  strandAColor,
  strandBColor,
  opacity,
}: {
  samples: ReturnType<typeof partitionTranscriptionDuplex>["samples"];
  strandAColor: string;
  strandBColor: string;
  opacity: number;
}) {
  const strandA = useMemo(() => samples.map((sample) => point(sample.strandA)), [samples]);
  const strandB = useMemo(() => samples.map((sample) => point(sample.strandB)), [samples]);

  return <group>
    <Backbone points={strandA} color={strandAColor} opacity={opacity} />
    <Backbone points={strandB} color={strandBColor} opacity={opacity} />
    {samples.filter((sample) => sample.opening === 0).map((sample) => {
      const start = point(sample.basePairStart);
      const end = point(sample.basePairEnd);
      const direction = end.clone().sub(start);
      const midpoint = start.clone().add(end).multiplyScalar(0.5);
      return <mesh key={sample.index} position={midpoint} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())}>
        <cylinderGeometry args={[0.008, 0.008, direction.length(), 8]} />
        <meshStandardMaterial color={`#${dnaVisualSystem.colors.basePair.toString(16)}`} transparent opacity={0.72 * opacity} roughness={0.8} />
      </mesh>;
    })}
  </group>;
}

export function TranscriptionDnaTemplate({ hasRnap, hasNascentRna }: { hasRnap: boolean; hasNascentRna: boolean }) {
  const plan = useMemo(() => deriveTranscriptionTemplatePlan({ hasRnap, hasNascentRna }), [hasNascentRna, hasRnap]);
  const sections = useMemo(() => partitionTranscriptionDuplex(plan), [plan]);
  const { samples, upstream, bubble, downstream } = sections;
  const bubbleA = useMemo(() => bubble.map((sample) => point(sample.strandA)), [bubble]);
  const bubbleB = useMemo(() => bubble.map((sample) => point(sample.strandB)), [bubble]);
  const bubbleSamples = useMemo(
    () => bubble.filter((sample) => sample.opening > 0.5),
    [bubble]
  );
  const bubbleIsPrimary = plan.presentation.bubbleEmphasis === "primary";
  const bubbleCenter = point(samples[plan.dna.openCenter].strandB);
  const rnaCurve = useMemo(() => new THREE.CatmullRomCurve3([
    bubbleCenter.clone(),
    bubbleCenter.clone().add(new THREE.Vector3(-0.18, -0.22, 0.08)),
    bubbleCenter.clone().add(new THREE.Vector3(-0.46, -0.38, 0.18)),
  ]), [bubbleCenter]);

  return (
    <group position={transcriptionDnaTemplateTransform.position} rotation={transcriptionDnaTemplateTransform.rotation}>
      <PairedDuplexSection
        samples={upstream}
        strandAColor={`#${dnaVisualSystem.colors.strandA.toString(16)}`}
        strandBColor={`#${dnaVisualSystem.colors.strandB.toString(16)}`}
        opacity={plan.presentation.pairedFlankOpacity}
      />
      <Backbone points={bubbleA} color={`#${dnaVisualSystem.colors.strandA.toString(16)}`} opacity={1} />
      <Backbone points={bubbleB} color={`#${dnaVisualSystem.colors.strandB.toString(16)}`} opacity={1} />
      <PairedDuplexSection
        samples={downstream}
        strandAColor={`#${dnaVisualSystem.colors.strandA.toString(16)}`}
        strandBColor={`#${dnaVisualSystem.colors.strandB.toString(16)}`}
        opacity={plan.presentation.pairedFlankOpacity}
      />
      {bubbleSamples.map((sample) => {
        const start = point(sample.basePairStart);
        const end = point(sample.basePairEnd);
        const midpoint = start.clone().add(end).multiplyScalar(0.5);
        return <mesh key={`bubble-${sample.index}`} position={midpoint}>
          <sphereGeometry args={[bubbleIsPrimary ? 0.029 : 0.022, 8, 8]} />
          <meshStandardMaterial color="#f0c875" emissive="#805215" emissiveIntensity={bubbleIsPrimary ? 0.42 : 0.18} />
        </mesh>;
      })}
      {plan.nascentRna.visible && (
        <mesh>
          <tubeGeometry args={[rnaCurve, 20, 0.022, 7, false]} />
          <meshStandardMaterial color="#38c58e" roughness={0.62} metalness={0.01} />
        </mesh>
      )}
    </group>
  );
}

"use client";

import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useMemo } from "react";
import { dnaVisualSystem } from "./DnaVisualSystem.ts";
import { deriveTranscriptionTemplatePlan, sampleTranscriptionBubble } from "./biology-transcription-template.ts";

const coordinateScale = 0.08;

function point(value: readonly [number, number, number]) {
  return new THREE.Vector3(value[0] * coordinateScale, value[1] * coordinateScale, value[2] * coordinateScale);
}

function Backbone({ points, color }: { points: THREE.Vector3[]; color: string }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  return (
    <mesh>
      <tubeGeometry args={[curve, 96, 0.038, 8, false]} />
      <meshStandardMaterial color={color} roughness={0.64} metalness={0.02} />
    </mesh>
  );
}

export function TranscriptionDnaTemplate({ hasRnap, hasNascentRna }: { hasRnap: boolean; hasNascentRna: boolean }) {
  const plan = useMemo(() => deriveTranscriptionTemplatePlan({ hasRnap, hasNascentRna }), [hasNascentRna, hasRnap]);
  const samples = useMemo(() => sampleTranscriptionBubble(plan), [plan]);
  const strandA = useMemo(() => samples.map((sample) => point(sample.strandA)), [samples]);
  const strandB = useMemo(() => samples.map((sample) => point(sample.strandB)), [samples]);
  const rungs = useMemo(() => samples.filter((sample) => sample.opening <= 0.01 && sample.index % 2 === 0), [samples]);
  const bubbleCenter = point(samples[plan.dna.openCenter].strandB);
  const rnaCurve = useMemo(() => new THREE.CatmullRomCurve3([
    bubbleCenter.clone(),
    bubbleCenter.clone().add(new THREE.Vector3(-0.18, -0.22, 0.08)),
    bubbleCenter.clone().add(new THREE.Vector3(-0.46, -0.38, 0.18)),
  ]), [bubbleCenter]);

  return (
    <group>
      <Backbone points={strandA} color={`#${dnaVisualSystem.colors.strandA.toString(16)}`} />
      <Backbone points={strandB} color={`#${dnaVisualSystem.colors.strandB.toString(16)}`} />
      {rungs.map((sample) => {
        const start = point(sample.basePairStart);
        const end = point(sample.basePairEnd);
        const direction = end.clone().sub(start);
        const midpoint = start.clone().add(end).multiplyScalar(0.5);
        return (
          <mesh key={sample.index} position={midpoint} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())}>
            <cylinderGeometry args={[0.009, 0.009, direction.length(), 6]} />
            <meshStandardMaterial color={`#${dnaVisualSystem.colors.basePair.toString(16)}`} transparent opacity={0.55} roughness={0.8} />
          </mesh>
        );
      })}
      <Text position={bubbleCenter.clone().add(new THREE.Vector3(-0.38, -0.18, 0))} fontSize={0.075} fillOpacity={0.72} color={`#${dnaVisualSystem.colors.strandB.toString(16)}`}>
        template
      </Text>
      {plan.nascentRna.visible && (
        <mesh>
          <tubeGeometry args={[rnaCurve, 28, 0.03, 8, false]} />
          <meshStandardMaterial color="#38c58e" roughness={0.62} metalness={0.01} />
        </mesh>
      )}
    </group>
  );
}

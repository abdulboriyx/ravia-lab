"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Line, OrbitControls, Text } from "@react-three/drei";
import { useLayoutEffect, useMemo, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { SpatialRaviaTheme } from "./spatial-ravia-theme";
import type { RnaPresentationRoute } from "./RnaPresentationRouter";
import { deriveProductionRnaScenePlan, type RnaProductionScenePlan, type RnaProductionStrand } from "./RnaProductionScenePlan";
import type { RnaPoint, RnaResidueSample } from "./RnaVisualSystem";

function cameraFrame(intent: RnaPresentationRoute["cameraIntent"]) {
  if (intent === "local-chemistry") return { position: [0, 0, 5.2] as RnaPoint, target: [0, 0, 0] as RnaPoint, fov: 36 };
  if (intent === "nucleotide") return { position: [0, 0, 6.5] as RnaPoint, target: [0, 0, 0] as RnaPoint, fov: 40 };
  if (intent === "secondary-structure") return { position: [0, 0, 5.8] as RnaPoint, target: [0, 1.1, 0] as RnaPoint, fov: 42 };
  if (intent === "rna-dna-hybrid") return { position: [0, 0, 10] as RnaPoint, target: [0, 0, 0] as RnaPoint, fov: 44 };
  if (intent === "processing-region" || intent === "whole-rna") return { position: [0, 0, 10] as RnaPoint, target: [0, 0, 0] as RnaPoint, fov: 45 };
  return { position: [0, 0, 9] as RnaPoint, target: [0, 0, 0] as RnaPoint, fov: 44 };
}

function RnaCameraRig({ frame, controls }: { frame: ReturnType<typeof cameraFrame>; controls: OrbitControlsImpl | null }) {
  const { camera } = useThree();
  useLayoutEffect(() => {
    camera.position.set(...frame.position);
    camera.lookAt(...frame.target);
    controls?.target.set(...frame.target);
    controls?.update();
    const request = window.requestAnimationFrame(() => {
      camera.position.set(...frame.position);
      camera.lookAt(...frame.target);
      controls?.target.set(...frame.target);
      controls?.update();
    });
    return () => window.cancelAnimationFrame(request);
  }, [camera, controls, frame]);
  return null;
}

function pointVector(point: RnaPoint) {
  return new THREE.Vector3(point[0], point[1], point[2]);
}

const baseColor: Record<string, string> = { A: "#4d8db7", U: "#c87573", G: "#d19a44", C: "#65a477", T: "#a27bc1" };

function RnaBackbone({ strand, isDark, dna = false }: { strand: RnaProductionStrand; isDark: boolean; dna?: boolean }) {
  const points = strand.samples.map((sample) => pointVector(sample.backbone));
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  if (points.length < 2) return null;
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, Math.max(24, points.length * 8), dna ? 0.08 : 0.07, 10, false]} />
        <meshStandardMaterial color={dna ? "#9b78b7" : "#2d8295"} roughness={0.54} metalness={0.05} transparent opacity={0.94} />
      </mesh>
      {strand.samples.map((sample) => (
        <group key={`${strand.id}-${sample.index}`}>
          <Line points={[sample.backbone, sample.ribose]} color={dna ? "#a27bc1" : "#8f79b8"} lineWidth={1.1} transparent opacity={0.72} />
          <mesh position={sample.backbone as [number, number, number]}>
            <sphereGeometry args={[0.075, 10, 8]} />
            <meshStandardMaterial color={dna ? "#9b78b7" : "#2d8295"} transparent opacity={0.92} />
          </mesh>
          <mesh position={sample.ribose as [number, number, number]}>
            <torusGeometry args={[0.125, 0.035, 8, 12]} />
            <meshStandardMaterial color={dna ? "#a27bc1" : "#8f79b8"} transparent opacity={0.9} />
          </mesh>
          <Line points={[sample.ribose, sample.basePosition]} color={baseColor[sample.base] ?? (isDark ? "#d7e5e6" : "#33464b")} lineWidth={1.25} transparent opacity={0.8} />
          <mesh position={sample.basePosition as [number, number, number]} scale={[0.2, 0.12, 0.055]}>
            <boxGeometry args={[1.7, 1, 1]} />
            <meshStandardMaterial color={baseColor[sample.base] ?? (isDark ? "#d7e5e6" : "#33464b")} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function RnaInteractionLines({ plan, isDark }: { plan: RnaProductionScenePlan; isDark: boolean }) {
  return (
    <group>
      {plan.interactions.map((interaction) => (
        <Line
          key={interaction.id}
          points={[interaction.from, interaction.to]}
          color={interaction.type === "wobblePair" ? "#e8ae5d" : interaction.type === "hydrogenBond" ? "#e4d18d" : interaction.type === "highlight" ? "#f09a5b" : (isDark ? "#dfe9ea" : "#52646a")}
          lineWidth={interaction.type === "hydrogenBond" || interaction.type === "wobblePair" ? 1.6 : 2.2}
          dashed={interaction.type === "hydrogenBond" || interaction.type === "wobblePair"}
          dashSize={0.08}
          gapSize={0.06}
        />
      ))}
    </group>
  );
}

function AtomBondLayer({ plan, isDark }: { plan: RnaProductionScenePlan; isDark: boolean }) {
  const colors: Record<string, string> = { C: "#68767b", N: "#5689b8", O: "#d57a75", P: "#d5a148" };
  const atoms = [...plan.atoms, ...plan.comparisonAtoms];
  const bonds = [...plan.bonds, ...plan.comparisonBonds];
  return (
    <group>
      {bonds.map((bond) => <Line key={bond.id} points={[bond.from, bond.to]} color={bond.type === "phosphodiester" ? "#4c9ba7" : bond.type === "hydrogenBond" ? "#e4d18d" : (isDark ? "#bbcacc" : "#59696e")} lineWidth={bond.type === "phosphodiester" ? 2.2 : 1.4} dashed={bond.type === "hydrogenBond"} />)}
      {atoms.map((atom) => (
        <mesh key={atom.id} position={atom.position as [number, number, number]}>
          <sphereGeometry args={[atom.role === "twoPrimeHydroxyl" ? 0.16 : 0.12, 16, 10]} />
          <meshStandardMaterial color={colors[atom.element] ?? (isDark ? "#dce8e8" : "#43575c")} />
        </mesh>
      ))}
    </group>
  );
}

function TerminalMarkers({ plan }: { plan: RnaProductionScenePlan }) {
  return <group>{plan.terminalMarkers.map((marker) => <mesh key={marker.id} position={marker.position as [number, number, number]} scale={marker.kind === "polyATail" ? [0.32, 0.12, 0.12] : [0.2, 0.2, 0.2]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color={marker.kind === "fivePrimeCap" ? "#e8ae5d" : marker.kind === "polyATail" ? "#c87573" : "#f09a5b"} emissive={marker.kind === "exposedEnd" ? "#7a301f" : "#2b1910"} emissiveIntensity={0.25} /></mesh>)}</group>;
}

function RnaLabels({ plan, isDark }: { plan: RnaProductionScenePlan; isDark: boolean }) {
  return <group>{plan.labels.map((label) => <Text key={label.anchor} position={label.position as [number, number, number]} fontSize={0.16} color={isDark ? "#e5eff2" : "#17242b"} fillOpacity={0.84} anchorX="center" anchorY="middle">{label.text}</Text>)}</group>;
}

function ProductionRnaSceneContent({ plan, theme }: { plan: RnaProductionScenePlan; theme: SpatialRaviaTheme }) {
  const isDark = theme === "dark";
  return (
    <>
      <ambientLight intensity={isDark ? 1.65 : 1.85} />
      <directionalLight position={[4, 6, 8]} intensity={isDark ? 2.15 : 2.4} />
      {plan.structuralMode === "procedural" && plan.strands.map((strand) => <RnaBackbone key={strand.id} strand={strand} isDark={isDark} dna={strand.kind === "DNA"} />)}
      <RnaInteractionLines plan={plan} isDark={isDark} />
      {plan.structuralMode === "local-chemistry" && <AtomBondLayer plan={plan} isDark={isDark} />}
      <TerminalMarkers plan={plan} />
      <RnaLabels plan={plan} isDark={isDark} />
    </>
  );
}

export function ProductionRnaScene({ route, theme }: { route: RnaPresentationRoute; theme: SpatialRaviaTheme }) {
  const plan = useMemo(() => deriveProductionRnaScenePlan(route), [route]);
  const frame = useMemo(() => cameraFrame(route.cameraIntent), [route.cameraIntent]);
  const [controls, setControls] = useState<OrbitControlsImpl | null>(null);
  const isDark = theme === "dark";
  return (
    <section className="mechanisticSceneSurface" aria-label={`Production RNA scene: ${route.family}`} data-rna-production-family={route.family} data-rna-production-owner={route.owner} data-rna-production-camera={route.cameraIntent}>
      <Canvas camera={{ position: frame.position, fov: frame.fov }} dpr={[1, 2]}>
        <color attach="background" args={[isDark ? "#020305" : "#f6f8f7"]} />
        <RnaCameraRig frame={frame} controls={controls} />
        <ProductionRnaSceneContent plan={plan} theme={theme} />
        <OrbitControls ref={setControls} enablePan={false} target={frame.target} enableDamping dampingFactor={0.08} />
      </Canvas>
    </section>
  );
}

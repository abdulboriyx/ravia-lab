"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Line, OrbitControls, Text } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { SpatialRaviaTheme } from "./spatial-ravia-theme";
import type { RnaPresentationRoute } from "./RnaPresentationRouter";
import { deriveProductionRnaScenePlan, type RnaProductionScenePlan, type RnaProductionStrand, type RnaProductionComparisonLayout } from "./RnaProductionScenePlan";
import type { RnaPoint, RnaResidueSample } from "./RnaVisualSystem";
import { bottomDockInsetPx, boundsFromPoints, cameraForBounds, layoutRnaLabels, type RnaCompositionBounds } from "./RnaProductionComposition";

function cameraFrame(intent: RnaPresentationRoute["cameraIntent"]) {
  if (intent === "local-chemistry") return { position: [0, 0, 5.2] as RnaPoint, target: [0, 0, 0] as RnaPoint, fov: 36 };
  if (intent === "nucleotide") return { position: [0, 0, 6.5] as RnaPoint, target: [0, 0, 0] as RnaPoint, fov: 40 };
  if (intent === "secondary-structure") return { position: [0, 0, 5.8] as RnaPoint, target: [0, 1.1, 0] as RnaPoint, fov: 42 };
  if (intent === "rna-dna-hybrid") return { position: [0, 0, 10] as RnaPoint, target: [0, 0, 0] as RnaPoint, fov: 44 };
  if (intent === "processing-region" || intent === "whole-rna") return { position: [0, 0, 10] as RnaPoint, target: [0, 0, 0] as RnaPoint, fov: 45 };
  return { position: [0, 0, 9] as RnaPoint, target: [0, 0, 0] as RnaPoint, fov: 44 };
}

function localChemistryFrame(plan: RnaProductionScenePlan, aspect = 1) {
  const focusRoles = plan.localFocus === "twoPrimeOH" ? new Set(["twoPrimeHydroxyl", "ribose"]) : undefined;
  const selected = focusRoles
    ? plan.atoms.filter((atom) => focusRoles.has(atom.role))
    : plan.localFocus === "phosphodiesterLinkage"
      ? plan.atoms.filter((atom) => atom.emphasis === "primary" || atom.role === "ribose" || atom.role === "threePrimeCarbon" || atom.role === "fivePrimeCarbon" || atom.role === "phosphate")
      : plan.atoms;
  const points = [
    ...(selected.length > 0 ? selected : plan.atoms).map((atom) => atom.position),
    ...plan.labels.map((label) => label.position),
  ];
  const minX = Math.min(...points.map((value) => value[0]));
  const maxX = Math.max(...points.map((value) => value[0]));
  const minY = Math.min(...points.map((value) => value[1]));
  const maxY = Math.max(...points.map((value) => value[1]));
  const target: RnaPoint = [(minX + maxX) / 2, (minY + maxY) / 2, 0];
  const padding = plan.localFocus === "phosphodiesterLinkage" ? 0.62 : 0.8;
  const verticalExtent = Math.max(maxY - minY + padding, (maxX - minX + padding) / Math.max(0.35, aspect));
  return { position: [target[0], target[1], Math.max(3.8, verticalExtent / (2 * Math.tan((36 * Math.PI) / 360)))] as RnaPoint, target, fov: 36 };
}

function comparisonCameraFrame(layout: RnaProductionComparisonLayout, aspect: number) {
  const fov = 42;
  const verticalExtent = Math.max(layout.bounds.height + 1.05, (layout.bounds.width + 1.05) / Math.max(0.35, aspect));
  const distance = Math.max(3.8, verticalExtent / (2 * Math.tan((fov * Math.PI) / 360)));
  return { position: [layout.bounds.center[0], layout.bounds.center[1], distance] as RnaPoint, target: [layout.bounds.center[0], layout.bounds.center[1], 0] as RnaPoint, fov };
}

function planBounds(plan: RnaProductionScenePlan): RnaCompositionBounds | null {
  const points: RnaPoint[] = [];
  for (const strand of plan.strands) for (const sample of strand.samples) points.push(sample.backbone, sample.ribose, sample.basePosition);
  for (const atom of [...plan.atoms, ...plan.comparisonAtoms]) points.push(atom.position);
  for (const interaction of plan.interactions) points.push(interaction.from, interaction.to);
  for (const bond of [...plan.bonds, ...plan.comparisonBonds]) points.push(bond.from, bond.to);
  for (const marker of plan.terminalMarkers) points.push(marker.position);
  for (const label of plan.labels) points.push(label.position);
  return boundsFromPoints(points);
}

function RnaCameraRig({ frame, controls }: { frame: { position: RnaPoint; target: RnaPoint; fov: number }; controls: OrbitControlsImpl | null }) {
  const { camera } = useThree();
  const [px, py, pz] = frame.position;
  const [tx, ty, tz] = frame.target;
  useLayoutEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      // R3F exposes the active camera as a mutable Three.js object; this is the
      // one intentional projection update in the shared camera handshake.
      // eslint-disable-next-line react-hooks/immutability
      camera.fov = frame.fov;
      camera.updateProjectionMatrix();
    }
    camera.position.set(px, py, pz);
    camera.lookAt(tx, ty, tz);
    controls?.target.set(tx, ty, tz);
    controls?.update();
    const request = window.requestAnimationFrame(() => {
      camera.position.set(px, py, pz);
      camera.lookAt(tx, ty, tz);
      controls?.target.set(tx, ty, tz);
      controls?.update();
    });
    return () => window.cancelAnimationFrame(request);
  }, [camera, controls, frame.fov, px, py, pz, tx, ty, tz]);
  return null;
}

function pointVector(point: RnaPoint) {
  return new THREE.Vector3(point[0], point[1], point[2]);
}

const baseColor: Record<string, string> = { A: "#4d8db7", U: "#c87573", G: "#d19a44", C: "#65a477", T: "#a27bc1" };

function RnaBackbone({ strand, isDark, dna = false, simplified = false }: { strand: RnaProductionStrand; isDark: boolean; dna?: boolean; simplified?: boolean }) {
  const points = strand.samples.map((sample) => pointVector(sample.backbone));
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  if (points.length < 2) return null;
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, Math.max(24, points.length * 8), dna ? 0.08 : 0.07, 10, false]} />
        <meshStandardMaterial color={dna ? "#9b78b7" : "#2d8295"} roughness={0.54} metalness={0.05} transparent opacity={strand.opacity ?? 0.94} />
      </mesh>
      {!simplified && strand.samples.map((sample) => (
        <group key={`${strand.id}-${sample.index}`}>
          <Line points={[sample.backbone, sample.ribose]} color={dna ? "#a27bc1" : "#8f79b8"} lineWidth={1.1} transparent opacity={0.72} />
          <mesh position={sample.backbone as [number, number, number]}>
            <sphereGeometry args={[0.075, 10, 8]} />
            <meshStandardMaterial color={dna ? "#9b78b7" : "#2d8295"} transparent opacity={strand.opacity ?? 0.92} />
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
          color={interaction.type === "wobblePair" ? "#e8ae5d" : interaction.type === "hydrogenBond" ? "#e4d18d" : interaction.type === "highlight" ? "#f09a5b" : interaction.type === "dnaPair" ? (isDark ? "#a9bcc2" : "#6d7d83") : (isDark ? "#dfe9ea" : "#52646a")}
          lineWidth={interaction.type === "hydrogenBond" || interaction.type === "wobblePair" ? 1.6 : 2.2}
          dashed={interaction.type === "hydrogenBond" || interaction.type === "wobblePair"}
          dashSize={0.08}
          gapSize={0.06}
        />
      ))}
    </group>
  );
}

function TranscriptSpanLayer({ plan }: { plan: RnaProductionScenePlan }) {
  const strands = new Map(plan.strands.map((strand) => [strand.id, strand]));
  const colors = { exon: "#3f9ab0", intron: "#d08c52" } as const;
  return <group>{plan.transcriptSpans.map((span) => {
    const strand = strands.get(span.strandId);
    const points = span.indices.map((index) => strand?.samples[index]?.backbone).filter((point): point is RnaPoint => Boolean(point));
    if (points.length < 2) return null;
    const curve = new THREE.CatmullRomCurve3(points.map(pointVector));
    return <group key={span.id}>
      <mesh><tubeGeometry args={[curve, Math.max(12, points.length * 10), 0.24, 12, false]} /><meshStandardMaterial color={colors[span.kind]} emissive={colors[span.kind]} emissiveIntensity={0.28} roughness={0.38} /></mesh>
      {points.map((position, index) => <mesh key={index} position={position as [number, number, number]}><sphereGeometry args={[0.255, 12, 10]} /><meshStandardMaterial color={colors[span.kind]} emissive={colors[span.kind]} emissiveIntensity={0.2} /></mesh>)}
    </group>;
  })}</group>;
}

function AtomBondLayer({ plan, isDark }: { plan: RnaProductionScenePlan; isDark: boolean }) {
  const colors: Record<string, string> = { C: "#68767b", N: "#5689b8", O: "#d57a75", P: "#d5a148" };
  const atoms = [...plan.atoms, ...plan.comparisonAtoms];
  const bonds = [...plan.bonds, ...plan.comparisonBonds];
  return (
    <group>
      {bonds.map((bond) => {
        const primary = bond.emphasis === "primary";
        const supporting = bond.emphasis === "supporting";
        return <Line key={bond.id} points={[bond.from, bond.to]} color={bond.type === "phosphodiester" ? (primary ? "#e7a94f" : "#6e9699") : bond.type === "hydrogenBond" ? "#e4d18d" : (isDark ? "#bbcacc" : "#59696e")} lineWidth={bond.type === "phosphodiester" ? (primary ? 2.8 : 0.8) : supporting ? 0.8 : 1.4} transparent opacity={supporting ? 0.48 : 0.94} dashed={bond.type === "hydrogenBond"} />;
      })}
      {atoms.map((atom) => (
        <mesh key={atom.id} position={atom.position as [number, number, number]}>
          <sphereGeometry args={[plan.localFocus === "twoPrimeOH" && atom.role === "twoPrimeHydroxyl" ? 0.24 : atom.role === "twoPrimeHydroxyl" ? 0.16 : atom.emphasis === "primary" ? 0.14 : 0.10, 16, 10]} />
          <meshStandardMaterial color={colors[atom.element] ?? (isDark ? "#dce8e8" : "#43575c")} transparent opacity={atom.emphasis === "supporting" ? 0.58 : 1} emissive={plan.localFocus === "twoPrimeOH" && atom.role === "twoPrimeHydroxyl" ? "#d99b48" : atom.emphasis === "primary" ? "#8e5e1e" : "#000000"} emissiveIntensity={plan.localFocus === "twoPrimeOH" && atom.role === "twoPrimeHydroxyl" ? 0.55 : atom.emphasis === "primary" ? 0.2 : 0} />
        </mesh>
      ))}
    </group>
  );
}

function TerminalMarkers({ plan }: { plan: RnaProductionScenePlan }) {
  return <group>{plan.terminalMarkers.map((marker) => <mesh key={marker.id} position={marker.position as [number, number, number]} scale={marker.kind === "polyATail" ? [0.32, 0.12, 0.12] : [0.2, 0.2, 0.2]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color={marker.kind === "fivePrimeCap" ? "#e8ae5d" : marker.kind === "polyATail" ? "#c87573" : "#f09a5b"} emissive={marker.kind === "exposedEnd" ? "#7a301f" : "#2b1910"} emissiveIntensity={0.25} /></mesh>)}</group>;
}

function RnaLabels({ plan, isDark }: { plan: RnaProductionScenePlan; isDark: boolean }) {
  const bounds = planBounds(plan);
  const labels = layoutRnaLabels(plan.labels, bounds);
  const processingSpanLabels = plan.transcriptSpans.length > 0;
  return <group>{labels.map((label) => <Text key={`${label.anchor}-${label.text}`} position={label.position as [number, number, number]} fontSize={processingSpanLabels ? 0.28 : 0.16} color={isDark ? "#e5eff2" : "#17242b"} fillOpacity={processingSpanLabels ? 1 : 0.84} anchorX="center" anchorY="middle" depthOffset={-1}>{label.text}</Text>)}</group>;
}

function ProductionRnaSceneContent({ plan, theme }: { plan: RnaProductionScenePlan; theme: SpatialRaviaTheme }) {
  const isDark = theme === "dark";
  const nascentScene = plan.family === "nascentTranscript";
  return (
    <>
      <ambientLight intensity={isDark ? 1.65 : 1.85} />
      <directionalLight position={[4, 6, 8]} intensity={isDark ? 2.15 : 2.4} />
      {plan.structuralMode === "procedural" && plan.strands.map((strand) => <RnaBackbone key={strand.id} strand={strand} isDark={isDark} dna={strand.kind === "DNA"} simplified={(plan.transcriptSpans.length > 0 && strand.id === "mRNA-transcript") || (nascentScene && strand.kind === "DNA")} />)}
      {plan.structuralMode === "procedural" && plan.transcriptSpans.length > 0 && <TranscriptSpanLayer plan={plan} />}
      <RnaInteractionLines plan={plan} isDark={isDark} />
      {plan.atoms.length > 0 && <AtomBondLayer plan={plan} isDark={isDark} />}
      <TerminalMarkers plan={plan} />
      <RnaLabels plan={plan} isDark={isDark} />
    </>
  );
}

function RnaSceneStage({ plan, theme, frame, controls }: { plan: RnaProductionScenePlan; theme: SpatialRaviaTheme; frame: ReturnType<typeof cameraFrame>; controls: OrbitControlsImpl | null }) {
  const { size } = useThree();
  const [bottomInsetPx, setBottomInsetPx] = useState(0);
  useEffect(() => {
    const measure = () => {
      const canvas = document.querySelector<HTMLCanvasElement>(".rnaProductionMount canvas, .mechanisticSceneSurface canvas");
      const dock = document.querySelector<HTMLElement>(".spatialPromptDock:not([data-state=collapsed])");
      if (!canvas || !dock) return setBottomInsetPx(0);
      const canvasRect = canvas.getBoundingClientRect();
      const dockRect = dock.getBoundingClientRect();
      setBottomInsetPx(bottomDockInsetPx(canvasRect.top, canvasRect.bottom, dockRect.top));
    };
    measure();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : undefined;
    const dock = document.querySelector<HTMLElement>(".spatialPromptDock");
    if (dock && observer) observer.observe(dock);
    window.addEventListener("resize", measure);
    return () => { observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, []);
  const aspect = size.width / Math.max(1, size.height);
  const portrait = Boolean(plan.comparison && aspect < 1.05);
  const layout = plan.comparison ? (portrait ? plan.comparison.portrait : plan.comparison.wide) : undefined;
  const activePlan = layout ? { ...plan, strands: layout.strands, labels: layout.labels, interactions: layout.interactions } : plan;
  const bounds = planBounds(activePlan);
  const activeFrame = bounds
    ? cameraForBounds(bounds, { aspect, fov: layout ? 42 : plan.atoms.length > 0 ? 36 : frame.fov, minDistance: layout ? 3.8 : 3.8, bottomInsetPx, viewportHeightPx: size.height })
    : layout ? comparisonCameraFrame(layout, aspect) : plan.atoms.length > 0 ? localChemistryFrame(plan, aspect) : frame;
  return (
    <>
      <RnaCameraRig frame={activeFrame} controls={controls} />
      <ProductionRnaSceneContent plan={activePlan} theme={theme} />
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
      <Canvas camera={{ position: frame.position, fov: plan.comparison ? 42 : frame.fov }} dpr={[1, 2]}>
        <color attach="background" args={[isDark ? "#020305" : "#f6f8f7"]} />
        <RnaSceneStage plan={plan} theme={theme} frame={frame} controls={controls} />
        <OrbitControls ref={setControls} enablePan={false} enableDamping dampingFactor={0.08} />
      </Canvas>
    </section>
  );
}

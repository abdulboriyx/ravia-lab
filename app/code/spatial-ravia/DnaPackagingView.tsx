"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { SpatialRaviaTheme } from "./spatial-ravia-theme";
import { derivePackagingMode, linkerPath, nucleosomeUnits, wrappedDnaPaths, type NucleosomeUnit } from "./DnaPackagingGeometry";
import { boundsForDnaCamera, deriveDnaSceneCameraFrame, getDnaSceneCameraContract } from "./DnaSceneCamera";
import { DnaSceneCameraRig } from "./DnaSceneCameraRig";

function Tube({ points, color, radius }: { points: THREE.Vector3[]; color: string; radius: number }) {
  const geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), Math.max(8, points.length * 2), radius, 7, false);
  return <mesh geometry={geometry}><meshStandardMaterial color={color} roughness={0.45} /></mesh>;
}
function Core() { const offsets: Array<readonly [number, number, number]> = [[-.72,.43,.45],[.72,.43,-.45],[-.72,-.43,-.45],[.72,-.43,.45],[-.42,.78,-.25],[.42,.78,.25],[-.42,-.78,.25],[.42,-.78,-.25]]; return <group>{offsets.map((position, index) => <mesh key={index} position={position}><sphereGeometry args={[.72,20,16]} /><meshStandardMaterial color={index % 2 ? "#d48a64" : "#cb6e5a"} roughness={.52} /></mesh>)}</group>; }
function Nucleosome({ unit }: { unit: NucleosomeUnit }) { const { pointsA, pointsB, rungs } = wrappedDnaPaths(unit); const offset = new THREE.Vector3(...unit.center); return <group position={unit.center}><Core /><Tube points={pointsA.map((point) => point.clone().sub(offset))} color="#4d8db7" radius={.105} /><Tube points={pointsB.map((point) => point.clone().sub(offset))} color="#9b78b7" radius={.105} />{rungs.map(([a,b], index) => <Tube key={index} points={[a.clone().sub(offset),b.clone().sub(offset)]} color="#dfcf9a" radius={.025} />)}</group>; }
export function DnaPackagingView({ prompt, theme }: { prompt: string; theme: SpatialRaviaTheme }) {
  const mode = derivePackagingMode(prompt);
  const units = nucleosomeUnits(mode);
  const frame = (() => {
    const points = units.flatMap((unit) => {
      const paths = wrappedDnaPaths(unit);
      // Include the histone-like core envelope as well as wrapped DNA so neither is cropped.
      return [...paths.pointsA, ...paths.pointsB, new THREE.Vector3(...unit.center).addScalar(-0.9), new THREE.Vector3(...unit.center).addScalar(0.9)]
        .map((point) => [point.x, point.y, point.z] as const);
    });
    if (mode === "chromatin") units.slice(0, -1).forEach((unit, index) => linkerPath(unit, units[index + 1]).forEach((point) => points.push([point.x, point.y, point.z])));
    const contract = { ...getDnaSceneCameraContract("packaging"), targetScreenOccupancy: mode === "chromatin" ? 0.68 : 0.5 };
    return deriveDnaSceneCameraFrame(contract, boundsForDnaCamera(points), 16 / 9);
  })();
  const labelPosition: [number, number, number] = [frame.bounds.center[0], frame.bounds.center[1] + frame.bounds.halfExtent[1] + 0.7, frame.bounds.center[2]];
  const [controls, setControls] = useState<OrbitControlsImpl | null>(null);
  return <section className="mechanisticSceneSurface" aria-label="DNA packaging visualization" data-packaging-mode={mode}><Canvas camera={{ position: frame.position, fov: frame.fov }}><color attach="background" args={[theme === "dark" ? "#05080b" : "#f6f8f7"]} /><ambientLight intensity={1.6} /><directionalLight position={[5,7,8]} intensity={2.4} /><DnaSceneCameraRig frame={frame} controls={controls} />{units.map((unit,index) => <Nucleosome key={index} unit={unit} />)}{mode === "chromatin" && units.slice(0,-1).map((unit,index) => <Tube key={index} points={linkerPath(unit,units[index+1])} color="#4d8db7" radius={.1} />)}<Text position={labelPosition} fontSize={.36} color={theme === "dark" ? "#eaf1f3" : "#26343b"}>{mode === "chromatin" ? "Chromatin: beads on a string" : "Nucleosome core"}</Text><OrbitControls ref={setControls} enablePan={false} target={frame.target} /></Canvas></section>;
}

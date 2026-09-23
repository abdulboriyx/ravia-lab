"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { CatmullRomCurve3, DoubleSide, LineCurve3, Vector3, type Mesh } from "three";
import type { EyePart, EyeView } from "./EyeStructureStudy";
import styles from "./eye-structure.module.css";

type Props = { selected: EyePart; onSelect: (part: EyePart) => void; view: EyeView; pupil: number; lightOn: boolean; resetKey: number };

const point = (x: number, y: number, z = 0) => new Vector3(x, y, z);

function Photon({ curve, offset, color }: { curve: CatmullRomCurve3; offset: number; color: string }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const phase = ((clock.elapsedTime * 0.25 + offset) % 1 + 1) % 1;
    ref.current.position.copy(curve.getPoint(phase));
  });
  return <mesh ref={ref}><sphereGeometry args={[0.043, 12, 12]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>;
}

function Ray({ offset, pupil }: { offset: number; pupil: number }) {
  const curve = useMemo(() => new CatmullRomCurve3([
    point(-3.25, offset * 1.12, 0.17),
    point(-2.08, offset * 0.82, 0.12),
    point(-1.58, offset * 0.49, 0.1),
    point(-1.14, offset * 0.36, 0.09),
    point(0.35, 0.15 + offset * 0.13, 0.08),
    point(1.86, 0.18, 0.02),
  ]), [offset]);
  const enters = Math.abs(offset) < pupil * 1.48 + 0.035;
  const visibleCurve = useMemo(() => enters ? curve : new CatmullRomCurve3([
    point(-3.25, offset * 1.12, 0.17), point(-2.08, offset * 0.82, 0.12), point(-1.62, offset * 0.49, 0.1),
  ]), [curve, enters, offset]);
  return <group>
    <mesh><tubeGeometry args={[visibleCurve, 48, 0.009, 5, false]} /><meshBasicMaterial color={enters ? "#ffe39c" : "#a98757"} transparent opacity={enters ? 0.85 : 0.4} toneMapped={false} depthWrite={false} /></mesh>
    {enters && <Photon curve={curve} offset={(offset + 0.6) * 0.27} color="#fff4c3" />}
  </group>;
}

function Highlight({ at, selected }: { at: [number, number, number]; selected: boolean }) {
  if (!selected) return null;
  return <group position={at}>
    <mesh><sphereGeometry args={[0.07, 16, 16]} /><meshBasicMaterial color="#ffe9a8" toneMapped={false} /></mesh>
    <mesh><sphereGeometry args={[0.16, 16, 16]} /><meshBasicMaterial color="#ffe9a8" transparent opacity={0.16} depthWrite={false} /></mesh>
  </group>;
}

function EyeModel({ selected, onSelect, pupil, lightOn }: Pick<Props, "selected" | "onSelect" | "pupil" | "lightOn">) {
  const choose = (part: EyePart) => (event: { stopPropagation: () => void }) => { event.stopPropagation(); onSelect(part); };
  const neural = useMemo(() => new CatmullRomCurve3([
    point(1.9, 0.18, -0.07), point(1.96, -0.09, -0.22), point(1.85, -0.45, -0.11),
    point(2.45, -0.5, -0.1), point(3.1, -0.54, -0.08),
  ]), []);

  return <group>
    {/* The open half of the wall makes the posterior retina visible without hiding the optics. */}
    <mesh onClick={choose("sclera")}>
      <sphereGeometry args={[2.03, 72, 40, Math.PI, Math.PI]} />
      <meshPhysicalMaterial color={selected === "sclera" ? "#e4f8e7" : "#e5e4d8"} roughness={0.55} side={DoubleSide} />
    </mesh>
    <mesh onClick={choose("retina")}>
      <sphereGeometry args={[1.94, 72, 40, Math.PI, Math.PI]} />
      <meshStandardMaterial color={selected === "retina" ? "#ffb296" : "#bb746b"} roughness={0.75} side={DoubleSide} />
    </mesh>
    <mesh rotation={[0, 0, 0]} onClick={choose("sclera")}>
      <torusGeometry args={[2.01, 0.055, 10, 100]} />
      <meshStandardMaterial color="#ebe6da" roughness={0.55} />
    </mesh>

    {/* The anterior optical apparatus is spaced along the optical axis (x). */}
    <mesh position={[-1.88, 0, 0]} scale={[0.48, 0.73, 0.73]} onClick={choose("cornea")}>
      <sphereGeometry args={[1, 48, 32]} />
      <meshPhysicalMaterial color="#a5e6e4" transparent opacity={selected === "cornea" ? 0.38 : 0.21} roughness={0.05} metalness={0.05} depthWrite={false} />
    </mesh>
    <mesh position={[-1.76, 0, 0]} scale={[0.45, 0.67, 0.67]} onClick={choose("aqueous")}>
      <sphereGeometry args={[1, 40, 28]} />
      <meshPhysicalMaterial color="#99d8dd" transparent opacity={selected === "aqueous" ? 0.17 : 0.045} depthWrite={false} />
    </mesh>
    <mesh position={[-1.54, 0, 0]} rotation={[0, Math.PI / 2, 0]} onClick={choose("pupil")}>
      <ringGeometry args={[pupil, 0.66, 72]} />
      <meshStandardMaterial color={selected === "pupil" ? "#75c4b0" : "#789d83"} roughness={0.48} side={DoubleSide} />
    </mesh>
    {Array.from({ length: 24 }, (_, i) => {
      const a = i * Math.PI * 2 / 24;
      const radius = pupil + (0.66 - pupil) * 0.52;
      return <mesh key={i} position={[-1.53, Math.cos(a) * radius, Math.sin(a) * radius]} rotation={[a, Math.PI / 2, 0]} onClick={choose("pupil")}>
        <boxGeometry args={[0.015, 0.22, 0.008]} />
        <meshStandardMaterial color="#a8c2a1" transparent opacity={0.75} />
      </mesh>;
    })}
    <mesh position={[-1.51, 0, 0]} rotation={[0, Math.PI / 2, 0]} onClick={choose("pupil")}>
      <torusGeometry args={[pupil, 0.014, 8, 72]} /><meshStandardMaterial color="#c6dac0" />
    </mesh>
    <mesh position={[-1.1, 0, 0]} scale={[0.22, 0.55, 0.55]} onClick={choose("lens")}>
      <sphereGeometry args={[1, 48, 32]} />
      <meshPhysicalMaterial color={selected === "lens" ? "#fff4c8" : "#e6e8c9"} roughness={0.18} transparent opacity={0.75} depthWrite={false} />
    </mesh>
    <mesh position={[-1.06, 0, 0]} rotation={[0, Math.PI / 2, 0]} onClick={choose("ciliary")}>
      <torusGeometry args={[0.83, 0.12, 16, 80]} />
      <meshStandardMaterial color={selected === "ciliary" ? "#eea28e" : "#a57569"} roughness={0.68} />
    </mesh>
    {Array.from({ length: 24 }, (_, i) => {
      const a = i * Math.PI * 2 / 24;
      const start = point(-1.06, Math.cos(a) * 0.76, Math.sin(a) * 0.76);
      const end = point(-1.1, Math.cos(a) * 0.51, Math.sin(a) * 0.51);
      return <mesh key={i} onClick={choose("ciliary")}>
        <tubeGeometry args={[new LineCurve3(start, end), 1, 0.008, 4, false]} />
        <meshStandardMaterial color="#d5b7a0" />
      </mesh>;
    })}
    <mesh position={[0.42, 0, -0.53]} scale={[1.29, 1.38, 1.05]} onClick={choose("vitreous")}>
      <sphereGeometry args={[1, 40, 32, Math.PI, Math.PI]} />
      <meshPhysicalMaterial color="#8dc5c7" transparent opacity={selected === "vitreous" ? 0.12 : 0.026} side={DoubleSide} depthWrite={false} />
    </mesh>

    {/* Macula/fovea and optic disk are distinct spots on the posterior lining. */}
    <mesh position={[1.91, 0.18, -0.1]} rotation={[0, Math.PI / 2, 0]} onClick={choose("fovea")}>
      <circleGeometry args={[0.19, 32]} /><meshBasicMaterial color={selected === "fovea" ? "#ffd580" : "#dcaa72"} side={DoubleSide} />
    </mesh>
    <mesh position={[1.94, 0.18, -0.1]} onClick={choose("fovea")}>
      <sphereGeometry args={[0.055, 16, 16]} /><meshBasicMaterial color="#754b49" />
    </mesh>
    <mesh position={[1.83, -0.45, -0.1]} rotation={[0, Math.PI / 2, 0]} onClick={choose("disk")}>
      <circleGeometry args={[0.16, 32]} /><meshBasicMaterial color={selected === "disk" ? "#fff5cb" : "#f1d7b9"} side={DoubleSide} />
    </mesh>
    <mesh position={[2.55, -0.51, -0.1]} rotation={[0, 0, -Math.PI / 2]} onClick={choose("nerve")}>
      <cylinderGeometry args={[0.22, 0.16, 1.43, 24]} />
      <meshStandardMaterial color={selected === "nerve" ? "#f5d09d" : "#d3ac8b"} roughness={0.85} />
    </mesh>
    <Highlight at={selected === "fovea" ? [1.94, 0.18, 0.03] : selected === "disk" ? [1.87, -0.45, 0.03] : selected === "pupil" ? [-1.53, pupil, 0.08] : selected === "lens" ? [-1.09, 0.58, 0.08] : selected === "cornea" ? [-2.25, 0, 0] : selected === "nerve" ? [2.55, -0.51, 0.18] : selected === "ciliary" ? [-1.06, 0.86, 0.06] : selected === "sclera" ? [0, 1.98, 0.05] : selected === "aqueous" ? [-1.83, 0.54, 0.07] : selected === "vitreous" ? [0.42, 1.25, 0.08] : [1.97, 0.89, 0.03]} selected />

    {lightOn && <group>
      {[-0.52, -0.26, 0, 0.26, 0.52].map((offset) => <Ray key={offset} offset={offset} pupil={pupil} />)}
      <mesh><tubeGeometry args={[neural, 64, 0.012, 5, false]} /><meshBasicMaterial color="#78e1d3" transparent opacity={0.83} toneMapped={false} depthWrite={false} /></mesh>
      <Photon curve={neural} offset={0.2} color="#a4f8ed" />
    </group>}
  </group>;
}

export default function Eye3DScene({ selected, onSelect, view, pupil, lightOn, resetKey }: Props) {
  const cameraPosition: [number, number, number] = view === "front" ? [-5.6, 0.35, 2.0] : view === "inside" ? [0.0, 0.3, 3.75] : [0.25, 1.15, 6.6];
  return <div className={styles.canvas} role="img" aria-label="Rotatable 3D cutaway model of the eye. Use the controls and structure buttons to explore its anatomy.">
    <Canvas key={`${view}-${resetKey}`} camera={{ position: cameraPosition, fov: 42, near: 0.1, far: 100 }} dpr={[1, 1.75]} fallback={<div className={styles.canvasFallback}>3D is unavailable in this browser. Use the structure controls to explore the anatomy.</div>}>
      <color attach="background" args={["#14222d"]} />
      <ambientLight intensity={1.45} />
      <directionalLight position={[-3, 5, 6]} intensity={2.5} color="#fff0d8" />
      <directionalLight position={[4, -3, 2]} intensity={1.4} color="#91d8da" />
      <EyeModel selected={selected} onSelect={onSelect} pupil={pupil} lightOn={lightOn} />
      <OrbitControls enablePan={false} enableDamping dampingFactor={0.08} minDistance={3.3} maxDistance={10} target={[0, 0, 0]} />
    </Canvas>
  </div>;
}

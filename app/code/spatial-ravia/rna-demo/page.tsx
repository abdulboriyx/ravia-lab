"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo, useSyncExternalStore } from "react";
import { readScinaTheme, subscribeToScinaTheme, type ScinaTheme } from "@/app/scina-theme";
import { RnaStrand3D } from "../RnaMolecularStrand3D";
import type { RnaBaseIdentity } from "../rna-canonical-visual";

const demoSequence: readonly RnaBaseIdentity[] = ["A", "U", "G", "C", "A", "U", "G", "C", "U", "A"];

export default function RnaDemoPage() {
  const theme = useSyncExternalStore<ScinaTheme>(subscribeToScinaTheme, readScinaTheme, () => "dark");
  const input = useMemo(() => ({ sequence: demoSequence, direction: "5-to-3" as const }), []);
  const dark = theme === "dark";
  return <main style={{ minHeight: "100vh", background: dark ? "#020305" : "#f6f8f7", color: dark ? "#eef7fa" : "#142226", padding: "32px 5vw" }}>
    <header style={{ maxWidth: 960, margin: "0 auto 16px" }}>
      <p style={{ letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, fontSize: 13, opacity: 0.7 }}>Scina · RNA visual primitive</p>
      <h1 style={{ margin: "8px 0 4px", fontSize: 28 }}>Canonical molecular RNA strand</h1>
      <p style={{ margin: 0, opacity: 0.75 }}>S2_SCHEMATIC · 10 ordered nucleotides · 5′ → 3′</p>
    </header>
    <section style={{ maxWidth: 960, height: 540, margin: "0 auto", borderRadius: 18, overflow: "hidden", border: `1px solid ${dark ? "#24363b" : "#c7d6d4"}` }} aria-label="isolated RNA demo">
      <Canvas camera={{ position: [0, 0.3, 5.6], fov: 34 }} dpr={[1, 2]}>
        <color attach="background" args={[dark ? "#020305" : "#f6f8f7"]} />
        <ambientLight intensity={dark ? 1.3 : 1.7} color={dark ? "#b7d8df" : "#dbe8e8"} />
        <directionalLight position={[2, 4, 5]} intensity={dark ? 2.2 : 2.4} color="#fff5df" />
        <directionalLight position={[-3, 1, -2]} intensity={dark ? 0.8 : 1} color="#6f9fb4" />
        <RnaStrand3D input={input} theme={theme} />
        <OrbitControls enablePan={false} enableDamping dampingFactor={0.08} minDistance={4} maxDistance={8} />
      </Canvas>
    </section>
  </main>;
}

"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo, useSyncExternalStore } from "react";
import { readScinaTheme, subscribeToScinaTheme, type ScinaTheme } from "@/app/scina-theme";
import { RnaStrand3D } from "../RnaMolecularStrand3D";
import type { RnaBaseIdentity } from "../rna-canonical-visual";

const demoSequence: readonly RnaBaseIdentity[] = ["A", "U", "G", "C", "A", "U", "G", "C", "U", "A"];
type DemoView = "overall" | "close" | "end";
const readDemoView = (): DemoView => {
  if (typeof window === "undefined") return "overall";
  const requested = new URLSearchParams(window.location.search).get("view");
  return requested === "close" || requested === "end" || requested === "overall" ? requested : "overall";
};
const subscribeToDemoView = () => () => {};

export default function RnaDemoPage() {
  const theme = useSyncExternalStore<ScinaTheme>(subscribeToScinaTheme, readScinaTheme, () => "dark");
  const view = useSyncExternalStore(subscribeToDemoView, readDemoView, () => "overall" as DemoView);
  const input = useMemo(() => {
    if (view === "close") return { sequence: demoSequence.slice(3, 6), direction: "5-to-3" as const, positions: [[-0.52, -0.05, 0], [0, 0.08, 0.03], [0.52, -0.02, 0.01]] as const };
    if (view === "end") return { sequence: demoSequence.slice(0, 4), direction: "5-to-3" as const, positions: [[-0.78, -0.03, 0], [-0.26, 0.08, 0.04], [0.26, 0.02, 0.01], [0.78, -0.06, 0.03]] as const };
    return { sequence: demoSequence, direction: "5-to-3" as const };
  }, [view]);
  const dark = theme === "dark";
  const camera = view === "overall" ? [0, 0.18, 5.6] : view === "close" ? [0, 0.08, 2.6] : [0, 0.1, 3.35];
  return <main style={{ minHeight: "100vh", background: dark ? "#020305" : "#f6f8f7", color: dark ? "#eef7fa" : "#142226", padding: "32px 5vw" }}>
    <header style={{ maxWidth: 960, margin: "0 auto 16px" }}>
      <p style={{ letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, fontSize: 13, opacity: 0.7 }}>Scina · RNA visual primitive</p>
      <h1 style={{ margin: "8px 0 4px", fontSize: 28 }}>Canonical molecular RNA strand</h1>
      <p style={{ margin: 0, opacity: 0.75 }}>S2_SCHEMATIC · {input.sequence.length} ordered nucleotides · 5′ → 3′ · {view} view</p>
    </header>
    <section style={{ maxWidth: 960, height: 540, margin: "0 auto", borderRadius: 18, overflow: "hidden", border: `1px solid ${dark ? "#24363b" : "#c7d6d4"}` }} aria-label="isolated RNA demo">
      <Canvas camera={{ position: camera as [number, number, number], fov: view === "overall" ? 34 : 30 }} dpr={[1, 2]}>
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

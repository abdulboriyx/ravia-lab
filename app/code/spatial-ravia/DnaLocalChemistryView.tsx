"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { useMemo, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { SpatialRaviaTheme } from "./spatial-ravia-theme";
import { DnaLocalChemistryPrimitive } from "./DnaLocalChemistryPrimitive";
import { getDnaLocalChemistryPlan, type LocalChemistrySubject } from "./DnaLocalChemistryRepresentation";
import { boundsForDnaCamera, deriveDnaSceneCameraFrame, getDnaSceneCameraContract } from "./DnaSceneCamera";
import { DnaSceneCameraRig } from "./DnaSceneCameraRig";

const labelLayouts: Record<LocalChemistrySubject, readonly { label: string; position: readonly [number, number, number] }[]> = {
  "at-base-pair": [
    { label: "Adenine", position: [-1.35, 0.92, 0] },
    { label: "Thymine", position: [1.35, 0.92, 0] },
  ],
  "gc-base-pair": [
    { label: "Guanine", position: [-1.35, 0.92, 0] },
    { label: "Cytosine", position: [1.35, 0.92, 0] },
  ],
  "backbone-linkage": [
    { label: "1′ carbon / base", position: [-1.55, 0.82, 0] },
    { label: "3′-OH", position: [-0.72, -0.78, 0] },
    { label: "5′ phosphate", position: [0.1, -0.9, 0] },
  ],
  nucleotide: [
    { label: "Phosphate", position: [-1.25, 0.74, 0] },
    { label: "Deoxyribose", position: [-0.2, -0.82, 0] },
    { label: "Guanine", position: [1.03, 0.78, 0] },
  ],
  "thymine-dimer": [{ label: "Thymine dimer", position: [0, 0.86, 0] }],
  mismatch: [
    { label: "Guanine", position: [-0.9, 0.7, 0] },
    { label: "Thymine mismatch", position: [0.96, 0.7, 0] },
  ],
};

/** The local chemistry family has one reusable static host, separate from Mol* duplex context. */
export function DnaLocalChemistryView({ subject, theme }: { subject: LocalChemistrySubject; theme: SpatialRaviaTheme }) {
  const plan = useMemo(() => getDnaLocalChemistryPlan(subject), [subject]);
  const frame = useMemo(() => deriveDnaSceneCameraFrame(
    getDnaSceneCameraContract(subject === "thymine-dimer" || subject === "mismatch" ? "damageRepair" : "localChemistry"),
    boundsForDnaCamera(plan.atoms.map((atom) => atom.position)),
    16 / 9,
  ), [plan, subject]);
  const isDark = theme === "dark";
  const [controls, setControls] = useState<OrbitControlsImpl | null>(null);
  return (
    <section className="mechanisticSceneSurface" aria-label="DNA local chemistry visualization" data-local-chemistry={subject}>
      <Canvas camera={{ position: frame.position, fov: frame.fov }}>
        <color attach="background" args={[isDark ? "#020305" : "#f6f8f7"]} />
        <ambientLight intensity={1.8} />
        <directionalLight position={[3, 4, 6]} intensity={2.4} />
        <DnaSceneCameraRig frame={frame} controls={controls} />
        <DnaLocalChemistryPrimitive plan={plan} />
        {labelLayouts[subject].map((label) => (
          <Text key={label.label} position={label.position} fontSize={0.13} fillOpacity={0.72} color={isDark ? "#eaf1f3" : "#26343b"}>
            {label.label}
          </Text>
        ))}
        <OrbitControls ref={setControls} enablePan={false} target={frame.target} />
      </Canvas>
    </section>
  );
}

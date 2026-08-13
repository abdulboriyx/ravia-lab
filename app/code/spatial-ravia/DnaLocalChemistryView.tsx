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
        {plan.actors.filter((actor) => actor.emphasis !== "context").map((actor, index) => (
          <Text key={actor.id} position={[0, 1.65 - index * 0.28, 0]} fontSize={0.16} color={isDark ? "#eaf1f3" : "#26343b"}>
            {actor.label}
          </Text>
        ))}
        <OrbitControls ref={setControls} enablePan={false} target={frame.target} />
      </Canvas>
    </section>
  );
}

"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import type { BiologySceneSpec } from "./biology-scene-spec";
import { resolveSpatialPlacements } from "./biology-spatial-resolver";

type Props = {
  scene: BiologySceneSpec;
};

function HelixStrand({
  phase,
  startY,
  endY,
  radius,
}: {
  phase: number;
  startY: number;
  endY: number;
  radius: number;
}) {
  const points: THREE.Vector3[] = [];
  const steps = 80;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = THREE.MathUtils.lerp(startY, endY, t);
    const angle = t * Math.PI * 6 + phase;

    points.push(
      new THREE.Vector3(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      )
    );
  }

  const curve = new THREE.CatmullRomCurve3(points);

  return (
    <mesh>
      <tubeGeometry args={[curve, 120, 0.06, 12, false]} />
      <meshStandardMaterial />
    </mesh>
  );
}

function createSeparatedStrandCurve(side: -1 | 1) {
  const points = [
    new THREE.Vector3(side * 0.25, 0, 0),
    new THREE.Vector3(side * 0.5, 0.6, 0),
    new THREE.Vector3(side * 0.9, 1.4, 0),
    new THREE.Vector3(side * 1.2, 2.2, 0),
  ];

  return new THREE.CatmullRomCurve3(points);
}

function SeparatedStrand({ side }: { side: -1 | 1 }) {
  const curve = createSeparatedStrandCurve(side);

  return (
    <mesh>
      <tubeGeometry args={[curve, 60, 0.06, 12, false]} />
      <meshStandardMaterial />
    </mesh>
  );
}

function DNAFork() {
  return (
    <group>
      <HelixStrand
        phase={0}
        startY={-2.5}
        endY={0}
        radius={0.28}
      />

      <HelixStrand
        phase={Math.PI}
        startY={-2.5}
        endY={0}
        radius={0.28}
      />

      <SeparatedStrand side={-1} />
      <SeparatedStrand side={1} />

      <Text position={[0, -2.9, 0]} fontSize={0.22}>
        Double-stranded DNA
      </Text>

      <Text position={[0, 2.7, 0]} fontSize={0.22}>
        Separated ssDNA
      </Text>
    </group>
  );
}

function Helicase() {
  return (
    <group position={[0, 0.15, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.18, 24, 64]} />
        <meshStandardMaterial />
      </mesh>

      <Text position={[0, 0.85, 0]} fontSize={0.24}>
        Helicase
      </Text>
    </group>
  );
}

function StrandBindingProteins({
  type,
}: {
  type: "rpa" | "ssb" | "generic";
}) {
  const label =
    type === "rpa"
      ? "RPA"
      : type === "ssb"
      ? "SSB"
      : "ssDNA-binding protein";

  const leftCurve = createSeparatedStrandCurve(-1);
  const rightCurve = createSeparatedStrandCurve(1);

  const bindingSites = [0.32, 0.55, 0.78];

  const positions: THREE.Vector3[] = [
    ...bindingSites.map((t) => leftCurve.getPoint(t)),
    ...bindingSites.map((t) => rightCurve.getPoint(t)),
  ];
  
  return (
    <group>
      {positions.map((position, index) => (
        <mesh
          key={index}
          position={[position.x, position.y, position.z]}
        >
          <sphereGeometry args={[0.17, 24, 24]} />
          <meshStandardMaterial />
        </mesh>
      ))}

      <Text position={[1.55, 1.45, 0]} fontSize={0.2}>
        {label}
      </Text>
    </group>
  );
}

function Topoisomerase({
  position,
}: {
  position: THREE.Vector3;
}) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshStandardMaterial />
      </mesh>

      <Text position={[0.6, 0, 0]} fontSize={0.2}>
        Topoisomerase
      </Text>
    </group>
  );
}

function Primase({
  position,
}: {
  position: THREE.Vector3;
}) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial />
      </mesh>

      <Text position={[0.55, 0, 0]} fontSize={0.2}>
        Primase
      </Text>
    </group>
  );
}

function RnaPrimer({
  position,
  label = "RNA primer",
  labelOffset = [0.5, 0.45, 0],
}: {
  position: THREE.Vector3;
  label?: string;
  labelOffset?: [number, number, number];
}) {
  const points = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.18, 0.18, 0),
    new THREE.Vector3(0.36, 0.34, 0),
  ];

  const curve = new THREE.CatmullRomCurve3(points);

  return (
    <group position={position}>
      <mesh>
        <tubeGeometry args={[curve, 30, 0.05, 10, false]} />
        <meshStandardMaterial />
      </mesh>

      <Text position={labelOffset} fontSize={0.14}>
        {label}
      </Text>
    </group>
  );
}

function Polymerase({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.46, 0.34, 0.3]} />
        <meshStandardMaterial color="#f4b942" />
      </mesh>

      <Text position={[-0.25, -0.42, 0]} fontSize={0.16}>
        DNA polymerase
      </Text>
    </group>
  );
}

function DaughterStrand({
  position,
  side,
  label,
  segments = 1,
}: {
  position: THREE.Vector3;
  side: -1 | 1;
  label: string;
  segments?: number;
}) {
  const fragmentOffsets = Array.from(
    { length: segments },
    (_, index) => index * 0.34
  );

  return (
    <group position={position}>
      {fragmentOffsets.map((offset) => {
        const points = [
          new THREE.Vector3(0, offset, 0.08),
          new THREE.Vector3(side * 0.12, offset + 0.22, 0.08),
          new THREE.Vector3(side * 0.22, offset + 0.42, 0.08),
        ];

        const curve = new THREE.CatmullRomCurve3(points);

        return (
          <mesh key={offset}>
            <tubeGeometry args={[curve, 28, 0.045, 10, false]} />
            <meshStandardMaterial color="#7dd3fc" />
          </mesh>
        );
      })}

      <Text position={[side * 0.9, 0.78, 0]} fontSize={0.15}>
        {label}
      </Text>
    </group>
  );
}

function OkazakiFragment({ position }: { position: THREE.Vector3 }) {
  const points = [
    new THREE.Vector3(-0.16, 0, 0.14),
    new THREE.Vector3(0.04, 0.18, 0.14),
    new THREE.Vector3(0.22, 0.34, 0.14),
  ];
  const curve = new THREE.CatmullRomCurve3(points);

  return (
    <group position={position}>
      <mesh>
        <tubeGeometry args={[curve, 24, 0.06, 10, false]} />
        <meshStandardMaterial color="#38bdf8" />
      </mesh>

      <Text position={[-0.1, 0.64, 0]} fontSize={0.16}>
        Okazaki fragment
      </Text>
    </group>
  );
}

function Ligase({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial color="#fb7185" />
      </mesh>

      <Text position={[0.82, 0.08, 0]} fontSize={0.16}>
        Ligase seals nick
      </Text>
    </group>
  );
}

function DirectionMarkers({
  template5Prime,
  template3Prime,
}: {
  template5Prime?: THREE.Vector3;
  template3Prime?: THREE.Vector3;
}) {
  return (
    <group>
      {template5Prime && (
        <Text position={template5Prime} fontSize={0.2}>
          5 prime
        </Text>
      )}

      {template3Prime && (
        <Text position={template3Prime} fontSize={0.2}>
          3 prime
        </Text>
      )}

      <Text position={[0, 0.52, 0.25]} fontSize={0.18}>
        daughter synthesis runs 5 prime to 3 prime
      </Text>
    </group>
  );
}


export default function MechanisticScene({ scene }: Props) {
  const hasDNA = scene.entities.some((e) => e.id === "dna");

  const hasHelicase = scene.entities.some(
    (e) => e.id === "helicase"
  );

  const hasRPA = scene.entities.some((e) => e.id === "rpa");

  const hasSSB = scene.entities.some((e) => e.id === "ssb");

  const hasGenericBindingProtein = scene.entities.some(
    (e) => e.id === "ssdna-binding-protein"
  );

  const hasTopoisomerase = scene.entities.some(
  (e) => e.id === "topoisomerase"
   );

  const topoisomeraseActsAhead = scene.relations.some(
  (r) =>
    r.subject === "topoisomerase" &&
    r.relation === "acts_ahead_of" &&
    r.object === "helicase"
);

  const bindingProteinType: "rpa" | "ssb" | "generic" | null =
    hasRPA
      ? "rpa"
      : hasSSB
      ? "ssb"
      : hasGenericBindingProtein
      ? "generic"
      : null;
   const placements = resolveSpatialPlacements(scene);
      const primasePlacement = placements.find(
      (p) => p.entityId === "primase"
      );

      const primerPlacement = placements.find(
      (p) => p.entityId === "rna-primer"
      );

   const topoisomerasePlacement = placements.find(
     (p) => p.entityId === "topoisomerase"
);

      const hasPrimase = scene.entities.some(
      (e) => e.id === "primase"
      );

      const hasRnaPrimer = scene.entities.some(
      (e) => e.id === "rna-primer"
      );

  const polymerasePlacement = placements.find(
    (p) => p.entityId === "polymerase"
  );

  const leadingPlacement = placements.find(
    (p) => p.entityId === "daughter-leading-strand"
  );

  const laggingPlacement = placements.find(
    (p) => p.entityId === "daughter-lagging-strand"
  );

  const leadingPrimerPlacement = placements.find(
    (p) => p.entityId === "rna-primer-leading"
  );

  const laggingPrimerPlacement = placements.find(
    (p) => p.entityId === "rna-primer-lagging"
  );

  const okazakiPlacement = placements.find(
    (p) => p.entityId === "okazaki-fragment"
  );

  const ligasePlacement = placements.find(
    (p) => p.entityId === "ligase"
  );

  const template5PrimePlacement = placements.find(
    (p) => p.entityId === "template-5-prime"
  );

  const template3PrimePlacement = placements.find(
    (p) => p.entityId === "template-3-prime"
  );

  const hasPolymerase = scene.entities.some(
    (e) => e.id === "polymerase"
  );

  const hasLeadingStrand = scene.entities.some(
    (e) => e.id === "daughter-leading-strand"
  );

  const hasLaggingStrand = scene.entities.some(
    (e) => e.id === "daughter-lagging-strand"
  );

  const hasOkazakiFragment = scene.entities.some(
    (e) => e.id === "okazaki-fragment"
  );

  const hasLigase = scene.entities.some((e) => e.id === "ligase");

  const hasDirectionality = scene.relations.some(
    (r) => r.relation === "direction" && r.object === "5-to-3"
  );

      const primaseSynthesizesPrimer = scene.actions.some(
      (a) =>
      a.actor === "primase" &&
      a.action === "synthesizes" &&
      a.target === "rna-primer"
      );
  return (
    <div style={{ width: "100%", height: "700px" }}>
      <Canvas camera={{ position: [4.5, 2.5, 7], fov: 45 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 5, 5]} intensity={2} />

        {hasDNA && <DNAFork />}

        {hasHelicase && <Helicase />}

        {bindingProteinType && (
          <StrandBindingProteins type={bindingProteinType} />
        )}
        {hasTopoisomerase && topoisomerasePlacement && (
            <Topoisomerase position={topoisomerasePlacement.position} />
            )}
      {hasPrimase && primasePlacement && (
            <Primase position={primasePlacement.position} />
            )}

            {hasRnaPrimer && primaseSynthesizesPrimer && primerPlacement && (
            <RnaPrimer position={primerPlacement.position} />
            )}

        {hasPolymerase && polymerasePlacement && (
          <Polymerase position={polymerasePlacement.position} />
        )}

        {leadingPrimerPlacement && (
          <RnaPrimer
            position={leadingPrimerPlacement.position}
            label="leading primer"
            labelOffset={[-0.56, 0.2, 0]}
          />
        )}

        {laggingPrimerPlacement && (
          <RnaPrimer
            position={laggingPrimerPlacement.position}
            label="lagging primers"
            labelOffset={[0.76, -0.2, 0]}
          />
        )}

        {hasLeadingStrand && leadingPlacement && (
          <DaughterStrand
            position={leadingPlacement.position}
            side={-1}
            label="leading strand"
          />
        )}

        {hasLaggingStrand && laggingPlacement && (
          <DaughterStrand
            position={laggingPlacement.position}
            side={1}
            label="lagging strand"
            segments={3}
          />
        )}

        {hasOkazakiFragment && okazakiPlacement && (
          <OkazakiFragment position={okazakiPlacement.position} />
        )}

        {hasLigase && ligasePlacement && (
          <Ligase position={ligasePlacement.position} />
        )}

        {hasDirectionality && (
          <DirectionMarkers
            template5Prime={template5PrimePlacement?.position}
            template3Prime={template3PrimePlacement?.position}
          />
        )}
        <OrbitControls />
      </Canvas>
    </div>
  );
}

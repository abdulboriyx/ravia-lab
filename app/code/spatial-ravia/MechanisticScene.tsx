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

function LinearDnaSegment({
  showBubble = false,
  showStrands = false,
}: {
  showBubble?: boolean;
  showStrands?: boolean;
}) {
  const topBefore = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.4, 0.16, 0),
    new THREE.Vector3(-0.82, 0.16, 0),
  ]);
  const bottomBefore = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.4, -0.16, 0),
    new THREE.Vector3(-0.82, -0.16, 0),
  ]);
  const topAfter = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.18, 0.16, 0),
    new THREE.Vector3(2.4, 0.16, 0),
  ]);
  const bottomAfter = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.18, -0.16, 0),
    new THREE.Vector3(2.4, -0.16, 0),
  ]);
  const topBubble = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.82, 0.16, 0),
    new THREE.Vector3(-0.55, 0.36, 0),
    new THREE.Vector3(-0.2, 0.34, 0),
    new THREE.Vector3(0.18, 0.16, 0),
  ]);
  const bottomBubble = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.82, -0.16, 0),
    new THREE.Vector3(-0.55, -0.36, 0),
    new THREE.Vector3(-0.2, -0.34, 0),
    new THREE.Vector3(0.18, -0.16, 0),
  ]);

  const curves = showBubble
    ? [topBefore, bottomBefore, topBubble, bottomBubble, topAfter, bottomAfter]
    : [
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-2.4, 0.16, 0),
          new THREE.Vector3(2.4, 0.16, 0),
        ]),
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-2.4, -0.16, 0),
          new THREE.Vector3(2.4, -0.16, 0),
        ]),
      ];

  return (
    <group>
      {curves.map((curve, index) => (
        <mesh key={index}>
          <tubeGeometry args={[curve, 48, 0.045, 10, false]} />
          <meshStandardMaterial color={index % 2 === 0 ? "#93c5fd" : "#c4b5fd"} />
        </mesh>
      ))}

      {showStrands && (
        <>
          <Text position={[1.2, 0.42, 0]} fontSize={0.14}>
            coding strand
          </Text>
          <Text position={[1.05, -0.42, 0]} fontSize={0.14}>
            template strand read 3 prime to 5 prime
          </Text>
        </>
      )}
    </group>
  );
}

function RegionMarker({
  position,
  label,
  color,
  width = 0.5,
}: {
  position: THREE.Vector3;
  label: string;
  color: string;
  width?: number;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[width, 0.08, 0.08]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text position={[0, 0.26, 0]} fontSize={0.14}>
        {label}
      </Text>
    </group>
  );
}

function RnaPolymerase({
  position,
  label,
}: {
  position: THREE.Vector3;
  label: string;
}) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.34, 32, 32]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
      <mesh position={[0.18, -0.08, 0]}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      <Text position={[0, 0.58, 0]} fontSize={0.14}>
        {label}
      </Text>
    </group>
  );
}

function RnaTranscript({ position }: { position: THREE.Vector3 }) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.22, -0.18, 0),
    new THREE.Vector3(-0.48, -0.26, 0),
    new THREE.Vector3(-0.78, -0.38, 0),
  ]);

  return (
    <group position={position}>
      <mesh>
        <tubeGeometry args={[curve, 36, 0.05, 10, false]} />
        <meshStandardMaterial color="#34d399" />
      </mesh>
      <Text position={[-0.55, -0.58, 0]} fontSize={0.14}>
        RNA transcript
      </Text>
    </group>
  );
}

function SigmaFactor({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.16, 20, 20]} />
        <meshStandardMaterial color="#fb7185" />
      </mesh>
      <Text position={[0.12, 0.28, 0]} fontSize={0.12}>
        sigma
      </Text>
    </group>
  );
}

function TranscriptionDirectionMarkers({
  rna5Prime,
  rna3Prime,
  template3Prime,
  template5Prime,
}: {
  rna5Prime?: THREE.Vector3;
  rna3Prime?: THREE.Vector3;
  template3Prime?: THREE.Vector3;
  template5Prime?: THREE.Vector3;
}) {
  return (
    <group>
      {rna5Prime && (
        <Text position={rna5Prime} fontSize={0.14}>
          RNA 5 prime
        </Text>
      )}
      {rna3Prime && (
        <Text position={rna3Prime} fontSize={0.14}>
          RNA 3 prime growing end
        </Text>
      )}
      {template3Prime && (
        <Text position={template3Prime} fontSize={0.14}>
          template 3 prime
        </Text>
      )}
      {template5Prime && (
        <Text position={template5Prime} fontSize={0.14}>
          template 5 prime
        </Text>
      )}
    </group>
  );
}

function MrnaStrand() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.1, -0.34, 0),
    new THREE.Vector3(-0.8, -0.34, 0),
    new THREE.Vector3(0.8, -0.34, 0),
    new THREE.Vector3(2.1, -0.34, 0),
  ]);

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 64, 0.045, 10, false]} />
        <meshStandardMaterial color="#34d399" />
      </mesh>
      <Text position={[-1.95, -0.72, 0]} fontSize={0.14}>
        mRNA
      </Text>
    </group>
  );
}

function RibosomeBody({ label }: { label: string }) {
  return (
    <group>
      <mesh position={[0, 0.45, 0.12]}>
        <sphereGeometry args={[0.92, 40, 24]} />
        <meshStandardMaterial color="#c084fc" />
      </mesh>
      <mesh position={[0, -0.08, 0.08]} scale={[1.4, 0.42, 0.5]}>
        <sphereGeometry args={[0.72, 36, 20]} />
        <meshStandardMaterial color="#93c5fd" />
      </mesh>
      <Text position={[0, 1.32, 0.18]} fontSize={0.14}>
        {label}
      </Text>
    </group>
  );
}

function RibosomeSite({
  position,
  label,
}: {
  position: THREE.Vector3;
  label: string;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.32, 0.16, 0.08]} />
        <meshStandardMaterial color="#fde68a" />
      </mesh>
      <Text position={[0, -0.24, 0]} fontSize={0.12}>
        {label}
      </Text>
    </group>
  );
}

function TrnaShape({
  position,
  label,
  color = "#60a5fa",
}: {
  position: THREE.Vector3;
  label: string;
  color?: string;
}) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.16, -0.3, 0),
    new THREE.Vector3(0, 0.1, 0),
    new THREE.Vector3(0.16, -0.3, 0),
  ]);

  return (
    <group position={position}>
      <mesh>
        <tubeGeometry args={[curve, 30, 0.04, 8, false]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text position={[0, 0.24, 0]} fontSize={0.12}>
        {label}
      </Text>
    </group>
  );
}

function AminoAcid({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshStandardMaterial color="#fb7185" />
      </mesh>
      <Text position={[0.3, 0.04, 0]} fontSize={0.1}>
        amino acid
      </Text>
    </group>
  );
}

function CodonMarker({
  position,
  label,
  color = "#fbbf24",
}: {
  position: THREE.Vector3;
  label: string;
  color?: string;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.32, 0.08, 0.08]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text position={[0, -0.22, 0]} fontSize={0.1}>
        {label}
      </Text>
    </group>
  );
}

function Polypeptide({ position }: { position: THREE.Vector3 }) {
  const beads = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.12, 0.18, 0.04),
    new THREE.Vector3(-0.24, 0.36, 0.02),
    new THREE.Vector3(-0.4, 0.52, 0.06),
  ];

  return (
    <group position={position}>
      {beads.map((bead, index) => (
        <mesh key={index} position={bead}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#f97316" />
        </mesh>
      ))}
      <Text position={[-0.55, 0.78, 0]} fontSize={0.12}>
        growing polypeptide
      </Text>
    </group>
  );
}

function ReleaseFactor({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.28, 0.42, 0.18]} />
        <meshStandardMaterial color="#f43f5e" />
      </mesh>
      <Text position={[0.28, 0.28, 0]} fontSize={0.1}>
        release factor
      </Text>
    </group>
  );
}

function TranslationDirectionMarkers({
  mrna5Prime,
  mrna3Prime,
  nTerminus,
  cTerminus,
}: {
  mrna5Prime?: THREE.Vector3;
  mrna3Prime?: THREE.Vector3;
  nTerminus?: THREE.Vector3;
  cTerminus?: THREE.Vector3;
}) {
  return (
    <group>
      {mrna5Prime && (
        <Text position={mrna5Prime} fontSize={0.13}>
          mRNA 5 prime
        </Text>
      )}
      {mrna3Prime && (
        <Text position={mrna3Prime} fontSize={0.13}>
          mRNA 3 prime
        </Text>
      )}
      {nTerminus && (
        <Text position={nTerminus} fontSize={0.12}>
          N terminus
        </Text>
      )}
      {cTerminus && (
        <Text position={cTerminus} fontSize={0.12}>
          C terminus grows
        </Text>
      )}
    </group>
  );
}

function PlasmaMembrane() {
  return (
    <group>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[4.6, 0.08, 0.18]} />
        <meshStandardMaterial color="#60a5fa" />
      </mesh>
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[4.6, 0.08, 0.18]} />
        <meshStandardMaterial color="#34d399" />
      </mesh>
      <Text position={[-2.2, 1.1, 0]} fontSize={0.14}>
        extracellular
      </Text>
      <Text position={[-2.2, -1.15, 0]} fontSize={0.14}>
        cytoplasm
      </Text>
    </group>
  );
}

function SignalingLigand({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
      <Text position={[0.35, 0.08, 0]} fontSize={0.12}>
        ligand
      </Text>
    </group>
  );
}

function TransmembraneReceptor({
  position,
  label,
  phosphorylated = false,
}: {
  position: THREE.Vector3;
  label: string;
  phosphorylated?: boolean;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.58, 0]}>
        <sphereGeometry args={[0.2, 24, 24]} />
        <meshStandardMaterial color="#a78bfa" />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.07, 0.07, 1.2, 16]} />
        <meshStandardMaterial color="#818cf8" />
      </mesh>
      <mesh position={[0, -0.64, 0]}>
        <boxGeometry args={[0.26, 0.22, 0.16]} />
        <meshStandardMaterial color="#6366f1" />
      </mesh>
      {phosphorylated && (
        <>
          <mesh position={[0.16, -0.86, 0.04]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color="#facc15" />
          </mesh>
          <mesh position={[-0.16, -0.82, 0.04]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color="#facc15" />
          </mesh>
        </>
      )}
      <Text position={[0, -1.08, 0]} fontSize={0.1}>
        {label}
      </Text>
    </group>
  );
}

function SignalingProtein({
  position,
  label,
  color = "#22c55e",
}: {
  position: THREE.Vector3;
  label: string;
  color?: string;
}) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.16, 22, 22]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text position={[0.28, 0.04, 0]} fontSize={0.1}>
        {label}
      </Text>
    </group>
  );
}

function Nucleus({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.38, 32, 20]} />
        <meshStandardMaterial color="#f9a8d4" transparent opacity={0.72} />
      </mesh>
      <Text position={[0, 0.55, 0]} fontSize={0.12}>
        nucleus
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
  const isTranscriptionScene = scene.entities.some((e) =>
    [
      "rna-polymerase",
      "bacterial-rna-polymerase",
      "rna-polymerase-ii",
      "rna-transcript",
      "transcription-bubble",
      "promoter",
      "gene",
      "template-strand",
      "coding-strand",
      "terminator",
    ].includes(e.id)
  );
  const isTranslationScene = scene.entities.some((e) =>
    [
      "mrna",
      "ribosome",
      "small-ribosomal-subunit",
      "large-ribosomal-subunit",
      "codon",
      "trna",
      "anticodon",
      "amino-acid",
      "aminoacyl-trna",
      "a-site",
      "p-site",
      "e-site",
      "polypeptide",
      "start-codon",
      "stop-codon",
      "release-factor",
    ].includes(e.id)
  );
  const isSignalingScene = scene.entities.some((e) =>
    [
      "plasma-membrane",
      "receptor-tyrosine-kinase",
      "receptor-dimer",
      "ligand",
      "ras",
      "raf",
      "mek",
      "erk",
    ].includes(e.id)
  );
  const hasMrna = scene.entities.some((e) => e.id === "mrna");

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
  const promoterPlacement = placements.find((p) => p.entityId === "promoter");
  const genePlacement = placements.find((p) => p.entityId === "gene");
  const bubblePlacement = placements.find((p) => p.entityId === "transcription-bubble");
  const rnaPolymeraseEntity = scene.entities.find((e) =>
    ["rna-polymerase", "bacterial-rna-polymerase", "rna-polymerase-ii"].includes(e.id)
  );
  const rnaPolymerasePlacement = rnaPolymeraseEntity
    ? placements.find((p) => p.entityId === rnaPolymeraseEntity.id)
    : undefined;
  const rnaTranscriptPlacement = placements.find((p) => p.entityId === "rna-transcript");
  const sigmaPlacement = placements.find((p) => p.entityId === "sigma-factor");
  const terminatorPlacement = placements.find((p) => p.entityId === "terminator");
  const rna5PrimePlacement = placements.find((p) => p.entityId === "rna-5-prime");
  const rna3PrimePlacement = placements.find((p) => p.entityId === "rna-3-prime");
  const ribosomeEntity = scene.entities.find((e) => e.id === "ribosome");
  const aSitePlacement = placements.find((p) => p.entityId === "a-site");
  const pSitePlacement = placements.find((p) => p.entityId === "p-site");
  const eSitePlacement = placements.find((p) => p.entityId === "e-site");
  const trnaPlacement = placements.find((p) => p.entityId === "trna");
  const initiatorTrnaPlacement = placements.find((p) => p.entityId === "initiator-trna");
  const aminoacylTrnaPlacement = placements.find((p) => p.entityId === "aminoacyl-trna");
  const aminoAcidPlacement = placements.find((p) => p.entityId === "amino-acid");
  const codonPlacement = placements.find((p) => p.entityId === "codon");
  const startCodonPlacement = placements.find((p) => p.entityId === "start-codon");
  const stopCodonPlacement = placements.find((p) => p.entityId === "stop-codon");
  const anticodonPlacement = placements.find((p) => p.entityId === "anticodon");
  const polypeptidePlacement = placements.find((p) => p.entityId === "polypeptide");
  const releaseFactorPlacement = placements.find((p) => p.entityId === "release-factor");
  const mrna5PrimePlacement = placements.find((p) => p.entityId === "mrna-5-prime");
  const mrna3PrimePlacement = placements.find((p) => p.entityId === "mrna-3-prime");
  const nTerminusPlacement = placements.find((p) => p.entityId === "n-terminus");
  const cTerminusPlacement = placements.find((p) => p.entityId === "c-terminus");
  const membranePlacement = placements.find((p) => p.entityId === "plasma-membrane");
  const ligandPlacement = placements.find((p) => p.entityId === "ligand");
  const rtkPlacement = placements.find((p) => p.entityId === "receptor-tyrosine-kinase");
  const monomerAPlacement = placements.find((p) => p.entityId === "receptor-monomer-a");
  const monomerBPlacement = placements.find((p) => p.entityId === "receptor-monomer-b");
  const phosphoPlacement = placements.find((p) => p.entityId === "phosphotyrosine-site");
  const phosphatePlacement = placements.find((p) => p.entityId === "phosphate-group");
  const adaptorPlacement = placements.find((p) => p.entityId === "adaptor-protein");
  const grb2Placement = placements.find((p) => p.entityId === "grb2");
  const sosPlacement = placements.find((p) => p.entityId === "sos");
  const rasPlacement = placements.find((p) => p.entityId === "ras");
  const rasGdpPlacement = placements.find((p) => p.entityId === "ras-gdp");
  const rasGtpPlacement = placements.find((p) => p.entityId === "ras-gtp");
  const rafPlacement = placements.find((p) => p.entityId === "raf");
  const mekPlacement = placements.find((p) => p.entityId === "mek");
  const erkPlacement = placements.find((p) => p.entityId === "erk");
  const nucleusPlacement = placements.find((p) => p.entityId === "nucleus");
  const responsePlacement = placements.find((p) => p.entityId === "cellular-response");
  const receptorPhosphorylated = scene.entities.some((e) => e.id === "phosphotyrosine-site");

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

        {isSignalingScene && membranePlacement && <PlasmaMembrane />}
        {ligandPlacement && <SignalingLigand position={ligandPlacement.position} />}
        {rtkPlacement && !monomerAPlacement && (
          <TransmembraneReceptor
            position={rtkPlacement.position}
            label="RTK"
            phosphorylated={receptorPhosphorylated}
          />
        )}
        {monomerAPlacement && (
          <TransmembraneReceptor
            position={monomerAPlacement.position}
            label="RTK A"
            phosphorylated={receptorPhosphorylated}
          />
        )}
        {monomerBPlacement && (
          <TransmembraneReceptor
            position={monomerBPlacement.position}
            label="RTK B"
            phosphorylated={receptorPhosphorylated}
          />
        )}
        {phosphoPlacement && <SignalingProtein position={phosphoPlacement.position} label="pY site" color="#facc15" />}
        {phosphatePlacement && <SignalingProtein position={phosphatePlacement.position} label="phosphate" color="#fbbf24" />}
        {adaptorPlacement && <SignalingProtein position={adaptorPlacement.position} label="adaptor" color="#2dd4bf" />}
        {grb2Placement && <SignalingProtein position={grb2Placement.position} label="Grb2" color="#14b8a6" />}
        {sosPlacement && <SignalingProtein position={sosPlacement.position} label="SOS" color="#10b981" />}
        {rasPlacement && <SignalingProtein position={rasPlacement.position} label="Ras" color="#84cc16" />}
        {rasGdpPlacement && <SignalingProtein position={rasGdpPlacement.position} label="Ras-GDP" color="#94a3b8" />}
        {rasGtpPlacement && <SignalingProtein position={rasGtpPlacement.position} label="Ras-GTP" color="#22c55e" />}
        {rafPlacement && <SignalingProtein position={rafPlacement.position} label="Raf" color="#38bdf8" />}
        {mekPlacement && <SignalingProtein position={mekPlacement.position} label="MEK" color="#0ea5e9" />}
        {erkPlacement && <SignalingProtein position={erkPlacement.position} label="ERK" color="#2563eb" />}
        {nucleusPlacement && <Nucleus position={nucleusPlacement.position} />}
        {responsePlacement && <SignalingProtein position={responsePlacement.position} label="response" color="#ec4899" />}

        {isTranslationScene && hasMrna && <MrnaStrand />}

        {ribosomeEntity && isTranslationScene && (
          <RibosomeBody label={ribosomeEntity.name} />
        )}

        {eSitePlacement && <RibosomeSite position={eSitePlacement.position} label="E" />}
        {pSitePlacement && <RibosomeSite position={pSitePlacement.position} label="P" />}
        {aSitePlacement && <RibosomeSite position={aSitePlacement.position} label="A" />}

        {codonPlacement && <CodonMarker position={codonPlacement.position} label="codon" />}
        {startCodonPlacement && (
          <CodonMarker position={startCodonPlacement.position} label="start codon" color="#22c55e" />
        )}
        {stopCodonPlacement && (
          <CodonMarker position={stopCodonPlacement.position} label="stop codon" color="#ef4444" />
        )}
        {anticodonPlacement && (
          <CodonMarker position={anticodonPlacement.position} label="anticodon" color="#38bdf8" />
        )}

        {initiatorTrnaPlacement && (
          <TrnaShape position={initiatorTrnaPlacement.position} label="initiator tRNA" color="#818cf8" />
        )}
        {trnaPlacement && !aminoacylTrnaPlacement && (
          <TrnaShape position={trnaPlacement.position} label="tRNA" />
        )}
        {aminoacylTrnaPlacement && (
          <TrnaShape position={aminoacylTrnaPlacement.position} label="aminoacyl-tRNA" color="#22d3ee" />
        )}
        {aminoAcidPlacement && <AminoAcid position={aminoAcidPlacement.position} />}
        {polypeptidePlacement && <Polypeptide position={polypeptidePlacement.position} />}
        {releaseFactorPlacement && <ReleaseFactor position={releaseFactorPlacement.position} />}
        {isTranslationScene && (
          <TranslationDirectionMarkers
            mrna5Prime={mrna5PrimePlacement?.position}
            mrna3Prime={mrna3PrimePlacement?.position}
            nTerminus={nTerminusPlacement?.position}
            cTerminus={cTerminusPlacement?.position}
          />
        )}

        {hasDNA && !isTranscriptionScene && !isTranslationScene && !isSignalingScene && <DNAFork />}

        {hasDNA && isTranscriptionScene && (
          <LinearDnaSegment
            showBubble={Boolean(bubblePlacement)}
            showStrands={scene.entities.some((e) =>
              ["template-strand", "coding-strand"].includes(e.id)
            )}
          />
        )}

        {promoterPlacement && (
          <RegionMarker
            position={promoterPlacement.position}
            label="promoter"
            color="#f97316"
          />
        )}

        {genePlacement && (
          <RegionMarker
            position={genePlacement.position}
            label="gene"
            color="#22c55e"
            width={1.3}
          />
        )}

        {bubblePlacement && (
          <RegionMarker
            position={bubblePlacement.position}
            label="transcription bubble"
            color="#fde68a"
            width={0.72}
          />
        )}

        {terminatorPlacement && (
          <RegionMarker
            position={terminatorPlacement.position}
            label="terminator"
            color="#a78bfa"
            width={0.42}
          />
        )}

        {rnaPolymeraseEntity && rnaPolymerasePlacement && (
          <RnaPolymerase
            position={rnaPolymerasePlacement.position}
            label={rnaPolymeraseEntity.name}
          />
        )}

        {rnaTranscriptPlacement && (
          <RnaTranscript position={rnaTranscriptPlacement.position} />
        )}

        {sigmaPlacement && <SigmaFactor position={sigmaPlacement.position} />}

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

        {hasDirectionality && !isTranscriptionScene && (
          <DirectionMarkers
            template5Prime={template5PrimePlacement?.position}
            template3Prime={template3PrimePlacement?.position}
          />
        )}

        {isTranscriptionScene && (
          <TranscriptionDirectionMarkers
            rna5Prime={rna5PrimePlacement?.position}
            rna3Prime={rna3PrimePlacement?.position}
            template3Prime={template3PrimePlacement?.position}
            template5Prime={template5PrimePlacement?.position}
          />
        )}
        <OrbitControls />
      </Canvas>
    </div>
  );
}

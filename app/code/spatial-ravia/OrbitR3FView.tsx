"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import type { SpatialSessionState } from "./model.ts";
import { dispatchScientificSessionEvent } from "./model.ts";
import type { CompiledScene } from "./scene-compiler.ts";
import {
  maxOrbitBenchmarkPositionErrorAu,
  orbitBenchmarkMetadata,
  orbitBenchmarkPoints,
  orbitPositionAtProgress
} from "./orbit-fixture.ts";

type OrbitR3FViewProps = {
  scene: CompiledScene;
  session: SpatialSessionState;
  setSession: (updater: (current: SpatialSessionState) => SpatialSessionState) => void;
};

const orbitScale = 3.2;

export function OrbitR3FView({ scene, session, setSession }: OrbitR3FViewProps) {
  const [cameraZoom, setCameraZoom] = useState(82);
  const earth = orbitPositionAtProgress(session.playback.timelinePosition);
  const activeStage = scene.timeline.stages.find((stage) => stage.active);
  const selected = new Set(session.selectedEntities);
  const pathVisible = isVisible("orbit-trajectory", session);
  const benchmarkVisible = isVisible("jpl-benchmark", session);
  const vectorVisible = isVisible("gravity-vector", session) && session.playback.showDirectionality;
  const labelsVisible = session.playback.showLabels;

  useEffect(() => {
    const updateZoom = () => {
      setCameraZoom(Math.min(82, Math.max(48, (window.innerWidth - 2) / 7.4)));
    };

    updateZoom();
    window.addEventListener("resize", updateZoom);
    return () => window.removeEventListener("resize", updateZoom);
  }, []);

  return (
    <section className="orbitSpatialView simulationCanvas" aria-label="Two-body orbit renderer">
      <div className="canvasMeta orbitMeta">
        <p>{scene.title}</p>
        <span>Evidence mode: equation-derived simulation</span>
        <span>Physical time: day {earth.day.toFixed(2)} / {orbitBenchmarkMetadata.stepDays * 5}</span>
        <span>Max error: {maxOrbitBenchmarkPositionErrorAu().toExponential(2)} AU</span>
      </div>

      <Canvas
        orthographic
        camera={{ position: [0, 0, 8], zoom: cameraZoom, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#020607"]} />
        <ambientLight intensity={0.75} />
        <pointLight position={[0, 0, 4]} intensity={26} color="#f8fbff" />
        <GridPlane />
        {pathVisible ? <OrbitPath selected={selected.has("orbit-trajectory")} /> : null}
        {benchmarkVisible ? <BenchmarkMarkers selected={selected.has("jpl-benchmark")} /> : null}
        {isVisible("sun", session) ? (
          <SelectableSphere
            entityId="sun"
            position={[0, 0, 0.05]}
            radius={selected.has("sun") ? 0.26 : 0.21}
            color="#f6fbff"
            setSession={setSession}
          />
        ) : null}
        {isVisible("earth", session) ? (
          <SelectableSphere
            entityId="earth"
            position={[earth.xAu * orbitScale, earth.yAu * orbitScale, 0.14]}
            radius={selected.has("earth") ? 0.14 : 0.105}
            color={activeStage?.id === "epoch-5" ? "#9bf0ff" : "#7fb7c7"}
            setSession={setSession}
          />
        ) : null}
        {vectorVisible ? (
          <GravityVector
            earthPosition={[earth.xAu * orbitScale, earth.yAu * orbitScale, 0.2]}
            selected={selected.has("gravity-vector")}
          />
        ) : null}
      </Canvas>

      <svg className="orbitOverlay" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true">
        {vectorVisible ? (
          <g className={selected.has("gravity-vector") ? "orbitVector isSelected" : "orbitVector"}>
            <line x1={screenX(earth.xAu)} y1={screenY(earth.yAu)} x2="500" y2="310" />
            <circle cx={screenX(earth.xAu)} cy={screenY(earth.yAu)} r="7" />
          </g>
        ) : null}
        {labelsVisible ? (
          <g className="orbitLabels">
            {isVisible("sun", session) ? <OrbitLabel x={528} y={307} label="Sun" active={selected.has("sun")} /> : null}
            {isVisible("earth", session) ? (
              <OrbitLabel
                x={screenX(earth.xAu) + 12}
                y={Math.max(screenY(earth.yAu) + 34, 96)}
                label="Earth"
                active={selected.has("earth")}
              />
            ) : null}
            {pathVisible ? <OrbitLabel x={640} y={96} label="Two-body path" active={selected.has("orbit-trajectory")} /> : null}
            {benchmarkVisible ? <OrbitLabel x={650} y={538} label="JPL checkpoints" active={selected.has("jpl-benchmark")} /> : null}
            {vectorVisible ? <OrbitLabel x={250} y={230} label="Acceleration toward Sun" active={selected.has("gravity-vector")} /> : null}
          </g>
        ) : null}
      </svg>

      <div className="orbitReadout">
        <p>{activeStage?.label ?? "Orbit benchmark"}</p>
        <span>
          x {earth.xAu.toFixed(4)} AU, y {earth.yAu.toFixed(4)} AU, model-to-JPL tolerance {orbitBenchmarkMetadata.maximumPositionErrorAu} AU.
        </span>
      </div>
    </section>
  );
}

function GridPlane() {
  return (
    <group>
      {Array.from({ length: 9 }, (_, index) => (index - 4) * 0.8).map((value) => (
        <line key={`x-${value}`}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[new Float32Array([-3.6, value, -0.1, 3.6, value, -0.1]), 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#1d3037" transparent opacity={0.45} />
        </line>
      ))}
      {Array.from({ length: 9 }, (_, index) => (index - 4) * 0.8).map((value) => (
        <line key={`y-${value}`}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[new Float32Array([value, -3.6, -0.1, value, 3.6, -0.1]), 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#1d3037" transparent opacity={0.45} />
        </line>
      ))}
    </group>
  );
}

function OrbitPath({ selected }: { selected: boolean }) {
  const lineObject = useMemo(() => {
    const points: number[] = [];
    for (let index = 0; index <= 240; index += 1) {
      const angle = (index / 240) * Math.PI * 2;
      points.push(Math.cos(angle) * orbitScale, Math.sin(angle) * orbitScale, 0);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    const material = new THREE.LineBasicMaterial({
      color: selected ? "#f8fbff" : "#7fb7c7",
      transparent: true,
      opacity: 0.9
    });

    return new THREE.Line(geometry, material);
  }, [selected]);

  return <primitive object={lineObject} />;
}

function BenchmarkMarkers({ selected }: { selected: boolean }) {
  return (
    <group>
      {orbitBenchmarkPoints.map((point) => (
        <mesh key={point.day} position={[point.jpl.xAu * orbitScale, point.jpl.yAu * orbitScale, 0.08]}>
          <sphereGeometry args={[selected ? 0.055 : 0.04, 12, 12]} />
          <meshBasicMaterial color={selected ? "#f8fbff" : "#94a6ad"} />
        </mesh>
      ))}
    </group>
  );
}

function GravityVector({
  earthPosition,
  selected
}: {
  earthPosition: [number, number, number];
  selected: boolean;
}) {
  const lineObject = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute([earthPosition[0], earthPosition[1], 0.22, 0, 0, 0.22], 3));
    const material = new THREE.LineBasicMaterial({
      color: selected ? "#f8fbff" : "#dbe8ec",
      transparent: true,
      opacity: 0.86
    });

    return new THREE.Line(geometry, material);
  }, [earthPosition, selected]);

  return <primitive object={lineObject} />;
}

function SelectableSphere({
  entityId,
  position,
  radius,
  color,
  setSession
}: {
  entityId: string;
  position: [number, number, number];
  radius: number;
  color: string;
  setSession: OrbitR3FViewProps["setSession"];
}) {
  return (
    <mesh
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        setSession((current) =>
          dispatchScientificSessionEvent(current, {
            type: "ENTITY_SELECTED",
            entityIds: [entityId]
          })
        );
      }}
    >
      <sphereGeometry args={[radius, 32, 24]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} roughness={0.48} />
    </mesh>
  );
}

function OrbitLabel({
  x,
  y,
  label,
  active
}: {
  x: number;
  y: number;
  label: string;
  active: boolean;
}) {
  const width = Math.max(52, label.length * 9.5);

  return (
    <g className={active ? "isActive" : undefined}>
      <rect x={x - 8} y={y - 24} width={width} height={30} rx={3} />
      <text x={x} y={y}>{label}</text>
    </g>
  );
}

function isVisible(entityId: string, session: SpatialSessionState) {
  if (session.hiddenEntities.includes(entityId)) {
    return false;
  }

  if (!session.isolatedEntity) {
    return true;
  }

  const group = session.activeModel?.renderPlan.isolationGroups[session.isolatedEntity] ?? [session.isolatedEntity];
  return group.includes(entityId);
}

function screenX(xAu: number) {
  return 500 + xAu * 390;
}

function screenY(yAu: number) {
  return 310 - yAu * 250;
}

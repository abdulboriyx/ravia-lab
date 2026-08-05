"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  SpatialSessionState,
  applyFollowUpCommand,
  createInitialSession,
  dispatchScientificSessionEvent,
  setTimelinePosition,
  startSessionFromPrompt
} from "./model";
import type { ScientificClaim, ScientificSource } from "./model";
import { processPacks } from "./process-registry";

type SceneCommand =
  | "isolate-polymerase"
  | "hide-coding-strand"
  | "show-growing-rna"
  | "show-directionality"
  | "compare-initiation-elongation";

type SpatialPrimitive = {
  id: string;
  entityId?: string;
  kind:
    | "strand-path"
    | "molecular-complex-volume"
    | "anchored-label"
    | "directional-flow"
    | "animated-transcript"
    | "translucent-interaction-region"
    | "timeline-driven-state-transition";
};

type SceneOptions = {
  generated: boolean;
  timeline: number;
  showDirectionality: boolean;
  hideCodingStrand: boolean;
  isolatePolymerase: boolean;
  showGrowingRna: boolean;
  compareMode: boolean;
  selectedEntity: string | null;
};

type SpatialSceneHandle = {
  setOptions: (options: SceneOptions) => void;
  destroy: () => void;
};

const defaultPrompt = "Show transcription";

const spatialPrimitives: SpatialPrimitive[] = [
  { id: "template-strand", entityId: "template-strand", kind: "strand-path" },
  { id: "coding-strand", entityId: "coding-strand", kind: "strand-path" },
  { id: "rna-polymerase-ii", entityId: "rna-polymerase-ii", kind: "molecular-complex-volume" },
  { id: "transcription-bubble", entityId: "transcription-bubble", kind: "translucent-interaction-region" },
  { id: "growing-rna-transcript", entityId: "growing-rna-transcript", kind: "animated-transcript" },
  { id: "directional-flow", kind: "directional-flow" },
  { id: "hover-labels", kind: "anchored-label" },
  { id: "stage-driver", kind: "timeline-driven-state-transition" }
];

export function SpatialRaviaPrototype() {
  const [session, setSession] = useState<SpatialSessionState>(() => createInitialSession());
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [drawer, setDrawer] = useState<"assumptions" | "sources" | null>(null);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);
  const [localCommands, setLocalCommands] = useState<Record<SceneCommand, boolean>>({
    "isolate-polymerase": false,
    "hide-coding-strand": false,
    "show-growing-rna": true,
    "show-directionality": false,
    "compare-initiation-elongation": false
  });
  const previousTick = useRef<number | null>(null);

  const generated = Boolean(session.activeModel);
  const model = session.activeModel;

  useEffect(() => {
    document.documentElement.dataset.spatialRavia = "active";
    return () => {
      delete document.documentElement.dataset.spatialRavia;
    };
  }, []);

  useEffect(() => {
    let frame = 0;

    const tick = (now: number) => {
      if (previousTick.current === null) {
        previousTick.current = now;
      }

      const delta = now - previousTick.current;
      previousTick.current = now;

      setSession((current) => {
        if (!current.activeModel || !current.playback.playing) {
          return current;
        }

        return {
          ...current,
          playback: {
            ...current.playback,
            timelinePosition:
              (current.playback.timelinePosition +
                (delta / current.activeModel.renderPlan.progressDurationMs) *
                  current.playback.speed) %
              1
          }
        };
      });

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = prompt.trim() || defaultPrompt;
    setPrompt(trimmed);
    setSession((current) => {
      const next = startSessionFromPrompt(current, trimmed, processPacks);
      if (!next.activeModel) {
        return next;
      }

      return dispatchScientificSessionEvent(next, {
        type: "PLAYBACK_CHANGED",
        playback: { playing: true, reset: true }
      });
    });
  }

  function toggleCommand(command: SceneCommand) {
    setLocalCommands((current) => {
      const next = { ...current, [command]: !current[command] };
      return next;
    });

    if (command === "hide-coding-strand") {
      setSession((current) => applyFollowUpCommand(current, "hide coding strand"));
    }

    if (command === "show-growing-rna") {
      setSession((current) => applyFollowUpCommand(current, "show growing rna"));
    }
  }

  const selectedDescription = useMemo(() => {
    const activeId = selectedEntity ?? hoveredEntity;
    return model?.entities.find((entity) => entity.id === activeId) ?? null;
  }, [hoveredEntity, model?.entities, selectedEntity]);

  return (
    <main className={generated ? "spatialWorkspace spatialGenerated" : "spatialWorkspace"}>
      <TranscriptionScene
        generated={generated}
        session={session}
        commands={localCommands}
        selectedEntity={selectedEntity}
        onEntityHover={setHoveredEntity}
        onEntitySelect={setSelectedEntity}
      />

      {!generated ? (
        <section className="spatialPromptStage" aria-label="Spatial Ravia prompt">
          <form className="spatialPrompt" onSubmit={generate}>
            <input
              aria-label="Science prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              autoFocus
            />
            <button type="submit">Generate</button>
          </form>
          {session.activeIntervention === "unsupported prompt" ? (
            <p className="spatialNotice">Unsupported process in this local pack.</p>
          ) : null}
        </section>
      ) : (
        <>
          <div className="sceneTopOverlay" aria-label="Scene status">
            <form className="scenePromptOverlay" onSubmit={generate}>
              <input
                aria-label="Science prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
              />
              <button type="submit">Run</button>
            </form>
            <span>{currentStageLabel(session)}</span>
          </div>

          <div className={controlsOpen ? "sceneControls isOpen" : "sceneControls"}>
            <button
              type="button"
              className="sceneControlToggle"
              onClick={() => setControlsOpen((open) => !open)}
              aria-expanded={controlsOpen}
            >
              Controls
            </button>
            <div className="sceneControlTray">
              <button
                type="button"
                onClick={() =>
                  setSession((current) =>
                    dispatchScientificSessionEvent(current, {
                      type: "PLAYBACK_CHANGED",
                      playback: { playing: !current.playback.playing }
                    })
                  )
                }
              >
                {session.playback.playing ? "Pause" : "Play"}
              </button>
              <button type="button" onClick={() => toggleCommand("isolate-polymerase")}>
                Isolate Pol II
              </button>
              <button type="button" onClick={() => toggleCommand("hide-coding-strand")}>
                Hide coding strand
              </button>
              <button type="button" onClick={() => toggleCommand("show-growing-rna")}>
                Growing RNA
              </button>
              <button type="button" onClick={() => toggleCommand("show-directionality")}>
                5&apos; / 3&apos;
              </button>
              <button type="button" onClick={() => toggleCommand("compare-initiation-elongation")}>
                Initiation / elongation
              </button>
              <button type="button" onClick={() => setDrawer("assumptions")}>
                Assumptions
              </button>
              <button type="button" onClick={() => setDrawer("sources")}>
                Sources
              </button>
            </div>
          </div>

          <div className="timelineOverlay" aria-label="Timeline">
            <span>{Math.round(session.playback.timelinePosition * 100)}%</span>
            <input
              aria-label="Timeline scrub"
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={session.playback.timelinePosition}
              onChange={(event) =>
                setSession((current) => setTimelinePosition(current, Number(event.target.value)))
              }
            />
          </div>

          {selectedDescription ? (
            <div className="hoverReadout">
              <strong>{selectedDescription.label}</strong>
              <span>{selectedDescription.description}</span>
            </div>
          ) : null}

          {drawer ? (
            <SpatialDrawer
              title={drawer === "assumptions" ? "Assumptions" : "Sources"}
              onClose={() => setDrawer(null)}
            >
              {drawer === "assumptions" ? (
                <ClaimList claims={[...(model?.assumptions ?? []), ...(model?.limitations ?? [])]} />
              ) : (
                <SourceList sources={model?.sources ?? []} />
              )}
            </SpatialDrawer>
          ) : null}
        </>
      )}
    </main>
  );
}

function TranscriptionScene({
  generated,
  session,
  commands,
  selectedEntity,
  onEntityHover,
  onEntitySelect
}: {
  generated: boolean;
  session: SpatialSessionState;
  commands: Record<SceneCommand, boolean>;
  selectedEntity: string | null;
  onEntityHover: (entity: string | null) => void;
  onEntitySelect: (entity: string | null) => void;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<SpatialSceneHandle | null>(null);

  useEffect(() => {
    if (!mountRef.current) {
      return;
    }

    const handle = createTranscriptionWorld(mountRef.current, onEntityHover, onEntitySelect);
    sceneRef.current = handle;

    return () => {
      handle.destroy();
      sceneRef.current = null;
    };
  }, [onEntityHover, onEntitySelect]);

  useEffect(() => {
    sceneRef.current?.setOptions({
      generated,
      timeline: session.playback.timelinePosition,
      showDirectionality: commands["show-directionality"],
      hideCodingStrand:
        commands["hide-coding-strand"] || session.hiddenEntities.includes("coding-strand"),
      isolatePolymerase: commands["isolate-polymerase"],
      showGrowingRna: commands["show-growing-rna"],
      compareMode: commands["compare-initiation-elongation"],
      selectedEntity
    });
  }, [commands, generated, selectedEntity, session.hiddenEntities, session.playback]);

  return (
    <div
      className="spatialCanvas"
      ref={mountRef}
      aria-label="Three-dimensional transcription scene"
      data-primitives={spatialPrimitives.map((primitive) => primitive.kind).join(" ")}
    />
  );
}

function createTranscriptionWorld(
  mount: HTMLDivElement,
  onEntityHover: (entity: string | null) => void,
  onEntitySelect: (entity: string | null) => void
): SpatialSceneHandle {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.setClearColor(0x020305, 1);
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070a, 0.032);

  const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 160);
  camera.position.set(0, 6.6, 18);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.enablePan = true;
  controls.minDistance = 6;
  controls.maxDistance = 34;
  controls.target.set(0, 0.4, 0);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(-10, -10);
  const interactive: THREE.Object3D[] = [];

  const world = new THREE.Group();
  world.name = "timeline-driven-state-transition";
  scene.add(world);

  const hemi = new THREE.HemisphereLight(0x7f9bb0, 0x050505, 0.45);
  scene.add(hemi);

  const key = new THREE.SpotLight(0xd9eef8, 3.8, 46, Math.PI / 4.8, 0.55, 1.2);
  key.position.set(-7, 10, 9);
  key.castShadow = true;
  scene.add(key);

  const rim = new THREE.PointLight(0x59e0ff, 1.6, 28);
  rim.position.set(9, 3.2, -7);
  scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(38, 24, 28, 16),
    new THREE.MeshStandardMaterial({
      color: 0x050607,
      roughness: 0.78,
      metalness: 0.12,
      transparent: true,
      opacity: 0.8
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -3.1;
  floor.receiveShadow = true;
  world.add(floor);

  const grid = new THREE.GridHelper(38, 38, 0x1e3339, 0x0b1518);
  grid.position.y = -3.08;
  world.add(grid);

  const particles = createParticles();
  world.add(particles);

  const promoter = createPromoterRegion();
  const factors = createFactorCluster();
  const polymerase = createPolymerase();
  const bubble = createBubble();
  const template = createStrand("template-strand", 0x4fb5ff, -0.34, 0);
  const coding = createStrand("coding-strand", 0xf0a85e, 0.34, Math.PI);
  const rna = createRnaTranscript();
  const arrows = createDirectionArrows();
  const labels = createLabels();
  const comparisonGhost = createComparisonGhost();

  [promoter, factors, polymerase, bubble, template, coding, rna, arrows, labels, comparisonGhost].forEach(
    (object) => world.add(object)
  );

  [promoter, factors, polymerase, bubble, template, coding, rna, arrows, labels, comparisonGhost].forEach(
    (object) => {
      object.visible = false;
    }
  );

  [promoter, factors, polymerase, bubble, template, coding, rna].forEach((object) => {
    object.traverse((child) => {
      if (child.userData.entityId) {
        interactive.push(child);
      }
    });
  });

  const options: SceneOptions = {
    generated: false,
    timeline: 0,
    showDirectionality: false,
    hideCodingStrand: false,
    isolatePolymerase: false,
    showGrowingRna: true,
    compareMode: false,
    selectedEntity: null
  };

  function updateScene(elapsed: number) {
    const assemble = options.generated ? smoothstep(0, 0.22, options.timeline) : 0;
    const bubbleOpen = smoothstep(0.16, 0.38, options.timeline);
    const escape = smoothstep(0.32, 0.58, options.timeline);
    const elongation = smoothstep(0.5, 0.96, options.timeline);
    const polX = THREE.MathUtils.lerp(-5.1, 5.9, Math.max(escape, elongation));
    const transcriptLength = options.showGrowingRna ? smoothstep(0.35, 0.92, options.timeline) : 0;

    world.rotation.y = Math.sin(elapsed * 0.11) * 0.055;
    particles.rotation.y = elapsed * 0.014;

    promoter.position.set(-6.05, -0.08, 0);
    promoter.scale.setScalar(THREE.MathUtils.lerp(0.001, 1, smoothstep(0.02, 0.18, options.timeline)));
    promoter.visible = options.generated;

    factors.position.set(-5.35, 1.2 + Math.sin(elapsed * 1.3) * 0.025, -0.05);
    factors.scale.setScalar(THREE.MathUtils.lerp(0.001, 1, smoothstep(0.08, 0.3, options.timeline)));
    factors.visible = options.generated;

    template.visible = options.generated;
    coding.visible = options.generated && !options.hideCodingStrand;
    template.scale.setScalar(THREE.MathUtils.lerp(0.001, 1, assemble));
    coding.scale.setScalar(THREE.MathUtils.lerp(0.001, 1, assemble));
    template.position.y = -0.28 - bubbleOpen * 0.24;
    coding.position.y = 0.28 + bubbleOpen * 0.24;
    coding.rotation.z = Math.sin(elapsed * 0.55) * 0.012;
    template.rotation.z = -Math.sin(elapsed * 0.48) * 0.012;

    polymerase.visible = options.generated;
    polymerase.position.set(polX, 0.3, 0.05);
    polymerase.rotation.y = Math.sin(elapsed * 0.34) * 0.06;
    polymerase.scale.setScalar(THREE.MathUtils.lerp(0.001, 1, smoothstep(0.14, 0.36, options.timeline)));

    bubble.visible = options.generated && bubbleOpen > 0.01;
    bubble.position.set(polX, 0.08, 0);
    bubble.scale.set(1.2 + bubbleOpen * 1.45, 0.42 + bubbleOpen * 0.75, 0.76 + bubbleOpen * 0.75);
    setMaterialOpacity(bubble, 0.06 + bubbleOpen * 0.22);

    rna.visible = options.generated && transcriptLength > 0.01;
    rna.position.set(polX - 0.15, -0.22, 0.25);
    updateRnaGeometry(rna, transcriptLength, elapsed);

    arrows.visible = options.generated && options.showDirectionality;
    arrows.position.x = polX;
    labels.visible = options.generated && Boolean(options.selectedEntity || options.showDirectionality);
    updateLabels(labels, polX, transcriptLength, options.selectedEntity);

    comparisonGhost.visible = options.generated && options.compareMode;
    comparisonGhost.position.x = -4.8;
    comparisonGhost.rotation.y = Math.sin(elapsed * 0.3) * 0.08;

    applyFocus([promoter, factors, polymerase, bubble, template, coding, rna, arrows], options);
  }

  function animate(now = 0) {
    const elapsed = now / 1000;
    updateScene(elapsed);
    controls.update();
    renderer.render(scene, camera);
    frame = window.requestAnimationFrame(animate);
  }

  function resize() {
    const width = mount.clientWidth;
    const height = mount.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function updatePointer(event: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(interactive, true)[0]?.object;
    onEntityHover((hit?.userData.entityId as string | undefined) ?? null);
  }

  function selectPointer(event: PointerEvent) {
    updatePointer(event);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(interactive, true)[0]?.object;
    onEntitySelect((hit?.userData.entityId as string | undefined) ?? null);
  }

  let frame = window.requestAnimationFrame(animate);
  window.addEventListener("resize", resize);
  renderer.domElement.addEventListener("pointermove", updatePointer);
  renderer.domElement.addEventListener("pointerdown", selectPointer);

  return {
    setOptions(nextOptions) {
      Object.assign(options, nextOptions);
    },
    destroy() {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointermove", updatePointer);
      renderer.domElement.removeEventListener("pointerdown", selectPointer);
      controls.dispose();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose?.();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) {
          material.forEach((item) => item.dispose());
        } else {
          material?.dispose?.();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    }
  };
}

function createStrand(entityId: string, color: number, yOffset: number, phase: number) {
  const group = new THREE.Group();
  group.name = entityId;
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.48,
    metalness: 0.08,
    emissive: color,
    emissiveIntensity: 0.14
  });
  const beadMaterial = new THREE.MeshStandardMaterial({
    color: 0xd7e8ef,
    roughness: 0.52,
    metalness: 0.04,
    emissive: color,
    emissiveIntensity: 0.08
  });

  for (let i = 0; i < 74; i += 1) {
    const x = -7.4 + i * 0.2;
    const z = Math.sin(i * 0.62 + phase) * 0.28;
    const y = yOffset + Math.cos(i * 0.62 + phase) * 0.18;
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), material);
    bead.position.set(x, y, z);
    bead.castShadow = true;
    bead.userData.entityId = entityId;
    group.add(bead);

    if (i % 3 === 0) {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.52, 8), beadMaterial);
      base.position.set(x, y * 0.2, z * 0.4);
      base.rotation.z = Math.PI / 2;
      base.userData.entityId = entityId;
      group.add(base);
    }
  }

  return group;
}

function createPolymerase() {
  const group = new THREE.Group();
  group.name = "rna-polymerase-ii";
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 40, 32),
    new THREE.MeshPhysicalMaterial({
      color: 0x9eb7c5,
      roughness: 0.36,
      metalness: 0.08,
      transmission: 0.08,
      transparent: true,
      opacity: 0.9,
      emissive: 0x183844,
      emissiveIntensity: 0.42
    })
  );
  core.scale.set(1.24, 0.82, 1);
  core.castShadow = true;
  core.userData.entityId = "rna-polymerase-ii";
  group.add(core);

  const cleft = new THREE.Mesh(
    new THREE.TorusGeometry(0.74, 0.08, 14, 44, Math.PI * 1.42),
    new THREE.MeshStandardMaterial({
      color: 0x54e2ff,
      roughness: 0.25,
      emissive: 0x1bbad3,
      emissiveIntensity: 0.55
    })
  );
  cleft.rotation.set(Math.PI / 2, 0.2, 0.1);
  cleft.position.set(0.04, -0.08, 0.08);
  cleft.userData.entityId = "rna-polymerase-ii";
  group.add(cleft);

  for (let i = 0; i < 7; i += 1) {
    const lobe = new THREE.Mesh(
      new THREE.SphereGeometry(0.22 + (i % 2) * 0.08, 18, 14),
      new THREE.MeshStandardMaterial({
        color: i % 2 ? 0x748895 : 0xb6ccd5,
        roughness: 0.44,
        emissive: 0x10252d,
        emissiveIntensity: 0.22
      })
    );
    const angle = (i / 7) * Math.PI * 2;
    lobe.position.set(Math.cos(angle) * 0.92, Math.sin(angle) * 0.42, Math.sin(angle * 1.7) * 0.66);
    lobe.castShadow = true;
    lobe.userData.entityId = "rna-polymerase-ii";
    group.add(lobe);
  }

  return group;
}

function createBubble() {
  const bubble = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 24),
    new THREE.MeshPhysicalMaterial({
      color: 0x75f1ff,
      roughness: 0.18,
      transmission: 0.28,
      transparent: true,
      opacity: 0.18,
      emissive: 0x0e7e9a,
      emissiveIntensity: 0.38,
      depthWrite: false
    })
  );
  bubble.name = "transcription-bubble";
  bubble.userData.entityId = "transcription-bubble";
  return bubble;
}

function createPromoterRegion() {
  const group = new THREE.Group();
  group.name = "promoter";
  const material = new THREE.MeshStandardMaterial({
    color: 0xe6cf7a,
    roughness: 0.42,
    emissive: 0x5b4e13,
    emissiveIntensity: 0.5
  });

  for (let i = 0; i < 6; i += 1) {
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.8, 0.18), material);
    marker.position.set(i * 0.18, 0, Math.sin(i) * 0.08);
    marker.userData.entityId = "promoter";
    group.add(marker);
  }

  return group;
}

function createFactorCluster() {
  const group = new THREE.Group();
  group.name = "transcription-factors";
  const material = new THREE.MeshStandardMaterial({
    color: 0xb18cff,
    roughness: 0.5,
    emissive: 0x2b1657,
    emissiveIntensity: 0.34
  });

  for (let i = 0; i < 9; i += 1) {
    const unit = new THREE.Mesh(new THREE.SphereGeometry(0.16 + (i % 3) * 0.04, 16, 12), material);
    unit.position.set((i % 3) * 0.36 - 0.36, Math.floor(i / 3) * 0.22 - 0.22, Math.sin(i) * 0.24);
    unit.userData.entityId = "transcription-factors";
    group.add(unit);
  }

  return group;
}

function createRnaTranscript() {
  const group = new THREE.Group();
  group.name = "growing-rna-transcript";
  group.userData.entityId = "growing-rna-transcript";
  return group;
}

function updateRnaGeometry(group: THREE.Group, length: number, elapsed: number) {
  group.clear();
  const material = new THREE.MeshStandardMaterial({
    color: 0x6df0b8,
    roughness: 0.34,
    emissive: 0x16845d,
    emissiveIntensity: 0.45
  });
  const count = Math.max(2, Math.floor(32 * length));
  for (let i = 0; i < count; i += 1) {
    const t = i / Math.max(1, count - 1);
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), material);
    bead.position.set(-t * (0.6 + length * 5.8), -0.18 - t * 1.15, 0.18 + Math.sin(t * 10 + elapsed * 2.2) * 0.24);
    bead.userData.entityId = "growing-rna-transcript";
    group.add(bead);
  }
}

function createDirectionArrows() {
  const group = new THREE.Group();
  group.name = "directional-flow";
  const material = new THREE.MeshStandardMaterial({
    color: 0xdff8ff,
    roughness: 0.3,
    emissive: 0x55d5ff,
    emissiveIntensity: 0.4
  });

  const arrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1.6, 1.45, 0.5), 3.2, 0x8feaff, 0.24, 0.1);
  group.add(arrow);
  ["5'", "3'"].forEach((text, index) => {
    const sprite = makeTextSprite(text, material.color.getHex());
    sprite.position.set(index === 0 ? -3.1 : 2.2, 1.78, 0.58);
    group.add(sprite);
  });
  return group;
}

function createLabels() {
  const group = new THREE.Group();
  group.name = "anchored-label";
  [
    ["Promoter", -6.2, -0.98, 0.2],
    ["RNA polymerase II", -5.1, 1.75, 0.2],
    ["Template strand", -1.9, -1.05, 0.2],
    ["Coding strand", -1.7, 1.05, 0.2],
    ["Nascent RNA", -1.1, -1.9, 0.4]
  ].forEach(([text, x, y, z]) => {
    const sprite = makeTextSprite(String(text), 0xd9eef8);
    sprite.position.set(Number(x), Number(y), Number(z));
    group.add(sprite);
  });
  return group;
}

function updateLabels(group: THREE.Group, polX: number, transcriptLength: number, selected: string | null) {
  group.children.forEach((child) => {
    child.visible = !selected || child.name === selected;
  });
  const polLabel = group.children[1];
  if (polLabel) {
    polLabel.position.x = polX;
  }
  const rnaLabel = group.children[4];
  if (rnaLabel) {
    rnaLabel.position.x = polX - 0.5 - transcriptLength * 1.7;
  }
}

function makeTextSprite(text: string, color: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = "600 42px Arial";
    context.fillStyle = "rgba(4, 8, 10, 0.64)";
    context.fillRect(0, 18, canvas.width, 78);
    context.strokeStyle = "rgba(170, 220, 230, 0.35)";
    context.strokeRect(0.5, 18.5, canvas.width - 1, 77);
    context.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
    context.fillText(text, 26, 70);
  }
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.86, depthWrite: false })
  );
  sprite.name = entityNameFromLabel(text);
  sprite.scale.set(1.7, 0.42, 1);
  return sprite;
}

function createComparisonGhost() {
  const group = createPolymerase();
  group.name = "initiation-elongation-comparison";
  group.traverse((child) => {
    const mesh = child as THREE.Mesh;
    const material = mesh.material as THREE.MeshStandardMaterial | undefined;
    if (material) {
      mesh.material = material.clone();
      const cloned = mesh.material as THREE.MeshStandardMaterial;
      cloned.color.set(0x4b5d66);
      cloned.transparent = true;
      cloned.opacity = 0.24;
      cloned.depthWrite = false;
    }
  });
  group.position.set(-4.8, 0.25, -2.5);
  return group;
}

function createParticles() {
  const count = 420;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 34;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 24;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0x82a8b5,
    size: 0.025,
    transparent: true,
    opacity: 0.45,
    depthWrite: false
  });
  return new THREE.Points(geometry, material);
}

function applyFocus(objects: THREE.Object3D[], options: SceneOptions) {
  const focus = options.isolatePolymerase ? "rna-polymerase-ii" : options.selectedEntity;
  objects.forEach((object) => {
    const isFocused = !focus || object.name === focus || object.name === "transcription-bubble" || object.name === "growing-rna-transcript";
    setMaterialOpacity(object, isFocused ? 1 : 0.18);
  });
}

function setMaterialOpacity(object: THREE.Object3D, opacity: number) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (!material) {
      return;
    }
    const materials = Array.isArray(material) ? material : [material];
    materials.forEach((item) => {
      item.transparent = opacity < 1;
      item.opacity = opacity;
    });
  });
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

function entityNameFromLabel(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function currentStageLabel(session: SpatialSessionState) {
  const states = session.activeModel?.states ?? [];
  if (states.length === 0) {
    return "Spatial model";
  }

  const index = Math.min(
    states.length - 1,
    Math.floor(session.playback.timelinePosition * states.length)
  );
  return states[index]?.label ?? "Spatial model";
}

function SpatialDrawer({
  title,
  children,
  onClose
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <aside className="spatialDrawer" aria-label={title}>
      <header>
        <h2>{title}</h2>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </header>
      {children}
    </aside>
  );
}

function ClaimList({ claims }: { claims: ScientificClaim[] }) {
  return (
    <div className="drawerList">
      {claims.map((claim) => (
        <p key={claim.id}>{claim.claim}</p>
      ))}
    </div>
  );
}

function SourceList({ sources }: { sources: ScientificSource[] }) {
  return (
    <div className="drawerList">
      {sources.map((source) => (
        <p key={source.id}>
          <strong>{source.authors}</strong>
          <span>{source.title}</span>
        </p>
      ))}
    </div>
  );
}

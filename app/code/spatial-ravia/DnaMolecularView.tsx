"use client";

import dynamic from "next/dynamic";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import metadata from "../../structures/1ZF5.metadata.json";
import { parseSpatialScenePrompt } from "./dna-structure-routing";
import type { PromptResolution, SpatialSceneCommand } from "./dna-structure-routing";

export type StructureViewMode = "cartoon" | "ball-stick" | "atomic";
export type StructureColorMode = "strand" | "base" | "element" | "backbone";
export type StructureTheme = "dark" | "light";
export type StructureSource = "experimental" | "idealized";
export type StructureCameraPreset = "reset" | "groove" | "base-pair";
export type DnaTransformationState = {
  strandSeparation: number;
  bubbleBasePairs: number;
  bend: number;
  exposeBases: number;
};
export type StructureIsolationMode =
  | "all"
  | "base-pair"
  | "strand-a"
  | "strand-b"
  | "bases"
  | "backbone"
  | "phosphates"
  | "sugars"
  | "hydrogen-bonds";

const MolstarStructureViewer = dynamic(() => import("./MolstarStructureViewer"), {
  ssr: false,
  loading: () => <div className="molstarLoadState">Initializing Mol* module</div>
});

const viewModes: Array<{ id: StructureViewMode; label: string }> = [
  { id: "cartoon", label: "Cartoon" },
  { id: "ball-stick", label: "Ball-and-stick" },
  { id: "atomic", label: "Atomic" }
];

const colorModes: Array<{ id: StructureColorMode; label: string }> = [
  { id: "base", label: "Base" },
  { id: "strand", label: "Strand" },
  { id: "element", label: "Element" },
  { id: "backbone", label: "Backbone" }
];

const isolationModes: Array<{ id: StructureIsolationMode; label: string }> = [
  { id: "all", label: "All" },
  { id: "strand-a", label: "Strand A" },
  { id: "strand-b", label: "Strand B" },
  { id: "bases", label: "Bases" },
  { id: "backbone", label: "Backbone" },
  { id: "phosphates", label: "Phosphates" },
  { id: "sugars", label: "Sugars" },
  { id: "hydrogen-bonds", label: "H bonds" }
];

const sources: Array<{ id: StructureSource; label: string }> = [
  { id: "experimental", label: "Experimental" },
  { id: "idealized", label: "Idealized" }
];

const neutralTransformation: DnaTransformationState = {
  strandSeparation: 0,
  bubbleBasePairs: 0,
  bend: 0,
  exposeBases: 0
};

const sourceDetails: Record<
  StructureSource,
  {
    title: string;
    subtitle: string;
    inspectorTitle: string;
    kind: string;
    method: string;
    resolution: string;
    representation: string;
    limitations: string[];
  }
> = {
  experimental: {
    title: "PDB 1ZF5",
    subtitle: "Experimental B-DNA crystal structure, not a dynamic simulation",
    inspectorTitle: `PDB ${metadata.pdbId}`,
    kind: metadata.structureType,
    method: metadata.experimentalMethod,
    resolution: `${metadata.resolutionAngstrom} Å`,
    representation: metadata.representation,
    limitations: metadata.limitations
  },
  idealized: {
    title: "Ideal B-DNA",
    subtitle: "Parametric canonical B-DNA duplex, not experimental coordinates",
    inspectorTitle: "Idealized structural model",
    kind: "Canonical 10 base-pair B-DNA duplex",
    method: "Generated from standard B-DNA helix parameters",
    resolution: "Not applicable",
    representation: "Mol* structure generated from a local idealized PDB model",
    limitations: [
      "This is an idealized structural model, not a deposited experimental structure.",
      "Coordinates use canonical B-DNA rise and twist to clarify strand geometry and source comparison.",
      "Bubble opening is a controlled geometric strand-separation transform of the idealized model, not a physical simulation.",
      "It is static and does not represent thermal motion, solvent, ions, or sequence-specific deformation."
    ]
  }
};
type DnaMolecularViewProps = {
  embedded?: boolean;
};

export function DnaMolecularView({
  embedded = false,
}: DnaMolecularViewProps) {
  const [sceneStarted, setSceneStarted] = useState(embedded);
  const [prompt, setPrompt] = useState("");
  const [lastCommand, setLastCommand] = useState<SpatialSceneCommand | null>(null);
  const [unsupportedReason, setUnsupportedReason] = useState<string | null>(null);
  const [source, setSource] = useState<StructureSource>("experimental");
  const [viewMode, setViewMode] = useState<StructureViewMode>("cartoon");
  const [colorMode, setColorMode] = useState<StructureColorMode>("base");
  const [isolationMode, setIsolationMode] = useState<StructureIsolationMode>("all");
  const [focusedBasePair, setFocusedBasePair] = useState(1);
  const [cameraCommand, setCameraCommand] = useState<{ preset: StructureCameraPreset; nonce: number }>({
    preset: "reset",
    nonce: 0
  });
  const [bubbleProgress, setBubbleProgress] = useState(0);
  const [transformation, setTransformation] = useState<DnaTransformationState>(neutralTransformation);
  const [bubblePlaying, setBubblePlaying] = useState(false);
  const [theme, setTheme] = useState<StructureTheme>("light");
  const [inspectorOpen, setInspectorOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.spatialRavia = "active";
    return () => {
      delete document.documentElement.dataset.spatialRavia;
    };
  }, []);

  useEffect(() => {
    if (!bubblePlaying) {
      return;
    }

    const timer = window.setInterval(() => {
      setBubbleProgress((value) => {
        if (value >= 1) {
          setBubblePlaying(false);
          setTransformation((current) => ({ ...current, bubbleBasePairs: 6 }));
          return 1;
        }

        const next = Math.min(1, value + 0.04);
        setTransformation((current) => ({ ...current, bubbleBasePairs: Math.round(next * 6) }));
        return next;
      });
    }, 120);

    return () => {
      window.clearInterval(timer);
    };
  }, [bubblePlaying]);

  const sendCameraPreset = (preset: StructureCameraPreset) => {
    setCameraCommand((command) => ({ preset, nonce: command.nonce + 1 }));
  };

  const setIsolationAndFrame = (mode: StructureIsolationMode, preset: StructureCameraPreset = "reset") => {
    setIsolationMode(mode);
    sendCameraPreset(preset);
  };

  const stepBasePair = (direction: -1 | 1) => {
    setFocusedBasePair((position) => {
      const next = Math.min(10, Math.max(1, position + direction));
      setIsolationMode("base-pair");
      setViewMode("ball-stick");
      sendCameraPreset("base-pair");
      return next;
    });
  };

  const applySceneCommand = (command: SpatialSceneCommand) => {
    setLastCommand(command);
    setUnsupportedReason(null);
    setSceneStarted(true);
    setSource(command.source);
    setViewMode(command.viewMode);
    setColorMode(command.colorMode);
    setIsolationMode(command.isolationMode);
    setFocusedBasePair(command.focusedBasePair);
    setBubblePlaying(false);
    setBubbleProgress(command.bubbleProgress);
    setTransformation(command.transformation);
    sendCameraPreset(command.cameraPreset);
  };

  const updateTransformation = (patch: Partial<DnaTransformationState>) => {
    setSource("idealized");
    setTransformation((value) => {
      const next = { ...value, ...patch };
      setBubbleProgress(next.bubbleBasePairs > 0 ? Math.min(1, next.bubbleBasePairs / 6) : 0);
      return next;
    });
  };

  const handlePromptSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const resolution = parseSpatialScenePrompt(prompt);

    if (!resolution.supported) {
      setUnsupportedReason(resolution.reason);
      return;
    }

    applySceneCommand(resolution.command);
  };

  return (
    <main
      className="spatialWorkspace molstarWorkspace"
      data-scene-command={lastCommand?.kind ?? "empty"}
      data-spatial-theme={theme}
    >
      {sceneStarted ? (
        <section className="molstarStage" aria-label="B-DNA molecular structure">
          <MolstarStructureViewer
            bubbleProgress={bubbleProgress}
            cameraCommand={cameraCommand}
            colorMode={colorMode}
            focusedBasePair={focusedBasePair}
            isolationMode={isolationMode}
            source={source}
            theme={theme}
            transformation={transformation}
            viewMode={viewMode}
          />
        </section>
      ) : null}

     {!embedded ? (
  <form
    className={sceneStarted ? "structurePromptBar isDocked" : "structurePromptBar"}
    aria-label="Spatial Ravia prompt"
    onSubmit={handlePromptSubmit}
  >
    <input
      type="text"
      value={prompt}
      autoFocus
      placeholder="Show B-DNA"
      onChange={(event) => setPrompt(event.currentTarget.value)}
    />
    <button type="submit">
      {sceneStarted ? "Update" : "Show"}
    </button>
  </form>
) : null}

      {!embedded && unsupportedReason ? (
        <section className="unsupportedNotice structureUnsupportedNotice" aria-label="Unsupported prompt">
          <p>{unsupportedReason}</p>
          <span>Try “show DNA structure”, “show B-DNA”, or “visualize DNA double helix”.</span>
        </section>
      ) : null}

      {sceneStarted ? (
        <div className="structureIdentity">
          <strong>{sourceDetails[source].title}</strong>
          <span>{sourceDetails[source].subtitle}</span>
        </div>
      ) : null}

      {sceneStarted ? (
        <div className="structureControls" aria-label="Structure view controls">
        <details className="structureToolbarMenu">
          <summary>Controls</summary>
          <div className="structureToolbarPopover">
            <div className="structureControlGroup" aria-label="Structure source">
              {sources.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={source === item.id ? "isSelected" : ""}
                  onClick={() => setSource(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="structureControlGroup structureBubbleControl" aria-label="Strand opening transformation">
              <button
                type="button"
                className={bubblePlaying ? "isSelected" : ""}
                onClick={() => {
                  setSource("idealized");
                  setBubblePlaying((playing) => !playing);
                }}
              >
                {bubblePlaying ? "Pause bubble" : "Open bubble"}
              </button>
              <label>
                <span>Bubble {Math.round(bubbleProgress * 100)}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={Math.round(bubbleProgress * 100)}
                  onChange={(event) => {
                    setSource("idealized");
                    setBubblePlaying(false);
                    const progress = Number(event.currentTarget.value) / 100;
                    setBubbleProgress(progress);
                    setTransformation((value) => ({ ...value, bubbleBasePairs: Math.round(progress * 6) }));
                  }}
                />
              </label>
            </div>
            <div className="structureTransformSliders" aria-label="Controlled DNA transformations">
              <label>
                <span>Separate {Math.round(transformation.strandSeparation * 100)}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={Math.round(transformation.strandSeparation * 100)}
                  onChange={(event) => updateTransformation({ strandSeparation: Number(event.currentTarget.value) / 100 })}
                />
              </label>
              <label>
                <span>Bend {Math.round(transformation.bend * 100)}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={Math.round(transformation.bend * 100)}
                  onChange={(event) => updateTransformation({ bend: Number(event.currentTarget.value) / 100 })}
                />
              </label>
              <label>
                <span>Expose bases {Math.round(transformation.exposeBases * 100)}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={Math.round(transformation.exposeBases * 100)}
                  onChange={(event) => updateTransformation({ exposeBases: Number(event.currentTarget.value) / 100 })}
                />
              </label>
            </div>
            <div className="structureControlGroup" aria-label="Representation">
              {viewModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={viewMode === mode.id ? "isSelected" : ""}
                  onClick={() => setViewMode(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <div className="structureControlGroup" aria-label="Molecular coloring">
              {colorModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={colorMode === mode.id ? "isSelected" : ""}
                  onClick={() => setColorMode(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <div className="structureControlGroup structureIsolationGroup" aria-label="Molecular isolation">
              {isolationModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={isolationMode === mode.id ? "isSelected" : ""}
                  onClick={() => setIsolationAndFrame(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <div className="structureControlGroup structurePresetGroup" aria-label="Inspection presets">
              <button type="button" onClick={() => setIsolationAndFrame("strand-a")}>
                Isolate A
              </button>
              <button type="button" onClick={() => setIsolationAndFrame("strand-b")}>
                Isolate B
              </button>
              <button type="button" onClick={() => setIsolationAndFrame("backbone")}>
                Backbone only
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsolationAndFrame("base-pair", "base-pair");
                  setViewMode("ball-stick");
                }}
              >
                Partners
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsolationMode("all");
                  sendCameraPreset("groove");
                }}
              >
                Groove view
              </button>
              <button
                type="button"
                onClick={() => {
                  setSource("idealized");
                  setIsolationAndFrame("all");
                  setTransformation(neutralTransformation);
                  setBubbleProgress(0);
                }}
              >
                Reset camera
              </button>
            </div>
            <div className="structureControlGroup structureStepGroup" aria-label="Base-pair stepping">
              <button type="button" onClick={() => stepBasePair(-1)}>
                Prev bp
              </button>
              <button
                type="button"
                className={isolationMode === "base-pair" ? "isSelected" : ""}
                onClick={() => {
                  setIsolationAndFrame("base-pair", "base-pair");
                  setViewMode("ball-stick");
                }}
              >
                BP {focusedBasePair}
              </button>
              <button type="button" onClick={() => stepBasePair(1)}>
                Next bp
              </button>
            </div>
          </div>
        </details>
        <button
          type="button"
          className="structureThemeToggle"
          onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
        >
          {theme === "dark" ? "Light theme" : "Dark theme"}
        </button>
        <button type="button" onClick={() => setInspectorOpen((open) => !open)}>
          {inspectorOpen ? "Hide metadata" : "Metadata"}
        </button>
        </div>
      ) : null}

      {sceneStarted ? (
        <div className="structureScaleBadge" aria-label="Coordinate scale and source">
          <strong>{source === "experimental" ? "Experimental coordinates" : "Idealized geometry"}</strong>
          <span>Scale: Angstrom coordinate units</span>
          <i aria-hidden="true" />
          <span>Bar: 10 Å</span>
        </div>
      ) : null}

      {sceneStarted ? (
        <div className="structureEndpointBadge" aria-label="DNA strand endpoint labels">
          <strong>Endpoint labels</strong>
          <span>Chain A: 5′ A1 → 3′ A10</span>
          <span>Chain B: 3′ B1 → 5′ B10</span>
        </div>
      ) : null}

      {sceneStarted && inspectorOpen ? (
        <aside className="structureInspector" aria-label="Structure source metadata">
          <header>
            <h2>{sourceDetails[source].inspectorTitle}</h2>
            <button type="button" onClick={() => setInspectorOpen(false)}>
              Close
            </button>
          </header>
          <dl>
            <div>
              <dt>Title</dt>
              <dd>{source === "experimental" ? metadata.title : sourceDetails[source].kind}</dd>
            </div>
            <div>
              <dt>Structure</dt>
              <dd>{sourceDetails[source].kind}</dd>
            </div>
            <div>
              <dt>Method</dt>
              <dd>{sourceDetails[source].method}</dd>
            </div>
            <div>
              <dt>Resolution</dt>
              <dd>{sourceDetails[source].resolution}</dd>
            </div>
            <div>
              <dt>Representation</dt>
              <dd>{sourceDetails[source].representation}</dd>
            </div>
          </dl>
          <section>
            <h3>Limitations</h3>
            {sourceDetails[source].limitations.map((limitation) => (
              <p key={limitation}>{limitation}</p>
            ))}
          </section>
        </aside>
      ) : null}
    </main>
  );
}

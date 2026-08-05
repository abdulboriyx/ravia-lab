"use client";

import dynamic from "next/dynamic";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import metadata from "../../structures/1ZF5.metadata.json";

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

type SpatialSceneCommand = {
  kind: "SHOW_STRUCTURE";
  prompt: string;
  source: StructureSource;
  viewMode: StructureViewMode;
  colorMode: StructureColorMode;
  isolationMode: StructureIsolationMode;
  focusedBasePair: number;
  bubbleProgress: number;
  transformation: DnaTransformationState;
  cameraPreset: StructureCameraPreset;
};

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

export function SpatialRaviaPrototype() {
  const [sceneStarted, setSceneStarted] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [lastCommand, setLastCommand] = useState<SpatialSceneCommand | null>(null);
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
    const command = parseSpatialScenePrompt(prompt);

    applySceneCommand(command);
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
        <button type="submit">{sceneStarted ? "Update" : "Show"}</button>
      </form>

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
                  onClick={() => setIsolationMode(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <div className="structureControlGroup structurePresetGroup" aria-label="Inspection presets">
              <button type="button" onClick={() => setIsolationMode("strand-a")}>
                Isolate A
              </button>
              <button type="button" onClick={() => setIsolationMode("strand-b")}>
                Isolate B
              </button>
              <button type="button" onClick={() => setIsolationMode("backbone")}>
                Backbone only
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
                  setIsolationMode("all");
                  setTransformation(neutralTransformation);
                  setBubbleProgress(0);
                  sendCameraPreset("reset");
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
                  setIsolationMode("base-pair");
                  setViewMode("ball-stick");
                  sendCameraPreset("base-pair");
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

function parseSpatialScenePrompt(prompt: string): SpatialSceneCommand {
  const normalized = prompt.trim().toLowerCase();
  const words = new Set(normalized.split(/[^a-z0-9']+/).filter(Boolean));
  const requestedBasePairs = readBasePairCount(normalized);
  const transformation = resolveTransformation(normalized, words, requestedBasePairs);
  const source: StructureSource =
    words.has("ideal") ||
    words.has("idealized") ||
    requestedBasePairs > 0 ||
    hasActiveTransformation(transformation)
      ? "idealized"
      : "experimental";
  const viewMode: StructureViewMode = words.has("atomic")
    ? "atomic"
    : normalized.includes("ball") || normalized.includes("stick")
      ? "ball-stick"
      : "cartoon";
  const colorMode: StructureColorMode = words.has("element")
    ? "element"
    : words.has("strand")
      ? "strand"
      : words.has("backbone")
        ? "backbone"
        : "base";
  const isolationMode = resolvePromptIsolation(normalized, words, requestedBasePairs);
  const focusedBasePair = readBasePairPosition(normalized) ?? 1;
  const bubbleProgress = requestedBasePairs > 0 ? Math.min(1, requestedBasePairs / 6) : 0;
  const cameraPreset: StructureCameraPreset = words.has("groove")
    ? "groove"
    : isolationMode === "base-pair"
      ? "base-pair"
      : "reset";

  return {
    kind: "SHOW_STRUCTURE",
    prompt,
    source,
    viewMode: isolationMode === "base-pair" ? "ball-stick" : viewMode,
    colorMode,
    isolationMode,
    focusedBasePair,
    bubbleProgress,
    transformation,
    cameraPreset
  };
}

function resolveTransformation(
  normalized: string,
  words: Set<string>,
  requestedBasePairs: number
): DnaTransformationState {
  return {
    strandSeparation:
      normalized.includes("separate strand") || normalized.includes("separate the strand") || normalized.includes("split strand")
        ? 1
        : 0,
    bubbleBasePairs: requestedBasePairs,
    bend: words.has("bend") || words.has("bent") || normalized.includes("bend dna") ? 0.72 : 0,
    exposeBases:
      normalized.includes("expose base") || normalized.includes("show exposed base") || normalized.includes("flip base")
        ? 1
        : 0
  };
}

function hasActiveTransformation(transformation: DnaTransformationState) {
  return (
    transformation.strandSeparation > 0 ||
    transformation.bubbleBasePairs > 0 ||
    transformation.bend > 0 ||
    transformation.exposeBases > 0
  );
}

function resolvePromptIsolation(
  normalized: string,
  words: Set<string>,
  requestedBasePairs: number
): StructureIsolationMode {
  if (normalized.includes("hydrogen bond") || normalized.includes("h bond") || normalized.includes("h-bond")) {
    return "hydrogen-bonds";
  }

  if (normalized.includes("only backbone") || normalized.includes("backbone only") || words.has("backbone")) {
    return "backbone";
  }

  if (words.has("phosphate") || words.has("phosphates")) {
    return "phosphates";
  }

  if (words.has("sugar") || words.has("sugars")) {
    return "sugars";
  }

  if (words.has("bases") || normalized.includes("only base")) {
    return "bases";
  }

  if (normalized.includes("strand a") || normalized.includes("chain a")) {
    return "strand-a";
  }

  if (normalized.includes("strand b") || normalized.includes("chain b")) {
    return "strand-b";
  }

  if (requestedBasePairs > 0 && !normalized.includes("open")) {
    return "base-pair";
  }

  return "all";
}

function readBasePairCount(normalized: string) {
  if (!normalized.includes("open")) {
    return 0;
  }

  const numeric = normalized.match(/open\s+(\d+)\s+(?:base\s*)?pairs?/);
  if (numeric) {
    return Number(numeric[1]);
  }

  const wordNumber = normalized.match(/open\s+(one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:base\s*)?pairs?/);
  return wordNumber ? wordToNumber(wordNumber[1]) : 0;
}

function readBasePairPosition(normalized: string) {
  const numeric = normalized.match(/(?:base\s*pair|bp)\s+(\d+)/);
  if (numeric) {
    return Math.min(10, Math.max(1, Number(numeric[1])));
  }

  return undefined;
}

function wordToNumber(word: string) {
  switch (word) {
    case "one":
      return 1;
    case "two":
      return 2;
    case "three":
      return 3;
    case "four":
      return 4;
    case "five":
      return 5;
    case "six":
      return 6;
    case "seven":
      return 7;
    case "eight":
      return 8;
    case "nine":
      return 9;
    case "ten":
      return 10;
    default:
      return 0;
  }
}

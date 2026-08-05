"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import metadata from "../../structures/1ZF5.metadata.json";

export type StructureViewMode = "cartoon" | "ball-stick" | "atomic";
export type StructureColorMode = "strand" | "base" | "element" | "backbone";
export type StructureTheme = "dark" | "light";
export type StructureSource = "experimental" | "idealized";
export type StructureIsolationMode =
  | "all"
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
  const [source, setSource] = useState<StructureSource>("experimental");
  const [viewMode, setViewMode] = useState<StructureViewMode>("cartoon");
  const [colorMode, setColorMode] = useState<StructureColorMode>("base");
  const [isolationMode, setIsolationMode] = useState<StructureIsolationMode>("all");
  const [bubbleProgress, setBubbleProgress] = useState(0);
  const [bubblePlaying, setBubblePlaying] = useState(false);
  const [theme, setTheme] = useState<StructureTheme>("dark");
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
          return 1;
        }

        return Math.min(1, value + 0.04);
      });
    }, 120);

    return () => {
      window.clearInterval(timer);
    };
  }, [bubblePlaying]);

  return (
    <main className="spatialWorkspace molstarWorkspace" data-spatial-theme={theme}>
      <section className="molstarStage" aria-label="Static experimental B-DNA structure">
        <MolstarStructureViewer
          bubbleProgress={bubbleProgress}
          colorMode={colorMode}
          isolationMode={isolationMode}
          source={source}
          theme={theme}
          viewMode={viewMode}
        />
      </section>

      <div className="structureIdentity">
        <strong>{sourceDetails[source].title}</strong>
        <span>{sourceDetails[source].subtitle}</span>
      </div>

      <div className="structureControls" aria-label="Structure view controls">
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
                setBubbleProgress(Number(event.currentTarget.value) / 100);
              }}
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
        <button type="button" onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}>
          {theme === "dark" ? "Light" : "Dark"}
        </button>
        <button type="button" onClick={() => setInspectorOpen((open) => !open)}>
          {inspectorOpen ? "Hide metadata" : "Metadata"}
        </button>
      </div>

      {inspectorOpen ? (
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

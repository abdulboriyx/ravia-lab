"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import metadata from "../../structures/1ZF5.metadata.json";

export type StructureViewMode = "cartoon" | "ball-stick" | "atomic";

const MolstarStructureViewer = dynamic(() => import("./MolstarStructureViewer"), {
  ssr: false,
  loading: () => <div className="molstarLoadState">Initializing Mol* module</div>
});

const viewModes: Array<{ id: StructureViewMode; label: string }> = [
  { id: "cartoon", label: "Cartoon" },
  { id: "ball-stick", label: "Ball-and-stick" },
  { id: "atomic", label: "Atomic" }
];

export function SpatialRaviaPrototype() {
  const [viewMode, setViewMode] = useState<StructureViewMode>("cartoon");
  const [inspectorOpen, setInspectorOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.spatialRavia = "active";
    return () => {
      delete document.documentElement.dataset.spatialRavia;
    };
  }, []);

  return (
    <main className="spatialWorkspace molstarWorkspace" data-spatial-theme="dark">
      <section className="molstarStage" aria-label="Static experimental B-DNA structure">
        <MolstarStructureViewer viewMode={viewMode} />
      </section>

      <div className="structureIdentity">
        <strong>PDB 1ZF5</strong>
        <span>Static experimental B-DNA structure, not a dynamic simulation</span>
      </div>

      <div className="structureControls" aria-label="Structure view controls">
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
        <button type="button" onClick={() => setInspectorOpen((open) => !open)}>
          {inspectorOpen ? "Hide metadata" : "Metadata"}
        </button>
      </div>

      {inspectorOpen ? (
        <aside className="structureInspector" aria-label="1ZF5 experimental metadata">
          <header>
            <h2>PDB {metadata.pdbId}</h2>
            <button type="button" onClick={() => setInspectorOpen(false)}>
              Close
            </button>
          </header>
          <dl>
            <div>
              <dt>Title</dt>
              <dd>{metadata.title}</dd>
            </div>
            <div>
              <dt>Structure</dt>
              <dd>{metadata.structureType}</dd>
            </div>
            <div>
              <dt>Method</dt>
              <dd>{metadata.experimentalMethod}</dd>
            </div>
            <div>
              <dt>Resolution</dt>
              <dd>{metadata.resolutionAngstrom} Å</dd>
            </div>
            <div>
              <dt>Representation</dt>
              <dd>{metadata.representation}</dd>
            </div>
          </dl>
          <section>
            <h3>Limitations</h3>
            {metadata.limitations.map((limitation) => (
              <p key={limitation}>{limitation}</p>
            ))}
          </section>
        </aside>
      ) : null}
    </main>
  );
}

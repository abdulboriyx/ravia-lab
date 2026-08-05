"use client";

import { useEffect, useRef, useState } from "react";
import type { Viewer } from "molstar/lib/apps/viewer/app";
import { Color } from "molstar/lib/mol-util/color";
import metadata from "../../structures/1ZF5.metadata.json";

type StructureViewMode = "cartoon" | "ball-stick" | "atomic";
type MolstarViewerModule = typeof import("molstar/lib/apps/viewer/app");

const structureUrl = "/code/spatial-ravia/structures/1zf5";

const viewModes: Array<{ id: StructureViewMode; label: string }> = [
  { id: "cartoon", label: "Cartoon" },
  { id: "ball-stick", label: "Ball-and-stick" },
  { id: "atomic", label: "Atomic" }
];

export function SpatialRaviaPrototype() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [viewMode, setViewMode] = useState<StructureViewMode>("cartoon");
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    document.documentElement.dataset.spatialRavia = "active";
    return () => {
      delete document.documentElement.dataset.spatialRavia;
    };
  }, []);

  useEffect(() => {
    let disposed = false;

    async function initViewer() {
      if (!mountRef.current || viewerRef.current) {
        return;
      }

      setLoadState("loading");

      try {
        const { Viewer: MolstarViewer }: MolstarViewerModule = await import("molstar/lib/apps/viewer/app");
        const viewer = await MolstarViewer.create(mountRef.current, {
          layoutIsExpanded: false,
          layoutShowControls: false,
          layoutShowLeftPanel: false,
          layoutShowSequence: false,
          layoutShowLog: false,
          layoutShowRemoteState: false,
          collapseLeftPanel: true,
          collapseRightPanel: true,
          viewportShowControls: false,
          viewportShowExpand: false,
          viewportShowSettings: false,
          viewportShowSelectionMode: false,
          viewportShowAnimation: false,
          viewportShowTrajectoryControls: false,
          viewportShowScreenshotControls: false,
          viewportShowToggleFullscreen: false,
          viewportShowReset: true,
          viewportBackgroundColor: "#020305",
          illumination: true
        });

        if (disposed) {
          viewer.dispose();
          return;
        }

        viewerRef.current = viewer;
        await loadStructureRepresentation(viewer, viewMode);
        setLoadState("ready");
      } catch (error) {
        console.error(error);
        setLoadState("error");
      }
    }

    initViewer();

    return () => {
      disposed = true;
      viewerRef.current?.dispose();
      viewerRef.current = null;
    };
  }, [viewMode]);

  async function changeViewMode(nextMode: StructureViewMode) {
    setViewMode(nextMode);
    if (!viewerRef.current) {
      return;
    }

    setLoadState("loading");
    await loadStructureRepresentation(viewerRef.current, nextMode);
    setLoadState("ready");
  }

  return (
    <main className="spatialWorkspace molstarWorkspace" data-spatial-theme="dark">
      <section className="molstarStage" aria-label="Static experimental B-DNA structure">
        <div ref={mountRef} className="molstarMount" />
        {loadState !== "ready" ? (
          <div className="molstarLoadState">
            {loadState === "loading" ? "Loading local mmCIF 1ZF5" : "Could not load 1ZF5.cif"}
          </div>
        ) : null}
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
            onClick={() => changeViewMode(mode.id)}
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

async function loadStructureRepresentation(viewer: Viewer, mode: StructureViewMode) {
  await viewer.plugin.clear(false);

  const data = await viewer.plugin.builders.data.download(
    { url: structureUrl, isBinary: false },
    { state: { isGhost: true } }
  );
  const trajectory = await viewer.plugin.builders.structure.parseTrajectory(data, "mmcif");

  await viewer.plugin.builders.structure.hierarchy.applyPreset(trajectory, "default", {
    representationPreset: representationPreset(mode),
    representationPresetParams: {
      ignoreHydrogens: mode !== "atomic",
      ignoreHydrogensVariant: "all",
      quality: mode === "atomic" ? "high" : "auto",
      theme: {
        globalName: mode === "atomic" ? "element-symbol" : "chain-id",
        carbonColor: mode === "atomic" ? "element-symbol" : "chain-id",
        symmetryColor: "chain-id",
        globalColorParams: {},
        symmetryColorParams: {}
      }
    }
  });

  viewer.plugin.canvas3d?.setProps({
    cameraClipping: { radius: 80 },
    renderer: { backgroundColor: Color(0x020305) }
  });
  viewer.plugin.managers.camera.reset();
}

function representationPreset(mode: StructureViewMode) {
  if (mode === "cartoon") {
    return "polymer-cartoon";
  }

  if (mode === "atomic") {
    return "illustrative";
  }

  return "atomic-detail";
}

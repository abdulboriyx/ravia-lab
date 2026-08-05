"use client";

import { useEffect, useRef, useState } from "react";
import type { StructureViewMode } from "./prototype";

type LoadState = "loading" | "ready" | "error";
type MolstarViewer = import("molstar/lib/apps/viewer/app").Viewer;
type MolstarViewerModule = typeof import("molstar/lib/apps/viewer/app");
type MolstarColorModule = typeof import("molstar/lib/mol-util/color");

const publicStructureUrl = "/spatial-ravia/structures/1ZF5.cif";

export default function MolstarStructureViewer({ viewMode }: { viewMode: StructureViewMode }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<MolstarViewer | null>(null);
  const colorRef = useRef<MolstarColorModule["Color"] | null>(null);
  const lastModeRef = useRef<StructureViewMode | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("Initializing Mol* module");
  const [viewerReady, setViewerReady] = useState(false);

  useEffect(() => {
    let disposed = false;

    async function initialize() {
      if (!mountRef.current || viewerRef.current) {
        return;
      }

      setLoadState("loading");
      setMessage("Initializing Mol* module");

      try {
        const [{ Viewer }, { Color }] = await Promise.all([
          import("molstar/lib/apps/viewer/app"),
          import("molstar/lib/mol-util/color")
        ] satisfies [Promise<MolstarViewerModule>, Promise<MolstarColorModule>]);

        if (disposed || !mountRef.current) {
          return;
        }

        colorRef.current = Color;
        const viewer = await Viewer.create(mountRef.current, {
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
        setViewerReady(true);
      } catch (error) {
        console.error("[Spatial Ravia] Mol* module initialization failure", error);
        setMessage("Mol* module initialization failed");
        setLoadState("error");
      }
    }

    initialize();

    return () => {
      disposed = true;
      viewerRef.current?.dispose();
      viewerRef.current = null;
      colorRef.current = null;
      lastModeRef.current = null;
      setViewerReady(false);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadStructure() {
      const viewer = viewerRef.current;
      const Color = colorRef.current;

      if (!viewerReady || !viewer || !Color || lastModeRef.current === viewMode) {
        return;
      }

      setLoadState("loading");
      setMessage("Loading local mmCIF 1ZF5");

      try {
        await viewer.plugin.clear(false);
      } catch (error) {
        console.error("[Spatial Ravia] structure-preset failure while clearing Mol* state", error);
        setMessage("Mol* state reset failed");
        setLoadState("error");
        return;
      }

      let data;
      try {
        data = await viewer.plugin.builders.data.download(
          { url: publicStructureUrl, isBinary: false },
          { state: { isGhost: true } }
        );
      } catch (error) {
        console.error("[Spatial Ravia] HTTP/CIF download failure", {
          url: publicStructureUrl,
          error
        });
        setMessage("Could not download local 1ZF5.cif");
        setLoadState("error");
        return;
      }

      let trajectory;
      try {
        trajectory = await viewer.plugin.builders.structure.parseTrajectory(data, "mmcif");
      } catch (error) {
        console.error("[Spatial Ravia] mmCIF parsing failure", error);
        setMessage("Could not parse 1ZF5 mmCIF");
        setLoadState("error");
        return;
      }

      try {
        await viewer.plugin.builders.structure.hierarchy.applyPreset(trajectory, "default", {
          representationPreset: representationPreset(viewMode),
          representationPresetParams: {
            ignoreHydrogens: viewMode !== "atomic",
            ignoreHydrogensVariant: "all",
            quality: viewMode === "atomic" ? "high" : "auto",
            theme: {
              globalName: viewMode === "atomic" ? "element-symbol" : "chain-id",
              carbonColor: viewMode === "atomic" ? "element-symbol" : "chain-id",
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
      } catch (error) {
        console.error("[Spatial Ravia] structure-preset failure", {
          viewMode,
          error
        });
        setMessage("Could not build Mol* structure representation");
        setLoadState("error");
        return;
      }

      if (!cancelled) {
        lastModeRef.current = viewMode;
        setLoadState("ready");
      }
    }

    loadStructure();

    return () => {
      cancelled = true;
    };
  }, [viewMode, viewerReady]);

  return (
    <>
      <div ref={mountRef} className="molstarMount" />
      {loadState !== "ready" ? <div className="molstarLoadState">{message}</div> : null}
    </>
  );
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

"use client";

import { useEffect, useRef, useState } from "react";
import type { StructureViewMode } from "./prototype";

type LoadState = "loading" | "ready" | "error";
type MolstarViewerInstance = {
  dispose: () => void;
  plugin: {
    clear: (resetViewport?: boolean) => Promise<unknown>;
    builders: {
      data: {
        download: (
          params: { url: string; isBinary: boolean },
          options?: { state?: { isGhost?: boolean } }
        ) => Promise<unknown>;
      };
      structure: {
        parseTrajectory: (data: unknown, format: "mmcif") => Promise<unknown>;
        hierarchy: {
          applyPreset: (
            trajectory: unknown,
            preset: "default",
            options: {
              representationPreset: string;
              representationPresetParams: Record<string, unknown>;
            }
          ) => Promise<unknown>;
        };
      };
    };
    canvas3d?: {
      setProps: (props: Record<string, unknown>) => void;
    };
    managers: {
      camera: {
        reset: () => void;
      };
    };
  };
};

type MolstarGlobal = {
  Viewer: {
    create: (mount: HTMLElement, options: Record<string, unknown>) => Promise<MolstarViewerInstance>;
  };
  Color?: (hex: number) => unknown;
};

declare global {
  interface Window {
    molstar?: MolstarGlobal;
  }
}

const publicStructureUrl = "/spatial-ravia/structures/1ZF5.cif";
const molstarScriptUrl = "/spatial-ravia/molstar/molstar.js";
const molstarStylesheetUrl = "/spatial-ravia/molstar/molstar.css";
let molstarAssetPromise: Promise<MolstarGlobal> | null = null;

export default function MolstarStructureViewer({ viewMode }: { viewMode: StructureViewMode }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<MolstarViewerInstance | null>(null);
  const colorRef = useRef<MolstarGlobal["Color"] | null>(null);
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
        const molstar = await loadMolstarAssets();

        if (disposed || !mountRef.current) {
          return;
        }

        colorRef.current = molstar.Color ?? null;
        const viewer = await molstar.Viewer.create(mountRef.current, {
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

      if (!viewerReady || !viewer || lastModeRef.current === viewMode) {
        return;
      }

      setLoadState("loading");
      setMessage("Loading local mmCIF 1ZF5");

      try {
        const response = await fetch(publicStructureUrl, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} while fetching ${publicStructureUrl}`);
        }
      } catch (error) {
        console.error("[Spatial Ravia] HTTP/CIF download failure", {
          url: publicStructureUrl,
          error
        });
        setMessage("Could not download local 1ZF5.cif");
        setLoadState("error");
        return;
      }

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
          renderer: { backgroundColor: Color ? Color(0x020305) : 0x020305 }
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

function loadMolstarAssets() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Mol* can only initialize in the browser"));
  }

  if (window.molstar?.Viewer) {
    return Promise.resolve(window.molstar);
  }

  if (molstarAssetPromise) {
    return molstarAssetPromise;
  }

  molstarAssetPromise = new Promise<MolstarGlobal>((resolve, reject) => {
    ensureMolstarStylesheet();

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${molstarScriptUrl}"]`
    );

    const resolveFromGlobal = () => {
      if (window.molstar?.Viewer) {
        resolve(window.molstar);
        return;
      }

      reject(new Error("Mol* standalone viewer loaded without exposing window.molstar.Viewer"));
    };

    if (existingScript) {
      if (window.molstar?.Viewer) {
        resolve(window.molstar);
        return;
      }

      existingScript.addEventListener("load", resolveFromGlobal, { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error(`Could not load ${molstarScriptUrl}`)),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "spatial-ravia-molstar-script";
    script.src = molstarScriptUrl;
    script.async = true;
    script.onload = resolveFromGlobal;
    script.onerror = () => reject(new Error(`Could not load ${molstarScriptUrl}`));
    document.head.appendChild(script);
  }).catch((error) => {
    molstarAssetPromise = null;
    throw error;
  });

  return molstarAssetPromise;
}

function ensureMolstarStylesheet() {
  if (document.querySelector(`link[href="${molstarStylesheetUrl}"]`)) {
    return;
  }

  const stylesheet = document.createElement("link");
  stylesheet.id = "spatial-ravia-molstar-stylesheet";
  stylesheet.rel = "stylesheet";
  stylesheet.href = molstarStylesheetUrl;
  document.head.appendChild(stylesheet);
}

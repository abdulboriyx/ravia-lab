"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  DnaTransformationState,
  StructureCameraPreset,
  StructureColorMode,
  StructureIsolationMode,
  StructureSource,
  StructureTheme,
  StructureViewMode
} from "./DnaMolecularView";
import { dnaVisualSystem } from "./DnaVisualSystem";
import type { DnaRegulatoryRegion } from "./DnaRegulationPresentation";
import { MolstarPresentationRebuildGate } from "./MolstarPresentationRebuildGate";
import type { DnaVisualFamily } from "./biology-dna-visual-dispatcher";
import { getDnaSceneCameraContract } from "./DnaSceneCamera";

type LoadState = "loading" | "ready" | "error";
type SelectionReadout = {
  title: string;
  base: string;
  residue: string;
  nucleotide: string;
  chain: string;
  atoms: string;
  pairingPartner: string;
  orientation: string;
};
type MolstarSelector = unknown;
type MolstarStateBuilder = {
  to: (selector: MolstarSelector) => MolstarStateBuilder;
  apply: (
    transform: unknown,
    params?: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => MolstarStateBuilder;
  commit: () => Promise<unknown>;
};
type MolstarViewerInstance = {
  dispose: () => void;
  plugin: {
    state: {
      data: {
        build: () => MolstarStateBuilder;
      };
    };
    behaviors: {
      interaction: {
        click: {
          subscribe: (handler: (event: MolstarClickEvent) => void) => MolstarSubscription;
        };
      };
    };
    clear: (resetViewport?: boolean) => Promise<unknown>;
    builders: {
      data: {
        rawData: (
          params: { data: string; label?: string },
          options?: { state?: { isGhost?: boolean } }
        ) => Promise<unknown>;
        download: (
          params: { url: string; isBinary: boolean },
          options?: { state?: { isGhost?: boolean } }
        ) => Promise<unknown>;
      };
      structure: {
        parseTrajectory: (data: unknown, format: "mmcif" | "pdb") => Promise<unknown>;
        createModel: (trajectory: MolstarSelector, params?: Record<string, unknown>) => Promise<MolstarSelector>;
        createStructure: (
          model: MolstarSelector,
          params?: Record<string, unknown>
        ) => Promise<MolstarSelector>;
        insertStructureProperties: (
          structure: MolstarSelector,
          params?: Record<string, unknown>
        ) => Promise<MolstarSelector | undefined>;
        tryCreateComponentFromExpression: (
          structure: MolstarSelector,
          expression: unknown,
          key: string,
          params?: { label?: string; tags?: string[] }
        ) => Promise<MolstarSelector | undefined>;
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
        representation: {
          buildRepresentation: (
            builder: MolstarStateBuilder,
            structure: MolstarSelector | undefined,
            props: Record<string, unknown>,
            options?: { tag?: string; initialState?: Record<string, unknown> }
          ) => MolstarSelector | undefined;
        };
      };
    };
    canvas3d?: {
      setProps: (props: Record<string, unknown>) => void;
      camera: {
        getSnapshot: () => MolstarCameraSnapshot;
      };
    };
    managers: {
      interactivity: {
        lociSelects: {
          selectOnly: (current: MolstarRepresentationLoci, applyGranularity?: boolean) => void;
          deselectAll: () => void;
        };
      };
      camera: {
        reset: (snapshot?: Partial<MolstarCameraSnapshot>, durationMs?: number) => void;
        setSnapshot: (snapshot: Partial<MolstarCameraSnapshot>, durationMs?: number) => void;
      };
    };
  };
};

type MolstarCameraSnapshot = {
  position: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
  radius: number;
  radiusMax: number;
  [key: string]: unknown;
};

type MolstarGlobal = {
  Viewer: {
    create: (mount: HTMLElement, options: Record<string, unknown>) => Promise<MolstarViewerInstance>;
  };
  Color?: (hex: number) => unknown;
  lib?: {
    structure?: {
      StructureElement?: {
        Loci?: {
          getFirstLocation: (loci: MolstarElementLoci) => MolstarElementLocation | undefined;
        };
      };
      StructureProperties?: MolstarStructureProperties;
    };
  };
};

type MolstarSubscription = {
  unsubscribe: () => void;
};

type MolstarRepresentationLoci = {
  loci?: unknown;
};

type MolstarClickEvent = {
  current: MolstarRepresentationLoci;
};

type MolstarElementLoci = {
  kind: "element-loci";
};

type MolstarElementLocation = {
  kind: "element-location";
};

type MolstarStructureProperties = {
  atom: {
    label_atom_id: (location: MolstarElementLocation) => string;
    auth_atom_id: (location: MolstarElementLocation) => string;
    label_comp_id: (location: MolstarElementLocation) => string;
    type_symbol: (location: MolstarElementLocation) => string;
  };
  residue: {
    label_comp_id: (location: MolstarElementLocation) => string;
    auth_comp_id: (location: MolstarElementLocation) => string;
    label_seq_id: (location: MolstarElementLocation) => number;
    auth_seq_id: (location: MolstarElementLocation) => number;
    chem_comp_type: (location: MolstarElementLocation) => string;
  };
  chain: {
    label_asym_id: (location: MolstarElementLocation) => string;
    auth_asym_id: (location: MolstarElementLocation) => string;
  };
  unit: {
    operator_name: (location: MolstarElementLocation) => string;
    instance_id: (location: MolstarElementLocation) => string;
  };
};

type MolstarQueryRuntime = {
  MolScriptBuilder: {
    core: {
      logic: {
        and: (args: unknown[]) => unknown;
        not: (args: unknown[]) => unknown;
        or: (args: unknown[]) => unknown;
      };
      rel: {
        eq: (args: unknown[]) => unknown;
      };
      set: {
        has: (args: unknown[]) => unknown;
      };
    };
    set: (...values: string[]) => unknown;
    ammp: (name: string) => unknown;
    struct: {
      generator: {
        atomGroups: (params: Record<string, unknown>) => unknown;
      };
      modifier: {
        union: (items: unknown[]) => unknown;
      };
    };
  };
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
let molstarQueryPromise: Promise<MolstarQueryRuntime> | null = null;
const noRegulationRegions: readonly DnaRegulatoryRegion[] = [];

export default function MolstarStructureViewer({
  bubbleProgress,
  cameraCommand,
  colorMode,
  focusedBasePair,
  isolationMode,
  source,
  theme,
  transformation,
  viewMode,
  cameraFamily = "structure",
  regulationRegions,
}: {
  bubbleProgress: number;
  cameraCommand: { preset: StructureCameraPreset; nonce: number };
  colorMode: StructureColorMode;
  focusedBasePair: number;
  isolationMode: StructureIsolationMode;
  source: StructureSource;
  theme: StructureTheme;
  transformation: DnaTransformationState;
  viewMode: StructureViewMode;
  cameraFamily?: DnaVisualFamily;
  regulationRegions?: readonly DnaRegulatoryRegion[];
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<MolstarViewerInstance | null>(null);
  const colorRef = useRef<MolstarGlobal["Color"] | null>(null);
  const lastVisualRef = useRef<string | null>(null);
  const lastBaseVisualRef = useRef<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("Initializing Mol* module");
  const [selection, setSelection] = useState<SelectionReadout | null>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const frameRequestRef = useRef(0);
  const rebuildGateRef = useRef(new MolstarPresentationRebuildGate());
  const activeRegulationRegions = regulationRegions ?? noRegulationRegions;
  const regulationKey = useMemo(
    () => activeRegulationRegions
      .filter((region) => region.visible)
      .map((region) => `${region.id}:${region.start}-${region.end}`)
      .join(","),
    [activeRegulationRegions]
  );

  const requestStructureFrame = useCallback((preset: StructureCameraPreset) => {
    const viewer = viewerRef.current;
    if (!viewer) {
      return;
    }

    const request = frameRequestRef.current + 1;
    frameRequestRef.current = request;
    frameStructure(viewer, preset, cameraFamily);

    // Mol* commits representations asynchronously. A second fit catches the
    // final bounds when a command changes from the duplex to an isolated layer.
    window.setTimeout(() => {
      if (frameRequestRef.current === request && viewerRef.current === viewer) {
        frameStructure(viewer, preset, cameraFamily);
      }
    }, 220);
  }, [cameraFamily]);

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
          viewportBackgroundColor: themeBackground("light"),
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
      lastVisualRef.current = null;
      lastBaseVisualRef.current = null;
      setViewerReady(false);
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewerReady || !viewer) {
      return;
    }

    setMolstarBackground(viewer, colorRef.current, theme);
  }, [theme, viewerReady]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewerReady || !viewer || cameraCommand.nonce === 0) {
      return;
    }

    requestStructureFrame(cameraCommand.preset);
  }, [cameraCommand, requestStructureFrame, viewerReady]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewerReady || !viewer) {
      return;
    }

    const subscription = viewer.plugin.behaviors.interaction.click.subscribe((event) => {
      const readout = readSelection(event.current, window.molstar);

      if (!readout) {
        viewer.plugin.managers.interactivity.lociSelects.deselectAll();
        setSelection(null);
        return;
      }

      viewer.plugin.managers.interactivity.lociSelects.selectOnly(event.current, true);
      setSelection(readout);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [viewerReady]);

  useEffect(() => {
    let cancelled = false;
    const rebuildGate = rebuildGateRef.current;

    async function loadStructure(isCurrent: () => boolean) {
      const viewer = viewerRef.current;
      const Color = colorRef.current;
      const isStale = () => cancelled || !isCurrent() || viewerRef.current !== viewer;
      const transformationFrame = quantizedTransformation(transformation, bubbleProgress);
      const bubbleFrame = source === "idealized" ? transformationFrame.bubbleProgress : 0;
      const baseVisualKey = `${cameraFamily}:${source}:${viewMode}:${colorMode}:${isolationMode}:${focusedBasePair}:${regulationKey}`;
      const visualKey = `${baseVisualKey}:${transformationKey(transformationFrame)}`;
      const isBubbleFrameUpdate =
        source === "idealized" && lastBaseVisualRef.current === baseVisualKey && lastVisualRef.current !== null;

      if (!viewerReady || !viewer || isStale() || lastVisualRef.current === visualKey) {
        return;
      }

      if (!isBubbleFrameUpdate) {
        setLoadState("loading");
      }
      setSelection(null);
      viewer.plugin.managers.interactivity.lociSelects.deselectAll();
      setMessage(
        source === "experimental"
          ? "Loading local mmCIF 1ZF5"
          : bubbleProgress > 0
            ? "Opening ideal B-DNA bubble"
            : "Generating ideal B-DNA model"
      );

      if (source === "experimental") {
        try {
          const response = await fetch(publicStructureUrl, { cache: "no-store" });
          if (isStale()) {
            return;
          }
          if (!response.ok) {
            throw new Error(`HTTP ${response.status} while fetching ${publicStructureUrl}`);
          }
        } catch (error) {
          if (isStale()) {
            return;
          }
          console.error("[Spatial Ravia] HTTP/CIF download failure", {
            url: publicStructureUrl,
            error
          });
          setMessage("Could not download local 1ZF5.cif");
          setLoadState("error");
          return;
        }
      }

      try {
        await viewer.plugin.clear(false);
      } catch (error) {
        if (isStale()) {
          return;
        }
        console.error("[Spatial Ravia] structure-preset failure while clearing Mol* state", error);
        setMessage("Mol* state reset failed");
        setLoadState("error");
        return;
      }

      let data;
      let format: "mmcif" | "pdb" = "mmcif";
      try {
        if (source === "experimental") {
          data = await viewer.plugin.builders.data.download(
            { url: publicStructureUrl, isBinary: false },
            { state: { isGhost: true } }
          );
        } else {
          format = "pdb";
          data = await viewer.plugin.builders.data.rawData(
            {
              data: generateIdealBDnaPdb(transformationFrame),
              label: "Idealized canonical B-DNA duplex"
            },
            { state: { isGhost: true } }
          );
        }
      } catch (error) {
        if (isStale()) {
          return;
        }
        console.error(
          source === "experimental"
            ? "[Spatial Ravia] HTTP/CIF download failure"
            : "[Spatial Ravia] ideal B-DNA generation failure",
          {
            url: source === "experimental" ? publicStructureUrl : "generated:parametric-b-dna",
            error
          }
        );
        setMessage(source === "experimental" ? "Could not download local 1ZF5.cif" : "Could not generate ideal B-DNA");
        setLoadState("error");
        return;
      }

      if (isStale()) {
        return;
      }

      let trajectory;
      try {
        trajectory = await viewer.plugin.builders.structure.parseTrajectory(data, format);
      } catch (error) {
        if (isStale()) {
          return;
        }
        console.error(
          source === "experimental" ? "[Spatial Ravia] mmCIF parsing failure" : "[Spatial Ravia] ideal PDB parsing failure",
          error
        );
        setMessage(source === "experimental" ? "Could not parse 1ZF5 mmCIF" : "Could not parse ideal B-DNA PDB");
        setLoadState("error");
        return;
      }

      if (isStale()) {
        return;
      }

      try {
        if (isolationMode === "all") {
          await applySemanticRepresentation(viewer, trajectory, {
            colorMode,
            focusedBasePair,
            regulationRegions: activeRegulationRegions,
            viewMode
          });
        } else {
          await applyIsolatedRepresentation(viewer, trajectory, {
            colorMode,
            focusedBasePair,
            isolationMode,
            viewMode
          });
        }

        if (isStale()) {
          return;
        }

        setMolstarBackground(viewer, Color, theme);
        if (!isBubbleFrameUpdate) {
          requestStructureFrame(
            isolationMode === "nucleotide" ? "nucleotide" :
              isolationMode === "base-pair" ? "base-pair" : "reset"
          );
        }
      } catch (error) {
        if (isStale()) {
          return;
        }
        console.error("[Spatial Ravia] structure-preset failure", {
          viewMode,
          error
        });
        setMessage("Could not build Mol* structure representation");
        setLoadState("error");
        return;
      }

      if (!isStale()) {
        lastVisualRef.current = visualKey;
        lastBaseVisualRef.current = baseVisualKey;
        setLoadState("ready");
      }
    }

    void rebuildGate.schedule(loadStructure).catch((error) => {
      if (cancelled) {
        return;
      }
      console.error("[Spatial Ravia] Mol* structure rebuild failure", error);
      setMessage("Could not rebuild Mol* structure presentation");
      setLoadState("error");
    });

    return () => {
      cancelled = true;
      rebuildGate.invalidate();
    };
  }, [
    activeRegulationRegions,
    bubbleProgress,
    colorMode,
    cameraFamily,
    focusedBasePair,
    isolationMode,
    regulationKey,
    source,
    theme,
    transformation,
    viewMode,
    viewerReady,
    requestStructureFrame,
  ]);

  return (
    <>
      <div ref={mountRef} className="molstarMount" />
      {selection ? (
        <aside className="structureSelectionReadout" aria-label="Selected molecular detail">
          <header>
            <strong>{selection.title}</strong>
            <button
              type="button"
              onClick={() => {
                viewerRef.current?.plugin.managers.interactivity.lociSelects.deselectAll();
                setSelection(null);
              }}
            >
              Clear
            </button>
          </header>
          <dl>
            <div>
              <dt>Base</dt>
              <dd>{selection.base}</dd>
            </div>
            <div>
              <dt>Residue</dt>
              <dd>{selection.residue}</dd>
            </div>
            <div>
              <dt>Position</dt>
              <dd>{selection.nucleotide}</dd>
            </div>
            <div>
              <dt>Chain</dt>
              <dd>{selection.chain}</dd>
            </div>
            <div>
              <dt>Atoms</dt>
              <dd>{selection.atoms}</dd>
            </div>
            <div>
              <dt>Partner</dt>
              <dd>{selection.pairingPartner}</dd>
            </div>
            <div>
              <dt>5&apos;/3&apos;</dt>
              <dd>{selection.orientation}</dd>
            </div>
          </dl>
        </aside>
      ) : null}
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

function representationType(mode: StructureViewMode) {
  return mode === "cartoon" ? "cartoon" : "ball-and-stick";
}

function readSelection(
  current: MolstarRepresentationLoci,
  molstar: MolstarGlobal | undefined
): SelectionReadout | null {
  const loci = current.loci;

  if (!isElementLoci(loci)) {
    return null;
  }

  const structure = molstar?.lib?.structure;
  const location = structure?.StructureElement?.Loci?.getFirstLocation(loci);
  const props = structure?.StructureProperties;

  if (!location || !props) {
    return null;
  }

  const residueCode = safeValue(() => props.residue.label_comp_id(location), "Unknown");
  const residueName = nucleotideName(residueCode);
  const labelSeqId = safeValue(() => props.residue.label_seq_id(location), Number.NaN);
  const authSeqId = safeValue(() => props.residue.auth_seq_id(location), Number.NaN);
  const labelChain = safeValue(() => props.chain.label_asym_id(location), "Unknown");
  const authChain = safeValue(() => props.chain.auth_asym_id(location), labelChain);
  const operator = safeValue(() => props.unit.operator_name(location), "");
  const instance = safeValue(() => props.unit.instance_id(location), "");
  const atomName = safeValue(() => props.atom.label_atom_id(location), "");
  const atomElement = safeValue(() => props.atom.type_symbol(location), "");
  const chemType = safeValue(() => props.residue.chem_comp_type(location), "");
  const position = Number.isFinite(labelSeqId) ? labelSeqId : authSeqId;
  const terminal = terminalOrientation(position, chemType, labelChain);
  const atomCategory = atomClass(atomName);
  const partner = pairingPartner(labelChain, position, residueCode);
  const chainSuffix = [
    authChain && authChain !== labelChain ? `auth ${authChain}` : "",
    operator && operator !== "1_555" ? `operator ${operator}` : "",
    instance ? `instance ${instance}` : ""
  ]
    .filter(Boolean)
    .join(", ");

  return {
    title: `${residueName} ${Number.isFinite(position) ? position : ""}`.trim(),
    base: `${residueCode.replace(/^D/, "") || "Unknown"} - ${residueName}`,
    residue: `${residueCode} - ${residueName}`,
    nucleotide: Number.isFinite(position) ? `Nucleotide ${position} of ${dnaLength}` : "Unavailable",
    chain: chainSuffix ? `${labelChain} (${chainSuffix})` : labelChain,
    atoms: atomName
      ? `${atomName}${atomElement ? ` (${atomElement})` : ""}; ${atomCategory}`
      : `Residue selection; ${atomCategory}`,
    pairingPartner: partner,
    orientation: terminal
  };
}

function isElementLoci(loci: unknown): loci is MolstarElementLoci {
  return !!loci && typeof loci === "object" && "kind" in loci && loci.kind === "element-loci";
}

function safeValue<T>(read: () => T, fallback: T) {
  try {
    const value = read();
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function nucleotideName(code: string) {
  switch (code.replace(/^D/, "")) {
    case "A":
      return "Adenine";
    case "C":
      return "Cytosine";
    case "G":
      return "Guanine";
    case "T":
      return "Thymine";
    case "U":
      return "Uracil";
    default:
      return code || "Unknown nucleotide";
  }
}

function terminalOrientation(position: number, chemType: string, chain: string) {
  if (!Number.isFinite(position)) {
    return chemType.includes("3 prime") || chemType.includes("5 prime")
      ? chemType.replace(/prime/g, "'")
      : "Unavailable";
  }

  if (chain === "B") {
    if (position <= 1 || chemType.includes("3 prime")) {
      return "3' terminus on antiparallel strand B; positions increase toward 5'";
    }

    if (position >= dnaLength || chemType.includes("5 prime")) {
      return "5' terminus on antiparallel strand B; positions increase away from 3'";
    }

    return "Internal nucleotide on strand B; positions increase 3' -> 5'";
  }

  if (position <= 1 || chemType.includes("5 prime")) {
    return "5' terminus on strand A; positions increase 5' -> 3'";
  }

  if (position >= dnaLength || chemType.includes("3 prime")) {
    return "3' terminus on strand A; positions increase from 5'";
  }

  return "Internal nucleotide on strand A; positions increase 5' -> 3'";
}

function pairingPartner(chain: string, position: number, residueCode: string) {
  if (!Number.isFinite(position) || (chain !== "A" && chain !== "B")) {
    return "Unavailable";
  }

  const partnerChain = chain === "A" ? "B" : "A";
  const partnerPosition = dnaLength - position + 1;
  const base = residueCode.replace(/^D/, "");
  const partnerBase = complementBase(base);

  return `${partnerBase} ${partnerPosition} on chain ${partnerChain} (inferred Watson-Crick partner)`;
}

function atomClass(atomName: string) {
  if (!atomName) {
    return "nucleotide atom set";
  }

  if (phosphateAtoms.includes(atomName)) {
    return "phosphate atom";
  }

  if (sugarAtoms.includes(atomName)) {
    return "sugar atom";
  }

  if (nucleicBackboneAtoms.includes(atomName)) {
    return "backbone atom";
  }

  return "base atom";
}

type DnaTransformationFrame = DnaTransformationState & {
  bubbleProgress: number;
};

function generateIdealBDnaPdb(transformation: DnaTransformationFrame) {
  const sequence = "CCAGCGCTGGATCGTA";
  const progress = clamp01(transformation.bubbleProgress);
  const lines: string[] = [
    "HEADER    IDEALIZED PARAMETRIC B-DNA DUPLEX",
    "TITLE     CANONICAL B-DNA MODEL GENERATED IN SPATIAL RAVIA",
    "REMARK   SOURCE: IDEALIZED STRUCTURAL MODEL, NOT EXPERIMENTAL COORDINATES",
    `REMARK   PARAMETERS: RISE ${dnaVisualSystem.geometry.risePerBasePairAngstrom} ANGSTROM, TWIST ${(360 / dnaVisualSystem.geometry.basePairsPerTurn).toFixed(3)} DEGREES, ${dnaVisualSystem.geometry.basePairsPerTurn} BP/TURN`,
    "REMARK   BUBBLE: CONTROLLED STRAND-OPENING TRANSFORMATION, NOT MOLECULAR DYNAMICS",
    "REMARK   TRANSFORMS: STRAND SEPARATION, LOCAL BUBBLE, BEND, BASE EXPOSURE PRESERVE CHAIN ORDER"
  ];
  let serial = 1;

  for (let i = 0; i < sequence.length; i += 1) {
    const base = sequence[i];
    const theta = (i * (360 / dnaVisualSystem.geometry.basePairsPerTurn) * Math.PI) / 180;
    const z = (i - (sequence.length - 1) / 2) * dnaVisualSystem.geometry.risePerBasePairAngstrom;
    serial = addIdealNucleotide(lines, serial, "A", i + 1, base, theta, z, 1, progress, i, transformation);
  }

  for (let i = 0; i < sequence.length; i += 1) {
    const pairedIndex = sequence.length - 1 - i;
    const base = complementBase(sequence[pairedIndex]);
    const theta = ((pairedIndex * (360 / dnaVisualSystem.geometry.basePairsPerTurn) + 180) * Math.PI) / 180;
    const z = (pairedIndex - (sequence.length - 1) / 2) * dnaVisualSystem.geometry.risePerBasePairAngstrom;
    serial = addIdealNucleotide(lines, serial, "B", i + 1, base, theta, z, -1, progress, pairedIndex, transformation);
  }

  lines.push("TER");
  lines.push("END");
  return `${lines.join("\n")}\n`;
}

function addIdealNucleotide(
  lines: string[],
  startSerial: number,
  chain: string,
  residueNumber: number,
  base: string,
  theta: number,
  z: number,
  handedness: 1 | -1,
  bubbleProgress: number,
  pairedIndex: number,
  transformation: DnaTransformationFrame
) {
  const residue = `D${base}`;
  const helixRadius = dnaVisualSystem.geometry.helixRadiusAngstrom;
  const radial = vector(Math.cos(theta), Math.sin(theta), 0);
  const tangent = vector(-Math.sin(theta) * handedness, Math.cos(theta) * handedness, 0);
  const bubble = bubbleEnvelope(pairedIndex, transformation.bubbleBasePairs) * smoothStep(bubbleProgress);
  const baseLift = bubble * 3.35;
  const backboneLift = bubble * 1.28;
  const shear = bubble * 1.72 * handedness;
  const zShear = bubble * (pairedIndex < 5 ? -0.62 : 0.62);
  const atoms = [
    atomPoint("P", "P", radial, tangent, helixRadius + 0.4 + backboneLift, -0.82 + shear * 0.28, z - 0.56 + zShear * 0.4),
    atomPoint("OP1", "O", radial, tangent, helixRadius + 1.32 + backboneLift, -1.04 + shear * 0.3, z - 1.36 + zShear * 0.4),
    atomPoint("OP2", "O", radial, tangent, helixRadius + 0.72 + backboneLift, 0.62 + shear * 0.3, z + 0.5 + zShear * 0.4),
    atomPoint("O5'", "O", radial, tangent, helixRadius - 0.82 + backboneLift, -0.42 + shear * 0.34, z - 0.1 + zShear * 0.55),
    atomPoint("C5'", "C", radial, tangent, helixRadius - 1.42 + backboneLift, 0.28 + shear * 0.38, z + 0.66 + zShear * 0.55),
    atomPoint("C4'", "C", radial, tangent, helixRadius - 2.38 + backboneLift, -0.18 + shear * 0.42, z + 0.18 + zShear * 0.7),
    atomPoint("O4'", "O", radial, tangent, helixRadius - 2.9 + backboneLift, 0.76 + shear * 0.45, z - 0.36 + zShear * 0.72),
    atomPoint("C3'", "C", radial, tangent, helixRadius - 2.48 + backboneLift, -1.08 + shear * 0.42, z - 0.68 + zShear * 0.7),
    atomPoint("O3'", "O", radial, tangent, helixRadius - 1.84 + backboneLift, -1.84 + shear * 0.38, z - 1.42 + zShear * 0.55),
    atomPoint("C2'", "C", radial, tangent, helixRadius - 3.88 + backboneLift, -0.84 + shear * 0.52, z - 0.08 + zShear * 0.82),
    atomPoint("C1'", "C", radial, tangent, helixRadius - 4.12 + backboneLift, 0.52 + shear * 0.58, z - 0.48 + zShear * 0.85),
    ...baseAtoms(base, radial, tangent, z + zShear, baseLift, shear, dnaVisualSystem.geometry.basePairWidthAngstrom / 10.8)
  ].map((atom) =>
    transformIdealAtom(atom, {
      chain,
      handedness,
      isBase: !nucleicBackboneAtoms.includes(atom.name),
      pairedIndex,
      radial,
      tangent,
      transformation
    })
  );

  let serial = startSerial;
  for (const atom of atoms) {
    lines.push(formatPdbAtom(serial, atom.name, atom.element, residue, chain, residueNumber, atom.x, atom.y, atom.z));
    serial += 1;
  }

  return serial;
}

function atomPoint(
  name: string,
  element: string,
  radial: Vec3,
  tangent: Vec3,
  radialDistance: number,
  tangentialOffset: number,
  z: number
) {
  return {
    name,
    element,
    x: radial.x * radialDistance + tangent.x * tangentialOffset,
    y: radial.y * radialDistance + tangent.y * tangentialOffset,
    z
  };
}

type IdealAtom = ReturnType<typeof atomPoint>;

function transformIdealAtom(
  atom: IdealAtom,
  context: {
    chain: string;
    handedness: 1 | -1;
    isBase: boolean;
    pairedIndex: number;
    radial: Vec3;
    tangent: Vec3;
    transformation: DnaTransformationFrame;
  }
) {
  const strandSign = context.chain === "A" ? 1 : -1;
  const separation = smoothStep(context.transformation.strandSeparation) * 4.4;
  const expose = context.isBase ? smoothStep(context.transformation.exposeBases) : 0;
  const baseExposure = expose * 2.4;
  const bend = smoothStep(context.transformation.bend);
  const centeredZ = atom.z / 16;
  const bendOffset = bend * 5.8 * centeredZ * centeredZ;
  const bendTilt = bend * 0.18 * atom.z;

  return {
    ...atom,
    x:
      atom.x +
      strandSign * separation +
      context.radial.x * baseExposure +
      context.tangent.x * expose * 1.1 * context.handedness +
      bendOffset,
    y:
      atom.y +
      context.radial.y * baseExposure +
      context.tangent.y * expose * 1.1 * context.handedness +
      bendTilt,
    z: atom.z - bend * 0.08 * atom.x
  };
}

function baseAtoms(base: string, radial: Vec3, tangent: Vec3, z: number, baseLift = 0, shear = 0, baseScale = 1) {
  const glycosidic = base === "A" || base === "G" ? "N9" : "N1";
  const ring: BaseAtomTuple[] =
    base === "A"
      ? [
          ["N9", "N", 4.78, 0.58, -0.42],
          ["C8", "C", 3.92, 1.02, -0.22],
          ["N7", "N", 3.12, 0.34, 0.02],
          ["C5", "C", 3.48, -0.72, 0.08],
          ["C6", "C", 2.72, -1.72, 0.28],
          ["N6", "N", 2.98, -2.92, 0.44],
          ["N1", "N", 1.62, -1.38, 0.18],
          ["C2", "C", 1.34, -0.1, -0.02],
          ["N3", "N", 2.14, 0.82, -0.18],
          ["C4", "C", 3.22, 0.42, -0.08]
        ]
      : base === "G"
        ? [
            ["N9", "N", 4.78, 0.58, -0.42],
            ["C8", "C", 3.92, 1.02, -0.22],
            ["N7", "N", 3.12, 0.34, 0.02],
            ["C5", "C", 3.48, -0.72, 0.08],
            ["C6", "C", 2.7, -1.72, 0.28],
            ["O6", "O", 2.98, -2.86, 0.44],
            ["N1", "N", 1.62, -1.38, 0.18],
            ["C2", "C", 1.34, -0.1, -0.02],
            ["N2", "N", 0.12, 0.18, -0.1],
            ["N3", "N", 2.14, 0.82, -0.18],
            ["C4", "C", 3.22, 0.42, -0.08]
          ]
        : base === "C"
          ? [
              ["N1", "N", 4.78, 0.54, -0.42],
              ["C2", "C", 3.76, 1.2, -0.16],
              ["O2", "O", 3.86, 2.34, -0.02],
              ["N3", "N", 2.64, 0.54, 0.06],
              ["C4", "C", 2.54, -0.72, 0.22],
              ["N4", "N", 1.48, -1.36, 0.4],
              ["C5", "C", 3.62, -1.38, 0.06],
              ["C6", "C", 4.74, -0.72, -0.18]
            ]
          : [
              ["N1", "N", 4.78, 0.54, -0.42],
              ["C2", "C", 3.76, 1.2, -0.16],
              ["O2", "O", 3.82, 2.34, -0.02],
              ["N3", "N", 2.62, 0.54, 0.06],
              ["C4", "C", 2.48, -0.78, 0.22],
              ["O4", "O", 1.38, -1.28, 0.42],
              ["C5", "C", 3.58, -1.42, 0.04],
              ["C7", "C", 3.52, -2.88, 0.18],
              ["C6", "C", 4.74, -0.72, -0.18]
            ];

  return ring.map(([name, element, radialDistance, tangentialOffset, zOffset]) => {
    const point = atomPoint(
      name,
      element,
      radial,
      tangent,
      Number(radialDistance) * baseScale + baseLift,
      Number(tangentialOffset) * baseScale + shear,
      z + Number(zOffset)
    );
    return name === glycosidic ? { ...point, z: point.z - 0.06 } : point;
  });
}

function formatPdbAtom(
  serial: number,
  atomName: string,
  element: string,
  residue: string,
  chain: string,
  residueNumber: number,
  x: number,
  y: number,
  z: number
) {
  const atom = atomName.length < 4 ? ` ${atomName.padEnd(3, " ")}` : atomName.slice(0, 4);
  return [
    "ATOM  ",
    serial.toString().padStart(5, " "),
    " ",
    atom,
    " ",
    residue.padStart(3, " "),
    " ",
    chain,
    residueNumber.toString().padStart(4, " "),
    "    ",
    x.toFixed(3).padStart(8, " "),
    y.toFixed(3).padStart(8, " "),
    z.toFixed(3).padStart(8, " "),
    "  1.00 20.00           ",
    element.padStart(2, " ")
  ].join("");
}

function complementBase(base: string) {
  switch (base) {
    case "A":
      return "T";
    case "T":
      return "A";
    case "G":
      return "C";
    default:
      return "G";
  }
}

function vector(x: number, y: number, z: number) {
  return { x, y, z };
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function smoothStep(value: number) {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
}

function quantizedTransformation(
  transformation: DnaTransformationState,
  bubbleProgress: number
): DnaTransformationFrame {
  const quantize = (value: number) => Math.round(clamp01(value) * 25) / 25;
  const bubbleBasePairs = Math.max(0, Math.min(6, Math.round(transformation.bubbleBasePairs)));

  return {
    strandSeparation: quantize(transformation.strandSeparation),
    bubbleBasePairs,
    bubbleProgress: Math.max(quantize(bubbleProgress), bubbleBasePairs > 0 ? Math.min(1, bubbleBasePairs / 6) : 0),
    bend: quantize(transformation.bend),
    exposeBases: quantize(transformation.exposeBases)
  };
}

function transformationKey(transformation: DnaTransformationFrame) {
  return [
    transformation.bubbleProgress,
    transformation.bubbleBasePairs,
    transformation.strandSeparation,
    transformation.bend,
    transformation.exposeBases
  ].join(":");
}

function bubbleEnvelope(pairedIndex: number, bubbleBasePairs: number) {
  if (bubbleBasePairs <= 0) {
    return 0;
  }

  const center = 4.5;
  const halfWidth = Math.max(1, Math.min(3, bubbleBasePairs / 2));
  const distance = Math.abs(pairedIndex - center);
  return clamp01(1 - Math.max(0, distance - halfWidth) / 1.4);
}

type Vec3 = {
  x: number;
  y: number;
  z: number;
};

type BaseAtomTuple = [string, string, number, number, number];

const semanticColors = {
  strandA: dnaVisualSystem.colors.strandA,
  strandB: dnaVisualSystem.colors.strandB,
  bases: dnaVisualSystem.colors.basePair,
  backbone: 0x475569,
  phosphates: dnaVisualSystem.colors.phosphate,
  sugars: dnaVisualSystem.colors.sugar,
  hydrogenBonds: 0x0891b2
};

async function applySemanticRepresentation(
  viewer: MolstarViewerInstance,
  trajectory: MolstarSelector,
  options: {
    colorMode: StructureColorMode;
    focusedBasePair: number;
    regulationRegions: readonly DnaRegulatoryRegion[];
    viewMode: StructureViewMode;
  }
) {
  const runtime = await loadMolstarQueryRuntime();
  const model = await viewer.plugin.builders.structure.createModel(trajectory, { modelIndex: 0 });
  const structure = await viewer.plugin.builders.structure.createStructure(model, {
    name: "model",
    params: {}
  });
  const structureWithProps =
    (await viewer.plugin.builders.structure.insertStructureProperties(structure)) ?? structure;

  const strandA = await createComponent(viewer, runtime, structureWithProps, "semantic-strand-a", "Strand A", {
    "chain-test": runtime.MolScriptBuilder.core.rel.eq([runtime.MolScriptBuilder.ammp("label_asym_id"), "A"])
  });
  const strandB = await createComponent(viewer, runtime, structureWithProps, "semantic-strand-b", "Strand B", {
    "chain-test": runtime.MolScriptBuilder.core.rel.eq([runtime.MolScriptBuilder.ammp("label_asym_id"), "B"])
  });
  const phosphates = await createComponent(viewer, runtime, structureWithProps, "semantic-phosphates", "Phosphates", {
    "atom-test": atomNameIn(runtime.MolScriptBuilder, phosphateAtoms)
  });
  const sugars = await createComponent(viewer, runtime, structureWithProps, "semantic-sugars", "Sugars", {
    "atom-test": atomNameIn(runtime.MolScriptBuilder, sugarAtoms)
  });
  const focusedPair = await createComponent(viewer, runtime, structureWithProps, "semantic-focused-base-pair", `Base pair ${options.focusedBasePair}`, {
    "residue-test": focusedBasePairResidueTest(runtime.MolScriptBuilder, options.focusedBasePair)
  });
  const regulationComponents = await Promise.all(
    options.regulationRegions.filter((region) => region.visible).map((region) =>
      createComponent(viewer, runtime, structureWithProps, `regulation-${region.id}`, region.label, {
        "residue-test": regulatoryRegionResidueTest(runtime.MolScriptBuilder, region.start, region.end)
      })
    )
  );
  const labelComponents = await createLabelComponents(viewer, runtime, structureWithProps);

  const update = viewer.plugin.state.data.build();
  const strandTrace = {
    type: "cartoon",
    typeParams: {
      // Global DNA is a restrained duplex: two thin backbone traces with
      // nucleotide rings/blocks, not a full atomistic pile-up.
      sizeFactor: dnaVisualSystem.representation.backboneRadius,
      visuals: ["polymer-trace", "polymer-gap", "nucleotide-ring", "nucleotide-block"]
    },
    color: "chain-id",
    colorParams: {}
  };

  viewer.plugin.builders.structure.representation.buildRepresentation(
    update,
    strandA,
    { ...strandTrace, color: "uniform", colorParams: uniformColor(semanticColors.strandA) },
    { tag: "spatial-ravia-strand-a-trace" }
  );
  viewer.plugin.builders.structure.representation.buildRepresentation(
    update,
    strandB,
    { ...strandTrace, color: "uniform", colorParams: uniformColor(semanticColors.strandB) },
    { tag: "spatial-ravia-strand-b-trace" }
  );
  options.regulationRegions.filter((region) => region.visible).forEach((region, index) => {
    viewer.plugin.builders.structure.representation.buildRepresentation(
      update,
      regulationComponents[index],
      {
        type: "cartoon",
        typeParams: {
          sizeFactor: dnaVisualSystem.representation.backboneRadius * 1.34,
          visuals: ["polymer-trace", "nucleotide-ring", "nucleotide-block"]
        },
        color: "uniform",
        colorParams: uniformColor(region.color)
      },
      { tag: `spatial-ravia-regulation-${region.id}` }
    );
  });
  if (options.viewMode !== "cartoon") {
    // Close inspection remains local: this preserves a smooth semantic LOD
    // from the whole duplex to one chemically legible base-pair region.
    viewer.plugin.builders.structure.representation.buildRepresentation(
      update,
      focusedPair,
      localDnaChemistryRepresentation(options.viewMode, options.colorMode),
      { tag: "spatial-ravia-focused-base-pair-chemistry" }
    );
  }

  if (options.colorMode === "backbone" && options.viewMode !== "cartoon") {
    viewer.plugin.builders.structure.representation.buildRepresentation(
      update,
      phosphates,
      { type: "ball-and-stick", typeParams: { sizeFactor: dnaVisualSystem.representation.atomScale, sizeAspectRatio: 0.5, aromaticBonds: false }, color: "uniform", colorParams: uniformColor(semanticColors.phosphates) },
      { tag: "spatial-ravia-local-phosphate-detail" }
    );
    viewer.plugin.builders.structure.representation.buildRepresentation(
      update,
      sugars,
      { type: "ball-and-stick", typeParams: { sizeFactor: dnaVisualSystem.representation.atomScale * 0.9, sizeAspectRatio: 0.5, aromaticBonds: false }, color: "uniform", colorParams: uniformColor(semanticColors.sugars) },
      { tag: "spatial-ravia-local-sugar-detail" }
    );
  }
  // DNA identity is conveyed by the duplex itself and the restrained endpoint
  // badge; residue-number labels are opt-in inspection clutter, not hero art.
  addNucleotideLabels(viewer, update, labelComponents, false, false);

  await update.commit();
}

async function applyIsolatedRepresentation(
  viewer: MolstarViewerInstance,
  trajectory: MolstarSelector,
  options: {
    colorMode: StructureColorMode;
    focusedBasePair: number;
    isolationMode: StructureIsolationMode;
    viewMode: StructureViewMode;
  }
) {
  const runtime = await loadMolstarQueryRuntime();
  const model = await viewer.plugin.builders.structure.createModel(trajectory, { modelIndex: 0 });
  const structure = await viewer.plugin.builders.structure.createStructure(model, {
    name: "model",
    params: {}
  });
  const structureWithProps =
    (await viewer.plugin.builders.structure.insertStructureProperties(structure)) ?? structure;

  const expression = isolationExpression(runtime, options.isolationMode, options.focusedBasePair);
  const component = expression
    ? await viewer.plugin.builders.structure.tryCreateComponentFromExpression(
        structureWithProps,
        expression,
        `spatial-ravia-${options.isolationMode}`,
        { label: isolationLabel(options.isolationMode), tags: ["spatial-ravia-isolation"] }
      )
    : structureWithProps;
  const labelComponents = await createLabelComponents(viewer, runtime, structureWithProps);

  const update = viewer.plugin.state.data.build();

  if (options.isolationMode === "hydrogen-bonds") {
    viewer.plugin.builders.structure.representation.buildRepresentation(
      update,
      structureWithProps,
      {
        type: "cartoon",
        typeParams: {
          alpha: 0.16,
          visuals: ["polymer-trace", "nucleotide-ring"]
        },
        color: "chain-id",
        colorParams: {}
      },
      { tag: "spatial-ravia-hbond-context" }
    );
    viewer.plugin.builders.structure.representation.buildRepresentation(
      update,
      structureWithProps,
      {
        type: "interactions",
        typeParams: {
          sizeFactor: 0.32,
          visuals: ["intra-unit", "inter-unit", "bridge"]
        },
        color: "interaction-type",
        colorParams: {},
        size: "uniform",
        sizeParams: {}
      },
      { tag: "spatial-ravia-hydrogen-bonds" }
    );
  } else {
    viewer.plugin.builders.structure.representation.buildRepresentation(
      update,
      component,
      isolationRepresentation(options.viewMode, options.colorMode, options.isolationMode),
      { tag: `spatial-ravia-${options.isolationMode}-representation` }
    );
  }
  addNucleotideLabels(viewer, update, labelComponents, false, false);

  await update.commit();
}

async function createLabelComponents(
  viewer: MolstarViewerInstance,
  runtime: MolstarQueryRuntime,
  structure: MolstarSelector
) {
  const nucleotideComponent = await createComponent(viewer, runtime, structure, "nucleotide-labels", "Nucleotide numbering", {
    "residue-test": nucleotideResidueTest(runtime.MolScriptBuilder)
  });
  const terminalComponent = await createComponent(viewer, runtime, structure, "terminal-labels", "5' and 3' endpoint residues", {
    "residue-test": terminalResidueTest(runtime.MolScriptBuilder)
  });

  return { nucleotideComponent, terminalComponent };
}

function addNucleotideLabels(
  viewer: MolstarViewerInstance,
  update: MolstarStateBuilder,
  components: {
    nucleotideComponent: MolstarSelector | undefined;
    terminalComponent: MolstarSelector | undefined;
  },
  showNucleotideLabels = false,
  showTerminalLabels = false,
) {
  if (showNucleotideLabels) {
    viewer.plugin.builders.structure.representation.buildRepresentation(
      update,
      components.nucleotideComponent,
      {
        type: "label",
        typeParams: {
          level: "residue",
          residueScale: 0.46,
          background: true,
          backgroundMargin: 0.06,
          backgroundOpacity: 0.64,
          borderWidth: 0.06
        },
        color: "uniform",
        colorParams: uniformColor(0x111827)
      },
      { tag: "spatial-ravia-nucleotide-number-labels" }
    );
  }
  if (showTerminalLabels) {
    viewer.plugin.builders.structure.representation.buildRepresentation(
      update,
      components.terminalComponent,
      {
        type: "label",
        typeParams: {
          level: "residue",
          residueScale: 0.78,
          background: true,
          backgroundMargin: 0.12,
          backgroundOpacity: 0.82,
          borderWidth: 0.12
        },
        color: "uniform",
        colorParams: uniformColor(0x064e3b)
      },
      { tag: "spatial-ravia-terminal-residue-labels" }
    );
  }
}

function localDnaChemistryRepresentation(viewMode: StructureViewMode, colorMode: StructureColorMode) {
  const atomic = viewMode === "atomic";
  return {
    type: "ball-and-stick",
    typeParams: {
      sizeFactor: atomic ? dnaVisualSystem.representation.atomScale : dnaVisualSystem.representation.selectedNucleotideScale,
      sizeAspectRatio: 0.46,
      linkScale: dnaVisualSystem.representation.bondScale,
      aromaticBonds: true,
      ignoreHydrogens: true,
      radialSegments: 10,
    },
    color: atomic || colorMode === "element" ? "element-symbol" : colorMode === "base" ? "residue-name" : "chain-id",
    colorParams: atomic || colorMode === "element" ? { carbonColor: { name: "uniform", params: uniformColor(dnaVisualSystem.colors.atomCarbon) } } : {},
  };
}

function focusedBasePairResidueTest(MS: MolstarQueryRuntime["MolScriptBuilder"], focusedBasePair: number) {
  const pair = Math.min(dnaLength, Math.max(1, Math.round(focusedBasePair)));
  const partner = dnaLength - pair + 1;
  return MS.core.logic.or([
    MS.core.logic.and([
      MS.core.rel.eq([MS.ammp("label_asym_id"), "A"]),
      MS.core.rel.eq([MS.ammp("label_seq_id"), pair]),
    ]),
    MS.core.logic.and([
      MS.core.rel.eq([MS.ammp("label_asym_id"), "B"]),
      MS.core.rel.eq([MS.ammp("label_seq_id"), partner]),
    ]),
  ]);
}

/** Select complementary canonical-duplex spans; region evidence stays on DNA. */
function regulatoryRegionResidueTest(
  MS: MolstarQueryRuntime["MolScriptBuilder"],
  start: number,
  end: number,
) {
  const positions = Array.from(
    { length: Math.max(0, end - start + 1) },
    (_, index) => start + index,
  );
  const partnerPositions = positions.map((position) => dnaLength - position + 1);
  const residueIn = (values: number[]) => MS.core.logic.or(
    values.map((value) => MS.core.rel.eq([MS.ammp("label_seq_id"), value]))
  );
  return MS.core.logic.or([
    MS.core.logic.and([
      MS.core.rel.eq([MS.ammp("label_asym_id"), "A"]),
      residueIn(positions),
    ]),
    MS.core.logic.and([
      MS.core.rel.eq([MS.ammp("label_asym_id"), "B"]),
      residueIn(partnerPositions),
    ]),
  ]);
}

function isolationRepresentation(
  viewMode: StructureViewMode,
  colorMode: StructureColorMode,
  isolationMode: StructureIsolationMode
) {
  const color = isolationColor(colorMode, isolationMode);
  const params =
    color === "uniform"
      ? uniformColor(isolationMode === "strand-b" ? semanticColors.strandB : semanticColors.strandA)
      : colorParams(color);

  if (isolationMode === "nucleotide" || isolationMode === "base-pair") {
    return localDnaChemistryRepresentation(viewMode, colorMode);
  }

  if (isolationMode === "backbone") {
    return {
      type: "backbone",
      typeParams: {
        sizeFactor: 0.56
      },
      color: "uniform",
      colorParams: uniformColor(semanticColors.backbone)
    };
  }

  if (isolationMode === "strand-a" || isolationMode === "strand-b") {
    return {
      type: "ball-and-stick",
      typeParams: {
        sizeFactor: viewMode === "atomic" ? 0.24 : 0.32,
        sizeAspectRatio: 0.72,
        aromaticBonds: true
      },
      color,
      colorParams: params
    };
  }

  if (isolationMode === "phosphates") {
    return {
      type: "ball-and-stick",
      typeParams: {
        sizeFactor: 0.42,
        sizeAspectRatio: 0.74,
        aromaticBonds: false
      },
      color: "uniform",
      colorParams: uniformColor(semanticColors.phosphates)
    };
  }

  if (isolationMode === "sugars" || isolationMode === "bases") {
    return {
      type: "ball-and-stick",
      typeParams: {
        sizeFactor: isolationMode === "bases" ? 0.32 : 0.36,
        sizeAspectRatio: 0.72,
        aromaticBonds: isolationMode === "bases"
      },
      color: isolationMode === "bases" ? color : "uniform",
      colorParams: isolationMode === "bases" ? colorParams(color) : uniformColor(semanticColors.sugars)
    };
  }

  if (viewMode === "atomic") {
    return {
      type: "ball-and-stick",
      typeParams: {
        sizeFactor: 0.24,
        sizeAspectRatio: 0.72
      },
      color: "element-symbol",
      colorParams: {
        carbonColor: { name: "chain-id", params: {} }
      }
    };
  }

  return {
    type: viewMode === "ball-stick" ? "ball-and-stick" : "cartoon",
    typeParams:
      viewMode === "ball-stick"
        ? { sizeFactor: 0.32, sizeAspectRatio: 0.72 }
        : { sizeFactor: 0.62, visuals: ["polymer-trace", "polymer-gap", "nucleotide-ring", "nucleotide-atomic-bond"] },
    color,
    colorParams: params
  };
}

function isolationColor(colorMode: StructureColorMode, isolationMode: StructureIsolationMode) {
  if (isolationMode === "strand-a" || isolationMode === "strand-b") {
    return "uniform";
  }

  if (colorMode === "element" || isolationMode === "phosphates") {
    return "element-symbol";
  }

  if (colorMode === "strand") {
    return "chain-id";
  }

  return "residue-name";
}

function colorParams(color: string) {
  if (color === "uniform") {
    return uniformColor(semanticColors.strandA);
  }

  if (color === "element-symbol") {
    return {
      carbonColor: { name: "chain-id", params: {} }
    };
  }

  return {};
}

function uniformColor(hex: number) {
  return { value: hex };
}

function semanticColorName(colorMode: StructureColorMode, fallback: "bases") {
  if (colorMode === "element") {
    return "element-symbol";
  }

  if (colorMode === "strand") {
    return "chain-id";
  }

  if (fallback === "bases") {
    return "uniform";
  }

  return "uniform";
}

function semanticColorParams(colorMode: StructureColorMode, fallbackHex: number) {
  if (colorMode === "element") {
    return {
      carbonColor: { name: "element-symbol", params: {} }
    };
  }

  if (colorMode === "strand") {
    return {};
  }

  return uniformColor(fallbackHex);
}

function isolationExpression(
  runtime: MolstarQueryRuntime,
  isolationMode: StructureIsolationMode,
  focusedBasePair: number
) {
  const { MolScriptBuilder: MS } = runtime;

  if (isolationMode === "all" || isolationMode === "hydrogen-bonds") {
    return undefined;
  }

  if (isolationMode === "base-pair") {
    const pair = Math.min(dnaLength, Math.max(1, Math.round(focusedBasePair)));
    const partner = dnaLength - pair + 1;

    return MS.struct.modifier.union([
        MS.struct.generator.atomGroups({
          "chain-test": MS.core.rel.eq([MS.ammp("label_asym_id"), "A"]),
          "residue-test": MS.core.rel.eq([MS.ammp("label_seq_id"), pair])
        }),
        MS.struct.generator.atomGroups({
          "chain-test": MS.core.rel.eq([MS.ammp("label_asym_id"), "B"]),
          "residue-test": MS.core.rel.eq([MS.ammp("label_seq_id"), partner])
        })
      ]);
  }

  if (isolationMode === "nucleotide") {
    const nucleotide = Math.min(dnaLength, Math.max(1, Math.round(focusedBasePair)));
    return MS.struct.modifier.union([
      MS.struct.generator.atomGroups({
        "chain-test": MS.core.rel.eq([MS.ammp("label_asym_id"), "A"]),
        "residue-test": MS.core.rel.eq([MS.ammp("label_seq_id"), nucleotide])
      })
    ]);
  }

  if (isolationMode === "strand-a") {
    return atomGroups(MS, {
      "chain-test": MS.core.rel.eq([MS.ammp("label_asym_id"), "A"])
    });
  }

  if (isolationMode === "strand-b") {
    return atomGroups(MS, {
      "chain-test": MS.core.rel.eq([MS.ammp("label_asym_id"), "B"])
    });
  }

  if (isolationMode === "bases") {
    return atomGroups(MS, {
      "atom-test": MS.core.logic.not([atomNameIn(MS, nucleicBackboneAtoms)])
    });
  }

  if (isolationMode === "backbone") {
    return atomGroups(MS, {
      "atom-test": atomNameIn(MS, nucleicBackboneAtoms)
    });
  }

  if (isolationMode === "phosphates") {
    return atomGroups(MS, {
      "atom-test": atomNameIn(MS, phosphateAtoms)
    });
  }

  return atomGroups(MS, {
    "atom-test": atomNameIn(MS, sugarAtoms)
  });
}

function atomGroups(
  MS: MolstarQueryRuntime["MolScriptBuilder"],
  params: Record<string, unknown>
) {
  return MS.struct.modifier.union([MS.struct.generator.atomGroups(params)]);
}

function createComponent(
  viewer: MolstarViewerInstance,
  runtime: MolstarQueryRuntime,
  structure: MolstarSelector,
  key: string,
  label: string,
  params: Record<string, unknown>
) {
  return viewer.plugin.builders.structure.tryCreateComponentFromExpression(
    structure,
    atomGroups(runtime.MolScriptBuilder, params),
    `spatial-ravia-${key}`,
    { label, tags: ["spatial-ravia-semantic"] }
  );
}

function nucleotideResidueTest(MS: MolstarQueryRuntime["MolScriptBuilder"]) {
  return MS.core.set.has([MS.set("DA", "DC", "DG", "DT", "A", "C", "G", "T"), MS.ammp("label_comp_id")]);
}

function terminalResidueTest(MS: MolstarQueryRuntime["MolScriptBuilder"]) {
  return MS.core.logic.and([
    nucleotideResidueTest(MS),
    MS.core.logic.or([
      MS.core.rel.eq([MS.ammp("label_seq_id"), 1]),
      MS.core.rel.eq([MS.ammp("label_seq_id"), dnaLength])
    ])
  ]);
}

function atomNameIn(MS: MolstarQueryRuntime["MolScriptBuilder"], atoms: string[]) {
  return MS.core.set.has([MS.set(...atoms), MS.ammp("label_atom_id")]);
}

function isolationLabel(mode: StructureIsolationMode) {
  switch (mode) {
    case "strand-a":
      return "Strand A";
    case "strand-b":
      return "Strand B";
    case "base-pair":
      return "Focused base pair";
    case "nucleotide":
      return "Focused nucleotide";
    case "bases":
      return "Bases";
    case "backbone":
      return "Backbone";
    case "phosphates":
      return "Phosphates";
    case "sugars":
      return "Sugars";
    case "hydrogen-bonds":
      return "Hydrogen bonds";
    case "all":
      return "All";
  }
}

const phosphateAtoms = ["P", "OP1", "OP2", "O1P", "O2P"];
const dnaLength = dnaVisualSystem.geometry.canonicalDuplexBasePairCount;
const sugarAtoms = ["C1'", "C2'", "C3'", "C4'", "C5'", "O4'", "O2'", "C1*", "C2*", "C3*", "C4*", "C5*", "O4*", "O2*"];
const nucleicBackboneAtoms = [
  ...phosphateAtoms,
  ...sugarAtoms,
  "O3'",
  "O5'",
  "O3*",
  "O5*"
];

function representationParams(viewMode: StructureViewMode, colorMode: StructureColorMode) {
  return {
    ignoreHydrogens: viewMode !== "atomic",
    ignoreHydrogensVariant: "all",
    quality: viewMode === "atomic" ? "high" : "auto",
    theme: colorTheme(viewMode, colorMode)
  };
}

function colorTheme(viewMode: StructureViewMode, colorMode: StructureColorMode) {
  if (viewMode === "atomic" || colorMode === "element") {
    return {
      globalName: "element-symbol",
      carbonColor: colorMode === "strand" ? "chain-id" : "element-symbol",
      symmetryColor: "chain-id",
      globalColorParams: {
        carbonColor: {
          name: colorMode === "strand" ? "chain-id" : "element-symbol",
          params: {}
        }
      },
      symmetryColorParams: {}
    };
  }

  if (colorMode === "strand") {
    return baseColorTheme("chain-id");
  }

  if (colorMode === "backbone") {
    return {
      globalName: "cartoon",
      carbonColor: "chain-id",
      symmetryColor: "chain-id",
      globalColorParams: {
        mainchain: {
          name: "chain-id",
          params: {}
        },
        sidechain: {
          name: "residue-name",
          params: {}
        }
      },
      symmetryColorParams: {}
    };
  }

  return baseColorTheme("residue-name");
}

function baseColorTheme(globalName: "chain-id" | "residue-name") {
  return {
    globalName,
    carbonColor: "chain-id",
    symmetryColor: "chain-id",
    globalColorParams: {},
    symmetryColorParams: {}
  };
}

function setMolstarBackground(
  viewer: MolstarViewerInstance,
  Color: MolstarGlobal["Color"] | null,
  theme: StructureTheme
) {
  const hex = theme === "light" ? 0xffffff : 0x020305;

  viewer.plugin.canvas3d?.setProps({
    cameraClipping: { radius: 80 },
    renderer: { backgroundColor: Color ? Color(hex) : hex }
  });
}

function frameStructure(viewer: MolstarViewerInstance, preset: StructureCameraPreset, family: DnaVisualFamily = "structure") {
  viewer.plugin.managers.camera.reset(undefined, 0);
  window.setTimeout(() => {
    const snapshot = viewer.plugin.canvas3d?.camera.getSnapshot();

    if (!snapshot) {
      return;
    }

    const familyContract = getDnaSceneCameraContract(family);
    const radiusScale = preset === "groove" ? 0.48 : familyContract.molstarDistanceScale;
    const sourceTarget = snapshot.target;
    const sourceDistance = Math.hypot(
      snapshot.position[0] - sourceTarget[0],
      snapshot.position[1] - sourceTarget[1],
      snapshot.position[2] - sourceTarget[2],
    ) || snapshot.radius * 2;
    const directionLength = Math.hypot(...familyContract.viewDirection);
    const direction: [number, number, number] = directionLength > 0
      ? familyContract.viewDirection.map((value) => value / directionLength) as [number, number, number]
      : [0, 0, 1];
    const target: [number, number, number] = [
      sourceTarget[0],
      sourceTarget[1] - snapshot.radius * familyContract.usableViewportVerticalOffset,
      sourceTarget[2],
    ];
    const distance = Math.min(
      familyContract.maxDistance,
      Math.max(familyContract.minDistance, sourceDistance * radiusScale),
    );
    const nextSnapshot: Partial<MolstarCameraSnapshot> = {
      ...snapshot,
      radius: Math.max(snapshot.radius * radiusScale, preset === "nucleotide" ? 2.2 : preset === "base-pair" ? 4 : 12),
      radiusMax: Math.max(snapshot.radiusMax * radiusScale, 24),
      target,
      position: [
        target[0] + direction[0] * distance,
        target[1] + direction[1] * distance,
        target[2] + direction[2] * distance,
      ],
    };

    if (preset === "groove") {
      const radius = distance;
      nextSnapshot.position = [
        snapshot.target[0] + radius * 0.18,
        snapshot.target[1] - radius * 1.9,
        snapshot.target[2] + radius * 0.38
      ];
      nextSnapshot.up = [0, 0, 1];
    } else if (preset === "reset") {
      // The family policy already supplies an oblique teaching angle. Preserve
      // it instead of returning to Mol*'s full-structure reset framing.
      nextSnapshot.up = [0, 0, 1];
    }

    viewer.plugin.managers.camera.setSnapshot(nextSnapshot, 250);
  }, 40);
}

function themeBackground(theme: StructureTheme) {
  return theme === "light" ? "#ffffff" : "#020305";
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

function loadMolstarQueryRuntime() {
  if (molstarQueryPromise) {
    return molstarQueryPromise;
  }

  const runtimePromise = import("molstar/lib/mol-script/language/builder")
    .then(
      (builderModule): MolstarQueryRuntime => ({
        MolScriptBuilder: builderModule.MolScriptBuilder as unknown as MolstarQueryRuntime["MolScriptBuilder"]
      })
    )
    .catch((error) => {
      molstarQueryPromise = null;
      throw error;
    });

  molstarQueryPromise = runtimePromise;
  return runtimePromise;
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

"use client";

import { useEffect, useRef, useState } from "react";
import type { SpatialRaviaTheme } from "./spatial-ravia-theme";
import { MolstarPresentationRebuildGate } from "./MolstarPresentationRebuildGate";
import type { TranslationDisplayIntent } from "./biology-translation-display-intent";

type PresentationKind = "translation" | "transcription";
type Viewer = {
  dispose: () => void;
  plugin: {
    clear: (resetViewport?: boolean) => Promise<unknown>;
    canvas3d?: { setProps: (props: Record<string, unknown>) => void };
    managers: { camera: { reset: (snapshot?: unknown, durationMs?: number) => void; focusObject: (options: Record<string, unknown>) => void } };
    builders: {
      data: { download: (params: { url: string; isBinary: boolean }) => Promise<unknown> };
      structure: {
        parseTrajectory: (data: unknown, format: "mmcif" | "pdb") => Promise<unknown>;
        createModel: (trajectory: unknown, params?: Record<string, unknown>) => Promise<unknown>;
        createStructure: (model: unknown, params?: Record<string, unknown>) => Promise<unknown>;
        insertStructureProperties: (structure: unknown) => Promise<unknown>;
        tryCreateComponentFromExpression: (structure: unknown, expression: unknown, key: string, params?: Record<string, unknown>) => Promise<unknown>;
        representation: {
          addRepresentation: (structure: unknown, props: Record<string, unknown>, options?: Record<string, unknown>) => Promise<unknown>;
        };
      };
    };
  };
};
type PresentationMolstarGlobal = { Viewer: { create: (target: HTMLElement, options: Record<string, unknown>) => Promise<Viewer> }; Color?: (hex: number) => unknown };
type QueryRuntime = { MolScriptBuilder: Record<string, unknown> };

const scriptUrl = "/spatial-ravia/molstar/molstar.js";
const stylesheetUrl = "/spatial-ravia/molstar/molstar.css";
let molstarPromise: Promise<PresentationMolstarGlobal> | null = null;
let queryPromise: Promise<QueryRuntime> | null = null;

function molstarGlobal() {
  return window as unknown as { molstar?: PresentationMolstarGlobal };
}
function ensureMolstar(): Promise<PresentationMolstarGlobal> {
  const global = molstarGlobal();
  if (global.molstar?.Viewer) return Promise.resolve(global.molstar);
  if (molstarPromise) return molstarPromise;
  molstarPromise = new Promise<PresentationMolstarGlobal>((resolve, reject) => {
    if (!document.querySelector(`link[href="${stylesheetUrl}"]`)) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = stylesheetUrl;
      document.head.appendChild(css);
    }
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => {
      const loaded = molstarGlobal().molstar;
      if (loaded?.Viewer) resolve(loaded);
      else reject(new Error("Mol* viewer global unavailable"));
    };
    script.onerror = () => reject(new Error("Unable to load Mol* viewer bundle"));
    document.head.appendChild(script);
  }).catch((error) => { molstarPromise = null; throw error; });
  return molstarPromise as Promise<PresentationMolstarGlobal>;
}

function queryRuntime() {
  if (!queryPromise) {
    queryPromise = import("molstar/lib/mol-script/language/builder").then(
      (module) => ({ MolScriptBuilder: module.MolScriptBuilder as unknown as Record<string, unknown> })
    );
  }
  return queryPromise;
}

function query(MS: Record<string, unknown>, params: Record<string, unknown>) {
  const struct = MS.struct as { generator: { atomGroups: (value: Record<string, unknown>) => unknown }; modifier: { union: (value: unknown[]) => unknown } };
  return struct.modifier.union([struct.generator.atomGroups(params)]);
}
function ammp(MS: Record<string, unknown>, name: string) {
  return (MS.ammp as (value: string) => unknown)(name);
}
function equals(MS: Record<string, unknown>, left: unknown, right: string | number) {
  return ((MS.core as { rel: { eq: (args: unknown[]) => unknown } }).rel.eq)([left, right]);
}
function oneOf(MS: Record<string, unknown>, tests: unknown[]) {
  return ((MS.core as { logic: { or: (args: unknown[]) => unknown } }).logic.or)(tests);
}
function chainComponent(viewer: Viewer, structure: unknown, MS: Record<string, unknown>, id: string, chain: string) {
  return viewer.plugin.builders.structure.tryCreateComponentFromExpression(structure, query(MS, {
    "chain-test": equals(MS, ammp(MS, "label_asym_id"), chain),
  }), `spatial-ravia-${id}`, { label: chain });
}
function chainsComponent(viewer: Viewer, structure: unknown, MS: Record<string, unknown>, id: string, chains: readonly string[]) {
  return viewer.plugin.builders.structure.tryCreateComponentFromExpression(structure, query(MS, {
    "chain-test": oneOf(MS, chains.map((chain) => equals(MS, ammp(MS, "label_asym_id"), chain))),
  }), `spatial-ravia-${id}`, { label: id });
}
function residueComponent(viewer: Viewer, structure: unknown, MS: Record<string, unknown>, id: string, chain: string, seqIds: readonly number[]) {
  return viewer.plugin.builders.structure.tryCreateComponentFromExpression(structure, query(MS, {
    "chain-test": equals(MS, ammp(MS, "label_asym_id"), chain),
    "residue-test": oneOf(MS, seqIds.map((seq) => equals(MS, ammp(MS, "label_seq_id"), seq))),
  }), `spatial-ravia-${id}`, { label: `${chain}:${seqIds.join(",")}` });
}
function entityComponent(viewer: Viewer, structure: unknown, MS: Record<string, unknown>, id: string, entityIds: readonly string[]) {
  const set = (MS.set as (...values: string[]) => unknown)(...entityIds);
  const has = ((MS.core as { set: { has: (args: unknown[]) => unknown } }).set.has)([set, ammp(MS, "label_entity_id")]);
  return viewer.plugin.builders.structure.tryCreateComponentFromExpression(structure, query(MS, { "entity-test": has }), `spatial-ravia-${id}`, { label: id });
}
const uniform = (color: number) => ({ value: color });
const cartoon = (color: number, alpha = 1, sizeFactor = 0.55) => ({
  type: "cartoon", typeParams: { visuals: ["polymer-trace", "nucleotide-ring", "nucleotide-block"], sizeFactor, alpha, quality: "medium" }, color: "uniform", colorParams: uniform(color),
});
const atoms = (color = 0xffffff, sizeFactor = 0.22) => ({
  type: "ball-and-stick", typeParams: { visuals: ["element-sphere", "intra-bond"], sizeFactor, sizeAspectRatio: 0.5, linkScale: 0.34, ignoreHydrogens: true, radialSegments: 10 }, color: "element-symbol", colorParams: { carbonColor: { name: "uniform", params: uniform(color) } },
});

async function addRepresentation(viewer: Viewer, component: unknown, props: Record<string, unknown>) {
  if (!component) return;
  return viewer.plugin.builders.structure.representation.addRepresentation(component, props);
}

function focusPresentation(viewer: Viewer, representations: readonly unknown[], minRadius: number) {
  const targets = representations
    .map((representation) => (representation as { ref?: string } | undefined)?.ref)
    .filter((ref): ref is string => Boolean(ref))
    .map((targetRef) => ({ targetRef }));
  if (targets.length > 0) viewer.plugin.managers.camera.focusObject({ targets, minRadius, durationMs: 0 });
}

async function applyTranslation(viewer: Viewer, structure: unknown, MS: Record<string, unknown>, intent: TranslationDisplayIntent = "overview") {
  const transferFocus = intent === "transfer";
  const large = await entityComponent(viewer, structure, MS, "large-subunit", Array.from({ length: 32 }, (_, i) => String(i + 26)));
  await addRepresentation(viewer, large, { type: "gaussian-surface", typeParams: { resolution: transferFocus ? 3.2 : 1.8, smoothness: transferFocus ? 1.8 : 1.4, alpha: transferFocus ? 0.035 : 0.16, quality: "medium" }, color: "uniform", colorParams: uniform(0x8f989d) });
  const small = await entityComponent(viewer, structure, MS, "small-subunit", Array.from({ length: 21 }, (_, i) => String(i + 1)));
  await addRepresentation(viewer, small, { type: "gaussian-surface", typeParams: { resolution: transferFocus ? 3.2 : 1.8, smoothness: transferFocus ? 1.8 : 1.4, alpha: transferFocus ? 0.04 : 0.18, quality: "medium" }, color: "uniform", colorParams: uniform(0x718ca0) });
  const functionalRepresentations: unknown[] = [];
  const structuralActors = transferFocus
    ? [["trna-a", "Y", 0x8bbecd], ["trna-p", "V", 0xa99bc9], ["mrna", "X", 0x7ed0af]] as const
    : [["trna-a", "Y", 0x8bbecd], ["trna-p", "V", 0xa99bc9], ["trna-e", "W", 0x8c99a5], ["mrna", "X", 0x7ed0af]] as const;
  for (const [id, chain, color] of structuralActors) {
    const component = await chainComponent(viewer, structure, MS, id, chain);
    const representation = await addRepresentation(viewer, component, cartoon(color, 1, transferFocus ? 0.45 : 0.55));
    if (!transferFocus || chain !== "X") functionalRepresentations.push(representation);
  }
  const localDetails = transferFocus
    ? [["a-acceptor", "Y", [75, 76, 77]], ["p-acceptor", "V", [75, 76, 77]]] as const
    : [["a-anticodon", "Y", [34, 35, 36]], ["p-anticodon", "V", [34, 35, 36]], ["e-anticodon", "W", [34, 35, 36]], ["a-acceptor", "Y", [75, 76, 77]], ["p-acceptor", "V", [75, 76, 77]], ["e-acceptor", "W", [74, 75, 76]]] as const;
  for (const [id, chain, residues] of localDetails) {
    const component = await residueComponent(viewer, structure, MS, id, chain, residues);
    await addRepresentation(viewer, component, atoms(0xffffff, transferFocus ? 0.16 : 0.22));
  }
  // In transfer focus, A/P bodies set a stable ownership frame; neither the
  // complete ribosome nor the moving/long mRNA can enlarge the composition.
  focusPresentation(viewer, functionalRepresentations, transferFocus ? 20 : 24);
}

async function applyTranscription(viewer: Viewer, structure: unknown, MS: Record<string, unknown>) {
  // One quiet RNAP envelope. Nucleic acids and the local chemistry own the
  // teaching hierarchy; protein simply establishes the molecular machine.
  const protein = await chainsComponent(viewer, structure, MS, "rnap", ["G", "H", "I", "J", "K"]);
  await addRepresentation(viewer, protein, { type: "gaussian-surface", typeParams: { resolution: 2.8, smoothness: 1.65, alpha: 0.095, quality: "medium" }, color: "uniform", colorParams: uniform(0x78838d) });
  const nucleicRepresentations: unknown[] = [];
  for (const [id, chain, color, sizeFactor] of [["dna-a", "A", 0x77aaca, 0.42], ["dna-b", "B", 0x9f8cc5, 0.42], ["rna", "R", 0x38c58e, 0.48]] as const) {
    const component = await chainComponent(viewer, structure, MS, id, chain);
    nucleicRepresentations.push(await addRepresentation(viewer, component, cartoon(color, 1, sizeFactor)));
  }
  for (const [id, chain, residues] of [["active-dna-a", "A", [1, 2, 3]], ["active-dna-b", "B", [1, 2, 3]], ["active-rna", "R", [18, 19, 20]]] as const) {
    const component = await residueComponent(viewer, structure, MS, id, chain, residues);
    await addRepresentation(viewer, component, atoms(0x4c5964, 0.16));
  }
  // This intentionally does not include RNAP in the framing calculation: the
  // deposited duplex/RNA region is the teaching target, while RNAP surrounds
  // it as quiet structural context rather than determining a full-model shot.
  focusPresentation(viewer, nucleicRepresentations, 16);
}

export function MolstarStructurePresentationAdapter({ kind, theme, translationIntent }: { kind: PresentationKind; theme: SpatialRaviaTheme; translationIntent?: TranslationDisplayIntent }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const rebuildGateRef = useRef(new MolstarPresentationRebuildGate());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ensureMolstar().then(async (molstar) => {
      if (!mountRef.current || cancelled) return;
      const viewer = await molstar.Viewer.create(mountRef.current, { layoutIsExpanded: false, layoutShowControls: false, viewportShowControls: false, viewportShowExpand: false, viewportShowSettings: false, viewportShowSelectionMode: false, viewportShowAnimation: false, viewportShowTrajectoryControls: false, viewportShowScreenshotControls: false, viewportShowToggleFullscreen: false, viewportShowReset: false });
      if (cancelled) { viewer.dispose(); return; }
      viewerRef.current = viewer;
      setReady(true);
    }).catch((error) => console.error("[Spatial Ravia] Mol* presentation adapter unavailable", error));
    return () => { cancelled = true; viewerRef.current?.dispose(); viewerRef.current = null; };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!ready || !viewer) return;
    viewer.plugin.canvas3d?.setProps({ renderer: { backgroundColor: theme === "dark" ? 0x020305 : 0xf6f8f7 } });
  }, [ready, theme]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!ready || !viewer) return;
    const rebuildGate = rebuildGateRef.current;
    const rebuild = async (isCurrent: () => boolean) => {
      // Serialize full state-tree lifecycles. A previous request is either
      // completed and cleared before this begins, or skipped before it can
      // create a component in the newer structure subtree.
      if (!isCurrent() || viewerRef.current !== viewer) return;
      await viewer.plugin.clear(false);
      if (!isCurrent() || viewerRef.current !== viewer) return;
      const format = kind === "translation" ? "mmcif" : "pdb";
      const data = await viewer.plugin.builders.data.download({ url: kind === "translation" ? "/spatial-ravia/structures/4V5C.cif" : "/spatial-ravia/structures/6ALH.pdb", isBinary: false });
      if (!isCurrent() || viewerRef.current !== viewer) return;
      const trajectory = await viewer.plugin.builders.structure.parseTrajectory(data, format);
      const model = await viewer.plugin.builders.structure.createModel(trajectory, { modelIndex: 0 });
      const structure = await viewer.plugin.builders.structure.createStructure(model, kind === "translation" ? { name: "assembly", params: { id: "1" } } : { name: "model", params: {} });
      const withProperties = await viewer.plugin.builders.structure.insertStructureProperties(structure) ?? structure;
      const { MolScriptBuilder } = await queryRuntime();
      if (!isCurrent() || viewerRef.current !== viewer) return;
      if (kind === "translation") await applyTranslation(viewer, withProperties, MolScriptBuilder, translationIntent);
      else await applyTranscription(viewer, withProperties, MolScriptBuilder);
      if (!isCurrent() || viewerRef.current !== viewer) return;
    };
    void rebuildGate.schedule(rebuild).catch((error) =>
      console.error("[Spatial Ravia] Mol* structure presentation failed", error)
    );
    return () => { rebuildGate.invalidate(); };
  }, [kind, ready, translationIntent]);

  return <div ref={mountRef} className="molstarStructurePresentation" aria-label={`${kind} structure-derived Mol* presentation`} />;
}

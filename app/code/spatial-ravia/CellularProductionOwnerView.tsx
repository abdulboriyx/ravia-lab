"use client";

import { Component, useMemo, type ErrorInfo, type ReactNode } from "react";
import type { ProductionPromptRoute } from "./production-prompt-router";
import { createCanonicalEukaryoticGeneExpressionProgram } from "./cellular-gene-expression";
import { projectGeneExpressionProductionAtTime } from "./gene-expression-production";
import { createCanonicalSecretoryPathwayProgram } from "./secretory-pathway";
import { projectSecretoryProductionAtTime } from "./secretory-production";
import { createCanonicalIntracellularTransportProductionProgram, projectIntracellularTransportProductionAtTime } from "./intracellular-transport-production";
import { createCanonicalCellularSignalingProductionProgram, projectCellularSignalingProductionAtTime } from "./cellular-signaling-production";
import { applyCellularGeneExpressionExactFrame, applyCellularSecretoryExactFrame, applyCellularIntracellularTransportExactFrame, applyCellularSignalingExactFrame } from "./p4-b-exact-frame-runtime";
import { cellularProductionOwnerComponents } from "./cellular-production-dispatch";

type DisplayItem = Readonly<{ label: string; value: string | number | boolean }>;
type CellularProjection = Readonly<{ ownerId: string; timeSeconds: number; focus: string; items: readonly DisplayItem[] }>;

const renderConfig = { width: 1280, height: 720, pixelRatio: 1, background: { mode: "opaque" as const, color: "#f7fafb" } };

function geneProjection(): CellularProjection {
  const result = projectGeneExpressionProductionAtTime(createCanonicalEukaryoticGeneExpressionProgram(), 0);
  if (!result.ok) throw new Error(`${result.code}: ${result.reasons.join("; ")}`);
  const applied = applyCellularGeneExpressionExactFrame(result.projection, renderConfig);
  if (!applied.ok) throw new Error(`${applied.code}: ${applied.reasons.join("; ")}`);
  const p = applied.state.projection;
  return { ownerId: p.ownerId, timeSeconds: p.timeSeconds, focus: p.focus, items: [
    { label: "Nucleus / cytosol", value: `${p.compartments.nucleus} / ${p.compartments.cytosol}` },
    { label: "DNA bubble", value: p.dna.transcriptionBubble },
    { label: "RNA Pol II", value: p.transcription.polymeraseState },
    { label: "Nascent RNA", value: p.transcription.visibleRnaLength },
    { label: "mRNA localization", value: p.exportState.localization },
    { label: "Translation", value: p.translation.state },
    { label: "Peptide length", value: p.translation.peptideLength },
  ] };
}

function secretoryProjection(): CellularProjection {
  const result = projectSecretoryProductionAtTime(createCanonicalSecretoryPathwayProgram(), 0);
  if (!result.ok) throw new Error(`${result.code}: ${result.reasons.join("; ")}`);
  const applied = applyCellularSecretoryExactFrame(result.projection, renderConfig);
  if (!applied.ok) throw new Error(`${applied.code}: ${applied.reasons.join("; ")}`);
  const p = applied.state.projection;
  return { ownerId: p.ownerId, timeSeconds: p.timeSeconds, focus: p.focus, items: [
    { label: "ER / lumen", value: `${p.compartments.er} / ${p.compartments.erLumen}` },
    { label: "Protein", value: p.protein.localization },
    { label: "Signal / translocon", value: `${p.protein.signalState} / ${p.targeting.transloconState}` },
    { label: "Folding / quality", value: `${p.protein.foldingState} / ${p.protein.qualityState}` },
    { label: "Golgi", value: p.golgi },
    { label: "Extracellular", value: p.extracellular },
  ] };
}

function transportProjection(): CellularProjection {
  const result = projectIntracellularTransportProductionAtTime(createCanonicalIntracellularTransportProductionProgram(), 0);
  if (!result.ok) throw new Error(`${result.code}: ${result.reasons.join("; ")}`);
  const applied = applyCellularIntracellularTransportExactFrame(result.projection, renderConfig);
  if (!applied.ok) throw new Error(`${applied.code}: ${applied.reasons.join("; ")}`);
  const p = applied.state.projection;
  return { ownerId: p.ownerId, timeSeconds: p.timeSeconds, focus: p.focus, items: [
    { label: "Track polarity", value: p.track.polarity ?? "UNRESOLVED" },
    { label: "Motor / activity", value: `${p.motor.class} / ${p.motor.activity}` },
    { label: "Cargo / adaptor", value: `${p.cargo.id ?? "none"} / ${p.cargo.adaptorId ?? "none"}` },
    { label: "Direction", value: p.track.direction ?? "UNRESOLVED" },
    { label: "Endocytic membrane", value: p.endocytosis.membraneState },
    { label: "Early endosome", value: p.endocytosis.earlyEndosome },
  ] };
}

function signalingProjection(): CellularProjection {
  const result = projectCellularSignalingProductionAtTime(createCanonicalCellularSignalingProductionProgram(), 0);
  if (!result.ok) throw new Error(`${result.code}: ${result.reasons.join("; ")}`);
  const applied = applyCellularSignalingExactFrame(result.projection, renderConfig);
  if (!applied.ok) throw new Error(`${applied.code}: ${applied.reasons.join("; ")}`);
  const p = applied.state.projection;
  return { ownerId: p.ownerId, timeSeconds: p.timeSeconds, focus: p.focus, items: [
    { label: "Ligand bound", value: p.ligand.bound },
    { label: "Receptor", value: `${p.receptor.state} / ${p.receptor.phosphorylation}` },
    { label: "Ras / Raf", value: `${p.cascade.ras} / ${p.cascade.raf}` },
    { label: "MEK / ERK", value: `${p.cascade.mek} / ${p.cascade.erk}` },
    { label: "ERK localization", value: p.cascade.erkLocalization },
    { label: "Target response", value: p.nuclearResponse.stateOfTarget },
  ] };
}

const projectionForOwner: Record<string, () => CellularProjection> = {
  GENE_EXPRESSION_CELLULAR_V1: geneProjection,
  SECRETORY_PATHWAY_CELLULAR_V1: secretoryProjection,
  INTRACELLULAR_TRANSPORT_CELLULAR_V1: transportProjection,
  CELL_SIGNALING_RTK_MAPK_V1: signalingProjection,
};

class ProductionRenderBoundary extends Component<{ route: ProductionPromptRoute; children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) {}
  render() {
    if (this.state.error) return <section className="spatialRaviaStatus" role="alert"><strong>PRODUCTION_RENDER_FAILED</strong><div>Owner: {this.props.route.productionOwner}</div><div>Capability: {this.props.route.capabilityId}</div><div>Failure code: PRODUCTION_RENDER_FAILED</div></section>;
    return this.props.children;
  }
}

export function CellularProductionOwnerView({ route }: { route: ProductionPromptRoute }) {
  return <ProductionRenderBoundary route={route}><CellularProductionOwnerFrame route={route} /></ProductionRenderBoundary>;
}

function CellularProductionOwnerFrame({ route }: { route: ProductionPromptRoute }) {
  const projection = useMemo(() => projectionForOwner[route.productionOwner]?.(), [route.productionOwner]);
  if (!projection) throw new Error(`PRODUCTION_RENDERER_OWNER_UNMOUNTED: ${route.productionOwner}`);
  return <section className="cellularProductionMount" aria-label={`${projection.ownerId} production view`} data-production-owner={projection.ownerId} data-production-focus={projection.focus} data-exact-time={projection.timeSeconds}>
    <header><strong>{cellularProductionOwnerComponents[projection.ownerId as keyof typeof cellularProductionOwnerComponents]}</strong><span> · EXACT_FRAME · t={projection.timeSeconds}s</span></header>
    <div className="cellularProductionSchematic" role="img" aria-label={`${projection.ownerId} schematic production frame`}>
      {projection.items.map((item) => <div className="cellularProductionCard" key={item.label}><span>{item.label}</span><strong>{String(item.value)}</strong></div>)}
    </div>
    <small>S2_SCHEMATIC · canonical projection + P4 exact-frame application</small>
  </section>;
}

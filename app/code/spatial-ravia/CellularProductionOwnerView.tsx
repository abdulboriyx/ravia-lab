"use client";

import { Component, useMemo, useState, type ErrorInfo, type ReactNode } from "react";
import type { ProductionPromptRoute } from "./production-prompt-router";
import { createCanonicalEukaryoticGeneExpressionProgram, type GeneExpressionProgramV1 } from "./cellular-gene-expression";
import { projectGeneExpressionProductionAtTime, type GeneExpressionProductionProjectionV1 } from "./gene-expression-production";
import { createCanonicalSecretoryPathwayProgram } from "./secretory-pathway";
import { projectSecretoryProductionAtTime } from "./secretory-production";
import { createCanonicalIntracellularTransportProductionProgram, projectIntracellularTransportProductionAtTime } from "./intracellular-transport-production";
import { createCanonicalCellularSignalingProductionProgram, projectCellularSignalingProductionAtTime } from "./cellular-signaling-production";
import { applyCellularGeneExpressionExactFrame, applyCellularSecretoryExactFrame, applyCellularIntracellularTransportExactFrame, applyCellularSignalingExactFrame } from "./p4-b-exact-frame-runtime";
import { cellularProductionOwnerComponents } from "./cellular-production-dispatch";

type DisplayItem = Readonly<{ label: string; value: string | number | boolean }>;
type CellularProjection = Readonly<{ ownerId: string; timeSeconds: number; focus: string; items: readonly DisplayItem[] }>;
const renderConfig = { width: 1280, height: 720, pixelRatio: 1, background: { mode: "opaque" as const, color: "#f7fafb" } };
const transcriptionSteps = [
  { label: "START", time: 0 }, { label: "INITIATION", time: 0.5 }, { label: "ELONGATION", time: 1.5 }, { label: "TERMINATION", time: 2 },
] as const;

function geneProjection(program: GeneExpressionProgramV1, timeSeconds: number): GeneExpressionProductionProjectionV1 {
  const result = projectGeneExpressionProductionAtTime(program, timeSeconds);
  if (!result.ok) throw new Error(`${result.code}: ${result.reasons.join("; ")}`);
  const applied = applyCellularGeneExpressionExactFrame(result.projection, renderConfig);
  if (!applied.ok) throw new Error(`${applied.code}: ${applied.reasons.join("; ")}`);
  return applied.state.projection;
}

function secretoryProjection(): CellularProjection {
  const result = projectSecretoryProductionAtTime(createCanonicalSecretoryPathwayProgram(), 0);
  if (!result.ok) throw new Error(`${result.code}: ${result.reasons.join("; ")}`);
  const applied = applyCellularSecretoryExactFrame(result.projection, renderConfig);
  if (!applied.ok) throw new Error(`${applied.code}: ${applied.reasons.join("; ")}`);
  const p = applied.state.projection;
  return { ownerId: p.ownerId, timeSeconds: p.timeSeconds, focus: p.focus, items: [
    { label: "ER / lumen", value: `${p.compartments.er} / ${p.compartments.erLumen}` }, { label: "Protein", value: p.protein.localization },
    { label: "Signal / translocon", value: `${p.protein.signalState} / ${p.targeting.transloconState}` }, { label: "Folding / quality", value: `${p.protein.foldingState} / ${p.protein.qualityState}` },
    { label: "Golgi", value: p.golgi }, { label: "Extracellular", value: p.extracellular },
  ] };
}

function transportProjection(): CellularProjection {
  const result = projectIntracellularTransportProductionAtTime(createCanonicalIntracellularTransportProductionProgram(), 0);
  if (!result.ok) throw new Error(`${result.code}: ${result.reasons.join("; ")}`);
  const applied = applyCellularIntracellularTransportExactFrame(result.projection, renderConfig);
  if (!applied.ok) throw new Error(`${applied.code}: ${applied.reasons.join("; ")}`);
  const p = applied.state.projection;
  return { ownerId: p.ownerId, timeSeconds: p.timeSeconds, focus: p.focus, items: [
    { label: "Track polarity", value: p.track.polarity ?? "UNRESOLVED" }, { label: "Motor / activity", value: `${p.motor.class} / ${p.motor.activity}` },
    { label: "Cargo / adaptor", value: `${p.cargo.id ?? "none"} / ${p.cargo.adaptorId ?? "none"}` }, { label: "Direction", value: p.track.direction ?? "UNRESOLVED" },
    { label: "Endocytic membrane", value: p.endocytosis.membraneState }, { label: "Early endosome", value: p.endocytosis.earlyEndosome },
  ] };
}

function signalingProjection(): CellularProjection {
  const result = projectCellularSignalingProductionAtTime(createCanonicalCellularSignalingProductionProgram(), 0);
  if (!result.ok) throw new Error(`${result.code}: ${result.reasons.join("; ")}`);
  const applied = applyCellularSignalingExactFrame(result.projection, renderConfig);
  if (!applied.ok) throw new Error(`${applied.code}: ${applied.reasons.join("; ")}`);
  const p = applied.state.projection;
  return { ownerId: p.ownerId, timeSeconds: p.timeSeconds, focus: p.focus, items: [
    { label: "Ligand bound", value: p.ligand.bound }, { label: "Receptor", value: `${p.receptor.state} / ${p.receptor.phosphorylation}` },
    { label: "Ras / Raf", value: `${p.cascade.ras} / ${p.cascade.raf}` }, { label: "MEK / ERK", value: `${p.cascade.mek} / ${p.cascade.erk}` },
    { label: "ERK localization", value: p.cascade.erkLocalization }, { label: "Target response", value: p.nuclearResponse.stateOfTarget },
  ] };
}

const projectionForOwner: Record<string, () => CellularProjection> = {
  SECRETORY_PATHWAY_CELLULAR_V1: secretoryProjection, INTRACELLULAR_TRANSPORT_CELLULAR_V1: transportProjection, CELL_SIGNALING_RTK_MAPK_V1: signalingProjection,
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
  return <ProductionRenderBoundary route={route}>{route.productionOwner === "GENE_EXPRESSION_CELLULAR_V1" ? <GeneExpressionProductionView route={route} /> : <CellularProductionOwnerFrame route={route} />}</ProductionRenderBoundary>;
}

function CellularProductionOwnerFrame({ route }: { route: ProductionPromptRoute }) {
  const projection = useMemo(() => projectionForOwner[route.productionOwner]?.(), [route.productionOwner]);
  if (!projection) throw new Error(`PRODUCTION_RENDERER_OWNER_UNMOUNTED: ${route.productionOwner}`);
  return <section className="cellularProductionMount" aria-label={`${projection.ownerId} production view`} data-production-owner={projection.ownerId} data-production-focus={projection.focus} data-exact-time={projection.timeSeconds}>
    <header><strong>{cellularProductionOwnerComponents[projection.ownerId as keyof typeof cellularProductionOwnerComponents]}</strong><span> · EXACT_FRAME · t={projection.timeSeconds}s</span></header>
    <div className="cellularProductionSchematic" role="img" aria-label={`${projection.ownerId} schematic production frame`}>{projection.items.map((item) => <div className="cellularProductionCard" key={item.label}><span>{item.label}</span><strong>{String(item.value)}</strong></div>)}</div>
    <small>S2_SCHEMATIC · canonical projection + P4 exact-frame application</small>
  </section>;
}

function GeneExpressionProductionView({ route }: { route: ProductionPromptRoute }) {
  const program = useMemo(() => createCanonicalEukaryoticGeneExpressionProgram(), []);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const projection = useMemo(() => geneProjection(program, timeSeconds), [program, timeSeconds]);
  const bubbleOpen = projection.dna.transcriptionBubble === "OPEN";
  const rnaLength = projection.transcription.visibleRnaLength;
  const rnaWidth = Math.max(0, Math.min(230, rnaLength * 28));
  const activeStep = transcriptionSteps.find((step) => step.time === timeSeconds)?.label ?? "EXACT TIME";
  const explanation = timeSeconds === 0
    ? "In the nucleus, RNA polymerase II is available near the promoter before RNA synthesis begins."
    : timeSeconds <= 0.5
      ? "Polymerase II associates with the promoter and opens a local transcription bubble."
      : timeSeconds < 2
        ? "The template is read 3′→5′ while the nascent RNA grows 5′→3′ from its 3′ end."
        : "Transcription has ended; the transcript is no longer polymerase-growing and DNA re-pairs.";
  return <section className="cellularProductionMount transcriptionProductionMount" aria-label="Gene expression transcription production view" data-production-owner={projection.ownerId} data-production-focus={projection.focus} data-exact-time={projection.timeSeconds}>
    <header className="transcriptionProductionHeader"><div><strong>TRANSCRIPTION · NUCLEUS</strong><span> · {projection.fidelity} · EXACT_FRAME · t={projection.timeSeconds}s</span></div><span className="transcriptionProductionStatus">{activeStep}</span></header>
    <div className="transcriptionScene" role="img" aria-label={`Nuclear transcription scene: DNA, promoter, RNA polymerase II, ${bubbleOpen ? "open transcription bubble" : "closed DNA"}, and ${rnaLength} nascent RNA nucleotides`}>
      <div className="nucleusHalo" aria-hidden="true"><span>NUCLEUS</span></div>
      <svg className="transcriptionDiagram" viewBox="0 0 1000 500" aria-hidden="true" focusable="false">
        <defs><filter id="softShadow"><feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#000814" floodOpacity="0.45" /></filter><radialGradient id="bubbleGlow"><stop offset="0" stopColor="#ffbd69" stopOpacity="0.35" /><stop offset="1" stopColor="#ffbd69" stopOpacity="0" /></radialGradient></defs>
        <ellipse cx="500" cy="250" rx="414" ry="158" className="nucleusBoundary" />
        <ellipse cx="500" cy="250" rx="320" ry="116" className="depthRing" />
        <ellipse cx="500" cy="250" rx="152" ry="72" className="bubbleGlow" />
        <path d="M 130 208 C 250 155 365 155 450 208 C 500 238 520 238 570 208 C 655 155 770 155 870 208" className="dnaStrand dnaCodingStrand" />
        <path d="M 130 292 C 250 345 365 345 450 292 C 500 262 520 262 570 292 C 655 345 770 345 870 292" className="dnaStrand dnaTemplateStrand" />
        <path d="M 130 208 C 250 155 365 155 450 208" className="dnaOutside" /><path d="M 570 208 C 655 155 770 155 870 208" className="dnaOutside" />
        <path d="M 130 292 C 250 345 365 345 450 292" className="dnaOutside" /><path d="M 570 292 C 655 345 770 345 870 292" className="dnaOutside" />
        {!bubbleOpen && Array.from({ length: 13 }, (_, index) => { const x = 180 + index * 52; const y = 232 + Math.sin((index / 12) * Math.PI) * 22; return <line key={index} x1={x} y1={y - 12} x2={x} y2={y + 12} className="dnaRung" />; })}
        {bubbleOpen && <g className="transcriptionBubble"><path d="M 425 206 C 465 174 535 174 575 206" /><path d="M 425 294 C 465 326 535 326 575 294" /><path d="M 430 216 C 465 190 535 190 570 216" className="bubbleInner" /></g>}
        <rect x="214" y="174" width="108" height="34" rx="8" className="promoterRegion" /><text x="268" y="196" textAnchor="middle" className="promoterLabel">PROMOTER</text>
        <g className={`polymeraseComplex ${bubbleOpen ? "isEngaged" : ""}`} transform={`translate(${bubbleOpen ? 500 : 290} 250)`} filter="url(#softShadow)">
          <path d="M -55 -18 C -65 -54 -26 -67 0 -50 C 23 -75 67 -47 53 -12 C 82 9 55 50 20 40 C 0 67 -43 52 -40 20 C -74 20 -78 -12 -55 -18 Z" className="polymeraseShell" />
          <ellipse cx="-18" cy="-12" rx="21" ry="28" className="polymeraseLobe polymeraseLobeA" /><ellipse cx="25" cy="-10" rx="26" ry="32" className="polymeraseLobe polymeraseLobeB" /><ellipse cx="4" cy="23" rx="30" ry="15" className="polymeraseLobe polymeraseLobeC" />
          <path d="M -34 2 C -10 -12 12 -12 36 2" className="polymeraseChannel" /><text x="0" y="5" textAnchor="middle" className="polymeraseText">POL II</text>
        </g>
        {rnaLength > 0 && <path d={`M 500 307 C 500 365 535 390 590 390 C ${590 + rnaWidth / 2} 390 ${590 + rnaWidth} 360 ${590 + rnaWidth} 320`} className="nascentRnaPath" />}
        {rnaLength > 0 && <text x={600 + rnaWidth / 2} y="424" textAnchor="middle" className="rnaLabel">NASCENT RNA · 5′ → 3′</text>}
        <text x="145" y="155" className="strandLabel codingLabel">DNA</text><text x="145" y="370" className="strandLabel templateLabel">TEMPLATE 3′ → 5′</text><text x="755" y="180" className="repairedLabel">REPAIRED</text>
      </svg>
      <div className="transcriptionTeachingCue"><strong>{bubbleOpen ? "RNA Pol II is opening and reading the local DNA" : "A gene segment inside the nucleus"}</strong><span>{explanation}</span></div>
      <div className="transcriptionLegend" aria-label="Transcription legend"><span><i className="legendSwatch codingSwatch" />DNA</span><span><i className="legendSwatch templateSwatch" />template</span><span><i className="legendSwatch rnaSwatch" />nascent RNA</span></div>
    </div>
    <div className="transcriptionControls" aria-label="Transcription exact-time chapters">{transcriptionSteps.map((step) => <button key={step.label} type="button" className={step.time === timeSeconds ? "isSelected" : ""} onClick={() => setTimeSeconds(step.time)}>{step.label}</button>)}</div>
    <details className="cellularProductionDetails"><summary>State details</summary><div className="cellularProductionSchematic">{[["DNA bubble", projection.dna.transcriptionBubble], ["RNA Pol II", projection.transcription.polymeraseState], ["Nascent RNA", rnaLength], ["RNA localization", projection.exportState.localization], ["Transcript", projection.transcription.transcriptState], ["Template read", "3′ → 5′"]].map(([label, value]) => <div className="cellularProductionCard" key={String(label)}><span>{label}</span><strong>{String(value)}</strong></div>)}</div></details>
    <small>S2_SCHEMATIC · canonical D-C projection + P4 exact-frame application · owner {route.productionOwner}</small>
  </section>;
}

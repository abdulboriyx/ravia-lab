"use client";

import { Component, useEffect, useMemo, useState, type ErrorInfo, type ReactNode } from "react";
import type { ProductionPromptRoute } from "./production-prompt-router";
import { createCanonicalEukaryoticGeneExpressionProgram, type GeneExpressionProgramV1 } from "./cellular-gene-expression";
import { projectGeneExpressionProductionAtTime, type GeneExpressionProductionProjectionV1 } from "./gene-expression-production";
import { createCanonicalSecretoryPathwayProgram } from "./secretory-pathway";
import { projectSecretoryProductionAtTime } from "./secretory-production";
import { createCanonicalIntracellularTransportProductionProgram, projectIntracellularTransportProductionAtTime } from "./intracellular-transport-production";
import { createCanonicalCellularSignalingProductionProgram, projectCellularSignalingProductionAtTime } from "./cellular-signaling-production";
import { applyCellularGeneExpressionExactFrame, applyCellularSecretoryExactFrame, applyCellularIntracellularTransportExactFrame, applyCellularSignalingExactFrame } from "./p4-b-exact-frame-runtime";
import { cellularProductionOwnerComponents } from "./cellular-production-dispatch";
import { GeneExpression3DScene } from "./GeneExpression3DScene";
import { deriveTranscriptionPresentationState, isValidTranscriptionPresentationState, type TranscriptionPresentationStateV1 } from "./transcription-presentation-state";
import type { SpatialRaviaTheme } from "./spatial-ravia-theme";

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

export function CellularProductionOwnerView({ route, theme }: { route: ProductionPromptRoute; theme: SpatialRaviaTheme }) {
  return <ProductionRenderBoundary route={route}>{route.productionOwner === "GENE_EXPRESSION_CELLULAR_V1" ? <GeneExpressionProductionView route={route} theme={theme} /> : <CellularProductionOwnerFrame route={route} />}</ProductionRenderBoundary>;
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

function GeneExpressionProductionView({ route, theme }: { route: ProductionPromptRoute; theme: SpatialRaviaTheme }) {
  const program = useMemo(() => createCanonicalEukaryoticGeneExpressionProgram(), []);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [playing, setPlaying] = useState(false);
  const transcriptionDuration = transcriptionSteps[transcriptionSteps.length - 1]!.time;
  useEffect(() => {
    if (!playing) return undefined;
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = Math.max(0, Math.min(0.1, (now - previous) / 1000));
      previous = now;
      setTimeSeconds((current) => {
        const next = Math.min(transcriptionDuration, current + delta);
        if (next >= transcriptionDuration) setPlaying(false);
        return next;
      });
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [playing, transcriptionDuration]);
  const projection = useMemo(() => geneProjection(program, timeSeconds), [program, timeSeconds]);
  const presentationResult = useMemo((): Readonly<{ ok: true; state: TranscriptionPresentationStateV1 } | { ok: false; details: string }> => {
    try {
      const state = deriveTranscriptionPresentationState(program, projection);
      return isValidTranscriptionPresentationState(state)
        ? { ok: true, state }
        : { ok: false, details: "derived state failed finite-field validation" };
    } catch (error) {
      return { ok: false, details: error instanceof Error ? error.message : "unknown derivation failure" };
    }
  }, [program, projection]);
  if (!presentationResult.ok) {
    return <section className="spatialRaviaStatus" role="alert" data-error-code="TRANSCRIPTION_PRESENTATION_STATE_INVALID"><strong>TRANSCRIPTION_PRESENTATION_STATE_INVALID</strong>{process.env.NODE_ENV !== "production" && <div>{presentationResult.details}</div>}</section>;
  }
  const presentation = presentationResult.state;
  const bubbleOpen = projection.dna.transcriptionBubble === "OPEN";
  const rnaLength = projection.transcription.visibleRnaLength;
  const activeStep = transcriptionSteps.find((step) => step.time === timeSeconds)?.label ?? "EXACT TIME";
  const explanation = timeSeconds === 0
    ? "In the nucleus, RNA polymerase II is available near the promoter before RNA synthesis begins."
    : timeSeconds <= 0.5
      ? "Polymerase II associates with the promoter and opens a local transcription bubble."
      : timeSeconds < 2
        ? "The template is read 3′→5′ while the nascent RNA grows 5′→3′ from its 3′ end."
        : "Transcription has ended; the transcript is no longer polymerase-growing and DNA re-pairs.";
  return <section className="cellularProductionMount transcriptionProductionMount" aria-label="Gene expression transcription production view" data-production-owner={projection.ownerId} data-production-focus={projection.focus} data-exact-time={projection.timeSeconds} data-presentation-progress={presentation.normalizedProgress.toFixed(3)}>
    <header className="transcriptionProductionHeader"><div><strong>TRANSCRIPTION · NUCLEUS</strong><span> · {projection.fidelity} · EXACT_FRAME · t={projection.timeSeconds}s</span></div><span className="transcriptionProductionStatus">{activeStep}</span></header>
    <div className="transcriptionScene" role="img" aria-label={`Nuclear transcription scene: DNA, promoter, RNA polymerase II, ${presentation.bubbleOpenFraction > 0.01 ? "open transcription bubble" : "closed DNA"}, and ${presentation.nascentRnaVisualLength.toFixed(1)} nascent RNA nucleotides`}>
      <GeneExpression3DScene projection={projection} presentation={presentation} theme={theme} />
      <details className="transcriptionTeachingCue">
        <summary>{bubbleOpen ? "Pol II opens DNA and builds RNA." : "A gene segment inside the nucleus."}</summary>
        <span>{explanation}</span>
      </details>
    </div>
    <div className="transcriptionControls" aria-label="Transcription exact-time chapters">{transcriptionSteps.map((step) => <button key={step.label} type="button" className={step.time === timeSeconds ? "isSelected" : ""} onClick={() => { setPlaying(false); setTimeSeconds(step.time); }}>{step.label}</button>)}<button type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Pause transcription playback" : "Play transcription playback"}>{playing ? "PAUSE" : "PLAY"}</button><label className="transcriptionScrubber">time <input type="range" min="0" max={transcriptionDuration} step="0.01" value={timeSeconds} onChange={(event) => { setPlaying(false); setTimeSeconds(Number(event.target.value)); }} aria-label="Transcription exact time" /><output>{timeSeconds.toFixed(2)}s</output></label></div>
    <details className="cellularProductionDetails"><summary>State details</summary><div className="cellularProductionSchematic">{[["DNA bubble", projection.dna.transcriptionBubble], ["RNA Pol II", projection.transcription.polymeraseState], ["Nascent RNA", rnaLength], ["RNA localization", projection.exportState.localization], ["Transcript", projection.transcription.transcriptState], ["Template read", "3′ → 5′"]].map(([label, value]) => <div className="cellularProductionCard" key={String(label)}><span>{label}</span><strong>{String(value)}</strong></div>)}</div></details>
    {process.env.NODE_ENV !== "production" && <details className="transcriptionDebugState"><summary>Presentation debug</summary><code>progress={presentation.normalizedProgress.toFixed(3)} · PolII={presentation.polymeraseGenePosition.toFixed(3)} · bubble={presentation.bubbleCenter.toFixed(3)} / {presentation.bubbleOpenFraction.toFixed(3)} · RNA={presentation.nascentRnaVisualLength.toFixed(2)} · repair={presentation.dnaRepairProgress.toFixed(3)}</code></details>}
    <small>S2_SCHEMATIC · canonical D-C projection + P4 exact-frame application · owner {route.productionOwner}</small>
  </section>;
}

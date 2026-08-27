"use client";

import { Component, useEffect, useMemo, useReducer, type ErrorInfo, type ReactNode } from "react";
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
import { deriveTranscriptionMechanismVisualState } from "./transcription-mechanism-presentation";
import { deriveEukaryoticTranscriptionCausalStateAtTime, eukaryoticTranscriptionActionTypes } from "./eukaryotic-transcription-causal-state";
import { createExpertTranscriptionControlState, deriveTranscriptionChapterSteps, deriveTranscriptionExpertEvents, reduceExpertTranscriptionControl, type ExpertTranscriptionTarget, type ExpertTranscriptionGeometryMode } from "./transcription-expert-controls";
import { resolveTranscriptionProvenance } from "./transcription-provenance";
import type { SpatialRaviaTheme } from "./spatial-ravia-theme";

type DisplayItem = Readonly<{ label: string; value: string | number | boolean }>;
type CellularProjection = Readonly<{ ownerId: string; timeSeconds: number; focus: string; items: readonly DisplayItem[] }>;
const renderConfig = { width: 1280, height: 720, pixelRatio: 1, background: { mode: "opaque" as const, color: "#f7fafb" } };
const transcriptionDisplayDuration = 8;
const transcriptionSourceDuration = 2.35;

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
  // Land on the first mechanistically informative frame so the prompt never
  // opens to a blank pre-initiation state.
  const transcriptionDuration = transcriptionDisplayDuration;
  const expertEvents = useMemo(() => deriveTranscriptionExpertEvents(program, transcriptionDisplayDuration, transcriptionSourceDuration), [program]);
  const transcriptionSteps = useMemo(() => deriveTranscriptionChapterSteps(expertEvents, transcriptionDuration), [expertEvents, transcriptionDuration]);
  const initialTime = transcriptionSteps.find((step) => step.label === "INITIATION")?.time ?? 0;
  const initialControls = useMemo(() => createExpertTranscriptionControlState(expertEvents, transcriptionDuration, initialTime), [expertEvents, initialTime, transcriptionDuration]);
  const [controls, dispatchControl] = useReducer(reduceExpertTranscriptionControl, initialControls);
  const timeSeconds = controls.exactTime;
  const playing = controls.playing;
  const sourceTimeSeconds = Math.min(transcriptionSourceDuration, (timeSeconds / transcriptionDisplayDuration) * transcriptionSourceDuration);
  useEffect(() => {
    if (!controls.playing) return undefined;
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = Math.max(0, Math.min(0.1, (now - previous) / 1000));
      previous = now;
      dispatchControl({ type: "ADVANCE_TIME", deltaSeconds: delta });
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [controls.playing, transcriptionDuration]);
  useEffect(() => {
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(".spatialRaviaViewport")?.scrollTo({ top: 0, behavior: "auto" });
    });
  }, [timeSeconds]);
  const projection = useMemo(() => geneProjection(program, sourceTimeSeconds), [program, sourceTimeSeconds]);
  const causalState = useMemo(() => deriveEukaryoticTranscriptionCausalStateAtTime(program, sourceTimeSeconds), [program, sourceTimeSeconds]);
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
  const provenance = useMemo(() => resolveTranscriptionProvenance(controls.selectedTarget, controls.geometryMode), [controls.selectedTarget, controls.geometryMode]);
  if (!presentationResult.ok) {
    return <section className="spatialRaviaStatus" role="alert" data-error-code="TRANSCRIPTION_PRESENTATION_STATE_INVALID"><strong>TRANSCRIPTION_PRESENTATION_STATE_INVALID</strong>{process.env.NODE_ENV !== "production" && <div>{presentationResult.details}</div>}</section>;
  }
  const presentation = presentationResult.state;
  const mechanismState = deriveTranscriptionMechanismVisualState(presentation);
  const bubbleOpen = presentation.bubbleOpenFraction > 0.01;
  const rnaLength = projection.transcription.visibleRnaLength;
  const activeStep = transcriptionSteps.find((step) => step.time === timeSeconds)?.label ?? "EXACT TIME";
  const explanation = sourceTimeSeconds === 0
    ? "Eukaryotic RNA polymerase II is positioned near the promoter context before RNA synthesis begins."
    : sourceTimeSeconds <= 0.5
      ? "Eukaryotic RNA polymerase II engages the promoter context and opens a local transcription bubble."
      : sourceTimeSeconds < 2
        ? "The template is read 3′→5′ while the nascent RNA grows 5′→3′ from its 3′ end."
        : "Transcription has ended; the transcript is no longer polymerase-growing and DNA re-pairs.";
  return <section className="cellularProductionMount transcriptionProductionMount" aria-label="Gene expression transcription production view" data-production-owner={projection.ownerId} data-production-focus={projection.focus} data-exact-time={timeSeconds} data-source-time={projection.timeSeconds} data-presentation-progress={presentation.normalizedProgress.toFixed(3)} data-causal-state-schema={causalState.schemaVersion} data-causal-action-contract={eukaryoticTranscriptionActionTypes.join(",")} data-dna-opening={causalState.dnaOpening.toFixed(3)} data-polymerase-engagement={causalState.polymeraseEngagement.toFixed(3)} data-polymerase-axis-position={causalState.polymeraseAxisPosition.toFixed(3)} data-hybrid-length={causalState.hybridLength.toFixed(2)} data-transcript-release={causalState.transcriptRelease.toFixed(3)} data-expert-selected-target={controls.selectedTarget} data-expert-geometry-mode={controls.geometryMode} data-expert-event-index={controls.eventIndex} data-expert-camera-revision={controls.cameraRevision} data-expert-scene-revision={controls.sceneRevision} data-expert-inspector={provenance ? "OPEN" : "CLOSED"}>
    <header className="transcriptionProductionHeader"><div><strong>TRANSCRIPTION · DNA → RNA</strong><span> · EUKARYOTIC POL II · 5FLM_SOURCE_ANCHORED · COMPUTED_SURFACES · INFERRED_MOTION · t={timeSeconds.toFixed(2)}s</span></div><span className="transcriptionProductionStatus">{activeStep} · {mechanismState.stage}</span></header>
    <div className="transcriptionScene" role="img" aria-label={`Transcription mechanism: DNA, promoter context, eukaryotic RNA polymerase II, ${presentation.bubbleOpenFraction > 0.01 ? "open transcription bubble" : "closed DNA"}, and ${presentation.nascentRnaVisualLength.toFixed(1)} nascent RNA nucleotides`}>
      <GeneExpression3DScene projection={projection} presentation={presentation} theme={theme} selectedTarget={controls.selectedTarget} geometryMode={controls.geometryMode} cameraRevision={controls.cameraRevision} sceneRevision={controls.sceneRevision} />
      <details className="transcriptionTeachingCue">
        <summary>{bubbleOpen ? "Eukaryotic Pol II opens DNA locally and builds RNA." : "A deposited DNA segment inside the molecular machine."}</summary>
        <span>{explanation}</span>
      </details>
    </div>
    <div className="transcriptionControls" aria-label="Transcription exact-time chapters">{transcriptionSteps.map((step) => <button key={step.label} type="button" className={step.time === timeSeconds ? "isSelected" : ""} onClick={() => dispatchControl({ type: "SEEK_EXACT_TIME", exactTime: step.time })}>{step.label}</button>)}<button type="button" onClick={() => dispatchControl({ type: "STEP_BACK_EVENT" })} aria-label="Step back one transcription event">◀ EVENT</button><button type="button" onClick={() => dispatchControl({ type: "TOGGLE_PLAY" })} aria-label={playing ? "Pause transcription playback" : "Play transcription playback"}>{playing ? "PAUSE" : "PLAY"}</button><button type="button" onClick={() => dispatchControl({ type: "STEP_FORWARD_EVENT" })} aria-label="Step forward one transcription event">EVENT ▶</button><label className="transcriptionScrubber">time <input type="range" min="0" max={transcriptionDuration} step="0.01" value={timeSeconds} onChange={(event) => dispatchControl({ type: "SEEK_EXACT_TIME", exactTime: Number(event.target.value) })} aria-label="Transcription exact time" /><input className="transcriptionExactTimeInput" type="number" min="0" max={transcriptionDuration} step="0.01" value={timeSeconds.toFixed(2)} onChange={(event) => { const exactTime = Number(event.target.value); if (Number.isFinite(exactTime)) dispatchControl({ type: "SEEK_EXACT_TIME", exactTime }); }} aria-label="Transcription exact time value" /><output>{timeSeconds.toFixed(2)}s</output></label></div>
    <div className="transcriptionExpertControls" aria-label="Expert transcription controls"><label>focus <select value={controls.selectedTarget} onChange={(event) => dispatchControl({ type: "SELECT_TARGET", target: event.target.value as ExpertTranscriptionTarget })} aria-label="Select transcription target"><option value="NONE">NONE</option><option value="POL_II">Pol II</option><option value="DNA">DNA</option><option value="RNA">RNA</option><option value="HYBRID">Hybrid</option><option value="MG">Mg</option></select></label><label>geometry <select value={controls.geometryMode} onChange={(event) => dispatchControl({ type: "SET_GEOMETRY_MODE", mode: event.target.value as ExpertTranscriptionGeometryMode })} aria-label="Select geometry mode"><option value="DEPOSITED">DEPOSITED</option><option value="DERIVED">DERIVED</option></select></label><button type="button" onClick={() => dispatchControl({ type: "RESET_CAMERA" })}>RESET CAMERA</button><button type="button" onClick={() => dispatchControl({ type: "RESET_SCENE" })}>RESET SCENE</button></div>
    {provenance && <aside className="transcriptionProvenanceInspector" aria-label="Inspectable provenance" data-provenance-target={provenance.target} data-provenance-status={provenance.displayStatus} data-provenance-structure={provenance.structureId} data-provenance-residue-range={provenance.residueRange}>
      <header><div><span className="transcriptionProvenanceEyebrow">INSPECTABLE PROVENANCE</span><strong>{provenance.label}</strong></div><span className={`transcriptionProvenanceBadge transcriptionProvenanceBadge--${provenance.displayStatus.toLowerCase()}`}>{provenance.displayStatus}</span></header>
      <dl className="transcriptionProvenanceFacts"><div><dt>Structure</dt><dd>{provenance.structureId} · assembly {provenance.assemblyId}</dd></div><div><dt>Chain</dt><dd>{provenance.chains.join(", ")}</dd></div><div><dt>Residue range</dt><dd>{provenance.residueRange}</dd></div><div><dt>Source status</dt><dd>{provenance.sourceStatus}</dd></div><div><dt>Display status</dt><dd>{provenance.displayStatus}</dd></div><div><dt>Fidelity</dt><dd>{provenance.fidelity.join(" · ")}</dd></div></dl>
      <div className="transcriptionProvenanceColumns"><section><h4>Experimentally present</h4><ul>{provenance.experimentallyPresent.map((item) => <li key={item}>{item}</li>)}</ul></section><section><h4>Animated or inferred</h4><ul>{provenance.animatedOrInferred.map((item) => <li key={item}>{item}</li>)}</ul></section><section><h4>Known limitations</h4><ul>{provenance.knownLimitations.map((item) => <li key={item}>{item}</li>)}</ul></section></div>
      <footer><span>{provenance.organism} · {provenance.citation}</span><a href={provenance.sourceUrl} target="_blank" rel="noreferrer">View {provenance.sourceTitle} ↗</a></footer>
    </aside>}
    <details className="cellularProductionDetails"><summary>State details</summary><div className="cellularProductionSchematic">{[["DNA bubble", projection.dna.transcriptionBubble], ["Eukaryotic Pol II", projection.transcription.polymeraseState], ["Nascent RNA", rnaLength], ["RNA localization", projection.exportState.localization], ["Transcript", projection.transcription.transcriptState], ["Template read", "3′ → 5′"]].map(([label, value]) => <div className="cellularProductionCard" key={String(label)}><span>{label}</span><strong>{String(value)}</strong></div>)}</div></details>
    {process.env.NODE_ENV !== "production" && <details className="transcriptionDebugState"><summary>Presentation debug</summary><code>progress={presentation.normalizedProgress.toFixed(3)} · RNAP={presentation.polymeraseGenePosition.toFixed(3)} · bubble={presentation.bubbleCenter.toFixed(3)} / {presentation.bubbleOpenFraction.toFixed(3)} · RNA={presentation.nascentRnaVisualLength.toFixed(2)} · repair={presentation.dnaRepairProgress.toFixed(3)}</code></details>}
    <small>TRANSCRIPTION_ONLY · promoter context → initiation → elongation → termination · program timing mapped to 8s · E0 5FLM coordinates → C0 computed surfaces → S2 inferred Pol II translocation · owner {route.productionOwner}</small>
  </section>;
}

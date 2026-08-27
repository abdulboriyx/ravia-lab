import type { GeneExpressionProgramV1 } from "./cellular-gene-expression.ts";

export const expertTranscriptionTargets = ["NONE", "POL_II", "DNA", "RNA", "HYBRID", "MG"] as const;
export type ExpertTranscriptionTarget = (typeof expertTranscriptionTargets)[number];
export const expertTranscriptionGeometryModes = ["DEPOSITED", "DERIVED"] as const;
export type ExpertTranscriptionGeometryMode = (typeof expertTranscriptionGeometryModes)[number];

export type ExpertTranscriptionEvent = Readonly<{ eventId: string; kind: string; displayTime: number; sourceTime: number }>;
export type ExpertTranscriptionChapter = Readonly<{ label: "START" | "INITIATION" | "ELONGATION" | "TERMINATION"; time: number }>;
export type ExpertTranscriptionControlState = Readonly<{
  playing: boolean;
  exactTime: number;
  selectedTarget: ExpertTranscriptionTarget;
  geometryMode: ExpertTranscriptionGeometryMode;
  cameraRevision: number;
  sceneRevision: number;
  eventIndex: number;
  events: readonly ExpertTranscriptionEvent[];
  duration: number;
}>;

export type ExpertTranscriptionControlAction =
  | Readonly<{ type: "TOGGLE_PLAY" }>
  | Readonly<{ type: "SET_PLAYING"; playing: boolean }>
  | Readonly<{ type: "ADVANCE_TIME"; deltaSeconds: number }>
  | Readonly<{ type: "SEEK_EXACT_TIME"; exactTime: number }>
  | Readonly<{ type: "STEP_FORWARD_EVENT" }>
  | Readonly<{ type: "STEP_BACK_EVENT" }>
  | Readonly<{ type: "SELECT_TARGET"; target: ExpertTranscriptionTarget }>
  | Readonly<{ type: "SET_GEOMETRY_MODE"; mode: ExpertTranscriptionGeometryMode }>
  | Readonly<{ type: "RESET_CAMERA" }>
  | Readonly<{ type: "RESET_SCENE" }>;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const uniqueSorted = (values: readonly number[]) => [...new Set(values.map((value) => Number(value.toFixed(6))))].sort((a, b) => a - b);

export function deriveTranscriptionExpertEvents(program: GeneExpressionProgramV1, displayDuration: number, sourceDuration: number): readonly ExpertTranscriptionEvent[] {
  const eventKinds = new Set(["TRANSCRIPTION_MACHINERY_ASSOCIATED", "TRANSCRIPTION_BUBBLE_OPENED", "TRANSCRIPTION_INITIATED", "RNA_NUCLEOTIDE_ADDED", "TRANSCRIPTION_TERMINATED", "RNA_TRANSCRIPT_RELEASED"]);
  return program.events
    .filter((event) => eventKinds.has(event.kind) && event.at <= sourceDuration)
    .sort((a, b) => a.at - b.at || a.eventId.localeCompare(b.eventId))
    .map((event) => ({ eventId: event.eventId, kind: event.kind, sourceTime: event.at, displayTime: (event.at / sourceDuration) * displayDuration }));
}

/** Chapter buttons must follow canonical event boundaries, not hand-tuned UI seconds. */
export function deriveTranscriptionChapterSteps(events: readonly ExpertTranscriptionEvent[], duration: number): readonly ExpertTranscriptionChapter[] {
  const eventTime = (kind: string, fallback: number) => events.find((event) => event.kind === kind)?.displayTime ?? fallback;
  const initiation = eventTime("TRANSCRIPTION_INITIATED", duration * 0.2);
  const elongation = eventTime("RNA_NUCLEOTIDE_ADDED", initiation);
  const termination = eventTime("TRANSCRIPTION_TERMINATED", duration);
  return [
    { label: "START", time: 0 },
    { label: "INITIATION", time: initiation },
    { label: "ELONGATION", time: elongation },
    { label: "TERMINATION", time: termination },
  ];
}

export function createExpertTranscriptionControlState(events: readonly ExpertTranscriptionEvent[], duration: number, initialTime = 0): ExpertTranscriptionControlState {
  const time = clamp(initialTime, 0, duration);
  return { playing: false, exactTime: time, selectedTarget: "NONE", geometryMode: "DEPOSITED", cameraRevision: 0, sceneRevision: 0, eventIndex: eventIndexForTime(events, time), events, duration };
}

function eventIndexForTime(events: readonly ExpertTranscriptionEvent[], time: number) {
  let index = -1;
  events.forEach((event, candidateIndex) => { if (event.displayTime <= time + 0.000001) index = candidateIndex; });
  return index;
}

function withTime(state: ExpertTranscriptionControlState, exactTime: number, playing = state.playing): ExpertTranscriptionControlState {
  const nextTime = clamp(exactTime, 0, state.duration);
  return { ...state, exactTime: nextTime, playing: nextTime >= state.duration ? false : playing, eventIndex: eventIndexForTime(state.events, nextTime) };
}

/** UI-only reducer. It controls inspection of the causal state; it does not mutate biology. */
export function reduceExpertTranscriptionControl(state: ExpertTranscriptionControlState, action: ExpertTranscriptionControlAction): ExpertTranscriptionControlState {
  switch (action.type) {
    case "TOGGLE_PLAY": return { ...state, playing: !state.playing && state.exactTime < state.duration };
    case "SET_PLAYING": return { ...state, playing: action.playing && state.exactTime < state.duration };
    case "ADVANCE_TIME": return withTime(state, state.exactTime + clamp(action.deltaSeconds, 0, 0.25));
    case "SEEK_EXACT_TIME": return withTime(state, action.exactTime, false);
    case "STEP_FORWARD_EVENT": {
      const next = state.events.find((event) => event.displayTime > state.exactTime + 0.000001);
      return withTime(state, next?.displayTime ?? state.duration, false);
    }
    case "STEP_BACK_EVENT": {
      const previous = [...state.events].reverse().find((event) => event.displayTime < state.exactTime - 0.000001);
      return withTime(state, previous?.displayTime ?? 0, false);
    }
    case "SELECT_TARGET": return { ...state, selectedTarget: action.target };
    case "SET_GEOMETRY_MODE": return { ...state, geometryMode: action.mode };
    case "RESET_CAMERA": return { ...state, cameraRevision: state.cameraRevision + 1 };
    case "RESET_SCENE": return { ...state, playing: false, exactTime: 0, selectedTarget: "NONE", geometryMode: "DEPOSITED", cameraRevision: state.cameraRevision + 1, sceneRevision: state.sceneRevision + 1, eventIndex: -1 };
  }
}

export function validateExpertTranscriptionControlState(state: ExpertTranscriptionControlState): readonly string[] {
  const issues: string[] = [];
  if (!Number.isFinite(state.exactTime) || state.exactTime < 0 || state.exactTime > state.duration) issues.push("exactTime");
  if (!expertTranscriptionTargets.includes(state.selectedTarget)) issues.push("selectedTarget");
  if (!expertTranscriptionGeometryModes.includes(state.geometryMode)) issues.push("geometryMode");
  if (state.eventIndex >= state.events.length) issues.push("eventIndex");
  return issues;
}

export function controlTimeValues(events: readonly ExpertTranscriptionEvent[], duration: number) {
  return uniqueSorted([0, ...events.map((event) => event.displayTime), duration]);
}

/**
 * Standalone state/action contract for one bounded eukaryotic nuclear Pol II
 * transcription event. This contract is intentionally narrower than the
 * existing D-C gene-expression program: it stops at transcript release.
 */

export const eukaryoticTranscriptionContractVersion = "1" as const;
export const eukaryoticTranscriptionIdentity = {
  domain: "TRANSCRIPTION",
  organism: "EUKARYOTIC_NUCLEAR",
  polymeraseClass: "EUKARYOTIC_POL_II",
  sourceRequirement: "eukaryoticPolIIElongationSourceRequirements",
} as const;

export const eukaryoticTranscriptionPhases = [
  "PROMOTER_CLOSED",
  "PIC_ASSEMBLED",
  "OPEN_COMPLEX",
  "INITIATING",
  "ELONGATING",
  "PAUSED",
  "TERMINATING",
  "TRANSCRIPT_RELEASED",
  "POLYMERASE_RELEASED",
] as const;
export type EukaryoticTranscriptionPhase = typeof eukaryoticTranscriptionPhases[number];

export const eukaryoticTranscriptionActions = [
  "ASSEMBLE_PIC",
  "OPEN_PROMOTER",
  "INITIATE_TRANSCRIPT",
  "ADD_NUCLEOTIDE",
  "PAUSE",
  "RESUME",
  "BEGIN_TERMINATION",
  "RELEASE_TRANSCRIPT",
  "RELEASE_POLYMERASE",
] as const;
export type EukaryoticTranscriptionActionKind = typeof eukaryoticTranscriptionActions[number];

export type EukaryoticTranscriptionAction = Readonly<{
  actionId: string;
  kind: EukaryoticTranscriptionActionKind;
  atSeconds: number;
  requestedBy: "USER" | "TIMELINE" | "SYSTEM";
  nucleotide?: "A" | "U" | "G" | "C";
  pauseReason?: "PAUSING" | "BACKTRACKING" | "RESOURCE_LIMIT" | "USER_CONTROL";
}>;

export type EukaryoticTranscriptionState = Readonly<{
  schemaVersion: typeof eukaryoticTranscriptionContractVersion;
  contractId: string;
  timeSeconds: number;
  phase: EukaryoticTranscriptionPhase;
  identity: typeof eukaryoticTranscriptionIdentity;
  locus: Readonly<{
    promoterId: string;
    templateStrandId: string;
    nonTemplateStrandId: string;
    templateSequence?: string;
    templateReadDirection: "THREE_PRIME_TO_FIVE_PRIME";
    rnaSynthesisDirection: "FIVE_PRIME_TO_THREE_PRIME";
    startIndex: number;
    terminationIndex?: number;
  }>;
  polymerase: Readonly<{
    id: string;
    state: "AVAILABLE" | "PIC_ASSOCIATED" | "INITIATING" | "ELONGATING" | "PAUSED" | "TERMINATING" | "RELEASED";
    locusPosition: number;
    sourceStatus: "AVAILABLE" | "REQUIRED_NOT_CONFIGURED";
    sourceId?: string;
  }>;
  bubble: Readonly<{
    open: boolean;
    startIndex: number;
    endIndex: number;
  }>;
  transcript: Readonly<{
    id: string;
    status: "NONE" | "NASCENT" | "RELEASED";
    sequence: string;
    length: number;
    hybridLength: number;
  }>;
  pauseReason?: EukaryoticTranscriptionAction["pauseReason"];
  fidelity: "S2_SCHEMATIC" | "E0_DEPOSITED";
  appliedActionIds: readonly string[];
}>;

export type EukaryoticTranscriptionValidationIssue = Readonly<{ path: string; message: string }>;
export type EukaryoticTranscriptionValidationResult =
  | Readonly<{ valid: true; issues: [] }>
  | Readonly<{ valid: false; issues: readonly EukaryoticTranscriptionValidationIssue[] }>;

export type EukaryoticTranscriptionActionResult =
  | Readonly<{ accepted: true; state: EukaryoticTranscriptionState }>
  | Readonly<{ accepted: false; state: EukaryoticTranscriptionState; code: string; reason: string }>;

type PolymeraseState = EukaryoticTranscriptionState["polymerase"]["state"];
type MutableState = {
  -readonly [Key in keyof EukaryoticTranscriptionState]: EukaryoticTranscriptionState[Key];
};

const idPattern = /^[a-z][a-zA-Z0-9]*(?:-[a-zA-Z0-9]+)*$/;
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const dnaToRna: Record<string, string> = { A: "U", T: "A", G: "C", C: "G" };
const phaseSet = new Set<string>(eukaryoticTranscriptionPhases);

export const eukaryoticTranscriptionTransitionTable: Readonly<Record<EukaryoticTranscriptionActionKind, readonly EukaryoticTranscriptionPhase[]>> = {
  ASSEMBLE_PIC: ["PROMOTER_CLOSED"],
  OPEN_PROMOTER: ["PIC_ASSEMBLED"],
  INITIATE_TRANSCRIPT: ["OPEN_COMPLEX"],
  ADD_NUCLEOTIDE: ["INITIATING", "ELONGATING"],
  PAUSE: ["ELONGATING"],
  RESUME: ["PAUSED"],
  BEGIN_TERMINATION: ["ELONGATING"],
  RELEASE_TRANSCRIPT: ["TERMINATING"],
  RELEASE_POLYMERASE: ["TRANSCRIPT_RELEASED"],
};

function issue(path: string, message: string): EukaryoticTranscriptionValidationIssue {
  return { path, message };
}

export function validateEukaryoticTranscriptionState(state: EukaryoticTranscriptionState): EukaryoticTranscriptionValidationResult {
  const issues: EukaryoticTranscriptionValidationIssue[] = [];
  const add = (path: string, message: string) => issues.push(issue(path, message));
  if (state.schemaVersion !== eukaryoticTranscriptionContractVersion) add("schemaVersion", "unknown contract version");
  if (!idPattern.test(state.contractId)) add("contractId", "must be a stable ID");
  if (!finite(state.timeSeconds) || state.timeSeconds < 0) add("timeSeconds", "must be finite and non-negative");
  if (!phaseSet.has(state.phase)) add("phase", "is not a supported eukaryotic transcription phase");
  if (JSON.stringify(state.identity) !== JSON.stringify(eukaryoticTranscriptionIdentity)) add("identity", "must remain frozen to eukaryotic nuclear Pol II");
  for (const [path, value] of Object.entries({
    promoterId: state.locus.promoterId,
    templateStrandId: state.locus.templateStrandId,
    nonTemplateStrandId: state.locus.nonTemplateStrandId,
    polymeraseId: state.polymerase.id,
    transcriptId: state.transcript.id,
  })) if (!idPattern.test(value)) add(path, "must be a stable ID");
  if (state.locus.templateStrandId === state.locus.nonTemplateStrandId) add("locus", "template and non-template strands must be distinct");
  if (state.locus.templateSequence !== undefined && !/^[ATGC]*$/.test(state.locus.templateSequence)) add("locus.templateSequence", "must contain only DNA bases");
  if (state.locus.templateReadDirection !== "THREE_PRIME_TO_FIVE_PRIME" || state.locus.rnaSynthesisDirection !== "FIVE_PRIME_TO_THREE_PRIME") add("locus", "must preserve canonical transcription directions");
  if (!Number.isInteger(state.locus.startIndex) || state.locus.startIndex < 0) add("locus.startIndex", "must be a non-negative integer");
  if (state.locus.terminationIndex !== undefined && (!Number.isInteger(state.locus.terminationIndex) || state.locus.terminationIndex <= state.locus.startIndex)) add("locus.terminationIndex", "must follow the transcription start");
  if (!finite(state.polymerase.locusPosition) || state.polymerase.locusPosition < state.locus.startIndex) add("polymerase.locusPosition", "must be finite and at or after the start index");
  if (state.polymerase.sourceStatus === "REQUIRED_NOT_CONFIGURED" && state.fidelity === "E0_DEPOSITED") add("fidelity", "cannot claim deposited fidelity without the required Pol II source");
  if (!finite(state.bubble.startIndex) || !finite(state.bubble.endIndex) || state.bubble.endIndex < state.bubble.startIndex) add("bubble", "must have an ordered finite interval");
  if (!finite(state.transcript.length) || state.transcript.length < 0 || !Number.isInteger(state.transcript.length)) add("transcript.length", "must be a non-negative integer");
  if (state.transcript.length !== state.transcript.sequence.length) add("transcript", "length must equal sequence length");
  if (!/^[AUGC]*$/.test(state.transcript.sequence)) add("transcript.sequence", "must contain only RNA bases");
  if (!Number.isInteger(state.transcript.hybridLength) || state.transcript.hybridLength < 0 || state.transcript.hybridLength > state.transcript.length) add("transcript.hybridLength", "must be bounded by transcript length");
  if (!Array.from(new Set(state.appliedActionIds)).every((id) => idPattern.test(id)) || new Set(state.appliedActionIds).size !== state.appliedActionIds.length) add("appliedActionIds", "must be unique stable IDs");

  const openPhases = new Set<EukaryoticTranscriptionPhase>(["OPEN_COMPLEX", "INITIATING", "ELONGATING", "PAUSED", "TERMINATING"]);
  if (state.bubble.open !== openPhases.has(state.phase)) add("bubble.open", "must agree with the transcription phase");
  const expectedPolymerase: Record<EukaryoticTranscriptionPhase, PolymeraseState> = {
    PROMOTER_CLOSED: "AVAILABLE", PIC_ASSEMBLED: "PIC_ASSOCIATED", OPEN_COMPLEX: "PIC_ASSOCIATED", INITIATING: "INITIATING", ELONGATING: "ELONGATING", PAUSED: "PAUSED", TERMINATING: "TERMINATING", TRANSCRIPT_RELEASED: "TERMINATING", POLYMERASE_RELEASED: "RELEASED",
  };
  if (state.polymerase.state !== expectedPolymerase[state.phase]) add("polymerase.state", "must agree with the phase");
  const noTranscriptPhases = new Set<EukaryoticTranscriptionPhase>(["PROMOTER_CLOSED", "PIC_ASSEMBLED", "OPEN_COMPLEX"]);
  if (noTranscriptPhases.has(state.phase) && state.transcript.status !== "NONE") add("transcript.status", "must be NONE before initiation");
  if (state.phase === "INITIATING" || state.phase === "ELONGATING" || state.phase === "PAUSED" || state.phase === "TERMINATING") {
    if (state.transcript.status !== "NASCENT") add("transcript.status", "must be NASCENT while transcription is active");
  }
  if (state.phase === "TRANSCRIPT_RELEASED" || state.phase === "POLYMERASE_RELEASED") {
    if (state.transcript.status !== "RELEASED") add("transcript.status", "must be RELEASED after transcript release");
    if (state.transcript.hybridLength !== 0) add("transcript.hybridLength", "must be zero after transcript release");
  }
  if (state.pauseReason !== undefined && state.phase !== "PAUSED") add("pauseReason", "is only valid in PAUSED phase");
  return issues.length ? { valid: false, issues } : { valid: true, issues: [] };
}

export function createInitialEukaryoticTranscriptionState(input: Readonly<{
  contractId?: string;
  promoterId?: string;
  templateStrandId?: string;
  nonTemplateStrandId?: string;
  polymeraseId?: string;
  transcriptId?: string;
  templateSequence?: string;
  sourceStatus?: "AVAILABLE" | "REQUIRED_NOT_CONFIGURED";
  sourceId?: string;
}> = {}): EukaryoticTranscriptionState {
  const sourceStatus = input.sourceStatus ?? "REQUIRED_NOT_CONFIGURED";
  return {
    schemaVersion: eukaryoticTranscriptionContractVersion,
    contractId: input.contractId ?? "eukaryotic-transcription-contract",
    timeSeconds: 0,
    phase: "PROMOTER_CLOSED",
    identity: eukaryoticTranscriptionIdentity,
    locus: { promoterId: input.promoterId ?? "promoter", templateStrandId: input.templateStrandId ?? "dna-template", nonTemplateStrandId: input.nonTemplateStrandId ?? "dna-non-template", ...(input.templateSequence === undefined ? {} : { templateSequence: input.templateSequence }), templateReadDirection: "THREE_PRIME_TO_FIVE_PRIME", rnaSynthesisDirection: "FIVE_PRIME_TO_THREE_PRIME", startIndex: 0 },
    polymerase: { id: input.polymeraseId ?? "pol2", state: "AVAILABLE", locusPosition: 0, sourceStatus, ...(input.sourceId === undefined ? {} : { sourceId: input.sourceId }) },
    bubble: { open: false, startIndex: 0, endIndex: 0 },
    transcript: { id: input.transcriptId ?? "nascent-rna", status: "NONE", sequence: "", length: 0, hybridLength: 0 },
    fidelity: sourceStatus === "AVAILABLE" ? "E0_DEPOSITED" : "S2_SCHEMATIC",
    appliedActionIds: [],
  };
}

function rejected(state: EukaryoticTranscriptionState, code: string, reason: string): EukaryoticTranscriptionActionResult {
  return { accepted: false, state, code, reason };
}

export function applyEukaryoticTranscriptionAction(state: EukaryoticTranscriptionState, action: EukaryoticTranscriptionAction): EukaryoticTranscriptionActionResult {
  const validation = validateEukaryoticTranscriptionState(state);
  if (!validation.valid) return rejected(state, "STATE_INVALID", validation.issues.map((entry) => `${entry.path}: ${entry.message}`).join("; "));
  if (!idPattern.test(action.actionId)) return rejected(state, "ACTION_ID_INVALID", "actionId must be a stable ID");
  if (state.appliedActionIds.includes(action.actionId)) return rejected(state, "ACTION_ALREADY_APPLIED", "actionId has already been applied");
  if (!eukaryoticTranscriptionActions.includes(action.kind)) return rejected(state, "ACTION_KIND_INVALID", "action kind is not supported");
  if (!finite(action.atSeconds) || action.atSeconds < state.timeSeconds) return rejected(state, "ACTION_TIME_INVALID", "action time must be finite and monotonic");
  if (!eukaryoticTranscriptionTransitionTable[action.kind].includes(state.phase)) return rejected(state, "ILLEGAL_TRANSITION", `${action.kind} is not legal from ${state.phase}`);
  if (action.kind === "ADD_NUCLEOTIDE") {
    if (!action.nucleotide) return rejected(state, "NUCLEOTIDE_REQUIRED", "ADD_NUCLEOTIDE requires an RNA base");
    const templateBase = state.locus.templateSequence?.[state.transcript.length];
    if (templateBase && dnaToRna[templateBase] !== action.nucleotide) return rejected(state, "TEMPLATE_COMPLEMENT_MISMATCH", "RNA nucleotide must complement the template base");
  }
  if (action.kind === "PAUSE" && !action.pauseReason) return rejected(state, "PAUSE_REASON_REQUIRED", "PAUSE requires a reason");
  const next: MutableState = {
    ...state,
    timeSeconds: action.atSeconds,
    appliedActionIds: [...state.appliedActionIds, action.actionId],
  };
  switch (action.kind) {
    case "ASSEMBLE_PIC": next.phase = "PIC_ASSEMBLED"; next.polymerase = { ...state.polymerase, state: "PIC_ASSOCIATED" }; break;
    case "OPEN_PROMOTER": next.phase = "OPEN_COMPLEX"; next.bubble = { open: true, startIndex: state.locus.startIndex, endIndex: state.locus.startIndex + 8 }; next.polymerase = { ...state.polymerase, state: "PIC_ASSOCIATED" }; break;
    case "INITIATE_TRANSCRIPT": next.phase = "INITIATING"; next.transcript = { ...state.transcript, status: "NASCENT" }; next.polymerase = { ...state.polymerase, state: "INITIATING" }; break;
    case "ADD_NUCLEOTIDE": next.phase = "ELONGATING"; next.transcript = { ...state.transcript, status: "NASCENT", sequence: `${state.transcript.sequence}${action.nucleotide}`, length: state.transcript.length + 1, hybridLength: Math.min(8, state.transcript.hybridLength + 1) }; next.polymerase = { ...state.polymerase, state: "ELONGATING", locusPosition: state.polymerase.locusPosition + 1 }; break;
    case "PAUSE": next.phase = "PAUSED"; next.pauseReason = action.pauseReason; next.polymerase = { ...state.polymerase, state: "PAUSED" }; break;
    case "RESUME": next.phase = "ELONGATING"; delete next.pauseReason; next.polymerase = { ...state.polymerase, state: "ELONGATING" }; break;
    case "BEGIN_TERMINATION": next.phase = "TERMINATING"; next.polymerase = { ...state.polymerase, state: "TERMINATING" }; break;
    case "RELEASE_TRANSCRIPT": next.phase = "TRANSCRIPT_RELEASED"; next.bubble = { ...state.bubble, open: false }; next.transcript = { ...state.transcript, status: "RELEASED", hybridLength: 0 }; next.polymerase = { ...state.polymerase, state: "TERMINATING" }; break;
    case "RELEASE_POLYMERASE": next.phase = "POLYMERASE_RELEASED"; next.polymerase = { ...state.polymerase, state: "RELEASED" }; break;
  }
  const nextState = next as EukaryoticTranscriptionState;
  const nextValidation = validateEukaryoticTranscriptionState(nextState);
  if (!nextValidation.valid) return rejected(state, "ACTION_WOULD_INVALIDATE_STATE", nextValidation.issues.map((entry) => `${entry.path}: ${entry.message}`).join("; "));
  return { accepted: true, state: nextState };
}


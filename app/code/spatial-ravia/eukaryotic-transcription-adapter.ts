import type { GeneExpressionEventV1, GeneExpressionProgramV1 } from "./cellular-gene-expression.ts";
import {
  createInitialEukaryoticTranscriptionState,
  type EukaryoticTranscriptionAction,
  type EukaryoticTranscriptionState,
} from "./eukaryotic-transcription-contract.ts";

export type EukaryoticTranscriptionAdapterResult =
  | Readonly<{ status: "READY"; state: EukaryoticTranscriptionState; actions: readonly EukaryoticTranscriptionAction[] }>
  | Readonly<{ status: "INCOMPATIBLE"; code: string; reasons: readonly string[] }>;

const requiredKinds: readonly GeneExpressionEventV1["kind"][] = [
  "TRANSCRIPTION_MACHINERY_ASSOCIATED",
  "TRANSCRIPTION_BUBBLE_OPENED",
  "TRANSCRIPTION_INITIATED",
  "RNA_NUCLEOTIDE_ADDED",
  "TRANSCRIPTION_TERMINATED",
  "RNA_TRANSCRIPT_RELEASED",
];

function fail(code: string, ...reasons: string[]): EukaryoticTranscriptionAdapterResult {
  return { status: "INCOMPATIBLE", code, reasons };
}

function actionKind(event: GeneExpressionEventV1): EukaryoticTranscriptionAction["kind"] | undefined {
  switch (event.kind) {
    case "TRANSCRIPTION_MACHINERY_ASSOCIATED": return "ASSEMBLE_PIC";
    case "TRANSCRIPTION_BUBBLE_OPENED": return "OPEN_PROMOTER";
    case "TRANSCRIPTION_INITIATED": return "INITIATE_TRANSCRIPT";
    case "RNA_NUCLEOTIDE_ADDED": return "ADD_NUCLEOTIDE";
    case "TRANSCRIPTION_TERMINATED": return "BEGIN_TERMINATION";
    case "RNA_TRANSCRIPT_RELEASED": return "RELEASE_TRANSCRIPT";
    default: return undefined;
  }
}

function transcriptionEvents(program: GeneExpressionProgramV1) {
  return [...program.events]
    .filter((event) => requiredKinds.includes(event.kind))
    .sort((a, b) => a.at - b.at || a.eventId.localeCompare(b.eventId));
}

/**
 * Compatibility boundary from the broad D-C program to the focused contract.
 * It is intentionally conservative: missing action-level nucleotide identity
 * or lifecycle events are reported instead of being fabricated.
 */
export function adaptGeneExpressionProgramToEukaryoticTranscription(
  program: GeneExpressionProgramV1,
  options: Readonly<{ sourceStatus?: "AVAILABLE" | "REQUIRED_NOT_CONFIGURED"; sourceId?: string }> = {},
): EukaryoticTranscriptionAdapterResult {
  const reasons: string[] = [];
  if (program.speciesScope !== "EUKARYOTIC_NUCLEAR") reasons.push("program species scope is not eukaryotic nuclear");
  if (!program.transcriptionGrounding) reasons.push("transcriptionGrounding is required");
  const events = transcriptionEvents(program);
  for (const kind of requiredKinds) if (!events.some((event) => event.kind === kind)) reasons.push(`missing explicit ${kind} event`);
  if (events.some((event) => event.kind === "RNA_NUCLEOTIDE_ADDED" && !Number.isInteger(event.nucleotideCount))) reasons.push("RNA_NUCLEOTIDE_ADDED events require integer counts");
  if (events.some((event) => event.kind === "RNA_NUCLEOTIDE_ADDED")) reasons.push("legacy D-C RNA additions do not carry nucleotide identity or template sequence");
  if (reasons.length) return fail("D_C_TRANSCRIPTION_ADAPTER_INCOMPATIBLE", ...reasons);

  const initial = createInitialEukaryoticTranscriptionState({
    contractId: program.programId,
    promoterId: String(program.actors.promoterId),
    templateStrandId: String(program.actors.templateStrandId),
    nonTemplateStrandId: String(program.actors.nonTemplateStrandId),
    polymeraseId: String(program.actors.rnaPolymeraseIIId),
    transcriptId: String(program.actors.transcriptId),
    sourceStatus: options.sourceStatus,
    sourceId: options.sourceId,
  });
  const actions = events.flatMap((event): EukaryoticTranscriptionAction[] => {
    const kind = actionKind(event);
    if (!kind) return [];
    return [{ actionId: `action-${event.eventId}`, kind, atSeconds: event.at, requestedBy: "TIMELINE" }];
  });
  return { status: "READY", state: initial, actions };
}

import type { BiologySceneSpec } from "./biology-scene-spec.ts";
import type { DnaPromptSelection } from "./biology-dna-prompt-intent.ts";
import { getDnaCompositionPlan, type DnaCompositionCamera } from "./biology-dna-composition.ts";
import { getDnaRepresentationSpecification, type DnaDetailLevel } from "./biology-dna-representation-contract.ts";
import type { LocalChemistrySubject } from "./DnaLocalChemistryRepresentation.ts";

export type DnaVisualFamily =
  | "structure"
  | "regulation"
  | "replication"
  | "transcription"
  | "damageRepair"
  | "packaging"
  | "localChemistry";

export type DnaVisualTemplate = {
  family: DnaVisualFamily;
  templateId: `dna-${string}`;
  representationLevel: DnaDetailLevel;
  focus: string;
  scale: BiologySceneSpec["scale"];
  importantEntities: readonly string[];
  cameraPreset: DnaCompositionCamera;
  useExperimentalCoordinates: boolean;
  useCanonicalProceduralDNA: boolean;
  allowProteinContext: boolean;
  allowTranscriptionComplex: boolean;
  allowReplicationMachinery: boolean;
  allowBallAndStick: boolean;
  labels: readonly string[];
  localChemistrySubject?: LocalChemistrySubject;
};

export type DnaTemplateRendererOwner = "molecular-view" | "mechanistic-dna" | "packaging" | "local-chemistry";

const familyFromSelection: Record<DnaPromptSelection["family"], DnaVisualFamily> = {
  structure: "structure",
  "sequence-regulation": "regulation",
  replication: "replication",
  transcription: "transcription",
  "damage-repair": "damageRepair",
  packaging: "packaging",
  "local-chemistry": "localChemistry",
};

const contractFamily: Record<DnaVisualFamily, DnaPromptSelection["family"]> = {
  structure: "structure",
  regulation: "sequence-regulation",
  replication: "replication",
  transcription: "transcription",
  damageRepair: "damage-repair",
  packaging: "packaging",
  localChemistry: "local-chemistry",
};

const templateNames: Record<DnaVisualFamily, DnaVisualTemplate["templateId"]> = {
  structure: "dna-structure-template",
  regulation: "dna-regulation-template",
  replication: "dna-replication-template",
  transcription: "dna-transcription-template",
  damageRepair: "dna-damage-repair-template",
  packaging: "dna-packaging-template",
  localChemistry: "dna-local-chemistry-template",
};

function entityIds(scene: BiologySceneSpec) {
  return new Set(scene.entities.map((entity) => entity.id));
}

/** Infer DNA ownership from the normalized scene when a parse-result selection is unavailable. */
function inferDnaFamily(scene: BiologySceneSpec): DnaVisualFamily | undefined {
  const entities = entityIds(scene);
  if (!entities.has("dna")) return undefined;
  if (scene.scale === "atomic" || entities.has("base-pair")) return "localChemistry";
  if (entities.has("histone") || [...entities].some((id) => /histone|chromatin|packag/.test(id))) return "packaging";
  if (entities.has("damage") || entities.has("repair-machinery") || [...entities].some((id) => /repair|lesion|mismatch/.test(id))) return "damageRepair";
  if (entities.has("rna-polymerase") || entities.has("template-strand") || entities.has("coding-strand") || scene.actions.some((action) => /transcrib|rna/.test(action.action))) return "transcription";
  if (entities.has("helicase") || entities.has("polymerase") || scene.actions.some((action) => /replic|unwind|synthes/.test(action.action))) return "replication";
  if (entities.has("promoter") || scene.dnaRegions?.length) return "regulation";
  return "structure";
}

function labelsFor(family: DnaVisualFamily) {
  switch (family) {
    case "regulation": return ["promoter", "gene"];
    case "transcription": return ["template", "coding", "bubble"];
    case "damageRepair": return ["lesion", "repair"];
    case "packaging": return ["nucleosome"];
    case "localChemistry": return ["base-pair"];
    default: return ["5-prime", "3-prime"];
  }
}

/**
 * The sole renderer-ownership decision for DNA scenes. A supplied DNA prompt
 * selection wins over legacy scene vocabulary; scene inference is the safe
 * fallback for callers that only have a BiologySceneSpec.
 */
export function resolveDnaVisualTemplate(
  scene: BiologySceneSpec,
  selection?: DnaPromptSelection,
): DnaVisualTemplate | undefined {
  const family = selection ? familyFromSelection[selection.family] : inferDnaFamily(scene);
  if (!family) return undefined;
  const sourceFamily = contractFamily[family];
  const specification = getDnaRepresentationSpecification(sourceFamily);
  const composition = getDnaCompositionPlan(sourceFamily);
  const level = selection?.detailLevel ?? specification.representation;
  const importantEntities = selection?.requestedEntities.map((entity) => entity) ?? scene.entities.map((entity) => entity.id);
  const complexFamily = family === "replication" || family === "transcription";

  return {
    family,
    templateId: templateNames[family],
    representationLevel: level,
    focus: selection?.focalRegion.kind ?? specification.focalRegion.kind,
    scale: scene.scale,
    importantEntities,
    cameraPreset: composition.camera,
    useExperimentalCoordinates: family === "structure" || family === "localChemistry" || complexFamily,
    useCanonicalProceduralDNA: family !== "transcription",
    allowProteinContext: ["replication", "transcription", "damageRepair", "packaging"].includes(family),
    allowTranscriptionComplex: family === "transcription",
    allowReplicationMachinery: family === "replication",
    allowBallAndStick: level === "atom" || level === "residue" || family === "damageRepair" || family === "localChemistry",
    labels: labelsFor(family),
    localChemistrySubject: selection?.localChemistrySubject,
  };
}

/** Guards legacy renderers from taking ownership of an incompatible DNA family. */
export function dnaTemplateUsesLegacyMechanism(template: DnaVisualTemplate) {
  return template.family === "replication" || template.family === "transcription";
}

/** One explicit mount owner per DNA family; unrelated legacy renderers never arbitrate. */
export function resolveDnaTemplateRendererOwner(template: DnaVisualTemplate): DnaTemplateRendererOwner {
  if (template.family === "replication" || template.family === "transcription") return "mechanistic-dna";
  if (template.family === "packaging") return "packaging";
  if (template.family === "damageRepair" || template.family === "localChemistry") return "local-chemistry";
  return "molecular-view";
}

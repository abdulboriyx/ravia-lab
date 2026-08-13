import type { BiologySceneSpec } from "./biology-scene-spec.ts";

export type TranslationDisplayIntent = "overview" | "recognition" | "transfer" | "translocation" | "termination" | "entry";

export function deriveTranslationDisplayIntent(scene: BiologySceneSpec): TranslationDisplayIntent {
  const actions = scene.actions.map((action) => action.action);
  const entities = new Set(scene.entities.map((entity) => entity.id));
  if (entities.has("release-factor") || actions.includes("terminates")) return "termination";
  if (actions.includes("forms_peptide_bond") && actions.includes("advances_one_codon")) return "overview";
  if (actions.includes("forms_peptide_bond")) return "transfer";
  if (actions.includes("moves_through") || actions.includes("advances_one_codon")) return "translocation";
  if (entities.has("aminoacyl-trna") || entities.has("amino-acid")) return "entry";
  if (entities.has("codon") || entities.has("anticodon")) return "recognition";
  return "overview";
}

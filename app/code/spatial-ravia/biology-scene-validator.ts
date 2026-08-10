import type { BiologyContext } from "./biology-context.ts";
import type { BiologySceneSpec } from "./biology-scene-spec.ts";

export type BiologySceneValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

export function validateBiologySceneConsistency(
  scene: BiologySceneSpec,
  context: BiologyContext
): BiologySceneValidationResult {
  const entityIds = new Set(scene.entities.map((entity) => entity.id));

  for (const relation of scene.relations) {
    if (!entityIds.has(relation.subject)) {
      return {
        ok: false,
        reason: `Relation subject "${relation.subject}" is not present in entities.`,
      };
    }

    if (!entityIds.has(relation.object)) {
      return {
        ok: false,
        reason: `Relation object "${relation.object}" is not present in entities.`,
      };
    }
  }

  for (const action of scene.actions) {
    if (!entityIds.has(action.actor)) {
      return {
        ok: false,
        reason: `Action actor "${action.actor}" is not present in entities.`,
      };
    }

    if (action.target && !entityIds.has(action.target)) {
      return {
        ok: false,
        reason: `Action target "${action.target}" is not present in entities.`,
      };
    }
  }

  if (
    scene.renderMode === "molecular-structure" &&
    scene.intent !== "structure"
  ) {
    return {
      ok: false,
      reason: "Molecular structure rendering is only valid for structure scenes.",
    };
  }

  if (
    scene.renderMode === "mechanistic-3d" &&
    scene.relations.length === 0 &&
    scene.actions.length === 0
  ) {
    return {
      ok: false,
      reason: "Mechanistic scenes need at least one relation or action.",
    };
  }

  if (context.organism === "bacterial" && entityIds.has("rpa")) {
    return {
      ok: false,
      reason: "Bacterial ssDNA stabilization should not use eukaryotic RPA.",
    };
  }

  if (context.organism === "eukaryotic" && entityIds.has("ssb")) {
    return {
      ok: false,
      reason: "Eukaryotic ssDNA stabilization should not use bacterial SSB.",
    };
  }

  if (
    context.organism === "bacterial" &&
    entityIds.has("rna-polymerase-ii")
  ) {
    return {
      ok: false,
      reason: "Bacterial transcription should not use RNA polymerase II.",
    };
  }

  if (
    context.organism === "eukaryotic" &&
    (entityIds.has("bacterial-rna-polymerase") || entityIds.has("sigma-factor"))
  ) {
    return {
      ok: false,
      reason:
        "Eukaryotic transcription should not use bacterial RNA polymerase or sigma factor.",
    };
  }

  if (
    entityIds.has("rna-transcript") &&
    scene.actions.some((action) => action.target?.startsWith("daughter-"))
  ) {
    return {
      ok: false,
      reason: "Transcription scenes should synthesize RNA, not daughter DNA.",
    };
  }

  if (
    entityIds.has("ribosome") &&
    scene.actions.some(
      (action) =>
        action.actor === "ribosome" &&
        (action.target === "rna-transcript" || action.target?.startsWith("daughter-"))
    )
  ) {
    return {
      ok: false,
      reason: "Ribosomes synthesize polypeptides, not RNA transcripts or daughter DNA.",
    };
  }

  if (
    entityIds.has("rna-polymerase") &&
    scene.actions.some((action) => action.target === "polypeptide")
  ) {
    return {
      ok: false,
      reason: "RNA polymerase should not synthesize polypeptides.",
    };
  }

  if (
    entityIds.has("stop-codon") &&
    scene.relations.some(
      (relation) =>
        relation.object === "stop-codon" &&
        (relation.subject === "trna" || relation.subject === "aminoacyl-trna")
    )
  ) {
    return {
      ok: false,
      reason: "Stop codons should be recognized by release factors, not normal tRNAs.",
    };
  }

  if (
    entityIds.has("polypeptide") &&
    scene.relations.some(
      (relation) =>
        relation.subject === "polypeptide" &&
        relation.relation === "attached_to" &&
        relation.object === "mrna"
    )
  ) {
    return {
      ok: false,
      reason: "Polypeptides should not be represented as attached to mRNA.",
    };
  }

  if (
    entityIds.has("ligand") &&
    !scene.relations.some(
      (relation) =>
        relation.subject === "ligand" &&
        relation.relation === "located_in" &&
        relation.object === "extracellular-space"
    )
  ) {
    return {
      ok: false,
      reason: "Extracellular signaling ligands must be located outside the plasma membrane.",
    };
  }

  if (
    entityIds.has("receptor-tyrosine-kinase") &&
    !scene.relations.some(
      (relation) =>
        relation.subject === "receptor-tyrosine-kinase" &&
        relation.relation === "embedded_in" &&
        relation.object === "plasma-membrane"
    )
  ) {
    return {
      ok: false,
      reason: "Membrane receptor scenes must embed the receptor in the plasma membrane.",
    };
  }

  if (
    entityIds.has("phosphotyrosine-site") &&
    !scene.relations.some(
      (relation) =>
        relation.subject === "phosphotyrosine-site" &&
        relation.relation === "cytoplasmic_side_of"
    )
  ) {
    return {
      ok: false,
      reason: "RTK phosphotyrosine sites should be on cytoplasmic receptor tails.",
    };
  }

  if (
    entityIds.has("ras-gtp") &&
    !entityIds.has("ras")
  ) {
    return {
      ok: false,
      reason: "Ras-GTP state requires a Ras entity.",
    };
  }

  if (
    entityIds.has("ras") &&
    !scene.relations.some(
      (relation) =>
        relation.subject === "ras" &&
        relation.relation === "associated_with_surface" &&
        relation.object === "plasma-membrane"
    )
  ) {
    return {
      ok: false,
      reason: "Ras should remain associated with the inner membrane surface.",
    };
  }

  if (
    scene.actions.some(
      (action) =>
        action.actor === "ribosome" &&
        ["phosphorylates", "activates"].includes(action.action)
    )
  ) {
    return {
      ok: false,
      reason: "Translation machinery should not be used as an RTK signaling effector.",
    };
  }

  if (
    entityIds.has("rna-polymerase") &&
    entityIds.has("receptor-tyrosine-kinase")
  ) {
    return {
      ok: false,
      reason: "RNA polymerase should not be represented as a membrane receptor.",
    };
  }

  return { ok: true };
}

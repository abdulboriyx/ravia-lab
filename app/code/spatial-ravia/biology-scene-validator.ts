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

  if (entityIds.has("voltage-gated-sodium-channel")) {
    if (
      !scene.relations.some(
        (relation) =>
          relation.subject === "voltage-gated-sodium-channel" &&
          relation.relation === "embedded_in" &&
          relation.object === "plasma-membrane"
      )
    ) {
      return {
        ok: false,
        reason: "Voltage-gated sodium channels must be embedded in the plasma membrane.",
      };
    }
  }

  if (entityIds.has("voltage-gated-potassium-channel")) {
    if (
      !scene.relations.some(
        (relation) =>
          relation.subject === "voltage-gated-potassium-channel" &&
          relation.relation === "embedded_in" &&
          relation.object === "plasma-membrane"
      )
    ) {
      return {
        ok: false,
        reason: "Voltage-gated potassium channels must be embedded in the plasma membrane.",
      };
    }
  }

  if (
    entityIds.has("sodium-ion") &&
    !scene.relations.some(
      (relation) =>
        relation.subject === "sodium-ion" &&
        relation.relation === "higher_concentration_in" &&
        relation.object === "extracellular-space"
    )
  ) {
    return {
      ok: false,
      reason: "Action-potential scenes should represent Na+ as higher outside the cell.",
    };
  }

  if (
    entityIds.has("potassium-ion") &&
    !scene.relations.some(
      (relation) =>
        relation.subject === "potassium-ion" &&
        relation.relation === "higher_concentration_in" &&
        relation.object === "cytoplasm"
    )
  ) {
    return {
      ok: false,
      reason: "Action-potential scenes should represent K+ as higher inside the cell.",
    };
  }

  if (
    entityIds.has("sodium-current") &&
    !scene.relations.some(
      (relation) =>
        relation.subject === "sodium-current" &&
        relation.relation === "flows_into" &&
        relation.object === "cytoplasm"
    )
  ) {
    return {
      ok: false,
      reason: "Canonical action-potential Na+ current should flow inward.",
    };
  }

  if (
    entityIds.has("potassium-current") &&
    !scene.relations.some(
      (relation) =>
        relation.subject === "potassium-current" &&
        relation.relation === "flows_out_to" &&
        relation.object === "extracellular-space"
    )
  ) {
    return {
      ok: false,
      reason: "Canonical action-potential K+ current should flow outward.",
    };
  }

  if (scene.temporal) {
    const orderedPhases = [...scene.temporal.phases].sort(
      (left, right) => left.order - right.order
    );
    const phaseIds = new Set(scene.temporal.phases.map((phase) => phase.id));

    if (!phaseIds.has(scene.temporal.currentPhase)) {
      return {
        ok: false,
        reason: "Current temporal phase must exist in the temporal phase plan.",
      };
    }

    const expectedOrder = [
      "rest",
      "threshold",
      "depolarization",
      "peak",
      "repolarization",
      "hyperpolarization",
      "recovery",
    ];

    if (
      expectedOrder.every((phase) => phaseIds.has(phase)) &&
      orderedPhases.map((phase) => phase.id).join("|") !== expectedOrder.join("|")
    ) {
      return {
        ok: false,
        reason: "Action-potential phases must be temporally ordered from rest through recovery.",
      };
    }

    if (expectedOrder.every((phase) => phaseIds.has(phase))) {
      const phaseById = new Map(scene.temporal.phases.map((phase) => [phase.id, phase]));
      const depolarization = phaseById.get("depolarization");
      const repolarization = phaseById.get("repolarization");
      const peak = phaseById.get("peak");
      const hyperpolarization = phaseById.get("hyperpolarization");

      if (depolarization?.dominantFlux !== "sodium-current inward") {
        return {
          ok: false,
          reason: "Depolarization should be dominated by inward Na+ current.",
        };
      }

      if (repolarization?.dominantFlux !== "potassium-current outward") {
        return {
          ok: false,
          reason: "Repolarization should be dominated by outward K+ current.",
        };
      }

      if (
        peak?.states["voltage-gated-sodium-channel"] !== "inactivated" ||
        repolarization?.states["voltage-gated-sodium-channel"] !== "inactivated"
      ) {
        return {
          ok: false,
          reason: "Na+ channels should be inactivated at peak/repolarization in the canonical AP scene.",
        };
      }

      if (
        hyperpolarization?.states["voltage-gated-potassium-channel"] !== "still-open-closing"
      ) {
        return {
          ok: false,
          reason: "Hyperpolarization should include continued K+ conductance.",
        };
      }
    }
  }

  return { ok: true };
}

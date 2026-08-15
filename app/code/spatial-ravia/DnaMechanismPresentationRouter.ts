import type { DnaMechanismFamily } from "./dna-mechanism-contract.ts";
import { buildDnaMechanismRepresentationPlan, type DnaMechanismRepresentationPlan } from "./dna-mechanism-resolution.ts";
import { resolveDnaMechanismIntent } from "./dna-mechanism-intent.ts";
import { deriveDnaBasePairInteractionPresentation, type DnaBasePairInteractionPresentation } from "./DnaBasePairInteractionPresentation.ts";
import { deriveDnaBackboneChemistryPresentation, type DnaBackboneChemistryPresentation } from "./DnaBackboneChemistryPresentation.ts";
import { deriveDnaPolarityAntiparallelPresentation, type DnaPolarityAntiparallelPresentation } from "./DnaPolarityAntiparallelPresentation.ts";
import { deriveDnaHelixStabilizationPresentation, type DnaHelixStabilizationPresentation } from "./DnaHelixStabilizationPresentation.ts";
import { deriveDnaStrandSeparationPresentation, type DnaStrandSeparationPresentation } from "./DnaStrandSeparationPresentation.ts";

export const dnaMechanismPresentationOwners = {
  basePairing: "DnaBasePairInteractionPresentation",
  backboneChemistry: "DnaBackboneChemistryPresentation",
  polarityAntiparallel: "DnaPolarityAntiparallelPresentation",
  helixStabilization: "DnaHelixStabilizationPresentation",
  strandSeparation: "DnaStrandSeparationPresentation",
  // Assembly deliberately mounts the shared backbone/local-chemistry substrate.
  nucleotideAssembly: "DnaBackboneChemistryPresentation",
} as const satisfies Record<DnaMechanismFamily, string>;

export type DnaMechanismPresentationOwner = typeof dnaMechanismPresentationOwners[DnaMechanismFamily];
export type DnaMechanismPresentation =
  | DnaBasePairInteractionPresentation
  | DnaBackboneChemistryPresentation
  | DnaPolarityAntiparallelPresentation
  | DnaHelixStabilizationPresentation
  | DnaStrandSeparationPresentation;

export type DnaMechanismPresentationRoute = {
  family: DnaMechanismFamily;
  owner: DnaMechanismPresentationOwner;
  plan: DnaMechanismRepresentationPlan;
  presentation: DnaMechanismPresentation;
  localChemistrySubject: "at-base-pair" | "gc-base-pair" | "backbone-linkage" | "nucleotide" | undefined;
};

/** Routes by the resolved mechanism family and plan, never by an individual prompt. */
export function routeDnaMechanismPresentation(plan: DnaMechanismRepresentationPlan): DnaMechanismPresentationRoute {
  const family = plan.sourceSpec.family;
  let presentation: DnaMechanismPresentation;
  switch (family) {
    case "basePairing":
      presentation = deriveDnaBasePairInteractionPresentation(plan);
      break;
    case "backboneChemistry":
    case "nucleotideAssembly":
      presentation = deriveDnaBackboneChemistryPresentation(plan);
      break;
    case "polarityAntiparallel":
      presentation = deriveDnaPolarityAntiparallelPresentation(plan);
      break;
    case "helixStabilization":
      presentation = deriveDnaHelixStabilizationPresentation(plan);
      break;
    case "strandSeparation":
      presentation = deriveDnaStrandSeparationPresentation(plan);
      break;
  }

  const pair = family === "basePairing" && "pair" in presentation ? presentation.pair : undefined;
  return {
    family,
    owner: dnaMechanismPresentationOwners[family],
    plan,
    presentation,
    localChemistrySubject: family === "backboneChemistry"
      ? "backbone-linkage"
      : family === "nucleotideAssembly"
        ? "nucleotide"
        : pair === "G-C"
          ? "gc-base-pair"
          : pair === "A-T"
            ? "at-base-pair"
            : undefined,
  };
}

/** Authoritative prompt entry point. Generic DNA prompts return undefined. */
export function resolveDnaMechanismPresentation(prompt: string): DnaMechanismPresentationRoute | undefined {
  const intent = resolveDnaMechanismIntent(prompt);
  return intent ? routeDnaMechanismPresentation(buildDnaMechanismRepresentationPlan(intent.spec)) : undefined;
}


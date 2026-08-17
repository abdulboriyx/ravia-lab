import { resolveRnaPresentation } from "./RnaPresentationRouter.ts";
import { deriveProductionRnaScenePlan, type RnaProductionScenePlan } from "./RnaProductionScenePlan.ts";
import { boundsFromPoints, type RnaCompositionBounds } from "./RnaProductionComposition.ts";

export const rnaPhase2AcceptancePrompts = [
  "show the structure of RNA",
  "show a single RNA nucleotide",
  "show the 2 prime OH in RNA",
  "show a phosphodiester bond in RNA",
  "show the structure of mRNA",
  "show a tRNA",
  "show rRNA",
  "compare mRNA and tRNA",
  "show newly synthesized RNA",
  "show RNA emerging from transcription",
  "show DNA and its nascent RNA transcript",
  "show introns and exons in pre mRNA",
  "compare pre mRNA and mature mRNA",
  "show the 5 prime cap on mRNA",
  "show an RNA hairpin",
  "show a bulge in RNA",
  "show an internal loop in RNA",
  "show how adenine pairs with uracil",
  "show G C pairing in RNA",
  "show an RNA DNA hybrid",
  "show RNA being cleaved",
  "show exonuclease degradation of RNA",
  "why is RNA less chemically stable than DNA",
  "compare a DNA nucleotide and an RNA nucleotide",
] as const;

function planBounds(plan: RnaProductionScenePlan): RnaCompositionBounds | null {
  const points = [
    ...plan.strands.flatMap((strand) => strand.samples.flatMap((sample) => [sample.backbone, sample.ribose, sample.basePosition])),
    ...plan.atoms.map((atom) => atom.position),
    ...plan.comparisonAtoms.map((atom) => atom.position),
    ...plan.interactions.flatMap((interaction) => [interaction.from, interaction.to]),
    ...plan.labels.map((label) => label.position),
  ];
  return boundsFromPoints(points);
}

export type RnaPhase2AcceptanceEntry = {
  prompt: string;
  family: string;
  owner: string;
  presentationMode: string;
  rnaType: string;
  cameraIntent: string;
  grounding: string;
  highlightedGroups: readonly string[];
  highlightedInteractions: readonly string[];
  bounds: RnaCompositionBounds | null;
  labels: readonly string[];
};

export function buildRnaPhase2AcceptanceManifest(): RnaPhase2AcceptanceEntry[] {
  return rnaPhase2AcceptancePrompts.map((prompt) => {
    const route = resolveRnaPresentation(prompt);
    if (!route) throw new Error(`RNA acceptance prompt did not resolve: ${prompt}`);
    const plan = deriveProductionRnaScenePlan(route);
    return {
      prompt,
      family: route.family,
      owner: route.owner,
      presentationMode: route.representationMode,
      rnaType: route.rnaType,
      cameraIntent: route.cameraIntent,
      grounding: route.groundingStatus,
      highlightedGroups: route.highlightedRegions,
      highlightedInteractions: route.highlightedInteractions,
      bounds: planBounds(plan),
      labels: route.labels,
    };
  });
}

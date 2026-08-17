import type { RnaFamily, RnaIntent, RnaSceneSpec } from "./rna-contract.ts";
import { resolveRnaIntent } from "./rna-intent.ts";
import { canonicalRnaView, rnaCameraFor, rnaMaterialPalette, rnaTopologyState, sampleCanonicalRna, type RnaResidueSample } from "./RnaVisualSystem.ts";
import { createRnaLocalChemistryPresentation, type RnaLocalChemistryPresentation } from "./RnaLocalChemistryPresentation.ts";
import { createRnaSecondaryStructureSpec, deriveRnaSecondaryStructurePresentation, type RnaSecondaryStructureMotif, type RnaSecondaryStructurePresentation } from "./RnaSecondaryStructurePresentation.ts";
import { deriveRnaTypePresentation, type RnaTypePresentation } from "./RnaTypePresentation.ts";
import { deriveRnaPairingPresentation, type RnaPairingPresentation } from "./RnaPairingPresentation.ts";
import { deriveRnaProcessingPresentation, type RnaProcessingPresentation } from "./RnaProcessingPresentation.ts";
import { deriveRnaDegradationPresentation, type RnaDegradationPresentation } from "./RnaDegradationPresentation.ts";
import { deriveRnaNascentTranscriptPresentation, type NascentTranscriptPresentation } from "./RnaNascentTranscriptPresentation.ts";

export const rnaPresentationOwners = {
  structure: "RnaVisualSystem",
  typesFunctions: "RnaTypePresentation",
  nascentTranscript: "RnaNascentTranscriptPresentation",
  processing: "RnaProcessingPresentation",
  secondaryStructure: "RnaSecondaryStructurePresentation",
  pairingHybridization: "RnaPairingPresentation",
  degradationStability: "RnaDegradationPresentation",
  localChemistry: "RnaLocalChemistryPresentation",
} as const satisfies Record<RnaFamily, string>;

export type RnaPresentationOwner = typeof rnaPresentationOwners[RnaFamily];

export type RnaSharedSubstratePresentation = {
  family: "structure" | "nascentTranscript";
  representation: ReturnType<typeof canonicalRnaView>;
  samples: readonly RnaResidueSample[];
  camera: ReturnType<typeof rnaCameraFor>;
  labels: readonly { text: string; target: string }[];
  highlightedGroups: readonly string[];
  grounding: "educational-procedural";
  dnaContextRequired: boolean;
};

export type RnaPresentationPayload =
  | RnaSharedSubstratePresentation
  | RnaTypePresentation
  | RnaLocalChemistryPresentation
  | RnaSecondaryStructurePresentation
  | RnaPairingPresentation
  | RnaProcessingPresentation
  | RnaDegradationPresentation
  | NascentTranscriptPresentation;

export type RnaPresentationRoute = {
  family: RnaFamily;
  owner: RnaPresentationOwner;
  sourceSpec: RnaSceneSpec;
  focus: string;
  cameraIntent: ReturnType<typeof rnaCameraFor>["intent"];
  groundingStatus: "educational-procedural" | "experimentally-grounded";
  rnaType: RnaSceneSpec["rnaType"];
  structuralState: RnaSceneSpec["structuralState"];
  labels: readonly string[];
  highlightedRegions: readonly string[];
  highlightedInteractions: readonly string[];
  representationMode: string;
  presentation: RnaPresentationPayload;
};

function structureFocus(spec: RnaSceneSpec): Parameters<typeof canonicalRnaView>[0] {
  if (spec.scale.level === "nucleotide") return "nucleotide";
  if (spec.scale.level === "secondaryStructure") return "secondary-structure";
  if (spec.scale.level === "localChemistry") return "local-chemistry";
  if (spec.pairingState !== "none") return "base-pair";
  return "whole-rna";
}

function sharedSubstrate(spec: RnaSceneSpec): RnaSharedSubstratePresentation {
  const family = spec.family === "nascentTranscript" ? "nascentTranscript" : "structure";
  const focus = family === "nascentTranscript" ? "whole-rna" : structureFocus(spec);
  const topology = rnaTopologyState("singleStrand", Math.max(8, spec.scale.level === "nucleotide" ? 1 : 16));
  return { family, representation: canonicalRnaView(focus), samples: sampleCanonicalRna(topology.unpairedResidues.length, { topology: "single-stranded", lod: canonicalRnaView(focus).lod, source: "canonical-procedural", topologyState: topology }), camera: rnaCameraFor(focus === "whole-rna" ? "whole-rna" : focus === "base-pair" ? "secondary-structure" : focus), labels: family === "nascentTranscript" ? [{ text: "Nascent RNA transcript", target: "rna-transcript" }] : [], highlightedGroups: family === "nascentTranscript" ? ["nascentTranscript"] : [], grounding: "educational-procedural", dnaContextRequired: spec.dnaContext.required };
}

function secondaryMotif(spec: RnaSceneSpec): RnaSecondaryStructureMotif {
  const motifs = spec.secondaryStructure.motifs;
  if (motifs.includes("bulge")) return "bulge";
  if (motifs.includes("internalLoop")) return "internalLoop";
  if (motifs.includes("stem")) return motifs.includes("hairpin") || motifs.includes("stemLoop") ? "hairpin" : "stem";
  return "pairedUnpaired";
}

function routePresentation(spec: RnaSceneSpec): RnaPresentationPayload {
  switch (spec.family) {
    case "structure":
      return sharedSubstrate(spec);
    case "nascentTranscript":
      return deriveRnaNascentTranscriptPresentation(spec);
    case "typesFunctions":
      return deriveRnaTypePresentation(spec);
    case "localChemistry":
      return createRnaLocalChemistryPresentation(spec, { mode: spec.dnaContext.required ? "comparison" : undefined });
    case "secondaryStructure":
      return deriveRnaSecondaryStructurePresentation(createRnaSecondaryStructureSpec(secondaryMotif(spec)));
    case "pairingHybridization":
      return deriveRnaPairingPresentation(spec);
    case "processing":
      return deriveRnaProcessingPresentation(spec);
    case "degradationStability":
      return deriveRnaDegradationPresentation(spec);
  }
}

function presentationMetadata(presentation: RnaPresentationPayload) {
  if ("family" in presentation && presentation.family === "nascentTranscript" && "hierarchy" in presentation) return { cameraIntent: "whole-rna" as const, groundingStatus: "educational-procedural" as const, representationMode: presentation.mode, labels: presentation.labels.map((label) => label.text), highlightedRegions: ["nascent-rna", "dna-template", "transcription-exit"], highlightedInteractions: [] };
  if ("grounding" in presentation && "family" in presentation) return { cameraIntent: presentation.camera.intent, groundingStatus: presentation.grounding, representationMode: presentation.family, labels: presentation.labels.map((label) => label.text), highlightedRegions: presentation.highlightedGroups, highlightedInteractions: [] };
  if ("policy" in presentation) return { cameraIntent: presentation.policy.cameraIntent, groundingStatus: presentation.grounding.status, representationMode: presentation.policy.view, labels: presentation.labels.map((label) => label.text), highlightedRegions: presentation.topology.regions.map((region) => region.id), highlightedInteractions: [] };
  if ("localScale" in presentation) return { cameraIntent: presentation.representation.camera.intent === "secondary-structure" ? "secondary-structure" as const : presentation.representation.camera.intent, groundingStatus: "educational-procedural" as const, representationMode: presentation.mode, labels: presentation.labels.map((label) => label.text), highlightedRegions: presentation.highlightedGroups, highlightedInteractions: presentation.bonds.filter((bond) => bond.type === "phosphodiester").map((bond) => bond.id) };
  if ("topology" in presentation && "interactions" in presentation && "backboneLinks" in presentation) return { cameraIntent: presentation.camera.intent, groundingStatus: "educational-procedural" as const, representationMode: presentation.motif, labels: presentation.labels.map((label) => label.text), highlightedRegions: presentation.topology.regions.map((region) => region.id), highlightedInteractions: presentation.interactions.map((interaction) => interaction.id) };
  if ("hybridPlan" in presentation) return { cameraIntent: presentation.camera.intent, groundingStatus: "educational-procedural" as const, representationMode: presentation.spec.mode, labels: presentation.labels.map((label) => label.text), highlightedRegions: [], highlightedInteractions: presentation.interactions.map((interaction) => interaction.id) };
  if ("transcriptIdentity" in presentation) return { cameraIntent: presentation.camera.intent, groundingStatus: "educational-procedural" as const, representationMode: presentation.mode, labels: presentation.labels.map((label) => label.text), highlightedRegions: presentation.topology.regions.map((region) => region.id), highlightedInteractions: presentation.topology.spliceJunctions.map((junction) => junction.id) };
  if ("backboneLinks" in presentation && "exposedEnds" in presentation) return { cameraIntent: presentation.camera.intent, groundingStatus: "educational-procedural" as const, representationMode: presentation.spec.mode, labels: presentation.labels.map((label) => label.text), highlightedRegions: presentation.fragments.map((fragment) => fragment.id), highlightedInteractions: presentation.backboneLinks.filter((link) => link.targeted || link.state === "absent").map((link) => link.id) };
  throw new Error("Unsupported RNA presentation payload");
}

export function routeRnaPresentation(sceneSpec: RnaSceneSpec): RnaPresentationRoute {
  const presentation = routePresentation(sceneSpec);
  const metadata = presentationMetadata(presentation);
  return { family: sceneSpec.family, owner: rnaPresentationOwners[sceneSpec.family], sourceSpec: sceneSpec, focus: sceneSpec.focus, cameraIntent: metadata.cameraIntent, groundingStatus: metadata.groundingStatus, rnaType: sceneSpec.rnaType, structuralState: sceneSpec.structuralState, labels: metadata.labels, highlightedRegions: metadata.highlightedRegions, highlightedInteractions: metadata.highlightedInteractions, representationMode: metadata.representationMode, presentation };
}

export function resolveRnaPresentation(prompt: string): RnaPresentationRoute | undefined {
  const intent: RnaIntent | undefined = resolveRnaIntent(prompt);
  return intent ? routeRnaPresentation(intent.spec) : undefined;
}

export function isRnaPresentationRoute(route: RnaPresentationRoute): boolean {
  return route.owner === rnaPresentationOwners[route.family] && route.sourceSpec.family === route.family && route.cameraIntent.length > 0 && route.representationMode.length > 0;
}

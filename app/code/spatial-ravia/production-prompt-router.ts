import { compilePromptIngress, type PromptIngressResult } from "./prompt-ingress-compiler.ts";
import { normalizeBiologyPrompt } from "./biology-normalizer.ts";
import { resolveDnaMechanismPresentation } from "./DnaMechanismPresentationRouter.ts";
import { capabilityRegistryV2 } from "./capability-registry.ts";
import { eukaryoticPolIIElongationSourceRequirements } from "./transcription-polymerase-representation.ts";

export type ProductionPromptRoute = Readonly<{
  normalizedPrompt: PromptIngressResult["normalizedPrompt"];
  semanticIntent: PromptIngressResult["semanticIntent"];
  ingressDisposition: PromptIngressResult["disposition"];
  capabilityId: string;
  capabilitySupportStatus: string;
  scientificOwner: string;
  productionOwner: string;
  p3StateAvailability: "AVAILABLE_VIA_CANONICAL_OWNER" | "LEGACY_OWNER_ONLY" | "UNAVAILABLE";
  p4StateAvailability: "AVAILABLE_VIA_CANONICAL_OWNER" | "LEGACY_OWNER_ONLY" | "UNAVAILABLE";
  rendererOwner: string;
  fallback: "none" | "explicit-error";
  failure?: Readonly<{ code: string; message: string }>;
}>;

export type ProductionPromptRoutingContext = Readonly<{
  /** The canonical resolver supplies this once transcription identity is known. */
  transcriptionIdentity?: "EUKARYOTIC_NUCLEAR" | "BACTERIAL";
}>;

const cellularRoutes = [
  { test: /\btranscription|rna polymerase|make rna\b/i, capabilityId: "transcription-elongation", owner: "GENE_EXPRESSION_CELLULAR_V1", scientificOwner: "GENE_EXPRESSION_CELLULAR_V1" },
  { test: /\b(splic|intron|exon)\w*/i, capabilityId: "mrna-splicing", owner: "GENE_EXPRESSION_CELLULAR_V1", scientificOwner: "GENE_EXPRESSION_CELLULAR_V1" },
  { test: /\b(translation|ribosome|codon|trna)\w*/i, capabilityId: "translation-initiation", owner: "GENE_EXPRESSION_CELLULAR_V1", scientificOwner: "GENE_EXPRESSION_CELLULAR_V1" },
  { test: /secreted protein|secretory pathway|\b(er|golgi|translocon)\b/i, capabilityId: "er-targeting", owner: "SECRETORY_PATHWAY_CELLULAR_V1", scientificOwner: "SECRETORY_PATHWAY_CELLULAR_V1" },
  { test: /\b(kinesin|dynein)\b|transporting a vesicle|vesicle transport/i, capabilityId: "kinesin-cargo-transport", owner: "INTRACELLULAR_TRANSPORT_CELLULAR_V1", scientificOwner: "INTRACELLULAR_TRANSPORT_CELLULAR_V1" },
  { test: /\b(rtk|ras|mapk|erk|raf|mek)\b|cellular signaling/i, capabilityId: "kinase-cascade", owner: "CELL_SIGNALING_RTK_MAPK_V1", scientificOwner: "CELL_SIGNALING_RTK_MAPK_V1" },
] as const;

const recordFor = (capabilityId: string) => capabilityRegistryV2.find((record) => record.capabilityId === capabilityId);

export function createProductionRoutingError(
  ingress: PromptIngressResult,
  failure: Readonly<{ code: string; message: string }>,
  capabilityId = "UNRESOLVED",
): ProductionPromptRoute {
  return {
    normalizedPrompt: ingress.normalizedPrompt,
    semanticIntent: ingress.semanticIntent,
    ingressDisposition: ingress.disposition,
    capabilityId,
    capabilitySupportStatus: "UNSUPPORTED",
    scientificOwner: "none",
    productionOwner: "none",
    p3StateAvailability: "UNAVAILABLE",
    p4StateAvailability: "UNAVAILABLE",
    rendererOwner: "ProductionRoutingError",
    fallback: "explicit-error",
    failure,
  };
}

function legacyRoute(prompt: string, ingress: PromptIngressResult): ProductionPromptRoute | undefined {
  const dna = resolveDnaMechanismPresentation(prompt);
  if (dna) {
    const capabilityId = dna.family === "strandSeparation" ? "dna-strand-separation" : undefined;
    if (!capabilityId) return undefined;
    const capability = recordFor(capabilityId);
    return { normalizedPrompt: ingress.normalizedPrompt, semanticIntent: ingress.semanticIntent, ingressDisposition: ingress.disposition, capabilityId, capabilitySupportStatus: capability?.supportStatus ?? "UNAVAILABLE", scientificOwner: dna.owner, productionOwner: dna.owner, p3StateAvailability: "LEGACY_OWNER_ONLY", p4StateAvailability: "LEGACY_OWNER_ONLY", rendererOwner: dna.owner, fallback: "none" };
  }
  if (/^show\s+dna$|\bshow\s+(?:an?\s+)?ideal\s+b[- ]?dna\b/i.test(prompt.trim())) {
    const capability = recordFor("dna-canonical-structure");
    return { normalizedPrompt: ingress.normalizedPrompt, semanticIntent: ingress.semanticIntent, ingressDisposition: ingress.disposition, capabilityId: "dna-canonical-structure", capabilitySupportStatus: capability?.supportStatus ?? "UNAVAILABLE", scientificOwner: "DnaVisualSystem", productionOwner: "DnaMolecularView", p3StateAvailability: "LEGACY_OWNER_ONLY", p4StateAvailability: "LEGACY_OWNER_ONLY", rendererOwner: "DnaMolecularView", fallback: "none" };
  }
  return undefined;
}

export function resolveProductionPromptRoute(rawPrompt: string, context: ProductionPromptRoutingContext = {}): ProductionPromptRoute {
  const ingress = compilePromptIngress(rawPrompt);
  const normalized = normalizeBiologyPrompt(ingress.normalizedPrompt.normalizedText);
  const legacy = legacyRoute(rawPrompt, ingress);
  if (legacy) return legacy;
  const match = cellularRoutes.find((route) => route.test.test(normalized));
  if (match) {
    if (match.capabilityId === "transcription-elongation" && context.transcriptionIdentity === "EUKARYOTIC_NUCLEAR" && eukaryoticPolIIElongationSourceRequirements.status !== "CONFIGURED") {
      return createProductionRoutingError(ingress, {
        code: "EUKARYOTIC_POL_II_SOURCE_UNAVAILABLE",
        message: `Eukaryotic nuclear transcription is selected, but the required source is ${eukaryoticPolIIElongationSourceRequirements.status.toLowerCase()}. The current 6ALH bacterial RNAP source cannot satisfy Pol II identity.`,
      }, match.capabilityId);
    }
    const capability = recordFor(match.capabilityId);
    const rendererOwner = match.owner === "GENE_EXPRESSION_CELLULAR_V1" ? "GeneExpressionProductionView" : match.owner === "SECRETORY_PATHWAY_CELLULAR_V1" ? "SecretoryPathwayProductionView" : match.owner === "INTRACELLULAR_TRANSPORT_CELLULAR_V1" ? "IntracellularTransportProductionView" : "CellularSignalingProductionView";
    return { normalizedPrompt: ingress.normalizedPrompt, semanticIntent: ingress.semanticIntent, ingressDisposition: ingress.disposition, capabilityId: match.capabilityId, capabilitySupportStatus: capability?.supportStatus ?? "UNAVAILABLE", scientificOwner: match.scientificOwner, productionOwner: match.owner, p3StateAvailability: "AVAILABLE_VIA_CANONICAL_OWNER", p4StateAvailability: "AVAILABLE_VIA_CANONICAL_OWNER", rendererOwner, fallback: "none" };
  }
  const reason = ingress.disposition === "CLARIFICATION_REQUIRED" ? "The prompt did not resolve to a supported production capability." : "No production owner is registered for this request.";
  return createProductionRoutingError(ingress, { code: "PRODUCTION_ROUTE_UNAVAILABLE", message: reason });
}

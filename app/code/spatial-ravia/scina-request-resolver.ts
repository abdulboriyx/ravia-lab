import { compilePromptIngress, type PromptIngressResult } from "./prompt-ingress-compiler.ts";
import { parseBiologyScenePrompt } from "./biology-parser.ts";
import { chooseBiologyRenderer, type BiologyRenderer } from "./biology-renderer-router.ts";
import { resolveDnaTemplateRendererOwner, resolveDnaVisualTemplate, type DnaVisualTemplate } from "./biology-dna-visual-dispatcher.ts";
import { resolveDnaMechanismPresentation, type DnaMechanismPresentationRoute } from "./DnaMechanismPresentationRouter.ts";
import { resolveRnaPresentation, type RnaPresentationRoute } from "./RnaPresentationRouter.ts";
import { createProductionRoutingError, resolveProductionPromptRoute, type ProductionPromptRoute } from "./production-prompt-router.ts";
import { capabilityRegistryV2 } from "./capability-registry.ts";

export const scinaDomains = ["DNA", "RNA", "CELLULAR"] as const;
export type ScinaDomain = typeof scinaDomains[number];
export const scinaOrganisms = ["UNSPECIFIED", "EUKARYOTIC_NUCLEAR", "BACTERIAL"] as const;
export type ScinaOrganism = typeof scinaOrganisms[number];
export type ScinaPolymeraseClass = "EUKARYOTIC_POL_II" | "BACTERIAL_RNAP";
export type ScinaFidelity = "E0_DEPOSITED" | "C0_COMPUTED" | "S1_CONSTRAINED" | "S2_SCHEMATIC" | "UNAVAILABLE";

export type ScinaIdentity = Readonly<{
  domain: ScinaDomain;
  organism: ScinaOrganism;
  entity: string;
  polymeraseClass?: ScinaPolymeraseClass;
  sourceRequirement?: string;
  sourceAvailability: "NOT_APPLICABLE" | "AVAILABLE" | "REQUIRED_NOT_CONFIGURED";
}>;

export type CanonicalScinaRequest = Readonly<{
  rawPrompt: string;
  normalizedPrompt: PromptIngressResult["normalizedPrompt"];
  semanticIntent: PromptIngressResult["semanticIntent"];
  ingressDisposition: PromptIngressResult["disposition"];
  domain: ScinaDomain;
  organism: ScinaOrganism;
  capabilityId: string;
  capabilitySupportStatus: string;
  identity: ScinaIdentity;
  owner: Readonly<{ scientific: string; production: string }>;
  renderer: string;
  fidelity: ScinaFidelity;
}>;

export type CanonicalScinaResolution = Readonly<{
  request: CanonicalScinaRequest;
  route:
    | Readonly<{ kind: "dna-mechanism"; route: DnaMechanismPresentationRoute }>
    | Readonly<{ kind: "rna"; route: RnaPresentationRoute }>
    | Readonly<{ kind: "cellular"; route: ProductionPromptRoute }>
    | Readonly<{ kind: "dna-scene"; scene: NonNullable<Extract<ReturnType<typeof parseBiologyScenePrompt>, { status: "supported" }>["scene"]>; template: DnaVisualTemplate; renderer: BiologyRenderer; parseSource: string }>
    | Readonly<{ kind: "error"; route: ProductionPromptRoute }>;
}>;

const capabilityFor = (capabilityId: string) => capabilityRegistryV2.find((record) => record.capabilityId === capabilityId);

function capabilityIdForDnaMechanism(family: DnaMechanismPresentationRoute["family"]): string {
  return {
    basePairing: "dna-base-pairing",
    backboneChemistry: "dna-phosphodiester-backbone",
    polarityAntiparallel: "dna-antiparallel-polarity",
    helixStabilization: "dna-helix-stabilization",
    strandSeparation: "dna-strand-separation",
    nucleotideAssembly: "dna-nucleotide-assembly",
  }[family];
}

function capabilityIdForRna(route: RnaPresentationRoute): string {
  if (route.family === "pairingHybridization") return route.sourceSpec.pairingState === "hybrid" ? "rna-dna-hybridization" : "rna-base-pairing";
  if (route.family === "degradationStability") return route.sourceSpec.annotations.includes("exonuclease") ? "rna-exonuclease-degradation" : "rna-cleavage";
  return {
    structure: "rna-generic-structure",
    typesFunctions: "rna-types-functions",
    nascentTranscript: "rna-nascent-transcript",
    processing: "rna-processing",
    secondaryStructure: "rna-secondary-structure",
    localChemistry: "rna-local-chemistry",
    pairingHybridization: "rna-base-pairing",
    degradationStability: "rna-cleavage",
  }[route.family];
}

function capabilityIdForDnaTemplate(template: DnaVisualTemplate): string {
  return {
    structure: "dna-canonical-structure",
    regulation: "dna-sequence-regulation",
    replication: "dna-replication",
    transcription: "dna-transcription",
    damageRepair: "dna-damage-repair",
    packaging: "dna-packaging",
    localChemistry: "dna-local-chemistry",
  }[template.family];
}

function isBacterial(text: string) {
  return /\b(?:bacterial|prokaryotic|e\.?\s*coli|bacterial rnap)\b/i.test(text);
}

function isTranscription(text: string) {
  return /\b(?:transcription|transcrib\w*|rna polymerase|make rna|nascent transcript|gene expression)\b/i.test(text);
}

function isDnaExplicit(text: string) {
  return /\b(?:dna|b[- ]?dna|double helix|promoter|enhancer|helicase|replication fork|nucleosome|histone|chromatin)\b/i.test(text);
}

function isRnaExplicit(text: string) {
  return /\b(?:rna|mrna|trna|rrna|mirna|sirna|snrna|uracil|ribose)\b/i.test(text);
}

function baseRequest(
  ingress: PromptIngressResult,
  values: Omit<CanonicalScinaRequest, "rawPrompt" | "normalizedPrompt" | "semanticIntent" | "ingressDisposition">,
  rawPrompt: string,
): CanonicalScinaRequest {
  return { rawPrompt, normalizedPrompt: ingress.normalizedPrompt, semanticIntent: ingress.semanticIntent, ingressDisposition: ingress.disposition, ...values };
}

function dnaMechanismResolution(rawPrompt: string, ingress: PromptIngressResult, route: DnaMechanismPresentationRoute): CanonicalScinaResolution {
  const capabilityId = capabilityIdForDnaMechanism(route.family);
  const capability = capabilityFor(capabilityId);
  const request = baseRequest(ingress, {
    domain: "DNA", organism: "UNSPECIFIED", capabilityId, capabilitySupportStatus: capability?.supportStatus ?? "UNSUPPORTED",
    identity: { domain: "DNA", organism: "UNSPECIFIED", entity: route.family, sourceAvailability: "NOT_APPLICABLE" },
    owner: { scientific: route.owner, production: route.owner }, renderer: route.owner, fidelity: "S2_SCHEMATIC",
  }, rawPrompt);
  return { request, route: { kind: "dna-mechanism", route } };
}

function rnaResolution(rawPrompt: string, ingress: PromptIngressResult, route: RnaPresentationRoute): CanonicalScinaResolution {
  const capabilityId = capabilityIdForRna(route);
  const capability = capabilityFor(capabilityId);
  const request = baseRequest(ingress, {
    domain: "RNA", organism: "UNSPECIFIED", capabilityId, capabilitySupportStatus: capability?.supportStatus ?? "UNSUPPORTED",
    identity: { domain: "RNA", organism: "UNSPECIFIED", entity: route.family, sourceAvailability: "NOT_APPLICABLE" },
    owner: { scientific: route.owner, production: route.owner }, renderer: route.owner, fidelity: route.groundingStatus === "experimentally-grounded" ? "E0_DEPOSITED" : "S2_SCHEMATIC",
  }, rawPrompt);
  return { request, route: { kind: "rna", route } };
}

function productionResolution(rawPrompt: string, ingress: PromptIngressResult, route: ProductionPromptRoute, organism: ScinaOrganism, identity: ScinaIdentity): CanonicalScinaResolution {
  const request = baseRequest(ingress, {
    domain: "CELLULAR", organism, capabilityId: route.capabilityId, capabilitySupportStatus: route.capabilitySupportStatus,
    identity, owner: { scientific: route.scientificOwner, production: route.productionOwner }, renderer: route.rendererOwner,
    fidelity: route.fallback === "explicit-error" ? "UNAVAILABLE" : route.capabilityId === "transcription-elongation" && organism === "BACTERIAL" ? "E0_DEPOSITED" : "S2_SCHEMATIC",
  }, rawPrompt);
  return { request, route: route.fallback === "explicit-error" ? { kind: "error", route } : { kind: "cellular", route } };
}

export function resolveScinaRequest(rawPrompt: string): CanonicalScinaResolution {
  const ingress = compilePromptIngress(rawPrompt);
  const text = ingress.normalizedPrompt.normalizedText;
  const dnaMechanism = resolveDnaMechanismPresentation(rawPrompt);

  // Cellular transcription is checked before RNA's broad “RNA polymerase” rule.
  if (isTranscription(text)) {
    const bacterial = isBacterial(text);
    const organism: ScinaOrganism = bacterial ? "BACTERIAL" : "EUKARYOTIC_NUCLEAR";
    const identity: ScinaIdentity = bacterial
      ? { domain: "CELLULAR", organism, entity: "bacterial transcription", polymeraseClass: "BACTERIAL_RNAP", sourceAvailability: "AVAILABLE" }
      : { domain: "CELLULAR", organism, entity: "eukaryotic RNA polymerase II transcription", polymeraseClass: "EUKARYOTIC_POL_II", sourceRequirement: "eukaryoticPolIIElongationSourceRequirements", sourceAvailability: "AVAILABLE" };
    const route = resolveProductionPromptRoute(rawPrompt, { transcriptionIdentity: bacterial ? "BACTERIAL" : "EUKARYOTIC_NUCLEAR" });
    if (route.fallback === "explicit-error") return productionResolution(rawPrompt, ingress, route, organism, identity);
    return productionResolution(rawPrompt, ingress, route, organism, identity);
  }

  // Explicit DNA wins over RNA for hybrid vocabulary; otherwise a DNA
  // mechanism route wins on unqualified A-T/G-C/base-pair requests.
  if (isDnaExplicit(text) || (!isRnaExplicit(text) && dnaMechanism)) {
    if (dnaMechanism) return dnaMechanismResolution(rawPrompt, ingress, dnaMechanism);
  }

  const rna = isRnaExplicit(text) ? resolveRnaPresentation(rawPrompt) : undefined;
  if (rna) return rnaResolution(rawPrompt, ingress, rna);
  if (dnaMechanism) return dnaMechanismResolution(rawPrompt, ingress, dnaMechanism);

  const parsed = parseBiologyScenePrompt(rawPrompt);
  if (parsed.status === "supported") {
    const template = resolveDnaVisualTemplate(parsed.scene, parsed.dnaSelection);
    const renderer = chooseBiologyRenderer(parsed.scene, template);
    if (template) {
      const capabilityId = capabilityIdForDnaTemplate(template);
      const capability = capabilityFor(capabilityId);
      const request = baseRequest(ingress, {
        domain: "DNA", organism: "UNSPECIFIED", capabilityId, capabilitySupportStatus: capability?.supportStatus ?? "UNSUPPORTED",
        identity: { domain: "DNA", organism: "UNSPECIFIED", entity: template.family, sourceAvailability: "NOT_APPLICABLE" },
        owner: { scientific: "DnaVisualSystem", production: resolveDnaTemplateRendererOwner(template) }, renderer, fidelity: template.useExperimentalCoordinates ? "E0_DEPOSITED" : "C0_COMPUTED",
      }, rawPrompt);
      return { request, route: { kind: "dna-scene", scene: parsed.scene, template, renderer, parseSource: parsed.source } };
    }
  }

  const route = createProductionRoutingError(ingress, { code: "SCINA_REQUEST_UNRESOLVED", message: parsed.status === "unsupported" ? parsed.reason : "No canonical DNA, RNA, or cellular route resolved this request." });
  const request = baseRequest(ingress, {
    domain: isRnaExplicit(text) ? "RNA" : "DNA", organism: "UNSPECIFIED", capabilityId: route.capabilityId, capabilitySupportStatus: route.capabilitySupportStatus,
    identity: { domain: isRnaExplicit(text) ? "RNA" : "DNA", organism: "UNSPECIFIED", entity: "unresolved", sourceAvailability: "NOT_APPLICABLE" },
    owner: { scientific: route.scientificOwner, production: route.productionOwner }, renderer: route.rendererOwner, fidelity: "UNAVAILABLE",
  }, rawPrompt);
  return { request, route: { kind: "error", route } };
}

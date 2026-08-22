/** P2-F: the sole evidence-only authority for scientific fidelity and uncertainty claims. */

import type { ScientificFidelityTier, ScientificProvenanceSource, MechanismEvidenceLevel, VisualApproximationLevel } from "./scientific-fidelity-provenance.ts";
import type { ValidatedProvenanceSource } from "./scientific-source-provenance-resolver.ts";

export const fidelityRepresentationRequirements = ["depositedCoordinates", "computedModel", "constrainedModel", "schematic", "overlay", "atomisticIllustration"] as const;
export type FidelityRepresentationRequirement = (typeof fidelityRepresentationRequirements)[number];
export const groundingEvidenceKinds = ["sourceSelected", "sourceAligned", "ruleConstrained", "educational", "none"] as const;
export type GroundingEvidenceKind = (typeof groundingEvidenceKinds)[number];

export type FidelityGroundingEvidence = Readonly<{ kind: GroundingEvidenceKind; confidence: number }>;
export type FidelityRepresentationRequest = Readonly<{
  requirement: FidelityRepresentationRequirement;
  /** A requested tier is a constraint, not an authority to manufacture evidence. */
  requestedTier?: ScientificFidelityTier;
  atomisticLooking?: boolean;
  fallbackFromDeposited?: boolean;
  declaredBy?: "evidence" | "renderer";
}>;
export type FidelityUncertaintyInput = Readonly<{
  sources: readonly ValidatedProvenanceSource[];
  grounding: FidelityGroundingEvidence;
  mechanismEvidence: MechanismEvidenceLevel;
  representation: FidelityRepresentationRequest;
}>;

export type FidelityUncertaintyDecision = Readonly<{
  fidelity: ScientificFidelityTier;
  sourceConfidence: number;
  groundingConfidence: number;
  mechanismEvidence: MechanismEvidenceLevel;
  visualApproximation: VisualApproximationLevel;
  limitations: readonly string[];
}>;
export type FidelityUncertaintyRejection = Readonly<{ accepted: false; reasons: readonly string[] }>;
export type FidelityUncertaintyResolution = Readonly<{ accepted: true; decision: FidelityUncertaintyDecision }> | FidelityUncertaintyRejection;

const unknownKeys = (value: unknown, allowed: readonly string[], path: string, reasons: string[]) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) { reasons.push(`${path} must be an object`); return; }
  for (const key of Object.keys(value)) if (!allowed.includes(key)) reasons.push(`${path}.${key} is not allowed`);
};

const inUnit = (value: number) => Number.isFinite(value) && value >= 0 && value <= 1;
const depositedSource = (source: ValidatedProvenanceSource) => source.__p2BValidated === true && source.sourceType === "depositedStructure" && Boolean(source.accessionOrEntryId && source.structure?.structureId && source.provider?.id && source.citationReference && source.licenseReference);
const tierFor = (requirement: FidelityRepresentationRequirement): ScientificFidelityTier => {
  switch (requirement) {
    case "depositedCoordinates": return "E0_DEPOSITED";
    case "computedModel": case "atomisticIllustration": return "C0_COMPUTED";
    case "constrainedModel": return "S1_CONSTRAINED";
    case "schematic": return "S2_SCHEMATIC";
    case "overlay": return "O_OVERLAY";
  }
};
const approximationFor = (tier: ScientificFidelityTier): VisualApproximationLevel => tier === "S1_CONSTRAINED" ? "constrained" : tier === "S2_SCHEMATIC" ? "schematic" : tier === "O_OVERLAY" ? "overlay" : "minor";

/**
 * Resolves only what may be claimed. It accepts no structure, selector,
 * topology, interaction, geometry, or renderer output fields.
 */
export function resolveFidelityUncertainty(input: FidelityUncertaintyInput): FidelityUncertaintyResolution {
  const reasons: string[] = [];
  unknownKeys(input, ["sources", "grounding", "mechanismEvidence", "representation"], "input", reasons);
  unknownKeys(input.grounding, ["kind", "confidence"], "grounding", reasons);
  unknownKeys(input.representation, ["requirement", "requestedTier", "atomisticLooking", "fallbackFromDeposited", "declaredBy"], "representation", reasons);
  input.sources.forEach((source, index) => unknownKeys(source, ["sourceId", "sourceType", "accessionOrEntryId", "structure", "provider", "citationReference", "licenseReference", "contentHash", "quality"], `sources[${index}]`, reasons));
  if (!input.sources.length) reasons.push("at least one provenance source is required");
  if (input.sources.some((source) => !inUnit(source.quality.sourceConfidence))) reasons.push("source confidence must be finite and within 0..1");
  if (!inUnit(input.grounding.confidence)) reasons.push("grounding confidence must be finite and within 0..1");
  if (!groundingEvidenceKinds.includes(input.grounding.kind)) reasons.push("grounding evidence kind is invalid");
  if (!fidelityRepresentationRequirements.includes(input.representation.requirement)) reasons.push("representation requirement is invalid");
  if (input.representation.declaredBy === "renderer") reasons.push("renderer-derived fidelity is prohibited");
  if (input.representation.fallbackFromDeposited) reasons.push("hidden fallback from deposited to schematic/computed representation is prohibited");

  const fidelity = tierFor(input.representation.requirement);
  const deposited = input.sources.filter(depositedSource);
  if (fidelity === "E0_DEPOSITED") {
    if (!deposited.length) reasons.push("E0_DEPOSITED requires valid deposited provenance with accession, structure, and provider");
    if (input.grounding.kind !== "sourceSelected" || input.grounding.confidence < 0.8) reasons.push("E0_DEPOSITED requires selected deposited grounding with confidence of at least 0.8");
    if (input.mechanismEvidence !== "direct" && input.mechanismEvidence !== "supported") reasons.push("E0_DEPOSITED requires direct or supported mechanism evidence");
  }
  if (fidelity === "S2_SCHEMATIC" && input.representation.requestedTier && input.representation.requestedTier !== "S2_SCHEMATIC") reasons.push("schematic substitutions must remain explicitly S2_SCHEMATIC");
  if (input.representation.requestedTier && input.representation.requestedTier !== fidelity) reasons.push("requested fidelity contradicts evidence-supported representation tier");
  if (fidelity === "O_OVERLAY" && input.grounding.kind === "sourceSelected") reasons.push("an overlay cannot claim deposited-coordinate grounding");
  if (reasons.length) return { accepted: false, reasons };

  const sourceConfidence = Math.max(...input.sources.map((source) => source.quality.sourceConfidence));
  const limitations = [
    "Fidelity is determined from declared provenance and grounding evidence, never visual realism.",
    ...(fidelity === "E0_DEPOSITED" ? ["Deposited provenance supports only the declared source-grounded representation; it does not validate undeclared components."] : []),
    ...(input.representation.requirement === "atomisticIllustration" || input.representation.atomisticLooking ? ["Atomistic-looking appearance is illustrative and does not imply deposited atomistic evidence."] : []),
    ...(fidelity === "S1_CONSTRAINED" ? ["This constrained model is not a deposited coordinate claim."] : []),
    ...(fidelity === "S2_SCHEMATIC" ? ["This is explicitly schematic; it is not a source-derived molecular reconstruction."] : []),
    ...(fidelity === "O_OVERLAY" ? ["Overlay content is explanatory and does not alter underlying scientific evidence."] : []),
  ];
  return { accepted: true, decision: { fidelity, sourceConfidence, groundingConfidence: input.grounding.confidence, mechanismEvidence: input.mechanismEvidence, visualApproximation: approximationFor(fidelity), limitations } };
}

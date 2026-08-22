import assert from "node:assert/strict";
import test from "node:test";
import { resolveFidelityUncertainty } from "./fidelity-uncertainty-authority.ts";
import { fidelityProvenanceFixture } from "./scientific-fidelity-provenance-fixtures.ts";
import type { ValidatedProvenanceSource } from "./scientific-source-provenance-resolver.ts";

const deposited = Object.defineProperty(fidelityProvenanceFixture.sources.find((source) => source.sourceType === "depositedStructure")!, "__p2BValidated", { value: true, enumerable: false }) as ValidatedProvenanceSource;
const canonical = Object.defineProperty(fidelityProvenanceFixture.sources.find((source) => source.sourceType === "canonicalParameterSet")!, "__p2BValidated", { value: true, enumerable: false }) as ValidatedProvenanceSource;

test("P2-F grants E0 only for valid deposited provenance and selected grounding", () => {
  const result = resolveFidelityUncertainty({ sources: [deposited], grounding: { kind: "sourceSelected", confidence: 0.93 }, mechanismEvidence: "direct", representation: { requirement: "depositedCoordinates", declaredBy: "evidence" } });
  assert.equal(result.accepted, true);
  if (result.accepted) {
    assert.equal(result.decision.fidelity, "E0_DEPOSITED");
    assert.equal(result.decision.sourceConfidence, 0.96);
    assert.equal(result.decision.groundingConfidence, 0.93);
  }
});

test("P2-F rejects evidence-free E0, hidden fallback, contradictory tiering, and renderer-derived claims", () => {
  const cases = [
    { sources: [canonical], grounding: { kind: "ruleConstrained" as const, confidence: 0.9 }, mechanismEvidence: "supported" as const, representation: { requirement: "depositedCoordinates" as const } },
    { sources: [deposited], grounding: { kind: "sourceSelected" as const, confidence: 0.9 }, mechanismEvidence: "direct" as const, representation: { requirement: "schematic" as const, fallbackFromDeposited: true } },
    { sources: [canonical], grounding: { kind: "ruleConstrained" as const, confidence: 0.8 }, mechanismEvidence: "supported" as const, representation: { requirement: "schematic" as const, requestedTier: "C0_COMPUTED" as const } },
    { sources: [canonical], grounding: { kind: "ruleConstrained" as const, confidence: 0.8 }, mechanismEvidence: "supported" as const, representation: { requirement: "computedModel" as const, declaredBy: "renderer" as const } },
  ];
  for (const input of cases) assert.equal(resolveFidelityUncertainty(input).accepted, false);
});

test("P2-F keeps uncertainty dimensions distinct and prevents atomistic appearance from elevating evidence", () => {
  const result = resolveFidelityUncertainty({ sources: [canonical], grounding: { kind: "ruleConstrained", confidence: 0.61 }, mechanismEvidence: "supported", representation: { requirement: "atomisticIllustration", atomisticLooking: true } });
  assert.equal(result.accepted, true);
  if (result.accepted) {
    assert.equal(result.decision.fidelity, "C0_COMPUTED");
    assert.equal(result.decision.sourceConfidence, canonical.quality.sourceConfidence);
    assert.equal(result.decision.groundingConfidence, 0.61);
    assert.equal(result.decision.mechanismEvidence, "supported");
    assert.ok(result.decision.limitations.some((item) => item.includes("does not imply deposited atomistic evidence")));
  }
});

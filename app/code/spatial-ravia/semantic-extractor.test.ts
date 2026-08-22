import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validateSemanticIntent } from "./semantic-intent.ts";
import { normalizeRawPrompt } from "./prompt-normalization.ts";
import { extractSemanticIntent } from "./semantic-extractor.ts";

const extract = (raw: string) => extractSemanticIntent(normalizeRawPrompt(raw));

test("P1-C has one validated NormalizedPrompt-to-SemanticIntent authority across current DNA/RNA coverage", () => {
  const cases = [
    ["show DNA structure", undefined, undefined], ["show a promoter on DNA", "regulation", undefined], ["show DNA replication", "replication", "dnaReplication"], ["show transcription", "transcription", "transcriptionElongation"],
    ["show DNA damage repair", "damageRepair", undefined], ["show DNA packaging in a nucleosome", "packaging", undefined], ["show DNA phosphodiester chemistry", "backboneChemistry", "phosphodiesterLinkage"], ["show A-T base pairing", "basePairing", "hydrogenBonding"],
    ["show antiparallel DNA", "polarity", "antiparallelOrganization"], ["show base stacking", "helixStabilization", "baseStacking"], ["unzip the DNA", "strandSeparation", "strandOpening"], ["add a nucleotide to DNA", "nucleotideAssembly", "nucleotideAddition"],
    ["show RNA structure", undefined, undefined], ["compare mRNA and tRNA", undefined, undefined], ["show a nascent transcript", "transcription", "transcriptionElongation"], ["show introns and exons", "rnaProcessing", "rnaSplicing"],
    ["show the loop in RNA", "rnaSecondaryStructure", "rnaSecondaryFolding"], ["show A-U pairing", "basePairing", "hydrogenBonding"], ["show an RNA-DNA hybrid", "rnaDnaHybridization", "rnaDnaHybridFormation"], ["cut the RNA", "cleavage", "rnaCleavage"],
    ["RNA gets eaten from the 5′ end", "exonucleaseDegradation", "terminalExonucleaseAction"], ["why does RNA fall apart easier", "chemicalStabilityComparison", "riboseHydroxylSusceptibility"], ["show the 2′-OH in RNA", "chemicalStabilityComparison", "riboseHydroxylSusceptibility"],
  ] as const;
  for (const [raw, phenomenon, mechanism] of cases) {
    const intent = extract(raw);
    assert.deepEqual(validateSemanticIntent(intent), { valid: true, issues: [] }, raw);
    assert.equal(intent.requests[0]?.phenomenon, phenomenon, raw);
    assert.equal(intent.requests[0]?.mechanism, mechanism, raw);
  }
});

test("P1-C preserves paraphrase-equivalent strand separation and normalized typography", () => {
  for (const raw of ["unzip the dna", "pull the two DNA strands apart", "UnZiP   the DNA!!!", "unzip the DNA 5′→3′"]) {
    const intent = extract(raw);
    assert.equal(intent.requests[0]?.phenomenon, "strandSeparation", raw);
    assert.equal(intent.requests[0]?.mechanism, "strandOpening", raw);
  }
});

test("P1-C preserves claims rather than converting them into scientific truth", () => {
  for (const raw of ["DNA has ribose right?", "A pairs with G"]) {
    const intent = extract(raw);
    assert.equal(intent.assertedClaims.length, 1, raw);
    assert.equal(intent.assertedClaims[0]?.status, "suspected", raw);
    assert.equal(intent.rawUtterance, raw);
  }
});

test("P1-C distinguishes biochemical, presentational, and sequence-relative direction", () => {
  assert.deepEqual(extract("DNA opens 5′ to 3′").requests[0]?.direction, { biochemical: "fiveToThree", meaning: "scientific" });
  assert.deepEqual(extract("DNA opens 3′ to 5′").requests[0]?.direction, { biochemical: "threeToFive", meaning: "scientific" });
  assert.deepEqual(extract("RNA breaking from left").requests[0]?.direction, { screen: "screenLeft", meaning: "presentational" });
  assert.deepEqual(extract("break RNA from the left").requests[0]?.direction, { screen: "screenLeft", meaning: "presentational" });
  assert.deepEqual(extract("RNA gets eaten from the 5′ end").requests[0]?.direction, { biochemical: "fiveToThree", meaning: "scientific" });
  assert.deepEqual(extract("upstream of the promoter").requests[0]?.direction, { biochemical: "sequenceDirection", meaning: "scientific" });
});

test("P1-C preserves multiple acts and bounded alternatives without deciding clarification", () => {
  const multi = extract("show replication and explain helicase");
  assert.deepEqual(multi.acts, ["show", "explain"]);
  const ambiguous = extract("open this helix");
  assert.equal(ambiguous.alternatives.length, 2);
  assert.equal(ambiguous.clarification.required, false);
  assert.equal(ambiguous.confidence, 0.48);
});

test("P1-C remains independent from legacy parsers, routes, scene construction, and ownership", () => {
  const source = readFileSync(new URL("./semantic-extractor.ts", import.meta.url), "utf8");
  for (const forbidden of ["biology-parser", "rna-intent", "dna-mechanism", "scene-spec", "renderer", "router", "capability-registry", "molstar"]) assert.equal(source.includes(forbidden), false, forbidden);
});

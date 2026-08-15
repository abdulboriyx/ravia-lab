import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalBasePairInteractions,
  canonicalBasePairSelections,
  classifyDnaBase,
  createDnaBasePairMechanismSpec,
  deriveDnaBasePairInteractionPresentation,
} from "./DnaBasePairInteractionPresentation.ts";
import { buildDnaMechanismRepresentationPlan } from "./dna-mechanism-resolution.ts";

test("canonical A-T and G-C pairs expose exactly two and three hydrogen bonds", () => {
  assert.equal(canonicalBasePairInteractions("A-T").length, 2);
  assert.equal(canonicalBasePairInteractions("G-C").length, 3);
  assert.ok(canonicalBasePairInteractions("A-T").every((interaction) => interaction.type === "hydrogenBond"));
  assert.ok(canonicalBasePairInteractions("G-C").every((interaction) => interaction.type !== "covalent"));
});

test("each interaction has explicit donor and acceptor sites on opposite strands", () => {
  for (const pair of ["A-T", "G-C"] as const) {
    const sites = canonicalBasePairSelections(pair);
    const byId = new Map(sites.map((selection) => [selection.id, selection]));
    for (const interaction of canonicalBasePairInteractions(pair)) {
      const [left, right] = interaction.participants.map((id) => byId.get(id)!);
      assert.equal(left.role, "donor");
      assert.equal(right.role, "acceptor");
      assert.notEqual(left.strand, right.strand);
    }
  }
});

test("purine and pyrimidine classification is canonical", () => {
  assert.equal(classifyDnaBase("A"), "purine");
  assert.equal(classifyDnaBase("G"), "purine");
  assert.equal(classifyDnaBase("C"), "pyrimidine");
  assert.equal(classifyDnaBase("T"), "pyrimidine");
});

test("comparison presentation uses a common local scale", () => {
  const plan = buildDnaMechanismRepresentationPlan(createDnaBasePairMechanismSpec("G-C"));
  const presentation = deriveDnaBasePairInteractionPresentation(plan);
  assert.deepEqual(presentation.comparison.map((entry) => entry.hydrogenBondCount), [2, 3]);
  assert.ok(presentation.comparison.every((entry) => entry.scale === "common-local-scale"));
  assert.equal(presentation.purinePyrimidineOverlay?.normalWidth, "consistent");
});

test("breaking base-pair hydrogen bonds preserves phosphodiester context", () => {
  const spec = createDnaBasePairMechanismSpec("A-T", "breaking");
  spec.interactions.push({ id: "backbone", type: "phosphodiester", participants: ["sugar-a", "sugar-b"], role: "backboneLink", state: "present", evidence: "structural" });
  const presentation = deriveDnaBasePairInteractionPresentation(buildDnaMechanismRepresentationPlan(spec));
  assert.ok(presentation.hydrogenBondPaths.every((path) => path.state === "breaking"));
  assert.equal(presentation.backbonePreserved, true);
});

test("representation plans are deterministic and expose donor/acceptor groups", () => {
  const spec = createDnaBasePairMechanismSpec("G-C");
  const first = buildDnaMechanismRepresentationPlan(spec);
  const second = buildDnaMechanismRepresentationPlan(spec);
  assert.deepEqual(first, second);
  assert.ok(first.molecularGroups.some((group) => group.kind === "hydrogenBondDonor"));
  assert.ok(first.molecularGroups.some((group) => group.kind === "hydrogenBondAcceptor"));
  assert.equal(first.localSelection.find((selection) => selection.sourceSelectionId === "adenine"), undefined);
  assert.equal(first.sourceSpec.molecularSelections.filter((selection) => selection.strand === "A").length > 0, true);
  assert.equal(first.sourceSpec.molecularSelections.filter((selection) => selection.strand === "B").length > 0, true);
});

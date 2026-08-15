import assert from "node:assert/strict";
import test from "node:test";
import {
  createDnaPolarityMechanismSpec,
  deriveDnaPolarityAntiparallelPresentation,
  polarityInteractions,
  polaritySelections,
} from "./DnaPolarityAntiparallelPresentation.ts";
import { buildDnaMechanismRepresentationPlan } from "./dna-mechanism-resolution.ts";
import { resolveDnaMechanismIntent } from "./dna-mechanism-intent.ts";

test("canonical polarity has opposite strand directions", () => {
  const presentation = deriveDnaPolarityAntiparallelPresentation(buildDnaMechanismRepresentationPlan(createDnaPolarityMechanismSpec()));
  assert.deepEqual(presentation.directions, [
    { strand: "A", direction: "5primeTo3prime" },
    { strand: "B", direction: "3primeTo5prime" },
  ]);
  assert.equal(presentation.representationPlan.sourceSpec.orientation.antiparallel, true);
});

test("5-prime and 3-prime labels attach to Agent D backbone anchors", () => {
  const presentation = deriveDnaPolarityAntiparallelPresentation(buildDnaMechanismRepresentationPlan(createDnaPolarityMechanismSpec("strandEnds")));
  for (const strand of [presentation.anchors.strandA, presentation.anchors.strandB]) {
    assert.ok(strand.some((anchor) => anchor.position === "5-prime"));
    assert.ok(strand.some((anchor) => anchor.position === "3-prime"));
    assert.ok(strand.every((anchor) => anchor.sourceAnchorId.length > 0));
  }
  assert.ok(presentation.labels.every((label) => label.anchorId.includes("one-prime") || label.anchorId.includes("three-prime") || label.anchorId.includes("five-prime")));
});

test("direction arrows are derived from backbone anchors and are not reversed", () => {
  const presentation = deriveDnaPolarityAntiparallelPresentation(buildDnaMechanismRepresentationPlan(createDnaPolarityMechanismSpec()));
  assert.deepEqual(presentation.arrows.map((arrow) => [arrow.strand, arrow.direction]), [
    ["A", "5primeTo3prime"],
    ["B", "3primeTo5prime"],
  ]);
  assert.equal(presentation.arrows[0].fromAnchor.includes("five"), true);
  assert.equal(presentation.arrows[0].toAnchor.includes("three"), true);
  assert.equal(presentation.arrows[1].fromAnchor.includes("three"), true);
  assert.equal(presentation.arrows[1].toAnchor.includes("five"), true);
  assert.ok(presentation.arrows.every((arrow) => arrow.derivedFrom === "backbone-5prime-to-3prime-anchors"));
});

test("both strands use one existing canonical duplex geometry", () => {
  const presentation = deriveDnaPolarityAntiparallelPresentation(buildDnaMechanismRepresentationPlan(createDnaPolarityMechanismSpec()));
  assert.equal(presentation.sharedDuplexGeometry.source, "existingDnaVisualSystem");
  assert.equal(presentation.sharedDuplexGeometry.complementaryBasesFace, "inward");
  assert.equal(presentation.sharedDuplexGeometry.basePairCount, presentation.camera.basePairCount);
  assert.equal(presentation.anchors.strandA.length, presentation.anchors.strandB.length);
});

test("local and whole-duplex polarity views share Agent D local chemistry", () => {
  const overview = deriveDnaPolarityAntiparallelPresentation(buildDnaMechanismRepresentationPlan(createDnaPolarityMechanismSpec("duplexOverview")));
  const local = deriveDnaPolarityAntiparallelPresentation(buildDnaMechanismRepresentationPlan(createDnaPolarityMechanismSpec("localBackbone")));
  assert.equal(overview.localBackbone.localChemistry.subject, "backbone-linkage");
  assert.equal(local.mode, "localBackbone");
  assert.equal(local.camera.focus, "local-chemistry");
  assert.deepEqual(local.anchors.strandA.map((anchor) => anchor.sourceAnchorId), overview.anchors.strandA.map((anchor) => anchor.sourceAnchorId));
  assert.ok(local.localBackbone.phosphateBridges.length > 0);
});

test("polarity spec exposes typed phosphodiester direction participants", () => {
  const selections = polaritySelections();
  const ids = new Set(selections.map((selection) => selection.id));
  for (const interaction of polarityInteractions()) {
    assert.equal(interaction.type, "phosphodiester");
    assert.ok(interaction.participants.every((participant) => ids.has(participant)));
    assert.notEqual(interaction.type, "hydrogenBond");
  }
});

test("polarity representation and resolved prompt remain deterministic", () => {
  const spec = createDnaPolarityMechanismSpec();
  const first = buildDnaMechanismRepresentationPlan(spec);
  const second = buildDnaMechanismRepresentationPlan(spec);
  assert.deepEqual(first, second);
  const resolved = resolveDnaMechanismIntent("why are DNA strands antiparallel");
  assert.equal(resolved?.family, "polarityAntiparallel");
  assert.ok(resolved?.spec.molecularSelections.some((selection) => selection.role === "fivePrimeEnd" && selection.strand === "A"));
  assert.ok(resolved?.spec.molecularSelections.some((selection) => selection.role === "threePrimeEnd" && selection.strand === "B"));
});

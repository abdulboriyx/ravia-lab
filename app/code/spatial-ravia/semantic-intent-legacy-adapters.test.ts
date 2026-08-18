import assert from "node:assert/strict";
import test from "node:test";
import { adaptBiologySceneSpec, adaptDnaMechanismSpec, adaptDnaPromptSelection, adaptDnaVisualTemplate, adaptRnaSceneSpec, assertLegacyAdapterResult } from "./semantic-intent-legacy-adapters.ts";
import type { BiologySceneSpec } from "./biology-scene-spec.ts";
import type { DnaMechanismSpec } from "./dna-mechanism-contract.ts";
import type { DnaPromptSelection } from "./biology-dna-prompt-intent.ts";
import type { DnaVisualTemplate } from "./biology-dna-visual-dispatcher.ts";
import type { RnaSceneSpec } from "./rna-contract.ts";

const biology: BiologySceneSpec = {
  intent: "mechanism", scale: "molecular", entities: [{ id: "dna", name: "DNA", type: "dna" }, { id: "helicase", name: "helicase", type: "protein" }],
  relations: [{ subject: "helicase", relation: "opens", object: "dna" }], actions: [{ actor: "helicase", action: "unwinds", target: "dna" }],
  renderMode: "mechanistic-3d", temporal: { currentPhase: "opening", phases: [{ id: "opening", label: "Opening", order: 0, states: { dna: "open" } }] },
};

const rna: RnaSceneSpec = {
  family: "processing", focus: "pre-mRNA versus mature mRNA", scale: { level: "transcript", locality: "regional" }, rnaType: "mRNA", structuralState: "preMature", strandCount: 1, pairingState: "none",
  requiredEntities: ["mRNA", "exon", "intron"], annotations: [], sequenceRequirements: { required: false }, secondaryStructure: { required: false, motifs: [] }, dnaContext: { required: false }, processingState: "comparePreMature", degradationState: "unspecified", representation: { detail: "overview", showBackbone: true, showBases: true, showAnnotations: true }, supportExpectation: "renderer-ready",
};

const dnaMechanism: DnaMechanismSpec = {
  family: "basePairing", focus: "G-C hydrogen bonds", scale: { level: "basePair", locality: "local" }, requiredPrimitives: ["bondingInteraction"],
  molecularSelections: [{ id: "g", kind: "base", label: "guanine", strand: "A", role: "donor", structuralAnchor: "existingDnaVisualSystem" }, { id: "c", kind: "base", label: "cytosine", strand: "B", role: "acceptor", structuralAnchor: "existingDnaVisualSystem" }],
  participatingGroups: ["hydrogen-bond donor", "hydrogen-bond acceptor"], interactions: [{ id: "h1", type: "hydrogenBond", participants: ["g", "c"], role: "donorAcceptor", state: "present", evidence: "explanatory" }],
  orientation: { strandDirections: ["5primeTo3prime", "3primeTo5prime"], antiparallel: true, atomOrGroupAnchors: ["g", "c"] }, structuralState: "pairedDuplex", annotations: [], representation: { backbone: "canonicalDna", localResidueDetail: "atomAndBond", basePairRungs: true, grooveReadability: false, strandSeparation: false, atomColorGrammar: true }, structuralSubstrate: "existingDnaVisualSystem",
};

const selection: DnaPromptSelection = { family: "replication", detailLevel: "polymer", focalRegion: { kind: "fork", includesStrandDirection: true }, cameraIntent: "fork", requestedEntities: ["dna", "replication-machinery"] };
const template = { family: "replication", templateId: "dna-replication-template", representationLevel: "polymer", focus: "fork", scale: { intent: "mechanism", scale: "molecular" }, importantEntities: ["dna", "replication-machinery"], cameraPreset: {} as never, useExperimentalCoordinates: true, useCanonicalProceduralDNA: true, allowProteinContext: true, allowTranscriptionComplex: false, allowReplicationMachinery: true, allowBallAndStick: false, labels: ["5-prime"] } as unknown as DnaVisualTemplate;

test("all four legacy sources adapt to valid SemanticIntent v1", () => {
  const results = [adaptBiologySceneSpec(biology, "show helicase opening DNA"), adaptRnaSceneSpec(rna, "compare pre mRNA and mature mRNA"), adaptDnaMechanismSpec(dnaMechanism, "show G C hydrogen bonds"), adaptDnaPromptSelection(selection, "show a DNA replication fork"), adaptDnaVisualTemplate(template, "show a DNA replication fork")];
  results.forEach(assertLegacyAdapterResult);
  assert.equal(results[0]!.intent.rawUtterance, "show helicase opening DNA");
  assert.equal(results[1]!.intent.requests[0]!.phenomenon, "rnaProcessing");
  assert.equal(results[2]!.intent.requests[0]!.mechanism, "hydrogenBonding");
  assert.equal(results[3]!.intent.requests[0]!.phenomenon, "replication");
});

test("semantic identity and direction survive adapters", () => {
  const result = adaptDnaMechanismSpec(dnaMechanism, "show G C hydrogen bonds");
  assert.deepEqual(result.intent.requests[0]!.subjects.map((item) => item.resolvedId), ["base", "base"]);
  assert.equal(result.intent.requests[0]!.states?.[0], "paired");
  assert.equal(result.intent.requests[0]!.direction?.biochemical, "strandRelative");
});

test("RNA family/type, processing, and DNA context remain distinct", () => {
  const hybrid = { ...rna, family: "pairingHybridization" as const, focus: "RNA-DNA hybrid", dnaContext: { required: true, role: "hybridPartner" as const }, pairingState: "hybrid" as const };
  const result = adaptRnaSceneSpec(hybrid, "show an RNA DNA hybrid");
  assert.equal(result.intent.requests[0]!.phenomenon, "rnaDnaHybridization");
  assert.equal(result.intent.requests[0]!.mechanism, "rnaDnaHybridFormation");
  assert.ok(result.intent.requests[0]!.subjects.some((item) => item.resolvedId === "dna"));
  assert.ok(result.intent.requests[0]!.subjects.some((item) => item.resolvedId === "mRNA"));
});

test("lossiness reports exclude renderer and presentation fields", () => {
  const biologyResult = adaptBiologySceneSpec(biology, "show helicase opening DNA");
  assert.ok(biologyResult.report.omittedFields.some((item) => item.field === "renderMode" && item.disposition === "PRESENTATION_ONLY"));
  const templateResult = adaptDnaVisualTemplate(template, "show a DNA replication fork");
  assert.ok(templateResult.report.omittedFields.some((item) => item.field === "cameraPreset"));
  assert.ok(templateResult.report.omittedFields.some((item) => item.field.includes("allowProteinContext")));
  assert.equal(JSON.stringify(templateResult.intent).includes("cameraPreset"), false);
  assert.equal(JSON.stringify(templateResult.intent).includes("Mol*"), false);
});

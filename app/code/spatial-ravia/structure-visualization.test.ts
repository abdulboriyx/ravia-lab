import assert from "node:assert/strict";
import test from "node:test";
import {
  createInitialSession,
  dispatchScientificSessionEvent,
  setRepresentationMode,
  startSessionFromPrompt
} from "./model.ts";
import { processPacks } from "./process-registry.ts";
import {
  molstarViewerUrl,
  resolveStructureForSession,
  structureClaimProvenance
} from "./structure-visualization.ts";

test("transcription RNA polymerase II resolves to curated experimental PDB biological assembly", () => {
  const session = dispatchScientificSessionEvent(
    startSessionFromPrompt(createInitialSession(), "Show transcription.", processPacks),
    {
      type: "ENTITY_SELECTED",
      entityIds: ["rna-polymerase-ii"]
    }
  );
  const view = resolveStructureForSession(session);

  assert.equal(view.supported, true);

  if (view.supported) {
    assert.equal(view.mapping.pdbId, "5XOG");
    assert.equal(view.mapping.useBiologicalAssembly, true);
    assert.equal(view.mapping.assemblyId, "1");
    assert.equal(view.record.evidence.experimental, true);
    assert.equal(view.record.evidence.predicted, false);
    assert.equal(view.record.structure?.method, "X-RAY DIFFRACTION");
    assert.equal(view.record.structure?.resolutionAngstrom, 3);
    assert.ok(view.record.structure?.chains.some((chain) => chain.moleculeType === "dna"));
    assert.ok(view.record.structure?.chains.some((chain) => chain.moleculeType === "rna"));
    assert.ok(view.record.structure?.ligands.some((ligand) => ligand.id === "APC" && !ligand.native));
  }
});

test("structure resolver exposes required honesty warnings", () => {
  const session = startSessionFromPrompt(createInitialSession(), "Show transcription.", processPacks);
  const view = resolveStructureForSession(session);

  assert.equal(view.supported, true);

  if (view.supported) {
    const warningCodes = new Set(view.warnings.map((warning) => warning.code));
    assert.ok(warningCodes.has("missing-domains"));
    assert.ok(warningCodes.has("engineered-construct"));
    assert.ok(warningCodes.has("non-native-ligands"));
    assert.ok(warningCodes.has("partial-complex"));
    assert.ok(warningCodes.has("static-snapshot"));
    assert.ok(view.warnings.some((warning) => warning.message.includes("does not represent full transcription dynamics")));
  }
});

test("Molstar URL targets the curated PDB assembly without exposing provider payloads", () => {
  const url = molstarViewerUrl("5XOG", "1");

  assert.equal(url, "https://molstar.org/viewer/?pdb=5xog&assemblyId=1");
});

test("structure provenance converts to internal claim-level provenance", () => {
  const session = startSessionFromPrompt(createInitialSession(), "Show transcription.", processPacks);
  const view = resolveStructureForSession(session);

  assert.equal(view.supported, true);

  if (view.supported) {
    const provenance = structureClaimProvenance(view);
    assert.equal(provenance.sourceId, "rcsb-pdb-5xog");
    assert.equal(provenance.publicationType, "database");
    assert.equal(provenance.claimStatus, "verified");
    assert.ok(provenance.supportedClaim.includes("biological assembly 1"));
  }
});

test("missing structures are handled honestly for unsupported entities", () => {
  const session = dispatchScientificSessionEvent(
    startSessionFromPrompt(createInitialSession(), "Show transcription.", processPacks),
    {
      type: "ENTITY_SELECTED",
      entityIds: ["transcription-factors"]
    }
  );
  const molecular = setRepresentationMode(session, "molecular-structure");
  const view = resolveStructureForSession(molecular);

  assert.equal(view.supported, true);

  if (view.supported) {
    assert.equal(view.mapping.entityId, "rna-polymerase-ii");
    assert.ok(view.warnings.some((warning) => warning.code === "static-snapshot"));
  }
});

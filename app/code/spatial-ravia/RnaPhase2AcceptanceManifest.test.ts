import assert from "node:assert/strict";
import test from "node:test";
import { buildRnaPhase2AcceptanceManifest, rnaPhase2AcceptancePrompts } from "./RnaPhase2AcceptanceManifest.ts";

test("RNA Phase 2 acceptance manifest resolves all 24 prompts through production ownership", () => {
  const manifest = buildRnaPhase2AcceptanceManifest();
  assert.equal(rnaPhase2AcceptancePrompts.length, 24);
  assert.equal(manifest.length, 24);
  assert.ok(manifest.every((entry) => entry.owner.length > 0 && entry.family.length > 0 && entry.cameraIntent.length > 0));
  assert.ok(manifest.every((entry) => entry.bounds === null || [...entry.bounds.min, ...entry.bounds.max].every(Number.isFinite)));
});

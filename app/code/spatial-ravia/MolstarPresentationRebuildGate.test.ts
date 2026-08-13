import assert from "node:assert/strict";
import test from "node:test";
import { MolstarPresentationRebuildGate } from "./MolstarPresentationRebuildGate.ts";

test("Mol* presentation rebuild gate serializes and invalidates superseded structure requests", async () => {
  const gate = new MolstarPresentationRebuildGate();
  const events: string[] = [];
  let releaseFirst!: () => void;
  const first = gate.schedule(async (isCurrent) => {
    events.push("translation:start");
    await new Promise<void>((resolve) => { releaseFirst = resolve; });
    if (isCurrent()) events.push("translation:commit");
  });
  await Promise.resolve();
  await Promise.resolve();
  const second = gate.schedule(async (isCurrent) => {
    if (isCurrent()) events.push("transcription:commit");
  });
  releaseFirst();
  await Promise.all([first, second]);
  assert.deepEqual(events, ["translation:start", "transcription:commit"]);
});

test("theme-like invalidation cannot commit a stale rebuild", async () => {
  const gate = new MolstarPresentationRebuildGate();
  let committed = false;
  const request = gate.schedule(async (isCurrent) => {
    gate.invalidate();
    if (isCurrent()) committed = true;
  });
  await request;
  assert.equal(committed, false);
});

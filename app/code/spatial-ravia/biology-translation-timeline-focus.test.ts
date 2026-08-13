import assert from "node:assert/strict";
import test from "node:test";
import { translationScene } from "./biology-scene-builders.ts";
import { deriveFocusedTimelineWindow } from "./biology-translation-timeline-focus.ts";
import { getTemporalFrame } from "./biology-timeline.ts";

const temporal = translationScene("peptide-bond", { organism: "unspecified" }).temporal;

test("focused translation windows stop before unrelated later phases", () => {
  const transfer = deriveFocusedTimelineWindow(temporal, "transfer");
  const recognition = deriveFocusedTimelineWindow(temporal, "recognition");
  const translocation = deriveFocusedTimelineWindow(temporal, "translocation");
  assert.ok(transfer && recognition && translocation);
  assert.equal(getTemporalFrame(temporal, transfer.startMs)?.phaseId, "peptide-transfer");
  assert.equal(getTemporalFrame(temporal, transfer.endMs)?.phaseId, "peptide-transfer");
  assert.equal(getTemporalFrame(temporal, transfer.endMs - 1)?.phaseId, "peptide-transfer");
  assert.equal(getTemporalFrame(temporal, recognition.endMs - 1)?.phaseId, "codon-recognition");
  assert.equal(getTemporalFrame(temporal, translocation.endMs - 1)?.phaseId, "translocation");
  assert.equal(deriveFocusedTimelineWindow(temporal, "overview"), undefined);
});

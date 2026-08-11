import assert from "node:assert/strict";
import test from "node:test";

import { lerpNumber, lerpVector, smoothstep } from "./biology-interpolation.ts";
import {
  DEFAULT_PHASE_DURATION_MS,
  clampTimeMs,
  getInitialTimeMs,
  getTemporalFrame,
  getTotalDurationMs,
  type TemporalPlan,
} from "./biology-timeline.ts";

const temporal: TemporalPlan = {
  currentPhase: "middle",
  phases: [
    {
      id: "start",
      label: "Start",
      order: 0,
      durationMs: 1000,
      states: { x: "a" },
    },
    {
      id: "middle",
      label: "Middle",
      order: 1,
      durationMs: 2000,
      states: { x: "b" },
    },
    {
      id: "end",
      label: "End",
      order: 2,
      durationMs: 1000,
      states: { x: "c" },
    },
  ],
};

test("temporal runtime computes total duration and initial current-phase time", () => {
  assert.equal(getTotalDurationMs(temporal), 4000);
  assert.equal(getInitialTimeMs(temporal), 1000);
});

test("temporal runtime resolves phase boundaries and local progress", () => {
  const start = getTemporalFrame(temporal, 500);
  assert.equal(start?.phaseId, "start");
  assert.equal(start?.phaseProgress, 0.5);

  const middle = getTemporalFrame(temporal, 2000);
  assert.equal(middle?.phaseId, "middle");
  assert.equal(middle?.phaseProgress, 0.5);

  const final = getTemporalFrame(temporal, 5000);
  assert.equal(final?.phaseId, "end");
  assert.equal(final?.phaseProgress, 1);
  assert.equal(final?.normalizedTime, 1);
});

test("temporal runtime handles empty and default-duration plans", () => {
  assert.equal(getTemporalFrame(undefined, 100), null);
  assert.equal(clampTimeMs(undefined, 100), 0);

  const defaultDurationPlan: TemporalPlan = {
    currentPhase: "only",
    phases: [
      {
        id: "only",
        label: "Only",
        order: 0,
        states: {},
      },
    ],
  };

  assert.equal(getTotalDurationMs(defaultDurationPlan), DEFAULT_PHASE_DURATION_MS);
});

test("interpolation helpers clamp and interpolate numbers and vectors", () => {
  assert.equal(lerpNumber(10, 20, -1), 10);
  assert.equal(lerpNumber(10, 20, 0.5), 15);
  assert.deepEqual(lerpVector([0, 0, 0], [10, 20, 30], 0.5), [5, 10, 15]);
  assert.equal(smoothstep(0), 0);
  assert.equal(smoothstep(1), 1);
});

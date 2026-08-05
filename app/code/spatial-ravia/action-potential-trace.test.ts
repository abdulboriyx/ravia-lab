import assert from "node:assert/strict";
import test from "node:test";
import { actionPotentialPack } from "./action-potential-process.ts";
import {
  actionPotentialTracePath,
  actionPotentialTracePoints,
  actionPotentialTraceSource
} from "./action-potential-trace.ts";
import {
  createInitialSession,
  startSessionFromPrompt
} from "./model.ts";
import { processPacks } from "./process-registry.ts";
import { compileSceneFromSession } from "./scene-compiler.ts";

test("Hodgkin-Huxley action-potential trace fixture declares ordered physical units", () => {
  assert.equal(actionPotentialTraceSource.sourceId, "hodgkin-huxley-1952");
  assert.equal(actionPotentialTraceSource.timeUnit, "ms");
  assert.equal(actionPotentialTraceSource.voltageUnit, "mV");
  assert.ok(actionPotentialTracePoints.length >= 20);

  for (let index = 1; index < actionPotentialTracePoints.length; index += 1) {
    assert.ok(
      actionPotentialTracePoints[index].timeMs > actionPotentialTracePoints[index - 1].timeMs,
      "trace time points must be strictly increasing"
    );
  }

  for (const point of actionPotentialTracePoints) {
    assert.ok(point.timeMs >= actionPotentialTraceSource.timeDomainMs[0]);
    assert.ok(point.timeMs <= actionPotentialTraceSource.timeDomainMs[1]);
    assert.ok(point.voltageMv >= actionPotentialTraceSource.voltageDomainMv[0]);
    assert.ok(point.voltageMv <= actionPotentialTraceSource.voltageDomainMv[1]);
  }
});

test("Hodgkin-Huxley action-potential trace renders as a D3-scaled SVG path", () => {
  const path = actionPotentialTracePath();

  assert.match(path, /^M/);
  assert.match(path, /L/);
  assert.ok(path.includes("92,"), "trace should start on the declared graph x-range");
  assert.ok(path.includes("886,"), "trace should end on the declared graph x-range");
});

test("visible action-potential scene uses the reviewed trace fixture", () => {
  const session = startSessionFromPrompt(
    createInitialSession(),
    "Show an action potential.",
    processPacks
  );
  const scene = compileSceneFromSession(session);
  const voltageNode = scene?.nodes.find((node) => node.id === "voltage-trace");

  assert.ok(scene);
  assert.ok(voltageNode);
  assert.equal(voltageNode.geometry.type, "path");
  assert.equal(voltageNode.provenance[0]?.sourceId, actionPotentialTraceSource.sourceId);

  if (voltageNode.geometry.type === "path") {
    assert.equal(voltageNode.geometry.d, actionPotentialTracePath());
  }

  assert.ok(
    actionPotentialPack.sources.some((source) => source.id === actionPotentialTraceSource.sourceId)
  );
  assert.ok(
    actionPotentialPack.assumptions.some((claim) =>
      claim.provenance.some((source) => source.sourceId === actionPotentialTraceSource.sourceId)
    )
  );
});

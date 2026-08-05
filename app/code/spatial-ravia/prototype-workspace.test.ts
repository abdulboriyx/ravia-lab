import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compileSceneFromSession } from "./scene-compiler.ts";
import {
  createInitialSession,
  dispatchScientificSessionEvent
} from "./model.ts";
import { startDnaWorkspaceFromPrompt } from "./dna-workspace.ts";

test("DNA workspace starts DNA replication through the shared process engine", () => {
  const result = startDnaWorkspaceFromPrompt(createInitialSession(), "Show DNA replication");
  const scene = compileSceneFromSession(result.session);

  assert.equal(result.unsupportedReason, null);
  assert.equal(result.session.selectedProcessPackId, "dna-replication");
  assert.equal(result.session.activeModel?.process, "DNA replication");
  assert.ok(scene);
  assert.equal(scene.title, "DNA replication / replication fork");
  assert.ok(scene.nodes.some((node) => node.entityId === "helicase"));
});

test("visible Spatial RAVIA shell starts action potential through the shared process engine", () => {
  const result = startDnaWorkspaceFromPrompt(createInitialSession(), "Show an action potential.");
  const scene = compileSceneFromSession(result.session);

  assert.equal(result.unsupportedReason, null);
  assert.equal(result.session.selectedProcessPackId, "action-potential");
  assert.equal(result.session.activeModel?.process, "Action potential");
  assert.ok(scene);
  assert.equal(scene.title, "Action potential / synchronized mixed representation");
  assert.ok(scene.nodes.some((node) => node.entityId === "sodium-channels"));
  assert.ok(scene.nodes.some((node) => node.entityId === "membrane-voltage"));
});

test("visible Spatial RAVIA shell starts two-body orbit through the shared process engine", () => {
  const result = startDnaWorkspaceFromPrompt(createInitialSession(), "Show Earth orbit.");
  const scene = compileSceneFromSession(result.session);

  assert.equal(result.unsupportedReason, null);
  assert.equal(result.session.selectedProcessPackId, "two-body-orbit");
  assert.equal(result.session.activeModel?.process, "Two-body orbit");
  assert.equal(result.session.activeModel?.phenomenonSpec?.views[0]?.renderer, "r3f");
  assert.ok(scene);
  assert.equal(scene.title, "Two-body orbit / Sun-Earth benchmark");
  assert.ok(scene.nodes.some((node) => node.entityId === "earth"));
  assert.ok(scene.nodes.some((node) => node.entityId === "jpl-benchmark"));
});

test("visible Spatial RAVIA shell refuses unsupported orbit scope without discarding state", () => {
  const loaded = startDnaWorkspaceFromPrompt(createInitialSession(), "Show Earth orbit.");
  const positioned = dispatchScientificSessionEvent(loaded.session, {
    type: "PLAYBACK_CHANGED",
    playback: { playing: false, timelinePosition: 0.4, speed: 0.5 }
  });
  const unsupported = startDnaWorkspaceFromPrompt(positioned, "Plan an N-body spacecraft mission.");
  const scene = compileSceneFromSession(unsupported.session);

  assert.ok(unsupported.unsupportedReason);
  assert.match(unsupported.unsupportedReason, /two-body benchmark/i);
  assert.equal(unsupported.session.activeModel?.process, "Two-body orbit");
  assert.equal(unsupported.session.playback.timelinePosition, 0.4);
  assert.equal(unsupported.session.playback.speed, 0.5);
  assert.ok(scene);
  assert.equal(scene.title, "Two-body orbit / Sun-Earth benchmark");
});

test("DNA workspace preserves the last valid scene for unsupported prompts", () => {
  const loaded = startDnaWorkspaceFromPrompt(createInitialSession(), "Show DNA replication");
  const positioned = dispatchScientificSessionEvent(loaded.session, {
    type: "PLAYBACK_CHANGED",
    playback: { playing: false, timelinePosition: 0.64, speed: 2 }
  });
  const unsupported = startDnaWorkspaceFromPrompt(positioned, "Show protein folding");
  const scene = compileSceneFromSession(unsupported.session);

  assert.ok(unsupported.unsupportedReason);
  assert.equal(unsupported.session.activeModel?.process, "DNA replication");
  assert.equal(unsupported.session.playback.timelinePosition, 0.64);
  assert.equal(unsupported.session.playback.speed, 2);
  assert.equal(unsupported.session.playback.playing, false);
  assert.ok(scene);
  assert.equal(scene.title, "DNA replication / replication fork");
});

test("visible Spatial RAVIA shell keeps B-DNA as a secondary scale view", () => {
  const source = readFileSync(new URL("./prototype.tsx", import.meta.url), "utf8");

  assert.match(source, /Fork mechanism/);
  assert.match(source, /DNA structure/);
  assert.match(source, /DnaMolecularView/);
  assert.match(source, /compileSceneFromSession/);
  assert.match(source, /literal deposited PDB 1ZF5 coordinates; not a replication-fork structure/i);
});

test("visible Spatial RAVIA shell keeps DNA structure controls DNA-only", () => {
  const source = readFileSync(new URL("./prototype.tsx", import.meta.url), "utf8");

  assert.match(source, /hasDnaStructureView/);
  assert.match(source, /Show DNA replication, an action potential, or Earth orbit/);
  assert.match(source, /show an action potential/);
  assert.match(source, /OrbitR3FView/);
  assert.match(source, /Spatial RAVIA process workspace/);
});

test("DNA replication scene fits core components inside the compiled SVG viewBox", () => {
  const loaded = startDnaWorkspaceFromPrompt(createInitialSession(), "Show DNA replication");

  for (const progress of [0, 0.1, 0.5, 0.64, 0.99]) {
    const positioned = dispatchScientificSessionEvent(loaded.session, {
      type: "PLAYBACK_CHANGED",
      playback: { playing: false, timelinePosition: progress }
    });
    const scene = compileSceneFromSession(positioned);

    assert.ok(scene);
    const viewBox = parseViewBox(scene.viewBox);
    assert.ok(viewBox.width >= 640, `viewBox should preserve a usable scene width at ${progress}`);
    assert.ok(viewBox.height >= 420, `viewBox should preserve a usable scene height at ${progress}`);
    assert.ok(viewBox.width <= 1400, `viewBox should not shrink content to illegibility at ${progress}`);
    assert.ok(viewBox.height <= 900, `viewBox should not shrink content to illegibility at ${progress}`);

    for (const node of scene.nodes.filter((item) => item.visible && item.entityId)) {
      const bounds = nodeBounds(node);

      if (!bounds) {
        continue;
      }

      assert.ok(bounds.minX >= viewBox.x - 1, `${node.id} minX should be inside viewBox at ${progress}`);
      assert.ok(bounds.maxX <= viewBox.x + viewBox.width + 1, `${node.id} maxX should be inside viewBox at ${progress}`);
      assert.ok(bounds.minY >= viewBox.y - 1, `${node.id} minY should be inside viewBox at ${progress}`);
      assert.ok(bounds.maxY <= viewBox.y + viewBox.height + 1, `${node.id} maxY should be inside viewBox at ${progress}`);
    }
  }
});

test("visible Spatial RAVIA shell includes practical visual layout guards", () => {
  const source = readFileSync(new URL("./prototype.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../globals.css", import.meta.url), "utf8");

  assert.match(source, /preserveAspectRatio="xMidYMid meet"/);
  assert.match(css, /grid-template-columns: minmax\(178px, 0\.38fr\) minmax\(720px, 2\.8fr\) minmax\(204px, 0\.46fr\)/);
  assert.match(css, /\.dnaForkCanvas\s*{[\s\S]*?height: clamp\(540px, calc\(100svh - 226px\), 820px\)/);
  assert.match(css, /\.primitive-timeline-event text\s*{[\s\S]*?font-size: 13px;/);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.simulationColumn\s*{\s*grid-row: 1;/);
  assert.match(css, /\.dnaForkCanvas svg\s*{[\s\S]*?min-height: 0;/);
});

function parseViewBox(viewBox: string) {
  const [x, y, width, height] = viewBox.split(/\s+/).map(Number);
  return { x, y, width, height };
}

function nodeBounds(node: NonNullable<ReturnType<typeof compileSceneFromSession>>["nodes"][number]) {
  const geometry = node.geometry;

  if (geometry.type === "path") {
    const values = Array.from(geometry.d.matchAll(/-?\d+(?:\.\d+)?/g), (match) => Number(match[0]));
    const xs = values.filter((_, index) => index % 2 === 0);
    const ys = values.filter((_, index) => index % 2 === 1);
    return xs.length && ys.length ? box(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)) : null;
  }

  if (geometry.type === "line" || geometry.type === "graph-edge") {
    return box(
      Math.min(geometry.x1, geometry.x2),
      Math.min(geometry.y1, geometry.y2),
      Math.max(geometry.x1, geometry.x2),
      Math.max(geometry.y1, geometry.y2)
    );
  }

  if (geometry.type === "rect") {
    return box(geometry.x, geometry.y, geometry.x + geometry.width, geometry.y + geometry.height);
  }

  if (geometry.type === "circle") {
    return box(geometry.cx - geometry.r, geometry.cy - geometry.r, geometry.cx + geometry.r, geometry.cy + geometry.r);
  }

  if (geometry.type === "ellipse") {
    return box(geometry.cx - geometry.rx, geometry.cy - geometry.ry, geometry.cx + geometry.rx, geometry.cy + geometry.ry);
  }

  if (geometry.type === "polygon") {
    const xs = geometry.points.map(([x]) => x);
    const ys = geometry.points.map(([, y]) => y);
    return box(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys));
  }

  if (geometry.type === "text" || geometry.type === "graph-node") {
    const radius = "radius" in geometry ? geometry.radius : 20;
    return box(geometry.x - radius, geometry.y - radius, geometry.x + radius, geometry.y + radius);
  }

  return box(geometry.x - 8, geometry.y - 28, geometry.x + 180, geometry.y + 20);
}

function box(minX: number, minY: number, maxX: number, maxY: number) {
  return { minX, minY, maxX, maxY };
}

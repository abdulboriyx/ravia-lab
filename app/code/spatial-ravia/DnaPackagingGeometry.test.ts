import assert from "node:assert/strict";
import test from "node:test";
import { derivePackagingMode, nucleosomeUnits, wrappedDnaPaths } from "./DnaPackagingGeometry.ts";
test("nucleosome DNA is a wrapped double-stranded path", () => { const paths = wrappedDnaPaths(nucleosomeUnits("nucleosome")[0]); assert.ok(paths.pointsA.length > 40); assert.equal(paths.pointsA.length, paths.pointsB.length); assert.ok(paths.rungs.length > 10); assert.ok(paths.pointsA.some((point,index) => point.distanceTo(paths.pointsB[index]) > .2)); });
test("chromatin creates a multi-nucleosome beads-on-a-string layout", () => { assert.equal(derivePackagingMode("show chromatin packing"), "chromatin"); assert.equal(nucleosomeUnits("chromatin").length, 4); assert.equal(derivePackagingMode("show a nucleosome structure"), "nucleosome"); });

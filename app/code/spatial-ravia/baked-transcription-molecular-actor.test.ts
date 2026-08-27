import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as THREE from "three";
import { resolveEukaryoticPolIIAssetManifest } from "./eukaryotic-pol-ii-asset-selection.ts";

test("static transcription actor is a cached Mol* Gaussian-source R3F actor", () => {
  const source = readFileSync(new URL("./BakedTranscriptionMolecularActor.tsx", import.meta.url), "utf8");
  assert.match(source, /loadGroundedStructure/);
  assert.doesNotMatch(source, /ConvexGeometry/);
  assert.match(source, /computeStructureGaussianDensity/);
  assert.match(source, /computeMarchingCubesMesh/);
  assert.match(source, /vertexBuffer/);
  assert.match(source, /normalBuffer/);
  assert.match(source, /indexBuffer/);
  assert.match(source, /userData=\{\{/);
  assert.match(source, /bakedFidelity: proteinLayer\.fidelity/);
  assert.match(source, /bakedFrame: \"M1-active-site\"/);
  assert.doesNotMatch(source, /<group[^>]*\b(?:data-|aria-)/);
  assert.match(source, /generateDepositedNucleicGeometry/);
  assert.match(source, /PRIMARY_TRANSCRIPTION_NUCLEIC_VISUAL/);
  assert.match(source, /selectPrimaryDepositedNucleicGeometry/);
  assert.match(source, /bakedNucleicRepresentation:\s*`molstar-\$\{PRIMARY_TRANSCRIPTION_NUCLEIC_VISUAL\}-primary`/);
  assert.match(source, /deriveProteinChainCenters/);
  assert.match(source, /vertexColors/);
  assert.match(source, /surfaceColorSource: "DEPOSITED_POL_II_CHAIN_ID"/);
  assert.match(source, /source-bounded atomistic hybrid window/);
  assert.match(source, /HybridContactMarker/);
  assert.match(source, /deposited-hybrid-contact-window/);
  assert.match(source, /NucleotideRingVisual/);
  assert.match(source, /NucleotideBlockVisual/);
  assert.match(source, /PolymerTraceVisual/);
  assert.match(source, /entry\.chainEntityTypes/);
  assert.match(source, /entry\.format === \"pdb\"/);
  assert.match(source, /trajectoryFromMmCIF/);
  assert.match(source, /restrictGeometryToBounds/);
  assert.match(source, /ActiveCenterMarker/);
  assert.match(source, /sourceRole: "active-center-magnesium"/);
  assert.match(source, /depthTest=\{false\}/);
  assert.doesNotMatch(source, /SourceTrace/);
  assert.doesNotMatch(source, /tubeGeometry/);
  assert.match(source, /torusGeometry/);
  assert.doesNotMatch(source, /icosahedronGeometry|lobe|PolymeraseHero/);
});

test("Mol* Gaussian generation yields indexed position/normal geometry beyond the hull baseline", async () => {
  const [{ parsePDB }, { trajectoryFromPDB }, { Structure }, { StructureElement }, { StructureProperties }, { PhysicalSizeTheme }, { computeStructureGaussianDensity, DefaultGaussianDensityProps }, { computeMarchingCubesMesh }, { Mesh }] = await Promise.all([
    import("molstar/lib/mol-io/reader/pdb/parser.js"),
    import("molstar/lib/mol-model-formats/structure/pdb.js"),
    import("molstar/lib/mol-model/structure/structure/structure.js"),
    import("molstar/lib/mol-model/structure/structure/element.js"),
    import("molstar/lib/mol-model/structure/structure/properties.js"),
    import("molstar/lib/mol-theme/size/physical.js"),
    import("molstar/lib/mol-repr/structure/visual/util/gaussian.js"),
    import("molstar/lib/mol-geo/util/marching-cubes/algorithm.js"),
    import("molstar/lib/mol-geo/geometry/mesh/mesh.js"),
  ]);
  const pdb = readFileSync(new URL("../../../public/spatial-ravia/structures/6ALH.pdb", import.meta.url), "utf8");
  const parsed = await parsePDB(pdb, "6ALH").run();
  assert.equal(parsed.isError, false);
  if (parsed.isError) return;
  const trajectory = await trajectoryFromPDB(parsed.result).run();
  const full = Structure.ofModel(trajectory.representative);
  const chainId = (unit: typeof full.units[number]) => StructureProperties.chain.label_asym_id(StructureElement.Location.create(full, unit, Array.from(unit.elements)[0]!));
  const proteinUnits = Array.from(full.units).filter((unit: typeof full.units[number]) => ["G", "H", "I", "J", "K"].includes(chainId(unit)));
  const structure = Structure.create(proteinUnits);
  const props = { ...DefaultGaussianDensityProps, resolution: 3.2, smoothness: 1.8 };
  const density = await computeStructureGaussianDensity(structure, PhysicalSizeTheme({ structure }, { scale: 1 }), props).run();
  const mesh = await computeMarchingCubesMesh({ isoLevel: Math.exp(-props.smoothness) / density.radiusFactor, scalarField: density.field, idField: density.idField }).run();
  Mesh.transform(mesh, density.transform);
  assert.ok(mesh.vertexBuffer.ref.value.length > 0);
  assert.equal(mesh.vertexBuffer.ref.value.length, mesh.normalBuffer.ref.value.length);
  assert.ok(mesh.indexBuffer.ref.value.length > 132 * 3);
});

test("Mol* deposited nucleic cartoon extraction includes A/B/R atom-derived meshes", async (t) => {
  let actorNamespace: typeof import("./BakedTranscriptionMolecularActor.tsx");
  try {
    actorNamespace = await import("./BakedTranscriptionMolecularActor.tsx");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ERR_UNKNOWN_FILE_EXTENSION") {
      t.skip("runtime extraction test requires the tsx loader");
      return;
    }
    throw error;
  }
  const actorModule = ((actorNamespace as unknown as { default?: unknown }).default ?? actorNamespace) as {
    generateDepositedNucleicGeometry: (entry: Parameters<typeof import("./biology-structure-loader.ts").loadGroundedStructure>[0]) => Promise<Array<{ chainId: string; visual: string; positions: Float32Array; normals: Float32Array; indices: Uint32Array }>>;
  };
  const pdb = readFileSync(new URL("../../../public/spatial-ravia/structures/6ALH.pdb", import.meta.url), "utf8");
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(pdb)) as typeof fetch;
  try {
    const entry = {
      structureId: "6ALH-nucleic-test",
      provider: "rcsb-pdb" as const,
      assetUrl: "/local/6ALH.pdb",
      format: "pdb" as const,
      assemblyId: "1",
      role: "rna-polymerase" as const,
      semanticEntityIds: ["rna-polymerase"],
      title: "6ALH test",
      canonicalSystem: "structure-grounded bacterial transcription V1",
      organism: "Escherichia coli K-12",
      sourceUrl: "https://www.rcsb.org/structure/6ALH",
      selectedChains: ["A", "B", "R", "G", "H", "I", "J", "K"],
      chainEntityTypes: { A: "dna", B: "dna", R: "rna", G: "protein", H: "protein", I: "protein", J: "protein", K: "protein" } as const,
      renderMode: "residue-centroid-cloud" as const,
      coarseGrainStride: 2,
      anchors: [],
      fallback: { status: "procedural" as const, reason: "test" },
    };
    const meshes = await actorModule.generateDepositedNucleicGeometry(entry);
    assert.deepEqual([...new Set(meshes.map((mesh) => mesh.chainId))].sort(), ["A", "B", "R"]);
    assert.deepEqual([...new Set(meshes.map((mesh) => mesh.visual))].sort(), ["nucleotide-block", "nucleotide-ring", "polymer-trace"]);
    for (const mesh of meshes) {
      assert.ok(mesh.positions.length > 0);
      assert.equal(mesh.positions.length, mesh.normals.length);
      assert.ok(mesh.indices.length > 0);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Mol* deposited nucleic cartoon extraction supports the 5FLM mmCIF Pol II asset", async (t) => {
  let actorNamespace: typeof import("./BakedTranscriptionMolecularActor.tsx");
  try {
    actorNamespace = await import("./BakedTranscriptionMolecularActor.tsx");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ERR_UNKNOWN_FILE_EXTENSION") {
      t.skip("runtime extraction test requires the tsx loader");
      return;
    }
    throw error;
  }
  const actorModule = ((actorNamespace as unknown as { default?: unknown }).default ?? actorNamespace) as {
    generateDepositedNucleicGeometry: (entry: Parameters<typeof import("./biology-structure-loader.ts").loadGroundedStructure>[0]) => Promise<Array<{ chainId: string; visual: string; positions: Float32Array; normals: Float32Array; indices: Uint32Array }>>;
  };
  const cif = readFileSync(new URL("../../../public/spatial-ravia/structures/5FLM.cif", import.meta.url), "utf8");
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(cif)) as typeof fetch;
  try {
    const meshes = await actorModule.generateDepositedNucleicGeometry(resolveEukaryoticPolIIAssetManifest());
    assert.deepEqual([...new Set(meshes.map((mesh) => mesh.chainId))].sort(), ["M", "N", "O"]);
    assert.deepEqual([...new Set(meshes.map((mesh) => mesh.visual))].sort(), ["nucleotide-block", "nucleotide-ring", "polymer-trace"]);
    for (const mesh of meshes) {
      assert.ok(mesh.positions.length > 0);
      assert.equal(mesh.positions.length, mesh.normals.length);
      assert.ok(mesh.indices.length > 0);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("local active-site cutaway removes only front-window protein triangles", async (t) => {
  let actorNamespace: typeof import("./BakedTranscriptionMolecularActor.tsx");
  try {
    actorNamespace = await import("./BakedTranscriptionMolecularActor.tsx");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ERR_UNKNOWN_FILE_EXTENSION") {
      t.skip("runtime cutaway test requires the tsx loader");
      return;
    }
    throw error;
  }
  const actorModule = ((actorNamespace as unknown as { default?: unknown }).default ?? actorNamespace) as {
    applyTranscriptionActiveSiteCutaway: (geometry: THREE.BufferGeometry, cutaway: {
      center: THREE.Vector3;
      halfExtent: THREE.Vector3;
      bounds: THREE.Box3;
      viewDirection: THREE.Vector3;
      paddingAngstrom: number;
    }) => THREE.BufferGeometry;
  };
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([
    0.1, 0, 0, 0.1, 0.1, 0, 0.1, 0, 0.1,
    -0.5, 0, 0, -0.5, 0.1, 0, -0.5, 0, 0.1,
  ], 3));
  geometry.setIndex([0, 1, 2, 3, 4, 5]);
  const cutaway = {
    center: new THREE.Vector3(0, 0, 0),
    halfExtent: new THREE.Vector3(0.25, 0.25, 0.25),
    bounds: new THREE.Box3(new THREE.Vector3(-0.25, -0.25, -0.25), new THREE.Vector3(0.25, 0.25, 0.25)),
    viewDirection: new THREE.Vector3(1, 0, 0),
    paddingAngstrom: 8,
  };
  const filtered = actorModule.applyTranscriptionActiveSiteCutaway(geometry, cutaway);
  assert.equal(geometry.getIndex()?.count, 6);
  assert.equal(filtered.getIndex()?.count, 3);
  assert.equal(filtered.getAttribute("position").count, geometry.getAttribute("position").count);
});

"use client";

import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { loadGroundedStructure } from "./biology-structure-loader.ts";
import type { MolecularAtom, StructureManifestEntry, StructureDerivedGeometry } from "./biology-structure-grounding.ts";
import { deriveTranscriptionActiveSiteCutaway, deriveTranscriptionActiveSiteRoi, pointIsInsideTranscriptionCutaway, type TranscriptionActiveSiteCutaway, type TranscriptionActiveSiteRoi } from "./transcription-active-site-camera.ts";
import type { TranscriptionPresentationStateV1 } from "./transcription-presentation-state.ts";
import type { ExpertTranscriptionGeometryMode, ExpertTranscriptionTarget } from "./transcription-expert-controls.ts";
import { transcriptionVisualLayer } from "./transcription-visual-contract.ts";

type Props = { entry: StructureManifestEntry; scale: number; presentation?: TranscriptionPresentationStateV1; selectedTarget?: ExpertTranscriptionTarget; geometryMode?: ExpertTranscriptionGeometryMode; onRoiReady?: (roi: TranscriptionActiveSiteRoi | null) => void };
type GaussianBuffers = {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  sourceActiveCenter: THREE.Vector3;
};

type MolstarMeshBuffers = {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
};

type DepositedNucleicBuffers = MolstarMeshBuffers & {
  chainId: string;
  entityType: "dna" | "rna";
  visual: "polymer-trace" | "nucleotide-ring" | "nucleotide-block";
};

export const PRIMARY_TRANSCRIPTION_NUCLEIC_VISUAL: DepositedNucleicBuffers["visual"] = "polymer-trace";

type TranscriptionAtomVisual = Readonly<{
  id: string;
  position: THREE.Vector3;
  sourcePosition: THREE.Vector3;
  element: string;
  atomName: string;
  residueName: string;
  residueSequence: number;
  chainId: string;
  entityType: MolecularAtom["entityType"];
}>;

type TranscriptionBondVisual = Readonly<{ id: string; left: TranscriptionAtomVisual; right: TranscriptionAtomVisual }>;

type TranscriptionProteinChainCenter = Readonly<{ chainId: string; point: THREE.Vector3; color: string }>;

const transcriptionProteinChainPalette: Record<string, string> = {
  A: "#8da9b7", B: "#7895ad", C: "#91a98f", D: "#a58d79",
  E: "#7e9ca4", F: "#9a9a7b", G: "#7d91b2", H: "#8ea5a0",
  I: "#a18b98", J: "#789a96", K: "#9a846c", L: "#8292a9",
};

const gaussianCache = new Map<string, Promise<GaussianBuffers>>();
const nucleicCache = new Map<string, Promise<DepositedNucleicBuffers[]>>();

function structuralFrame(geometry: StructureDerivedGeometry) {
  const anchor = (id: string) => geometry.anchors.find((candidate) => candidate.id === id);
  const active = anchor("active-center")?.point ?? geometry.centroid;
  const upstream = anchor("upstream-dna")?.point;
  const downstream = anchor("downstream-dna")?.point;
  if (!upstream || !downstream) return null;
  const axis = downstream.clone().sub(upstream).normalize();
  const exit = anchor("rna-exit")?.direction ?? new THREE.Vector3(0, 1, 0);
  let normal = exit.clone().sub(axis.clone().multiplyScalar(exit.dot(axis)));
  if (normal.lengthSq() < 0.25) normal = new THREE.Vector3(0, 1, 0).sub(axis.clone().multiplyScalar(axis.y));
  normal.normalize();
  if (!Number.isFinite(axis.x) || !Number.isFinite(normal.x) || normal.lengthSq() < 0.5) return null;
  const binormal = axis.clone().cross(normal).normalize();
  return { active, axis, normal, binormal };
}

function toScene(point: THREE.Vector3, frame: ReturnType<typeof structuralFrame>, scale: number) {
  if (!frame) return null;
  const delta = point.clone().sub(frame.active);
  return new THREE.Vector3(
    delta.dot(frame.axis) * scale,
    delta.dot(frame.normal) * scale,
    delta.dot(frame.binormal) * scale,
  );
}

function gaussianCacheKey(entry: StructureManifestEntry) {
  return [entry.structureId, entry.assemblyId ?? "model", entry.selectedChains.filter((chain) => entry.chainEntityTypes?.[chain] === "protein").join(","), "gaussian-surface", "3.2", "1.8"].join(":");
}

function nucleicCacheKey(entry: StructureManifestEntry) {
  return [entry.structureId, entry.assemblyId ?? "model", entry.selectedChains.filter((chain) => ["dna", "rna"].includes(entry.chainEntityTypes?.[chain] ?? "")).join(","), "cartoon", "medium"].join(":");
}

async function parseMolstarRepresentative(text: string, entry: StructureManifestEntry): Promise<unknown> {
  if (entry.format === "pdb") {
    const [{ parsePDB }, { trajectoryFromPDB }] = await Promise.all([
      import("molstar/lib/mol-io/reader/pdb/parser.js"),
      import("molstar/lib/mol-model-formats/structure/pdb.js"),
    ]);
    const parsed = await parsePDB(text, entry.structureId).run();
    if (parsed.isError) throw new Error(`TRANSCRIPTION_PDB_PARSE_FAILED:${parsed.message}`);
    return (await trajectoryFromPDB(parsed.result).run()).representative;
  }
  const [{ CIF }, { trajectoryFromMmCIF }] = await Promise.all([
    import("molstar/lib/mol-io/reader/cif.js"),
    import("molstar/lib/mol-model-formats/structure/mmcif.js"),
  ]);
  const parsed = await CIF.parse(text).run();
  if (parsed.isError) throw new Error(`TRANSCRIPTION_MMCIF_PARSE_FAILED:${parsed.message}`);
  const frame = parsed.result.blocks[0];
  if (!frame) throw new Error("TRANSCRIPTION_MMCIF_DATA_BLOCK_MISSING");
  return (await trajectoryFromMmCIF(frame, parsed.result).run()).representative;
}

type MolstarMeshVisual = {
  createOrUpdate: (
    context: { runtime: unknown },
    theme: unknown,
    props: unknown,
    data: unknown,
  ) => Promise<void> | void;
  renderObject?: { values: Record<string, unknown> };
  destroy: () => void;
};

function renderValue(values: Record<string, unknown>, key: string) {
  const value = values[key] as { ref?: { value?: unknown } } | undefined;
  return value?.ref?.value;
}

function extractMolstarMesh(visual: MolstarMeshVisual): MolstarMeshBuffers | null {
  const values = visual.renderObject?.values;
  if (!values) return null;
  const positions = renderValue(values, "aPosition");
  const normals = renderValue(values, "aNormal");
  const indices = renderValue(values, "elements");
  if (!(positions instanceof Float32Array) || !(normals instanceof Float32Array)) return null;
  if (!(indices instanceof Uint32Array) && !(indices instanceof Uint16Array)) return null;
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint32Array(indices),
  };
}

/**
 * Uses Mol*'s own nucleic cartoon visual generators, but never mounts a
 * viewer. Their render-object buffers are copied into the R3F actor cache.
 */
export async function generateDepositedNucleicGeometry(entry: StructureManifestEntry): Promise<DepositedNucleicBuffers[]> {
  const key = nucleicCacheKey(entry);
  const cached = nucleicCache.get(key);
  if (cached) return cached;
  const pending = (async () => {
    const [text, { Structure }, { Unit }, { StructureElement }, { StructureProperties }, { PolymerTraceVisual, PolymerTraceParams }, { NucleotideRingVisual, NucleotideRingParams }, { NucleotideBlockVisual, NucleotideBlockParams }, { Theme }, { RuntimeContext }, { ParamDefinition }] = await Promise.all([
      fetch(entry.assetUrl).then((response) => {
        if (!response.ok) throw new Error(`NUCLEIC_SOURCE_LOAD_FAILED:${response.status}`);
        return response.text();
      }),
      import("molstar/lib/mol-model/structure/structure/structure.js"),
      import("molstar/lib/mol-model/structure/structure/unit.js"),
      import("molstar/lib/mol-model/structure/structure/element.js"),
      import("molstar/lib/mol-model/structure/structure/properties.js"),
      import("molstar/lib/mol-repr/structure/visual/polymer-trace-mesh.js"),
      import("molstar/lib/mol-repr/structure/visual/nucleotide-ring-mesh.js"),
      import("molstar/lib/mol-repr/structure/visual/nucleotide-block-mesh.js"),
      import("molstar/lib/mol-theme/theme.js"),
      import("molstar/lib/mol-task/execution/runtime-context.js"),
      import("molstar/lib/mol-util/param-definition.js"),
    ]);
    const representative = await parseMolstarRepresentative(text, entry);
    const full = Structure.ofModel(representative as Parameters<typeof Structure.ofModel>[0]);
    const chainId = (unit: typeof full.units[number]) => {
      const location = StructureElement.Location.create(full, unit, unit.elements[0]);
      return StructureProperties.chain.label_asym_id(location);
    };
    const outputs: DepositedNucleicBuffers[] = [];
    for (const unit of Array.from(full.units)) {
      if (!Unit.isAtomic(unit)) continue;
      const chain = chainId(unit);
      const entityType = entry.chainEntityTypes?.[chain];
      if (entityType !== "dna" && entityType !== "rna") continue;
      if (!unit.nucleotideElements.length) continue;
      const structure = Structure.create([unit]);
      const group = { structure, group: structure.unitSymmetryGroups[0] };
      if (!group.group) throw new Error(`NUCLEIC_UNIT_GROUP_MISSING:${chain}`);
      const visuals = [
        ["polymer-trace", PolymerTraceVisual, PolymerTraceParams],
        ["nucleotide-ring", NucleotideRingVisual, NucleotideRingParams],
        ["nucleotide-block", NucleotideBlockVisual, NucleotideBlockParams],
      ] as const;
      for (const [visualName, factory, params] of visuals) {
        const visual = (factory as unknown as (materialId: number) => MolstarMeshVisual)(1);
        const props = ParamDefinition.getDefaultValues(params);
        if (visualName === "polymer-trace") {
          Object.assign(props, { sizeFactor: 0.2, nucleicProfile: "rounded", quality: "medium" });
        } else if (visualName === PRIMARY_TRANSCRIPTION_NUCLEIC_VISUAL) {
          Object.assign(props, { sizeFactor: 0.32, quality: "medium" });
        } else {
          Object.assign(props, { sizeFactor: 0.2, quality: "medium" });
        }
        await visual.createOrUpdate({ runtime: RuntimeContext.Synchronous }, Theme.createEmpty(), props, group);
        const mesh = extractMolstarMesh(visual);
        visual.destroy();
        if (mesh) outputs.push({ ...mesh, chainId: chain, entityType, visual: visualName });
      }
    }
    if (!outputs.some((output) => output.entityType === "dna") || !outputs.some((output) => output.entityType === "rna")) throw new Error("NUCLEIC_REQUIRED_DNA_RNA_MISSING");
    return outputs;
  })();
  nucleicCache.set(key, pending);
  try {
    return await pending;
  } catch (error) {
    nucleicCache.delete(key);
    throw error;
  }
}

/** Mount exactly one readable nucleic representation; retain trace as a fallback only. */
export function selectPrimaryDepositedNucleicGeometry(buffers: readonly DepositedNucleicBuffers[]) {
  const primary = buffers.filter((buffer) => buffer.visual === PRIMARY_TRANSCRIPTION_NUCLEIC_VISUAL);
  if (primary.some((buffer) => buffer.entityType === "dna") && primary.some((buffer) => buffer.entityType === "rna")) return primary;
  return buffers.filter((buffer) => buffer.visual === "polymer-trace");
}

/** CPU Mol* Gaussian surface generation. No Mol* viewer or camera is created. */
async function generateGaussianProteinSurface(entry: StructureManifestEntry): Promise<GaussianBuffers> {
  const key = gaussianCacheKey(entry);
  const cached = gaussianCache.get(key);
  if (cached) return cached;
  const pending = (async () => {
    const [text, { Structure }, { StructureElement }, { StructureProperties }, { PhysicalSizeTheme }, { computeStructureGaussianDensity, DefaultGaussianDensityProps }, { computeMarchingCubesMesh }, { Mesh }] = await Promise.all([
      fetch(entry.assetUrl).then((response) => {
        if (!response.ok) throw new Error(`GAUSSIAN_SOURCE_LOAD_FAILED:${response.status}`);
        return response.text();
      }),
      import("molstar/lib/mol-model/structure/structure/structure.js"),
      import("molstar/lib/mol-model/structure/structure/element.js"),
      import("molstar/lib/mol-model/structure/structure/properties.js"),
      import("molstar/lib/mol-theme/size/physical.js"),
      import("molstar/lib/mol-repr/structure/visual/util/gaussian.js"),
      import("molstar/lib/mol-geo/util/marching-cubes/algorithm.js"),
      import("molstar/lib/mol-geo/geometry/mesh/mesh.js"),
    ]);
    const representative = await parseMolstarRepresentative(text, entry);
    const full = Structure.ofModel(representative as Parameters<typeof Structure.ofModel>[0]);
    const chainId = (unit: typeof full.units[number]) => {
      const location = StructureElement.Location.create(full, unit, unit.elements[0]);
      return StructureProperties.chain.label_asym_id(location);
    };
    const units = Array.from(full.units);
    const proteinChains = new Set(entry.selectedChains.filter((chain) => entry.chainEntityTypes?.[chain] === "protein"));
    const nucleicChains = new Set(entry.selectedChains.filter((chain) => ["dna", "rna"].includes(entry.chainEntityTypes?.[chain] ?? "")));
    const proteinUnits = units.filter((unit: typeof full.units[number]) => proteinChains.has(chainId(unit)));
    const nucleicUnits = units.filter((unit: typeof full.units[number]) => nucleicChains.has(chainId(unit)));
    if (proteinUnits.length === 0 || nucleicUnits.length === 0) throw new Error("GAUSSIAN_REQUIRED_CHAINS_MISSING");

    const chainSums = new Map<string, { point: THREE.Vector3; count: number }>();
    for (const unit of nucleicUnits) {
      const id = chainId(unit);
      const sum = chainSums.get(id) ?? { point: new THREE.Vector3(), count: 0 };
      for (const element of Array.from(unit.elements)) {
        sum.point.x += unit.model.atomicConformation.x[element];
        sum.point.y += unit.model.atomicConformation.y[element];
        sum.point.z += unit.model.atomicConformation.z[element];
        sum.count += 1;
      }
      chainSums.set(id, sum);
    }
    const sourceActiveCenter = new THREE.Vector3();
    for (const sum of chainSums.values()) sourceActiveCenter.add(sum.point.multiplyScalar(1 / sum.count));
    sourceActiveCenter.multiplyScalar(1 / chainSums.size);

    const proteinStructure = Structure.create(proteinUnits);
    const sizeTheme = PhysicalSizeTheme({ structure: proteinStructure }, { scale: 1 });
    // Keep the deposited Gaussian field at the stable active-site setting; readability is handled by the local crop and material contrast.
    const props = { ...DefaultGaussianDensityProps, resolution: 3.2, smoothness: 1.8 };
    const density = await computeStructureGaussianDensity(proteinStructure, sizeTheme, props).run();
    const isoLevel = Math.exp(-props.smoothness) / density.radiusFactor;
    const mesh = await computeMarchingCubesMesh({ isoLevel, scalarField: density.field, idField: density.idField }).run();
    Mesh.transform(mesh, density.transform);
    return {
      positions: new Float32Array(mesh.vertexBuffer.ref.value),
      normals: new Float32Array(mesh.normalBuffer.ref.value),
      indices: new Uint32Array(mesh.indexBuffer.ref.value),
      sourceActiveCenter,
    };
  })();
  gaussianCache.set(key, pending);
  try {
    return await pending;
  } catch (error) {
    gaussianCache.delete(key);
    throw error;
  }
}

function transformGaussianBuffers(buffers: GaussianBuffers, frame: ReturnType<typeof structuralFrame>, scale: number, proteinChainCenters: readonly TranscriptionProteinChainCenter[] = []) {
  if (!frame) return null;
  const position = new Float32Array(buffers.positions.length);
  const normal = new Float32Array(buffers.normals.length);
  const sourceFrame = { ...frame, active: buffers.sourceActiveCenter };
  for (let i = 0; i < buffers.positions.length; i += 3) {
    const point = toScene(new THREE.Vector3(buffers.positions[i], buffers.positions[i + 1], buffers.positions[i + 2]), sourceFrame, scale);
    if (!point) return null;
    position[i] = point.x;
    position[i + 1] = point.y;
    position[i + 2] = point.z;
    const sourceNormal = new THREE.Vector3(buffers.normals[i], buffers.normals[i + 1], buffers.normals[i + 2]);
    const mappedNormal = new THREE.Vector3(sourceNormal.dot(frame.axis), sourceNormal.dot(frame.normal), sourceNormal.dot(frame.binormal)).normalize();
    normal[i] = mappedNormal.x;
    normal[i + 1] = mappedNormal.y;
    normal[i + 2] = mappedNormal.z;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normal, 3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(buffers.indices), 1));
  geometry.computeBoundingSphere();
  return addProteinChainVertexColors(geometry, frame, buffers.sourceActiveCenter, scale, proteinChainCenters);
}

function deriveProteinChainCenters(atoms: readonly MolecularAtom[], selectedChains: readonly string[]) {
  const selected = new Set(selectedChains);
  const sums = new Map<string, { point: THREE.Vector3; count: number }>();
  for (const atom of atoms) {
    if (atom.entityType !== "protein") continue;
    const chainId = atom.sourceChainId ?? atom.labelAsymId ?? atom.chainId.split("::", 1)[0];
    if (!selected.has(chainId)) continue;
    const sum = sums.get(chainId) ?? { point: new THREE.Vector3(), count: 0 };
    sum.point.add(new THREE.Vector3(atom.x, atom.y, atom.z));
    sum.count += 1;
    sums.set(chainId, sum);
  }
  return [...sums.entries()].map(([chainId, sum]) => ({ chainId, point: sum.point.multiplyScalar(1 / sum.count), color: transcriptionProteinChainPalette[chainId] ?? "#87979b" }));
}

function addProteinChainVertexColors(geometry: THREE.BufferGeometry, frame: ReturnType<typeof structuralFrame>, sourceActiveCenter: THREE.Vector3, scale: number, centers: readonly TranscriptionProteinChainCenter[]) {
  const position = geometry.getAttribute("position");
  if (!position || !frame || centers.length === 0) return geometry;
  const colors = new Float32Array(position.count * 3);
  const sourceFrame = { ...frame, active: sourceActiveCenter };
  const sceneCenters = centers.map((center) => ({ ...center, point: toScene(center.point, sourceFrame, scale)! }));
  for (let index = 0; index < position.count; index += 1) {
    const vertex = new THREE.Vector3().fromBufferAttribute(position, index);
    const nearest = sceneCenters.reduce((best, candidate) => vertex.distanceToSquared(candidate.point) < vertex.distanceToSquared(best.point) ? candidate : best, sceneCenters[0]!);
    new THREE.Color(nearest.color).toArray(colors, index * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function transformDepositedNucleicBuffers(
  buffers: DepositedNucleicBuffers[],
  frame: ReturnType<typeof structuralFrame>,
  sourceActiveCenter: THREE.Vector3,
  scale: number,
) {
  if (!frame) return [];
  return buffers.map((buffer) => {
    const positions = new Float32Array(buffer.positions.length);
    const normals = new Float32Array(buffer.normals.length);
    const sourceFrame = { ...frame, active: sourceActiveCenter };
    for (let i = 0; i < buffer.positions.length; i += 3) {
      const point = toScene(new THREE.Vector3(buffer.positions[i], buffer.positions[i + 1], buffer.positions[i + 2]), sourceFrame, scale);
      if (!point) throw new Error(`NUCLEIC_FRAME_TRANSFORM_FAILED:${buffer.chainId}:${buffer.visual}`);
      positions[i] = point.x;
      positions[i + 1] = point.y;
      positions[i + 2] = point.z;
      const sourceNormal = new THREE.Vector3(buffer.normals[i], buffer.normals[i + 1], buffer.normals[i + 2]);
      const mappedNormal = new THREE.Vector3(sourceNormal.dot(frame.axis), sourceNormal.dot(frame.normal), sourceNormal.dot(frame.binormal)).normalize();
      normals[i] = mappedNormal.x;
      normals[i + 1] = mappedNormal.y;
      normals[i + 2] = mappedNormal.z;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(buffer.indices), 1));
    geometry.computeBoundingSphere();
    return { chainId: buffer.chainId, entityType: buffer.entityType, visual: buffer.visual, geometry };
  });
}

const atomVdwRadiusAngstrom: Record<string, number> = { C: 1.70, N: 1.55, O: 1.52, P: 1.80, S: 1.80, MG: 1.73 };

function transformTranscriptionAtomisticDetail(
  atoms: readonly MolecularAtom[],
  frame: ReturnType<typeof structuralFrame>,
  sourceActiveCenter: THREE.Vector3,
  scale: number,
) {
  if (!frame) return [];
  const sourceFrame = { ...frame, active: sourceActiveCenter };
  const candidates = atoms.filter((atom) => {
    if (atom.element.toUpperCase() === "H") return false;
    const sourcePosition = new THREE.Vector3(atom.x, atom.y, atom.z);
    const distance = sourcePosition.distanceTo(sourceActiveCenter);
    const sourceChain = atom.sourceChainId ?? atom.labelAsymId ?? atom.chainId.split("::", 1)[0];
    const hybridWindow = (atom.entityType === "rna" && sourceChain === "N" && atom.residueSequence >= 7 && atom.residueSequence <= 20)
      || (atom.entityType === "dna" && sourceChain === "O" && atom.residueSequence >= 7 && atom.residueSequence <= 20);
    return atom.entityType === "ligand" || hybridWindow || (atom.entityType === "protein" && distance <= 7.5);
  });
  return candidates
    .sort((left, right) => new THREE.Vector3(left.x, left.y, left.z).distanceToSquared(sourceActiveCenter) - new THREE.Vector3(right.x, right.y, right.z).distanceToSquared(sourceActiveCenter))
    .slice(0, 720)
    .map((atom) => {
      const sourcePosition = new THREE.Vector3(atom.x, atom.y, atom.z);
      const sourceChain = atom.sourceChainId ?? atom.labelAsymId ?? atom.chainId.split("::", 1)[0];
      const position = toScene(sourcePosition, sourceFrame, scale);
      if (!position) throw new Error(`TRANSCRIPTION_ATOMISTIC_FRAME_TRANSFORM_FAILED:${atom.chainId}:${atom.atomName}`);
      return {
        id: `${atom.chainId}:${atom.residueSequence}:${atom.atomName}:${atom.serial}`,
        position,
        sourcePosition,
        element: atom.element,
        atomName: atom.atomName,
        residueName: atom.residueName,
        residueSequence: atom.residueSequence,
        chainId: sourceChain,
        entityType: atom.entityType,
      } satisfies TranscriptionAtomVisual;
    });
}

function deriveTranscriptionAtomisticBonds(atoms: readonly TranscriptionAtomVisual[]) {
  const bonds: TranscriptionBondVisual[] = [];
  const cellSize = 2.25;
  const cells = new Map<string, number[]>();
  const cellKey = (point: THREE.Vector3) => `${Math.floor(point.x / cellSize)}:${Math.floor(point.y / cellSize)}:${Math.floor(point.z / cellSize)}`;
  atoms.forEach((atom, index) => {
    const key = cellKey(atom.sourcePosition);
    const bucket = cells.get(key);
    if (bucket) bucket.push(index);
    else cells.set(key, [index]);
  });
  atoms.forEach((left, leftIndex) => {
    const center = left.sourcePosition;
    const cx = Math.floor(center.x / cellSize);
    const cy = Math.floor(center.y / cellSize);
    const cz = Math.floor(center.z / cellSize);
    for (let x = cx - 1; x <= cx + 1; x += 1) for (let y = cy - 1; y <= cy + 1; y += 1) for (let z = cz - 1; z <= cz + 1; z += 1) {
      for (const rightIndex of cells.get(`${x}:${y}:${z}`) ?? []) {
        if (rightIndex <= leftIndex) continue;
        const right = atoms[rightIndex]!;
        if (left.chainId !== right.chainId || left.entityType === "ligand" || right.entityType === "ligand") continue;
        const leftRadius = atomVdwRadiusAngstrom[left.element.toUpperCase()] ?? 1.5;
        const rightRadius = atomVdwRadiusAngstrom[right.element.toUpperCase()] ?? 1.5;
        const distance = left.sourcePosition.distanceTo(right.sourcePosition);
        if (distance > 0.55 * (leftRadius + rightRadius) || distance < 0.45) continue;
        bonds.push({ id: `${left.id}-${right.id}`, left, right });
      }
    }
  });
  return bonds;
}

/** Presentation-only local cutaway; source Gaussian geometry remains unchanged. */
export function applyTranscriptionActiveSiteCutaway(geometry: THREE.BufferGeometry, cutaway: TranscriptionActiveSiteCutaway) {
  const position = geometry.getAttribute("position");
  const index = geometry.getIndex();
  if (!position || !index) return geometry;
  const kept: number[] = [];
  const point = (vertexIndex: number) => new THREE.Vector3().fromBufferAttribute(position, vertexIndex);
  for (let offset = 0; offset < index.count; offset += 3) {
    const a = index.getX(offset);
    const b = index.getX(offset + 1);
    const c = index.getX(offset + 2);
    const centroid = point(a).add(point(b)).add(point(c)).multiplyScalar(1 / 3);
    if (pointIsInsideTranscriptionCutaway(centroid, cutaway)) continue;
    kept.push(a, b, c);
  }
  if (kept.length === index.count) return geometry;
  const result = geometry.clone();
  result.setIndex(kept);
  result.computeBoundingSphere();
  return result;
}

/** Keeps only protein triangles inside the structure-derived active-site ROI. */
function restrictGeometryToBounds(geometry: THREE.BufferGeometry, bounds: THREE.Box3) {
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const color = geometry.getAttribute("color");
  const index = geometry.getIndex();
  if (!position || !normal || !index) return geometry;
  const kept: number[] = [];
  const point = (vertexIndex: number) => new THREE.Vector3().fromBufferAttribute(position, vertexIndex);
  for (let offset = 0; offset < index.count; offset += 3) {
    const a = index.getX(offset);
    const b = index.getX(offset + 1);
    const c = index.getX(offset + 2);
    const centroid = point(a).add(point(b)).add(point(c)).multiplyScalar(1 / 3);
    if (bounds.containsPoint(centroid)) kept.push(a, b, c);
  }
  if (kept.length === 0) return geometry;
  const remap = new Map<number, number>();
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const remapped: number[] = [];
  for (const sourceIndex of kept) {
    let targetIndex = remap.get(sourceIndex);
    if (targetIndex === undefined) {
      targetIndex = remap.size;
      remap.set(sourceIndex, targetIndex);
      positions.push(position.getX(sourceIndex), position.getY(sourceIndex), position.getZ(sourceIndex));
      normals.push(normal.getX(sourceIndex), normal.getY(sourceIndex), normal.getZ(sourceIndex));
      if (color) colors.push(color.getX(sourceIndex), color.getY(sourceIndex), color.getZ(sourceIndex));
    }
    remapped.push(targetIndex);
  }
  const result = new THREE.BufferGeometry();
  result.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  result.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  if (color) result.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  result.setIndex(remapped);
  result.computeBoundingSphere();
  return result;
}

/** Deposited coordinates are converted once into a cached computed Gaussian surface. */
export function BakedTranscriptionMolecularActor({ entry, scale, presentation, selectedTarget = "NONE", geometryMode = "DEPOSITED", onRoiReady }: Props) {
  const [geometry, setGeometry] = useState<StructureDerivedGeometry | null>(null);
  const [proteinGeometry, setProteinGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [nucleicGeometry, setNucleicGeometry] = useState<Array<{ chainId: string; entityType: DepositedNucleicBuffers["entityType"]; visual: DepositedNucleicBuffers["visual"]; geometry: THREE.BufferGeometry }>>([]);
  const [atomisticAtoms, setAtomisticAtoms] = useState<TranscriptionAtomVisual[]>([]);
  useEffect(() => {
    let active = true;
    void loadGroundedStructure(entry).then(async (result) => {
      const [gaussian, nucleic] = await Promise.all([generateGaussianProteinSurface(entry), generateDepositedNucleicGeometry(entry)]);
      const primaryNucleic = selectPrimaryDepositedNucleicGeometry(nucleic);
      const frame = structuralFrame(result.geometry);
      const sourceActiveCenter = frame ? frame.active.clone().add(new THREE.Vector3(...result.structure.centroid)) : gaussian.sourceActiveCenter;
      const proteinChainCenters = deriveProteinChainCenters(result.structure.atoms, entry.selectedChains.filter((chain) => entry.chainEntityTypes?.[chain] === "protein"));
      const transformed = transformGaussianBuffers({ ...gaussian, sourceActiveCenter }, frame, scale, proteinChainCenters);
      const transformedNucleic = transformDepositedNucleicBuffers(primaryNucleic, frame, sourceActiveCenter, scale);
      const transformedAtomistic = transformTranscriptionAtomisticDetail(result.structure.atoms, frame, sourceActiveCenter, scale);
      if (active) {
        setGeometry(result.geometry);
        setNucleicGeometry(transformedNucleic);
        setAtomisticAtoms(transformedAtomistic);
        if (transformed) {
          const roi = deriveTranscriptionActiveSiteRoi({
            proteinGeometry: transformed,
            nucleicGeometries: transformedNucleic.map((item) => ({ chainId: item.chainId, visual: item.visual, geometry: item.geometry })),
            scale,
            dnaChainIds: entry.selectedChains.filter((chain) => entry.chainEntityTypes?.[chain] === "dna"),
            rnaChainIds: entry.selectedChains.filter((chain) => entry.chainEntityTypes?.[chain] === "rna"),
            includeProteinContext: true,
          });
          const cutaway = deriveTranscriptionActiveSiteCutaway({ roi, scale });
          onRoiReady?.(roi);
          setProteinGeometry(applyTranscriptionActiveSiteCutaway(restrictGeometryToBounds(transformed, roi.bounds), cutaway));
        } else {
          setProteinGeometry(null);
        }
      }
    }).catch((error: unknown) => {
      console.error("[Scina] deposited transcription structure failed to mount", error);
      if (active) {
        setGeometry(null);
        setProteinGeometry(null);
        setNucleicGeometry([]);
        setAtomisticAtoms([]);
        onRoiReady?.(null);
      }
    });
    return () => { active = false; };
  }, [entry, onRoiReady, scale]);
  const baked = useMemo(() => {
    if (!geometry) return null;
    const frame = structuralFrame(geometry);
    if (!frame) return null;
    const upstream = geometry.anchors.find((candidate) => candidate.id === "upstream-dna")?.point;
    const downstream = geometry.anchors.find((candidate) => candidate.id === "downstream-dna")?.point;
    const dnaSpan = upstream && downstream ? upstream.distanceTo(downstream) * scale : 0.5;
    return { frame, translocationSpan: dnaSpan };
  }, [geometry, scale]);
  const hybridContactPoint = useMemo(() => deriveHybridContactPointFromAtoms(atomisticAtoms) ?? deriveHybridContactPoint(nucleicGeometry), [atomisticAtoms, nucleicGeometry]);
  const atomisticBonds = useMemo(() => deriveTranscriptionAtomisticBonds(atomisticAtoms), [atomisticAtoms]);
  if (!baked || !proteinGeometry) return null;
  const showRna = (presentation?.nascentRnaVisualLength ?? 0) > 0.05;
  const proteinLayer = transcriptionVisualLayer("COMPUTED_PROTEIN_ENVELOPE");
  const nucleicLayer = transcriptionVisualLayer("COMPUTED_NUCLEIC_RENDER");
  const depositedLayer = transcriptionVisualLayer("DEPOSITED_COORDINATES");
  const motionLayer = transcriptionVisualLayer("INFERRED_MOTION");
  return <group userData={{
    bakedSource: entry.structureId,
    bakedSourceFidelity: depositedLayer.fidelity,
    bakedFidelity: proteinLayer.fidelity,
    bakedFrame: "M1-active-site",
    gaussianResolution: 3.2,
    gaussianSmoothness: 1.8,
    bakedNucleicChains: `${entry.structureId}:${entry.selectedChains.filter((chain) => ["dna", "rna"].includes(entry.chainEntityTypes?.[chain] ?? "")).join(",")}`,
    bakedNucleicRepresentation: `molstar-${PRIMARY_TRANSCRIPTION_NUCLEIC_VISUAL}-primary`,
    bakedNucleicFidelity: nucleicLayer.fidelity,
    motionSource: `${entry.structureId}_${motionLayer.label.toUpperCase().replaceAll(" ", "_")}`,
  }}>
    <KinematicPolymerase geometry={proteinGeometry} span={baked.translocationSpan} presentation={presentation} selectedTarget={selectedTarget} geometryMode={geometryMode} />
    <ActiveCenterMarker selected={selectedTarget === "MG"} />
    <HybridContactMarker point={hybridContactPoint} selected={selectedTarget === "HYBRID"} />
    <TranscriptionAtomisticDetail atoms={atomisticAtoms} bonds={atomisticBonds} presentation={presentation} selectedTarget={selectedTarget} />
    <group>
      {nucleicGeometry.map((entry) => <DepositedNucleicMesh key={`${entry.chainId}:${entry.visual}`} entry={entry} visible={entry.entityType !== "rna" || showRna} selectedTarget={selectedTarget} />)}
    </group>
  </group>;
}

function ActiveCenterMarker({ selected }: { selected: boolean }) {
  const opacity = selected ? 1 : 0.88;
  return <group position={[0, 0, 0]} renderOrder={8} userData={{ sourceChain: "R", sourceRole: "active-center-magnesium", sourceFidelity: transcriptionVisualLayer("DEPOSITED_COORDINATES").fidelity }}>
    <mesh>
      <sphereGeometry args={[selected ? 0.062 : 0.052, 20, 14]} />
      <meshBasicMaterial color="#e1ae4a" transparent opacity={opacity} depthTest={false} depthWrite={false} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[selected ? 0.105 : 0.085, 0.008, 8, 32]} />
      <meshBasicMaterial color="#f3c76c" transparent opacity={selected ? 0.82 : 0.52} depthTest={false} depthWrite={false} />
    </mesh>
  </group>;
}

function deriveHybridContactPoint(entries: readonly { entityType: DepositedNucleicBuffers["entityType"]; geometry: THREE.BufferGeometry }[]) {
  const dna = entries.filter((entry) => entry.entityType === "dna").flatMap((entry) => {
    const position = entry.geometry.getAttribute("position");
    return position ? Array.from({ length: position.count }, (_, index) => new THREE.Vector3().fromBufferAttribute(position, index)) : [];
  });
  const rna = entries.filter((entry) => entry.entityType === "rna").flatMap((entry) => {
    const position = entry.geometry.getAttribute("position");
    return position ? Array.from({ length: position.count }, (_, index) => new THREE.Vector3().fromBufferAttribute(position, index)) : [];
  });
  if (dna.length === 0 || rna.length === 0) return null;
  let closestDistance = Number.POSITIVE_INFINITY;
  let closestDna = dna[0]!;
  let closestRna = rna[0]!;
  for (const dnaPoint of dna) for (const rnaPoint of rna) {
    const distance = dnaPoint.distanceToSquared(rnaPoint);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestDna = dnaPoint;
      closestRna = rnaPoint;
    }
  }
  return closestDna.clone().add(closestRna).multiplyScalar(0.5);
}

/** Prefer the source-bounded atomistic hybrid window over a whole-trace contact. */
function deriveHybridContactPointFromAtoms(atoms: readonly TranscriptionAtomVisual[]) {
  const dna = atoms.filter((atom) => atom.entityType === "dna");
  const rna = atoms.filter((atom) => atom.entityType === "rna");
  if (dna.length === 0 || rna.length === 0) return null;
  let closestDistance = Number.POSITIVE_INFINITY;
  let closestDna = dna[0]!;
  let closestRna = rna[0]!;
  for (const dnaAtom of dna) for (const rnaAtom of rna) {
    const distance = dnaAtom.sourcePosition.distanceToSquared(rnaAtom.sourcePosition);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestDna = dnaAtom;
      closestRna = rnaAtom;
    }
  }
  return closestDna.position.clone().add(closestRna.position).multiplyScalar(0.5);
}

function HybridContactMarker({ point, selected }: { point: THREE.Vector3 | null; selected: boolean }) {
  if (!point) return null;
  return <group position={point.toArray()} renderOrder={7} userData={{ sourceRole: "deposited-hybrid-contact-window", sourceSelectors: "5FLM:O:7-20+N:7-20", sourceFidelity: transcriptionVisualLayer("DEPOSITED_COORDINATES").fidelity }}>
    <mesh>
      <sphereGeometry args={[selected ? 0.052 : 0.04, 16, 10]} />
      <meshBasicMaterial color="#54d7c2" transparent opacity={selected ? 1 : 0.82} depthTest={false} depthWrite={false} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[selected ? 0.085 : 0.065, 0.006, 8, 28]} />
      <meshBasicMaterial color="#8af2df" transparent opacity={selected ? 0.75 : 0.42} depthTest={false} depthWrite={false} />
    </mesh>
  </group>;
}

function transcriptionAtomColor(element: string) {
  if (element.toUpperCase() === "MG") return "#e1ae4a";
  return ({ C: "#b8b3aa", N: "#6f9fc3", O: "#c97d72", P: "#d0aa68", S: "#d4bd63" } as Record<string, string>)[element.toUpperCase()] ?? "#c5c8c5";
}

function transcriptionProteinChainColor(chainId: string) {
  return transcriptionProteinChainPalette[chainId] ?? "#87979b";
}

function AtomisticBond({ left, right, opacity }: { left: TranscriptionAtomVisual; right: TranscriptionAtomVisual; opacity: number }) {
  const midpoint = left.position.clone().add(right.position).multiplyScalar(0.5);
  const direction = right.position.clone().sub(left.position);
  return <mesh position={midpoint} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize())}>
    <cylinderGeometry args={[0.0045, 0.0045, direction.length(), 8]} />
      <meshStandardMaterial color="#526d76" transparent opacity={opacity} roughness={0.5} depthTest />
  </mesh>;
}

function TranscriptionAtomisticDetail({ atoms, bonds, presentation, selectedTarget }: { atoms: readonly TranscriptionAtomVisual[]; bonds: readonly TranscriptionBondVisual[]; presentation?: TranscriptionPresentationStateV1; selectedTarget: ExpertTranscriptionTarget }) {
  const rnaMaxResidue = 7 + Math.floor(presentation?.nascentRnaVisualLength ?? 0) - 1;
  const visibleAtoms = atoms.filter((atom) => atom.entityType !== "rna" || atom.residueSequence <= rnaMaxResidue);
  const visibleIds = new Set(visibleAtoms.map((atom) => atom.id));
  const visibleBonds = bonds.filter((bond) => visibleIds.has(bond.left.id) && visibleIds.has(bond.right.id));
  const targetMatches = (atom: TranscriptionAtomVisual) => selectedTarget === "NONE"
    || (selectedTarget === "DNA" && atom.entityType === "dna")
    || (selectedTarget === "RNA" && atom.entityType === "rna")
    || (selectedTarget === "HYBRID" && (atom.entityType === "dna" || atom.entityType === "rna"))
    || (selectedTarget === "MG" && atom.entityType === "ligand")
    || (selectedTarget === "POL_II" && atom.entityType === "protein");
  return <group userData={{ representation: "BALL_AND_STICK", sourceFidelity: "C0_COMPUTED_FROM_DEPOSITED_ATOMS", scope: "LOCAL_ACTIVE_SITE" }}>
    {visibleBonds.map((bond) => <AtomisticBond key={bond.id} left={bond.left} right={bond.right} opacity={targetMatches(bond.left) || targetMatches(bond.right) ? 0.78 : 0.22} />)}
    {visibleAtoms.map((atom) => {
      const active = targetMatches(atom);
      const radius = atomVdwRadiusAngstrom[atom.element.toUpperCase()] ? atomVdwRadiusAngstrom[atom.element.toUpperCase()]! * 0.01 * 0.72 : 0.011;
      const color = atom.entityType === "protein" ? transcriptionProteinChainColor(atom.chainId) : transcriptionAtomColor(atom.element);
      return <mesh key={atom.id} position={atom.position} userData={{ sourceChain: atom.chainId, sourceResidue: `${atom.residueName}:${atom.residueSequence}` }}>
        <sphereGeometry args={[radius * (active ? 1.15 : 0.92), 14, 12]} />
        <meshStandardMaterial color={color} transparent opacity={active ? 0.98 : 0.2} roughness={0.38} depthTest emissive={active && selectedTarget !== "NONE" ? color : "#000000"} emissiveIntensity={active && selectedTarget !== "NONE" ? 0.16 : 0} />
      </mesh>;
    })}
  </group>;
}

function KinematicPolymerase({ geometry, span, presentation, selectedTarget, geometryMode }: { geometry: THREE.BufferGeometry; span: number; presentation?: TranscriptionPresentationStateV1; selectedTarget: ExpertTranscriptionTarget; geometryMode: ExpertTranscriptionGeometryMode }) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((_state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const genePosition = presentation?.polymeraseGenePosition ?? 0.68;
    const target = geometryMode === "DERIVED" ? (genePosition - 0.68) * span : 0;
    group.position.x = THREE.MathUtils.damp(group.position.x, target, 8, delta);
    const engaged = presentation?.polymeraseEngagement ?? 1;
    const release = presentation?.transcriptReleaseProgress ?? 0;
    if (materialRef.current) materialRef.current.opacity = (0.32 + engaged * 0.16 - release * 0.08) * (selectedTarget === "NONE" || selectedTarget === "POL_II" ? 1 : 0.48);
  });
  return <group ref={groupRef} userData={{ actor: "POLYMERASE", motion: geometryMode === "DERIVED" ? "DNA_AXIS_TRANSLOCATION" : "STATIC_DEPOSITED_FRAME", motionFidelity: transcriptionVisualLayer("INFERRED_MOTION").fidelity, surfaceColorSource: "DEPOSITED_POL_II_CHAIN_ID", surfaceColorLimitation: "Chain-derived palette; not an experimental domain annotation.", visibility: "HIDDEN_TO_REVEAL_DEPOSITED_DNA_RNA" }}>
    <mesh geometry={geometry} visible frustumCulled={false}>
      <meshStandardMaterial ref={materialRef} vertexColors color="#ffffff" roughness={0.62} metalness={0.01} transparent opacity={0.52} depthWrite={false} depthTest emissive="#10282f" emissiveIntensity={0.1} />
    </mesh>
  </group>;
}

function DepositedNucleicMesh({ entry, visible, selectedTarget }: { entry: { chainId: string; entityType: DepositedNucleicBuffers["entityType"]; visual: DepositedNucleicBuffers["visual"]; geometry: THREE.BufferGeometry }; visible: boolean; selectedTarget: ExpertTranscriptionTarget }) {
  const color = entry.entityType === "rna" ? "#42b889" : "#d66f78";
  const renderOrder = entry.visual === "polymer-trace" ? 3 : entry.visual === "nucleotide-ring" ? 4 : 5;
  const baseOpacity = entry.visual === "polymer-trace" ? 0.98 : entry.visual === "nucleotide-ring" ? 0.7 : 0.96;
  const selected = selectedTarget === "NONE" || (selectedTarget === "DNA" && entry.entityType === "dna") || (selectedTarget === "RNA" && entry.entityType === "rna") || (selectedTarget === "HYBRID");
  const opacity = baseOpacity * (selected ? 1 : 0.32);
  return <mesh geometry={entry.geometry} renderOrder={renderOrder} visible={visible} userData={{ sourceChain: entry.chainId, sourceRepresentation: entry.visual, sourceFidelity: transcriptionVisualLayer("COMPUTED_NUCLEIC_RENDER").fidelity }}>
    <meshStandardMaterial color={color} roughness={0.5} metalness={0.01} transparent opacity={opacity} depthWrite={false} depthTest emissive={color} emissiveIntensity={0.1} />
  </mesh>;
}

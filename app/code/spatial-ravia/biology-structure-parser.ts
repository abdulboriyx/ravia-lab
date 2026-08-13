import * as THREE from "three";
import {
  StructureGroundingError,
  type MolecularAtom,
  type MolecularChain,
  type MolecularResidue,
  type NormalizedMolecularStructure,
  type ResolvedStructureAnchor,
  type StructureAnchorDefinition,
  type StructureDerivedGeometry,
  type StructureManifestEntry,
} from "./biology-structure-grounding.ts";

const PROTEIN_RESIDUES = new Set([
  "ALA","ARG","ASN","ASP","CYS","GLN","GLU","GLY","HIS","ILE","LEU","LYS","MET",
  "PHE","PRO","SER","THR","TRP","TYR","VAL","SEC","PYL","MSE"
]);
const DNA_RESIDUES = new Set(["DA","DC","DG","DT","DI","DU","A","C","G","T"]);
const RNA_RESIDUES = new Set(["A","C","G","U","I","RA","RC","RG","RU"]);

function classifyResidue(name: string): MolecularAtom["entityType"] {
  const residue = name.trim().toUpperCase();
  if (PROTEIN_RESIDUES.has(residue)) return "protein";
  if (DNA_RESIDUES.has(residue)) return "dna";
  if (RNA_RESIDUES.has(residue)) return "rna";
  if (residue.length > 0 && residue.length <= 3) return "ligand";
  return "other";
}

function centroidOfVectors(points: THREE.Vector3[]) {
  if (points.length === 0) return new THREE.Vector3(0, 0, 0);
  const sum = new THREE.Vector3();
  for (const point of points) sum.add(point);
  return sum.multiplyScalar(1 / points.length);
}

function boundsOfVectors(points: THREE.Vector3[]) {
  const min = new THREE.Vector3(Infinity, Infinity, Infinity);
  const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  for (const point of points) {
    min.min(point);
    max.max(point);
  }
  if (!points.length) {
    min.set(0, 0, 0);
    max.set(0, 0, 0);
  }
  return { min, max };
}

function tuple(vector: THREE.Vector3): [number, number, number] {
  return [vector.x, vector.y, vector.z];
}

function parsePdbAtomLine(line: string): MolecularAtom | null {
  const record = line.slice(0, 6).trim();
  if (record !== "ATOM" && record !== "HETATM") return null;
  const residueName = line.slice(17, 20).trim();
  const chainId = line.slice(21, 22).trim() || "_";
  const atomName = line.slice(12, 16).trim();
  const serial = Number.parseInt(line.slice(6, 11).trim(), 10);
  const residueSequence = Number.parseInt(line.slice(22, 26).trim(), 10);
  const residueInsertionCode = line.slice(26, 27).trim();
  const x = Number.parseFloat(line.slice(30, 38).trim());
  const y = Number.parseFloat(line.slice(38, 46).trim());
  const z = Number.parseFloat(line.slice(46, 54).trim());
  const occupancy = Number.parseFloat(line.slice(54, 60).trim());
  const bFactor = Number.parseFloat(line.slice(60, 66).trim());
  const element = (line.slice(76, 78).trim() || atomName[0] || "X").toUpperCase();
  if (![x, y, z].every(Number.isFinite)) {
    throw new StructureGroundingError("parse-failed", `Invalid PDB coordinates in line: ${line}`);
  }
  return {
    serial: Number.isFinite(serial) ? serial : 0,
    atomName,
    residueName,
    residueSequence,
    residueInsertionCode,
    chainId,
    entityType: classifyResidue(residueName),
    element,
    x,
    y,
    z,
    occupancy: Number.isFinite(occupancy) ? occupancy : undefined,
    bFactor: Number.isFinite(bFactor) ? bFactor : undefined,
  };
}

export function normalizeMolecularAtoms(options: {
  structureId: string;
  source: StructureManifestEntry["provider"];
  format: "pdb" | "mmcif";
  text: string;
  title?: string;
  organism?: string;
  assemblyId?: string;
  atoms: MolecularAtom[];
  entities?: NormalizedMolecularStructure["entities"];
  assemblies?: NormalizedMolecularStructure["assemblies"];
}): NormalizedMolecularStructure {
  const { atoms } = options;

  if (atoms.length === 0) {
    throw new StructureGroundingError("parse-failed", `No atom coordinates parsed from ${options.structureId}`);
  }

  const residues = new Map<string, MolecularResidue>();
  const chains = new Map<string, MolecularChain>();
  const points = atoms.map((atom) => new THREE.Vector3(atom.x, atom.y, atom.z));

  for (const atom of atoms) {
    const residueKey = `${atom.chainId}:${atom.residueSequence}:${atom.residueInsertionCode}:${atom.residueName}`;
    const residue = residues.get(residueKey) ?? {
      key: residueKey,
      residueName: atom.residueName,
      residueSequence: atom.residueSequence,
      labelSeqId: atom.labelSeqId,
      authSeqId: atom.authSeqId,
      labelAsymId: atom.labelAsymId,
      authAsymId: atom.authAsymId,
      entityId: atom.entityId,
      residueInsertionCode: atom.residueInsertionCode,
      chainId: atom.chainId,
      entityType: atom.entityType,
      atoms: [],
      centroid: [0, 0, 0],
    };
    residue.atoms.push(atom);
    residues.set(residueKey, residue);
  }

  for (const residue of residues.values()) {
    const residueCenter = centroidOfVectors(
      residue.atoms.map((atom) => new THREE.Vector3(atom.x, atom.y, atom.z))
    );
    residue.centroid = tuple(residueCenter);
    const chain = chains.get(residue.chainId) ?? {
      id: residue.chainId,
      labelAsymId: residue.atoms[0]?.labelAsymId,
      authAsymId: residue.atoms[0]?.authAsymId,
      entityId: residue.atoms[0]?.entityId,
      polymerTypeRaw: options.entities?.find((entity) => entity.entityId === residue.atoms[0]?.entityId)?.polymerTypeRaw,
      sourceChainId: residue.atoms[0]?.sourceChainId,
      assemblyId: residue.atoms[0]?.assemblyId,
      operatorId: residue.atoms[0]?.operatorId,
      entityType: residue.entityType,
      residues: [],
      atoms: [],
      centroid: [0, 0, 0],
      bounds: { min: [0, 0, 0], max: [0, 0, 0] },
    };
    chain.residues.push(residue);
    chain.atoms.push(...residue.atoms);
    chains.set(residue.chainId, chain);
  }

  for (const chain of chains.values()) {
    chain.residues.sort((a, b) => a.residueSequence - b.residueSequence);
    const chainPoints = chain.atoms.map((atom) => new THREE.Vector3(atom.x, atom.y, atom.z));
    const center = centroidOfVectors(chainPoints);
    const bounds = boundsOfVectors(chainPoints);
    chain.centroid = tuple(center);
    chain.bounds = { min: tuple(bounds.min), max: tuple(bounds.max) };
  }

  const bounds = boundsOfVectors(points);
  return {
    structureId: options.structureId,
    source: options.source,
    format: options.format,
    title: options.title,
    organism: options.organism,
    assemblyId: options.assemblyId,
    atoms,
    entities: options.entities,
    assemblies: options.assemblies,
    chains: Array.from(chains.values()).sort((a, b) => a.id.localeCompare(b.id)),
    centroid: tuple(centroidOfVectors(points)),
    bounds: { min: tuple(bounds.min), max: tuple(bounds.max) },
  };
}

export function parseMolecularStructure(options: {
  structureId: string; source: StructureManifestEntry["provider"]; format: "pdb" | "mmcif"; text: string; title?: string; organism?: string; assemblyId?: string;
}): NormalizedMolecularStructure {
  if (options.format === "mmcif") throw new StructureGroundingError("mmcif-parse-failed", "Use parseMolecularStructureAsync for mmCIF.");
  return normalizeMolecularAtoms({ ...options, atoms: options.text.split(/\r?\n/).map(parsePdbAtomLine).filter((value): value is MolecularAtom => value !== null) });
}

export async function parseMolecularStructureAsync(options: {
  structureId: string; source: StructureManifestEntry["provider"]; format: "pdb" | "mmcif"; text: string; title?: string; organism?: string; assemblyId?: string;
}) {
  if (options.format === "pdb") return parseMolecularStructure(options);
  const { parseMmcifWithMolstar } = await import("./biology-structure-mmcif.ts");
  const parsed = await parseMmcifWithMolstar(options);
  return normalizeMolecularAtoms({ ...options, atoms: parsed.atoms, entities: parsed.entities, assemblies: parsed.assemblies });
}

export function expandStructureAssembly(structure: NormalizedMolecularStructure, assemblyId: string): NormalizedMolecularStructure {
  const assembly = structure.assemblies?.find((candidate) => candidate.assemblyId === assemblyId);
  if (!assembly) throw new StructureGroundingError("assembly-not-found", `${structure.structureId}: assembly ${assemblyId}`);
  const atoms: MolecularAtom[] = [];
  for (const labelAsymId of assembly.sourceLabelAsymIds) {
    const source = structure.chains.find((chain) => chain.labelAsymId === labelAsymId);
    if (!source) throw new StructureGroundingError("assembly-membership-chain-not-found", `${structure.structureId}: ${labelAsymId}`);
    for (const operator of assembly.operators) {
      if (operator.matrix.length !== 16 || !operator.matrix.every(Number.isFinite)) throw new StructureGroundingError("assembly-operator-invalid", `${assemblyId}: ${operator.operatorId}`);
      const m = operator.matrix; const instanceId = `${source.id}::assembly:${assemblyId}::op:${operator.operatorId}`;
      for (const atom of source.atoms) atoms.push({ ...atom, chainId: instanceId, sourceChainId: source.id, assemblyId, operatorId: operator.operatorId, x: m[0] * atom.x + m[4] * atom.y + m[8] * atom.z + m[12], y: m[1] * atom.x + m[5] * atom.y + m[9] * atom.z + m[13], z: m[2] * atom.x + m[6] * atom.y + m[10] * atom.z + m[14] });
    }
  }
  return normalizeMolecularAtoms({ structureId: structure.structureId, source: structure.source, format: structure.format, text: "", title: structure.title, organism: structure.organism, assemblyId, atoms, entities: structure.entities, assemblies: structure.assemblies });
}

export function selectStructureChains(
  structure: NormalizedMolecularStructure,
  selectedChains: string[]
): NormalizedMolecularStructure {
  const chains = structure.chains.filter((chain) => selectedChains.includes(chain.id));
  if (chains.length !== selectedChains.length) {
    const missing = selectedChains.filter((chainId) => !chains.some((chain) => chain.id === chainId));
    throw new StructureGroundingError("chain-not-found", `Missing requested chains: ${missing.join(", ")}`);
  }
  const atoms = chains.flatMap((chain) => chain.atoms);
  const points = atoms.map((atom) => new THREE.Vector3(atom.x, atom.y, atom.z));
  const bounds = boundsOfVectors(points);
  return {
    ...structure,
    atoms,
    chains,
    centroid: tuple(centroidOfVectors(points)),
    bounds: { min: tuple(bounds.min), max: tuple(bounds.max) },
  };
}

export function resolveStructureChain(structure: NormalizedMolecularStructure, reference: import("./biology-structure-grounding.ts").ChainReference) {
  const matches = structure.chains.filter((chain) => reference.namespace === "normalized" ? chain.id === reference.id : reference.namespace === "label" ? chain.labelAsymId === reference.id : chain.authAsymId === reference.id);
  if (!matches.length) throw new StructureGroundingError("chain-not-found", `No ${reference.namespace} chain ${reference.id}`);
  if (matches.length > 1) throw new StructureGroundingError("ambiguous-chain-reference", `Ambiguous ${reference.namespace} chain ${reference.id}`);
  return matches[0];
}

export function resolveStructureEntity(structure: NormalizedMolecularStructure, entityId: string) {
  const entity = structure.entities?.find((candidate) => candidate.entityId === entityId);
  if (!entity) throw new StructureGroundingError("entity-not-found", `No entity ${entityId}`);
  return entity;
}

export function getStructureEntityChains(structure: NormalizedMolecularStructure, entityId: string) {
  resolveStructureEntity(structure, entityId);
  return structure.chains.filter((chain) => chain.entityId === entityId);
}

export function applyCuratedChainEntityTypes(
  structure: NormalizedMolecularStructure,
  chainEntityTypes: Record<string, MolecularAtom["entityType"]> | undefined
): NormalizedMolecularStructure {
  if (!chainEntityTypes) return structure;
  const chains = structure.chains.map((chain) => {
    const entityType = chainEntityTypes[chain.id] ?? chain.entityType;
    const atoms = chain.atoms.map((atom) => ({ ...atom, entityType }));
    const atomBySerial = new Map(atoms.map((atom) => [atom.serial, atom]));
    return {
      ...chain,
      entityType,
      atoms,
      residues: chain.residues.map((residue) => ({
        ...residue,
        entityType,
        atoms: residue.atoms.map((atom) => atomBySerial.get(atom.serial) ?? atom),
      })),
    };
  });
  return { ...structure, chains, atoms: chains.flatMap((chain) => chain.atoms) };
}

export function derivePrincipalAxis(points: THREE.Vector3[]) {
  const center = centroidOfVectors(points);
  if (points.length < 2) {
    return { center, axis: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, 1, 0) };
  }
  // Power iteration on the coordinate covariance matrix: stable, coordinate-derived,
  // and deliberately lightweight compared with a full molecular-analysis package.
  const covariance = new THREE.Matrix3();
  const values = covariance.elements;
  for (const point of points) {
    const delta = point.clone().sub(center);
    values[0] += delta.x * delta.x; values[1] += delta.x * delta.y; values[2] += delta.x * delta.z;
    values[3] += delta.y * delta.x; values[4] += delta.y * delta.y; values[5] += delta.y * delta.z;
    values[6] += delta.z * delta.x; values[7] += delta.z * delta.y; values[8] += delta.z * delta.z;
  }
  let axis = new THREE.Vector3(1, 0.5, 0.25).normalize();
  for (let index = 0; index < 16; index += 1) {
    const next = axis.clone().applyMatrix3(covariance);
    if (next.lengthSq() < 1e-12) break;
    axis = next.normalize();
  }
  // Eigenvectors are sign-ambiguous. Pick a reproducible hemisphere to prevent animation flips.
  const dominant = Math.abs(axis.x) >= Math.abs(axis.y) && Math.abs(axis.x) >= Math.abs(axis.z) ? axis.x
    : Math.abs(axis.y) >= Math.abs(axis.z) ? axis.y : axis.z;
  if (dominant < 0) axis.negate();
  const upHint = Math.abs(axis.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(axis, upHint).normalize();
  const up = new THREE.Vector3().crossVectors(right, axis).normalize();
  return { center, axis, up };
}

export function extractNucleicTrace(chain: MolecularChain) {
  const points: THREE.Vector3[] = [];
  for (const residue of chain.residues) {
    const phosphate = residue.atoms.find((atom) => atom.atomName.trim() === "P");
    const selected = phosphate
      ? new THREE.Vector3(phosphate.x, phosphate.y, phosphate.z)
      : new THREE.Vector3(...residue.centroid);
    points.push(selected);
  }
  return points;
}

function resolveAnchor(
  structure: NormalizedMolecularStructure,
  definition: StructureAnchorDefinition
): ResolvedStructureAnchor {
  if (definition.kind === "chain-centroid") {
    const chains = structure.chains.filter((chain) => definition.chainIds.includes(chain.id));
    if (!chains.length) {
      throw new StructureGroundingError("anchor-resolution-failed", `No chains found for anchor ${definition.id}`);
    }
    const points = chains.map((chain) => new THREE.Vector3(...chain.centroid));
    const point = centroidOfVectors(points);
    const axis = derivePrincipalAxis(chains.flatMap((chain) => chain.residues.map((residue) => new THREE.Vector3(...residue.centroid)))).axis;
    return { id: definition.id, point, direction: axis };
  }

  if (definition.kind === "residue-range-centroid") {
    const chain = structure.chains.find((candidate) => candidate.id === definition.chainId);
    const residues = chain?.residues.filter(
      (residue) => residue.residueSequence >= definition.startResidue && residue.residueSequence <= definition.endResidue
    ) ?? [];
    if (!residues.length) {
      throw new StructureGroundingError("anchor-resolution-failed", `No residues found for anchor ${definition.id}`);
    }
    const points = residues.map((residue) => new THREE.Vector3(...residue.centroid));
    const point = centroidOfVectors(points);
    const direction = derivePrincipalAxis(points).axis;
    return { id: definition.id, point, direction };
  }

  if (definition.kind === "atom-centroid") {
    const chain = structure.chains.find((candidate) => candidate.id === definition.chainId);
    const atoms = chain?.atoms.filter((atom) => {
      if (definition.residueSequence !== undefined && atom.residueSequence !== definition.residueSequence) return false;
      if (definition.atomNames && !definition.atomNames.includes(atom.atomName.trim())) return false;
      return true;
    }) ?? [];
    if (!atoms.length) {
      throw new StructureGroundingError("anchor-resolution-failed", `No atoms found for anchor ${definition.id}`);
    }
    const points = atoms.map((atom) => new THREE.Vector3(atom.x, atom.y, atom.z));
    const point = centroidOfVectors(points);
    const direction = derivePrincipalAxis(points).axis;
    return { id: definition.id, point, direction };
  }

  const chain = structure.chains.find((candidate) => candidate.id === definition.chainId);
  if (!chain) {
    throw new StructureGroundingError("anchor-resolution-failed", `No chain found for anchor ${definition.id}`);
  }
  const trace = extractNucleicTrace(chain);
  if (trace.length < 2) {
    throw new StructureGroundingError("anchor-resolution-failed", `Insufficient nucleic trace for ${definition.id}`);
  }
  const window = Math.max(1, definition.sampleWindow ?? 2);
  const index =
    definition.at === "start" ? 0 :
    definition.at === "end" ? trace.length - 1 :
    Math.floor(trace.length / 2);
  const from = trace[Math.max(0, index - window)];
  const to = trace[Math.min(trace.length - 1, index + window)];
  const point = trace[index].clone();
  // Short deposited oligonucleotide fragments can repeat their selected
  // phosphate/centroid coordinate at a trace end. Never normalize a zero
  // vector here: that produces NaNs which later crash structure alignment.
  const localAxis = to.clone().sub(from);
  const direction = Number.isFinite(localAxis.lengthSq()) && localAxis.lengthSq() >= 1e-12
    ? localAxis.normalize()
    : derivePrincipalAxis(trace).axis;
  return { id: definition.id, point, direction };
}

export function resolveStructureAnchors(
  structure: NormalizedMolecularStructure,
  definitions: StructureAnchorDefinition[]
) {
  return definitions.map((definition) => resolveAnchor(structure, definition));
}

export function deriveStructureGeometry(
  structure: NormalizedMolecularStructure,
  manifest: Pick<StructureManifestEntry, "coarseGrainStride" | "anchors">
): StructureDerivedGeometry {
  const residuePoints: StructureDerivedGeometry["residuePoints"] = [];
  const tracePaths: StructureDerivedGeometry["tracePaths"] = [];
  const localOrigin = new THREE.Vector3(...structure.centroid);
  const resolvedAnchors = resolveStructureAnchors(structure, manifest.anchors);

  for (const chain of structure.chains) {
    const stride = Math.max(1, manifest.coarseGrainStride);
    for (let index = 0; index < chain.residues.length; index += stride) {
      const residue = chain.residues[index];
      residuePoints.push({
        position: new THREE.Vector3(...residue.centroid).sub(localOrigin),
        chainId: chain.id,
        entityType: chain.entityType,
      });
    }
    if (chain.entityType === "dna" || chain.entityType === "rna") {
      tracePaths.push({
        chainId: chain.id,
        entityType: chain.entityType,
        points: extractNucleicTrace(chain).map((point) => point.sub(localOrigin)),
      });
    }
  }

  const bounds = {
    min: new THREE.Vector3(...structure.bounds.min).sub(localOrigin),
    max: new THREE.Vector3(...structure.bounds.max).sub(localOrigin),
  };
  return {
    residuePoints,
    tracePaths,
    anchors: resolvedAnchors.map((anchor) => ({
      ...anchor,
      point: anchor.point.sub(localOrigin),
    })),
    centroid: new THREE.Vector3(),
    bounds,
  };
}

export function alignStructureToMechanism(options: {
  sourceAnchor: ResolvedStructureAnchor;
  targetAnchor: THREE.Vector3;
  sourceDirection: THREE.Vector3;
  targetDirection: THREE.Vector3;
  scale?: number;
}) {
  const scale = options.scale ?? 1;
  if (
    !Number.isFinite(scale) || scale <= 0 ||
    options.sourceDirection.lengthSq() < 1e-12 ||
    options.targetDirection.lengthSq() < 1e-12 ||
    ![options.sourceAnchor.point, options.targetAnchor, options.sourceDirection, options.targetDirection]
      .every((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z))
  ) {
    throw new StructureGroundingError("anchor-resolution-failed", "Structure alignment inputs are not finite.");
  }
  const from = options.sourceDirection.clone().normalize();
  const to = options.targetDirection.clone().normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(from, to).normalize();
  const rotatedAnchor = options.sourceAnchor.point.clone().multiplyScalar(scale).applyQuaternion(quaternion);
  const position = options.targetAnchor.clone().sub(rotatedAnchor);
  return { position, quaternion, scale };
}

import type { StructureDerivedGeometry, StructureManifestEntry } from "./biology-structure-grounding.ts";
import { resolveTranscriptionStructureGrounding } from "./biology-transcription-structure-grounding.ts";
import { resolveEukaryoticPolIIAssetManifest } from "./eukaryotic-pol-ii-asset-selection.ts";

export type StructuralVector3 = readonly [number, number, number];
export type StructuralActorKind = "DNA" | "POLYMERASE" | "RNA" | "RNA_DNA_HYBRID";
export type PolymeraseClass = "BACTERIAL_RNAP" | "EUKARYOTIC_POL_II";
export type StructuralSourceType = "depositedStructure" | "computedStructure" | "constrainedSchematic" | "schematic";

export type StructuralResidueSelector = {
  structureId: string;
  chainId: string;
  residueRange?: { start: number; end: number };
  residueIds?: readonly number[];
  atomNames?: readonly string[];
};

export type StructuralActor = {
  actorKind: StructuralActorKind;
  actorId: string;
  sourceId: string;
  sourceType: StructuralSourceType;
  selectors: readonly StructuralResidueSelector[];
  bounds?: { min: StructuralVector3; max: StructuralVector3 };
  structuralUnits: "angstrom";
};

export type TranscriptionStructuralActorPackage = {
  schemaVersion: "1";
  packageId: string;
  source: {
    sourceId: string;
    structureId: string;
    sourceType: StructuralSourceType;
    organism: string;
    polymeraseClass: PolymeraseClass;
    modelId: string;
    assemblyId: string;
    provider: string;
    accession: string;
    fidelity: "E0_DEPOSITED";
    coordinateUnits: "angstrom";
    citation: string;
    license: string;
  };
  actors: {
    dna: StructuralActor;
    polymerase: StructuralActor;
    rna: StructuralActor;
    hybrid: StructuralActor;
    promoter: {
      actorId: string;
      anchoredToActorId: string;
      sourceSelector?: StructuralResidueSelector;
      semanticOnly: boolean;
    };
  };
  selectors: {
    dnaChains: readonly string[];
    rnaChain: string;
    polymeraseChains: readonly string[];
    hybrid: {
      dna: readonly StructuralResidueSelector[];
      rna: readonly StructuralResidueSelector[];
      selectionBasis: "source-bounded-window";
    };
  };
};

export type TranscriptionActiveSiteFrame = {
  schemaVersion: "1";
  frameId: string;
  sourceId: string;
  coordinateUnits: "angstrom";
  origin: StructuralVector3;
  dnaAxis: StructuralVector3;
  normal: StructuralVector3;
  binormal: StructuralVector3;
  activeCenter: StructuralVector3;
  upstreamDna: StructuralVector3;
  downstreamDna: StructuralVector3;
  rnaExit: StructuralVector3 | null;
  rnaExitDirection: StructuralVector3 | null;
  hybridWindow: {
    dnaSelectors: readonly StructuralResidueSelector[];
    rnaSelectors: readonly StructuralResidueSelector[];
    basis: "source-bounded-window";
  };
};

export type StructuralScalePolicy = {
  schemaVersion: "1";
  coordinateUnits: "angstrom";
  sceneUnits: "structural-scene-unit";
  angstromToScene: number;
  rationale: string;
};

/** One conversion for all future grounded transcription actors. */
export const transcriptionStructuralScalePolicy: StructuralScalePolicy = {
  schemaVersion: "1",
  coordinateUnits: "angstrom",
  sceneUnits: "structural-scene-unit",
  angstromToScene: 0.01,
  rationale: "100 angstroms map to one structural scene unit; camera/ROI may zoom, actors do not receive independent scales.",
};

export type StructuralRigidTransform = {
  sourceOrigin: StructuralVector3;
  sourceAxis: StructuralVector3;
  sourceNormal: StructuralVector3;
  sourceBinormal: StructuralVector3;
  targetOrigin: StructuralVector3;
  targetAxis: StructuralVector3;
  targetNormal: StructuralVector3;
  targetBinormal: StructuralVector3;
  scale: number;
};

export type LegacyTranscriptionCoordinateClassification = {
  name: string;
  classification: "PRESENTATION_ONLY" | "TEMPORARY_LEGACY" | "MUST_BE_REPLACED_BY_STRUCTURAL_FRAME";
  migrationDestination: string;
};

/** Existing constants remain documented until their presentation owners migrate. */
export const transcriptionLegacyCoordinateAudit: readonly LegacyTranscriptionCoordinateClassification[] = [
  { name: "sceneXFromProgress", classification: "MUST_BE_REPLACED_BY_STRUCTURAL_FRAME", migrationDestination: "structuralToScene(active-site frame)" },
  { name: "manual RNA y/z offsets", classification: "MUST_BE_REPLACED_BY_STRUCTURAL_FRAME", migrationDestination: "frame.rnaExit + rnaExitDirection" },
  { name: "independent bubble positions", classification: "MUST_BE_REPLACED_BY_STRUCTURAL_FRAME", migrationDestination: "frame.activeCenter + DNA axis/progress" },
  { name: "polymerase arbitrary offsets", classification: "TEMPORARY_LEGACY", migrationDestination: "polymerase actor bounds and active-site frame" },
  { name: "nested mechanism scales", classification: "MUST_BE_REPLACED_BY_STRUCTURAL_FRAME", migrationDestination: "transcriptionStructuralScalePolicy" },
  { name: "camera/ROI zoom", classification: "PRESENTATION_ONLY", migrationDestination: "camera/presentation layer (not actor geometry)" },
];

const ZERO: StructuralVector3 = [0, 0, 0];
const X: StructuralVector3 = [1, 0, 0];
const Y: StructuralVector3 = [0, 1, 0];

function asVector(value: { x: number; y: number; z: number }): StructuralVector3 {
  return [value.x, value.y, value.z];
}

function subtract(a: StructuralVector3, b: StructuralVector3): StructuralVector3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function add(a: StructuralVector3, b: StructuralVector3): StructuralVector3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function multiply(a: StructuralVector3, value: number): StructuralVector3 {
  return [a[0] * value, a[1] * value, a[2] * value];
}

function dot(a: StructuralVector3, b: StructuralVector3) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: StructuralVector3, b: StructuralVector3): StructuralVector3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function length(value: StructuralVector3) {
  return Math.hypot(value[0], value[1], value[2]);
}

function normalize(value: StructuralVector3, label: string): StructuralVector3 {
  const magnitude = length(value);
  if (!Number.isFinite(magnitude) || magnitude < 1e-8) throw new Error(`TRANSCRIPTION_FRAME_DEGENERATE_${label}`);
  return multiply(value, 1 / magnitude);
}

function finite(value: StructuralVector3) {
  return value.every(Number.isFinite);
}

function selector(structureId: string, chainId: string, start: number, end: number): StructuralResidueSelector {
  return { structureId, chainId, residueRange: { start, end } };
}

function actor(kind: StructuralActorKind, actorId: string, sourceId: string, selectors: readonly StructuralResidueSelector[], bounds?: StructuralActor["bounds"]): StructuralActor {
  return { actorKind: kind, actorId, sourceId, sourceType: "depositedStructure", selectors, ...(bounds ? { bounds } : {}), structuralUnits: "angstrom" };
}

function boundsForChains(geometry: StructureDerivedGeometry | undefined, chains: readonly string[]): StructuralActor["bounds"] {
  if (!geometry) return undefined;
  const selected = geometry.residuePoints.filter((point) => chains.some((chainId) => point.chainId === chainId || point.chainId.startsWith(`${chainId}::`))).map((point) => point.position);
  if (selected.length === 0) return undefined;
  const min: StructuralVector3 = [Math.min(...selected.map((point) => point.x)), Math.min(...selected.map((point) => point.y)), Math.min(...selected.map((point) => point.z))];
  const max: StructuralVector3 = [Math.max(...selected.map((point) => point.x)), Math.max(...selected.map((point) => point.y)), Math.max(...selected.map((point) => point.z))];
  return { min, max };
}

/**
 * Returns the current source package without touching React or a renderer. The
 * 6ALH package is explicitly bacterial; it is never classified as Pol II.
 */
export function resolveTranscriptionStructuralActorPackage(manifest: StructureManifestEntry | null = resolveTranscriptionStructureGrounding(), geometry?: StructureDerivedGeometry): TranscriptionStructuralActorPackage {
  if (!manifest || manifest.structureId !== "6ALH") throw new Error("TRANSCRIPTION_STRUCTURAL_SOURCE_UNSUPPORTED");
  const structureId = manifest.structureId;
  const sourceId = `${manifest.provider}:${structureId}:assembly-${manifest.assemblyId ?? "1"}:model-1`;
  const dna = [selector(structureId, "A", 1, 22), selector(structureId, "B", 1, 29)] as const;
  const rna = [selector(structureId, "R", 1, 11)] as const;
  const polymerase = [selector(structureId, "G", 1, 221), selector(structureId, "H", 1, 218), selector(structureId, "I", 1, 1319), selector(structureId, "J", 1, 1337), selector(structureId, "K", 1, 73)] as const;
  const hybridDna = [selector(structureId, "A", 1, 10), selector(structureId, "B", 1, 10)] as const;
  const hybridRna = [selector(structureId, "R", 1, 10)] as const;
  return {
    schemaVersion: "1",
    packageId: "transcription-6ALH-bacterial-elongation-v1",
    source: {
      sourceId, structureId, sourceType: "depositedStructure", organism: "Escherichia coli K-12",
      polymeraseClass: "BACTERIAL_RNAP", modelId: "1", assemblyId: manifest.assemblyId ?? "1", provider: "rcsb-pdb", accession: "6ALH",
      fidelity: "E0_DEPOSITED", coordinateUnits: "angstrom", citation: "doi:10.7554/eLife.25478", license: "RCSB-PDB data policy",
    },
    actors: {
      dna: actor("DNA", "transcription-dna-substrate-6ALH", sourceId, dna, boundsForChains(geometry, ["A", "B"])),
      polymerase: actor("POLYMERASE", "transcription-bacterial-rnap-6ALH", sourceId, polymerase, boundsForChains(geometry, ["G", "H", "I", "J", "K"])),
      rna: actor("RNA", "transcription-rna-chain-r-6ALH", sourceId, rna, boundsForChains(geometry, ["R"])),
      hybrid: actor("RNA_DNA_HYBRID", "transcription-rna-dna-hybrid-6ALH", sourceId, [...hybridDna, ...hybridRna], boundsForChains(geometry, ["A", "B", "R"])),
      promoter: { actorId: "transcription-promoter-region", anchoredToActorId: "transcription-dna-substrate-6ALH", sourceSelector: dna[0], semanticOnly: true },
    },
    selectors: { dnaChains: ["A", "B"], rnaChain: "R", polymeraseChains: ["G", "H", "I", "J", "K"], hybrid: { dna: hybridDna, rna: hybridRna, selectionBasis: "source-bounded-window" } },
  };
}

/**
 * Builds the eukaryotic Pol II package from the validated 5FLM manifest. The
 * elongation source does not contain a promoter, so that role is deliberately
 * semantic-only rather than attached to an invented coordinate range.
 */
export function resolveEukaryoticPolIIStructuralActorPackage(
  manifest: StructureManifestEntry = resolveEukaryoticPolIIAssetManifest(),
  geometry?: StructureDerivedGeometry,
): TranscriptionStructuralActorPackage {
  if (manifest.structureId !== "5FLM") throw new Error("TRANSCRIPTION_EUKARYOTIC_SOURCE_UNSUPPORTED");
  const structureId = manifest.structureId;
  const sourceId = `${manifest.provider}:${structureId}:assembly-${manifest.assemblyId ?? "1"}:model-1`;
  const dna = [selector(structureId, "M", 1, 39), selector(structureId, "O", 1, 39)] as const;
  const rna = [selector(structureId, "N", 7, 20)] as const;
  const polymerase = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"].map((chainId) => ({ structureId, chainId }));
  const hybridDna = [selector(structureId, "O", 7, 20)] as const;
  const hybridRna = [selector(structureId, "N", 7, 20)] as const;
  return {
    schemaVersion: "1",
    packageId: "transcription-5FLM-eukaryotic-pol-ii-elongation-v1",
    source: {
      sourceId, structureId, sourceType: "depositedStructure", organism: manifest.organism,
      polymeraseClass: "EUKARYOTIC_POL_II", modelId: "1", assemblyId: manifest.assemblyId ?? "1", provider: manifest.provider, accession: "5FLM",
      fidelity: "E0_DEPOSITED", coordinateUnits: "angstrom", citation: "doi:10.1038/nature16482", license: "RCSB-PDB data policy",
    },
    actors: {
      dna: actor("DNA", "transcription-dna-substrate-5FLM", sourceId, dna, boundsForChains(geometry, ["M", "O"])),
      polymerase: actor("POLYMERASE", "transcription-eukaryotic-pol-ii-5FLM", sourceId, polymerase, boundsForChains(geometry, ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"])),
      rna: actor("RNA", "transcription-rna-chain-n-5FLM", sourceId, rna, boundsForChains(geometry, ["N"])),
      hybrid: actor("RNA_DNA_HYBRID", "transcription-rna-dna-hybrid-5FLM", sourceId, [...hybridDna, ...hybridRna], boundsForChains(geometry, ["O", "N"])),
      promoter: { actorId: "transcription-promoter-region", anchoredToActorId: "transcription-dna-substrate-5FLM", semanticOnly: true },
    },
    selectors: { dnaChains: ["M", "O"], rnaChain: "N", polymeraseChains: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"], hybrid: { dna: hybridDna, rna: hybridRna, selectionBasis: "source-bounded-window" } },
  };
}

function anchor(geometry: StructureDerivedGeometry, id: string): StructuralVector3 | null {
  const resolved = geometry.anchors.find((candidate) => candidate.id === id);
  return resolved ? asVector(resolved.point) : null;
}

function anchorDirection(geometry: StructureDerivedGeometry, id: string): StructuralVector3 | null {
  const resolved = geometry.anchors.find((candidate) => candidate.id === id);
  return resolved ? asVector(resolved.direction) : null;
}

/** Derives one right-handed basis from grounded anchor evidence. */
export function deriveTranscriptionActiveSiteFrame(packageValue: TranscriptionStructuralActorPackage, geometry: StructureDerivedGeometry): TranscriptionActiveSiteFrame {
  const activeCenter = anchor(geometry, "active-center");
  const upstreamDna = anchor(geometry, "upstream-dna");
  const downstreamDna = anchor(geometry, "downstream-dna");
  if (!activeCenter || !upstreamDna || !downstreamDna) throw new Error("TRANSCRIPTION_FRAME_ANCHOR_UNRESOLVED");
  const dnaAxis = normalize(subtract(downstreamDna, upstreamDna), "DNA_AXIS");
  const exit = anchor(geometry, "rna-exit");
  const exitDirectionRaw = anchorDirection(geometry, "rna-exit");
  const exitDirection = exitDirectionRaw ? normalize(exitDirectionRaw, "RNA_EXIT") : null;
  const exitHint = exit ? subtract(exit, activeCenter) : Y;
  let normalCandidate = subtract(exitHint, multiply(dnaAxis, dot(exitHint, dnaAxis)));
  if (length(normalCandidate) < 1e-8) normalCandidate = subtract(Y, multiply(dnaAxis, dot(Y, dnaAxis)));
  if (length(normalCandidate) < 1e-8) normalCandidate = subtract(X, multiply(dnaAxis, dot(X, dnaAxis)));
  const normal = normalize(normalCandidate, "NORMAL");
  const binormal = normalize(cross(dnaAxis, normal), "BINORMAL");
  return {
    schemaVersion: "1", frameId: `${packageValue.packageId}:active-site-frame`, sourceId: packageValue.source.sourceId, coordinateUnits: "angstrom",
    origin: activeCenter, dnaAxis, normal, binormal, activeCenter, upstreamDna, downstreamDna, rnaExit: exit, rnaExitDirection: exitDirection,
    hybridWindow: { dnaSelectors: packageValue.selectors.hybrid.dna, rnaSelectors: packageValue.selectors.hybrid.rna, basis: "source-bounded-window" },
  };
}

export function structuralToScene(point: StructuralVector3, transform: StructuralRigidTransform): StructuralVector3 {
  if (!Number.isFinite(transform.scale) || transform.scale <= 0) throw new Error("TRANSCRIPTION_SCALE_INVALID");
  const delta = subtract(point, transform.sourceOrigin);
  const local: StructuralVector3 = [dot(delta, transform.sourceAxis), dot(delta, transform.sourceNormal), dot(delta, transform.sourceBinormal)];
  const scaled = multiply(local, transform.scale);
  return add(transform.targetOrigin, add(multiply(transform.targetAxis, scaled[0]), add(multiply(transform.targetNormal, scaled[1]), multiply(transform.targetBinormal, scaled[2]))));
}

export function sceneToStructural(point: StructuralVector3, transform: StructuralRigidTransform): StructuralVector3 {
  if (!Number.isFinite(transform.scale) || transform.scale <= 0) throw new Error("TRANSCRIPTION_SCALE_INVALID");
  const delta = subtract(point, transform.targetOrigin);
  const local: StructuralVector3 = [dot(delta, transform.targetAxis) / transform.scale, dot(delta, transform.targetNormal) / transform.scale, dot(delta, transform.targetBinormal) / transform.scale];
  return add(transform.sourceOrigin, add(multiply(transform.sourceAxis, local[0]), add(multiply(transform.sourceNormal, local[1]), multiply(transform.sourceBinormal, local[2]))));
}

export function frameTransform(frame: TranscriptionActiveSiteFrame, sceneOrigin: StructuralVector3 = ZERO, sceneAxis: StructuralVector3 = X, sceneNormal: StructuralVector3 = Y, sceneBinormal: StructuralVector3 = [0, 0, 1]): StructuralRigidTransform {
  return {
    sourceOrigin: frame.origin,
    sourceAxis: frame.dnaAxis,
    sourceNormal: frame.normal,
    sourceBinormal: frame.binormal,
    targetOrigin: sceneOrigin,
    targetAxis: normalize(sceneAxis, "SCENE_AXIS"),
    targetNormal: normalize(sceneNormal, "SCENE_NORMAL"),
    targetBinormal: normalize(sceneBinormal, "SCENE_BINORMAL"),
    scale: transcriptionStructuralScalePolicy.angstromToScene,
  };
}

export function formatTranscriptionStructuralDiagnostic(packageValue: TranscriptionStructuralActorPackage, frame?: TranscriptionActiveSiteFrame): string {
  const source = packageValue.source;
  const values = frame ? { activeCenter: frame.activeCenter, upstream: frame.upstreamDna, downstream: frame.downstreamDna, rnaExit: frame.rnaExit, scale: transcriptionStructuralScalePolicy.angstromToScene } : { scale: transcriptionStructuralScalePolicy.angstromToScene };
  return [
    "TRANSCRIPTION_STRUCTURAL_ACTORS_V1",
    `source=${source.structureId} organism=${source.organism} polymerase=${source.polymeraseClass}`,
    `dnaChains=${packageValue.selectors.dnaChains.join(",")} rnaChain=${packageValue.selectors.rnaChain} polymeraseChains=${packageValue.selectors.polymeraseChains.join(",")}`,
    JSON.stringify(values),
  ].join("\n");
}

export function isValidTranscriptionActiveSiteFrame(frame: TranscriptionActiveSiteFrame): boolean {
  const vectors = [frame.origin, frame.dnaAxis, frame.normal, frame.binormal, frame.activeCenter, frame.upstreamDna, frame.downstreamDna, ...(frame.rnaExit ? [frame.rnaExit] : []), ...(frame.rnaExitDirection ? [frame.rnaExitDirection] : [])];
  return vectors.every(finite)
    && Math.abs(length(frame.dnaAxis) - 1) < 1e-6
    && Math.abs(length(frame.normal) - 1) < 1e-6
    && Math.abs(length(frame.binormal) - 1) < 1e-6
    && Math.abs(dot(frame.dnaAxis, frame.normal)) < 1e-6
    && Math.abs(dot(frame.dnaAxis, frame.binormal)) < 1e-6
    && Math.abs(dot(frame.normal, frame.binormal)) < 1e-6;
}

export function validateTranscriptionStructuralActorPackage(packageValue: TranscriptionStructuralActorPackage): void {
  if (packageValue.schemaVersion !== "1" || packageValue.source.coordinateUnits !== "angstrom") throw new Error("TRANSCRIPTION_ACTOR_PACKAGE_VERSION_OR_UNITS_INVALID");
  const isBacterialPackage = packageValue.source.structureId === "6ALH" && packageValue.source.polymeraseClass === "BACTERIAL_RNAP";
  const isEukaryoticPackage = packageValue.source.structureId === "5FLM" && packageValue.source.polymeraseClass === "EUKARYOTIC_POL_II";
  if (packageValue.source.structureId === "6ALH" && !isBacterialPackage) throw new Error("TRANSCRIPTION_6ALH_MUST_BE_BACTERIAL_RNAP");
  if (packageValue.source.structureId === "5FLM" && !isEukaryoticPackage) throw new Error("TRANSCRIPTION_5FLM_MUST_BE_EUKARYOTIC_POL_II");
  if (!isBacterialPackage && !isEukaryoticPackage) throw new Error("TRANSCRIPTION_SOURCE_IDENTITY_INVALID");
  if (packageValue.source.sourceType === "depositedStructure" && (!packageValue.source.provider || !packageValue.source.accession || !packageValue.source.citation || !packageValue.source.license)) throw new Error("TRANSCRIPTION_DEPOSITED_PROVENANCE_INCOMPLETE");
  const actors = Object.values(packageValue.actors).filter((value): value is StructuralActor => typeof value === "object" && value !== null && "actorKind" in value);
  if (actors.length !== 4 || new Set(actors.map((value) => value.actorId)).size !== actors.length) throw new Error("TRANSCRIPTION_ACTOR_IDS_INVALID");
  for (const value of actors) {
    if (value.sourceId !== packageValue.source.sourceId || value.structuralUnits !== "angstrom" || value.selectors.length === 0) throw new Error("TRANSCRIPTION_ACTOR_SOURCE_OR_SELECTOR_INVALID");
    for (const item of value.selectors) {
      if (item.structureId !== packageValue.source.structureId || !item.chainId || (item.residueRange && (item.residueRange.start < 1 || item.residueRange.end < item.residueRange.start))) throw new Error("TRANSCRIPTION_SELECTOR_INVALID");
    }
  }
}

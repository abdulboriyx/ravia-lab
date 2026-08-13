import * as THREE from "three";
import type { ScientificDataProviderId } from "./scientific-data-providers.ts";

export type MolecularAtom = {
  serial: number;
  atomName: string;
  residueName: string;
  residueSequence: number;
  residueInsertionCode: string;
  chainId: string;
  labelAsymId?: string;
  authAsymId?: string;
  entityId?: string;
  labelSeqId?: number;
  authSeqId?: number;
  modelNumber?: number;
  sourceChainId?: string;
  assemblyId?: string;
  operatorId?: string;
  entityType: "protein" | "dna" | "rna" | "ligand" | "other";
  element: string;
  x: number;
  y: number;
  z: number;
  occupancy?: number;
  bFactor?: number;
};

export type MolecularResidue = {
  key: string;
  residueName: string;
  residueSequence: number;
  labelSeqId?: number;
  authSeqId?: number;
  labelAsymId?: string;
  authAsymId?: string;
  entityId?: string;
  residueInsertionCode: string;
  chainId: string;
  entityType: MolecularAtom["entityType"];
  atoms: MolecularAtom[];
  centroid: [number, number, number];
};

export type MolecularChain = {
  id: string;
  labelAsymId?: string;
  authAsymId?: string;
  entityId?: string;
  polymerTypeRaw?: string;
  sourceChainId?: string;
  assemblyId?: string;
  operatorId?: string;
  entityType: MolecularAtom["entityType"];
  residues: MolecularResidue[];
  atoms: MolecularAtom[];
  centroid: [number, number, number];
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
  };
};

export type NormalizedPolymerClass = "protein" | "dna" | "rna" | "hybrid" | "other-polymer" | "nonpolymer" | "unknown";
export type ChainReference = { namespace: "label" | "auth" | "normalized"; id: string };
export type NormalizedMolecularEntity = {
  entityId: string;
  entityType?: string;
  description?: string;
  polymerTypeRaw?: string;
  polymerClass: NormalizedPolymerClass;
  labelAsymIds: string[];
};
export type NormalizedAssemblyOperator = { operatorId: string; matrix: number[] };
export type NormalizedAssembly = { assemblyId: string; description?: string; sourceLabelAsymIds: string[]; operators: NormalizedAssemblyOperator[] };

export type NormalizedMolecularStructure = {
  structureId: string;
  source: ScientificDataProviderId;
  format: "pdb" | "mmcif";
  title?: string;
  organism?: string;
  assemblyId?: string;
  atoms: MolecularAtom[];
  chains: MolecularChain[];
  entities?: NormalizedMolecularEntity[];
  assemblies?: NormalizedAssembly[];
  centroid: [number, number, number];
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
  };
};

export type StructureGroundingStatus =
  | "structure-derived"
  | "structure-guided"
  | "procedural"
  | "hybrid";

export type StructureAnchorDefinition =
  | {
      id: string;
      kind: "chain-centroid";
      chainIds: string[];
    }
  | {
      id: string;
      kind: "residue-range-centroid";
      chainId: string;
      startResidue: number;
      endResidue: number;
    }
  | {
      id: string;
      kind: "nucleic-axis";
      chainId: string;
      at: "start" | "center" | "end";
      sampleWindow?: number;
    }
  | {
      id: string;
      kind: "atom-centroid";
      chainId: string;
      residueSequence?: number;
      atomNames?: string[];
    };

export type StructureManifestEntry = {
  role: string;
  semanticEntityIds: string[];
  provider: ScientificDataProviderId;
  structureId: string;
  assetUrl: string;
  format: "pdb" | "mmcif";
  assemblyId?: string;
  title: string;
  canonicalSystem: string;
  organism: string;
  sourceUrl: string;
  selectedChains: string[];
  /** PDB one-letter A/C/G residues are ambiguous; curated chain roles resolve them. */
  chainEntityTypes?: Record<string, MolecularAtom["entityType"]>;
  renderMode: "residue-centroid-cloud";
  coarseGrainStride: number;
  anchors: StructureAnchorDefinition[];
  fallback: {
    status: Exclude<StructureGroundingStatus, "structure-derived">;
    reason: string;
  };
};

export type ResolvedStructureAnchor = {
  id: string;
  point: THREE.Vector3;
  direction: THREE.Vector3;
};

export type StructureDerivedGeometry = {
  residuePoints: Array<{
    position: THREE.Vector3;
    chainId: string;
    entityType: MolecularAtom["entityType"];
  }>;
  tracePaths: Array<{
    chainId: string;
    entityType: MolecularAtom["entityType"];
    points: THREE.Vector3[];
  }>;
  anchors: ResolvedStructureAnchor[];
  centroid: THREE.Vector3;
  bounds: {
    min: THREE.Vector3;
    max: THREE.Vector3;
  };
};

export type LoadedGroundedStructure = {
  structure: NormalizedMolecularStructure;
  geometry: StructureDerivedGeometry;
  provenance: StructureGroundingProvenance;
  groundingStatus: "structure-derived";
};

export type StructureGroundingProvenance = {
  role: string;
  provider: ScientificDataProviderId;
  structureId: string;
  assemblyId?: string;
  selectedChains: string[];
  organism: string;
  title: string;
  sourceUrl: string;
  format: "pdb" | "mmcif";
  renderMode: "residue-centroid-cloud";
  groundingStatus: StructureGroundingStatus;
};

export type StructureGroundingErrorCode =
  | "structure-not-found"
  | "coordinate-load-failed"
  | "parse-failed"
  | "assembly-not-found"
  | "chain-not-found"
  | "anchor-resolution-failed"
  | "unsupported-format"
  | "mmcif-parse-failed"
  | "mmcif-data-block-not-found"
  | "ambiguous-chain-reference"
  | "entity-not-found"
  | "assembly-not-found"
  | "assembly-membership-chain-not-found"
  | "assembly-operator-invalid"
  | "assembly-expansion-failed";

export class StructureGroundingError extends Error {
  readonly code: StructureGroundingErrorCode;

  constructor(code: StructureGroundingErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

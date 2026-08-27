import * as THREE from "three";
import { resolveStructureManifest, getStructureGroundingProvenance } from "./biology-structure-manifest.ts";
import { alignStructureToMechanism } from "./biology-structure-parser.ts";

export function resolveTranscriptionStructureGrounding() {
  return resolveStructureManifest("rna-polymerase");
}

/** Selected eukaryotic source; the live renderer remains on the bacterial role until migration. */
export function resolveEukaryoticPolIIStructureGrounding() {
  return resolveStructureManifest("eukaryotic-pol-ii-elongation");
}

export function getTranscriptionStructureProvenance() {
  return getStructureGroundingProvenance(["rna-polymerase"], "hybrid");
}

export function createTranscriptionStructureTransform(options: {
  sourceAnchor: { point: THREE.Vector3; direction: THREE.Vector3 };
  targetAnchor: THREE.Vector3;
  targetDirection: THREE.Vector3;
  scale: number;
}) {
  return alignStructureToMechanism({
    sourceAnchor: { id: "active-center", ...options.sourceAnchor },
    targetAnchor: options.targetAnchor,
    sourceDirection: options.sourceAnchor.direction,
    targetDirection: options.targetDirection,
    scale: options.scale,
  });
}

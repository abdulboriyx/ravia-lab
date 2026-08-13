import * as THREE from "three";
import {
  getStructureGroundingProvenance,
  resolveStructureManifest,
  structureManifest,
} from "./biology-structure-manifest.ts";
import type {
  StructureManifestEntry,
  StructureGroundingProvenance,
} from "./biology-structure-grounding.ts";
import { alignStructureToMechanism } from "./biology-structure-parser.ts";

export type ReplicationStructureRole =
  | "replicative-helicase"
  | "dna-polymerase"
  | "bound-dna";

export const replicationStructureManifest = structureManifest.filter((entry) =>
  entry.role === "replicative-helicase" || entry.role === "dna-polymerase"
);

export function resolveReplicationStructureGrounding(role: ReplicationStructureRole) {
  return resolveStructureManifest(role);
}

export function getReplicationStructureProvenance(
  groundingStatus: StructureGroundingProvenance["groundingStatus"] = "hybrid"
) {
  return getStructureGroundingProvenance(["replicative-helicase", "dna-polymerase"], groundingStatus);
}

export function createStructureAlignmentQuaternion(options: {
  sourceDirection: THREE.Vector3;
  targetDirection: THREE.Vector3;
}) {
  if (options.sourceDirection.lengthSq() < 1e-12 || options.targetDirection.lengthSq() < 1e-12) {
    return new THREE.Quaternion();
  }
  return new THREE.Quaternion()
    .setFromUnitVectors(
      options.sourceDirection.clone().normalize(),
      options.targetDirection.clone().normalize()
    )
    .normalize();
}

export function createStructureTransform(options: {
  grounding: StructureManifestEntry;
  sourceAnchor: { point: THREE.Vector3; direction: THREE.Vector3 };
  targetAnchor: THREE.Vector3;
  targetDirection: THREE.Vector3;
  scale?: number;
}) {
  const aligned = alignStructureToMechanism({
    sourceAnchor: {
      id: "source",
      point: options.sourceAnchor.point,
      direction: options.sourceAnchor.direction,
    },
    targetAnchor: options.targetAnchor,
    sourceDirection: options.sourceAnchor.direction,
    targetDirection: options.targetDirection,
    scale: options.scale ?? 1,
  });
  return {
    position: aligned.position,
    quaternion: aligned.quaternion,
    scale: aligned.scale,
    grounding: options.grounding,
    fallbackUsed: false,
  };
}

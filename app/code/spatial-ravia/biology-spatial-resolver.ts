import * as THREE from "three";
import type { BiologySceneSpec } from "./biology-scene-spec.ts";

export type SpatialPlacement = {
  entityId: string;
  position: THREE.Vector3;
};

function addPlacement(
  placements: SpatialPlacement[],
  entityId: string,
  x: number,
  y: number,
  z = 0
) {
  if (placements.some((placement) => placement.entityId === entityId)) {
    return;
  }

  placements.push({
    entityId,
    position: new THREE.Vector3(x, y, z),
  });
}

export function resolveSpatialPlacements(
  scene: BiologySceneSpec
): SpatialPlacement[] {
  const placements: SpatialPlacement[] = [];

  const entityIds = new Set(scene.entities.map((entity) => entity.id));

  for (const relation of scene.relations) {
    if (
      relation.relation === "acts_ahead_of" &&
      relation.subject === "topoisomerase" &&
      relation.object === "helicase"
    ) {
      addPlacement(placements, "topoisomerase", 0, -1.55);
    }

    if (
      relation.relation === "stabilizes" &&
      (
        relation.subject === "rpa" ||
        relation.subject === "ssb" ||
        relation.subject === "ssdna-binding-protein"
      )
    ) {
      addPlacement(placements, relation.subject, 0, 1.3);
    }

    if (
  relation.subject === "primase" &&
  relation.relation === "binds_to" &&
  relation.object === "dna"
) {
  addPlacement(placements, "primase", 0.72, 0.72);
}

      if (
      relation.subject === "rna-primer" &&
      relation.relation === "attached_to" &&
      relation.object === "dna"
      ) {
      addPlacement(placements, "rna-primer", 0.92, 0.95);
      }

    if (
      relation.subject === "polymerase" &&
      relation.relation === "binds_to" &&
      relation.object === "dna"
    ) {
      addPlacement(placements, "polymerase", -0.8, 0.72, 0.1);
    }

    if (
      relation.subject === "daughter-leading-strand" &&
      relation.relation === "extends_from" &&
      relation.object === "rna-primer-leading"
    ) {
      addPlacement(placements, "rna-primer-leading", -0.96, 1.04, 0);
      addPlacement(placements, "daughter-leading-strand", -0.72, 1.2, 0);
    }

    if (
      relation.subject === "daughter-lagging-strand" &&
      relation.relation === "extends_from" &&
      relation.object === "rna-primer-lagging"
    ) {
      addPlacement(placements, "rna-primer-lagging", 0.52, 1.18, 0);
      addPlacement(placements, "daughter-lagging-strand", 0.78, 1.42, 0);
    }

    if (
      relation.subject === "okazaki-fragment" &&
      relation.relation === "part_of" &&
      relation.object === "daughter-lagging-strand"
    ) {
      addPlacement(placements, "okazaki-fragment", 0.92, 1.58, 0);
    }

    if (
      relation.subject === "ligase" &&
      relation.relation === "joins" &&
      relation.object === "okazaki-fragment"
    ) {
      addPlacement(placements, "ligase", 1.28, 1.76, 0.1);
    }

    if (
      relation.relation === "direction" &&
      relation.object === "5-to-3"
    ) {
      addPlacement(placements, `${relation.subject}-5-prime`, -0.2, 0.3, 0);
      addPlacement(placements, `${relation.subject}-3-prime`, -0.2, 0.6, 0);
    }
  }

  if (entityIds.has("template-5-prime")) {
    addPlacement(placements, "template-5-prime", -1.34, 2.16, 0);
  }

  if (entityIds.has("template-3-prime")) {
    addPlacement(placements, "template-3-prime", 1.34, 2.16, 0);
  }

  return placements;
}

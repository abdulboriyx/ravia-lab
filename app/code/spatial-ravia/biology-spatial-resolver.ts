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

  if (entityIds.has("plasma-membrane")) {
    addPlacement(placements, "plasma-membrane", 0, 0, 0);
  }
  if (entityIds.has("extracellular-space")) {
    addPlacement(placements, "extracellular-space", -2.25, 1.35, 0);
  }
  if (entityIds.has("cytoplasm")) {
    addPlacement(placements, "cytoplasm", -2.25, -1.35, 0);
  }

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

    if (
      relation.subject === "promoter" &&
      relation.relation === "located_on" &&
      relation.object === "dna"
    ) {
      addPlacement(placements, "promoter", -1.85, 0, 0.06);
    }

    if (
      relation.subject === "gene" &&
      relation.relation === "located_on" &&
      relation.object === "dna"
    ) {
      addPlacement(placements, "gene", 0.45, 0, 0.04);
    }

    if (
      relation.subject === "transcription-bubble" &&
      relation.relation === "located_on" &&
      relation.object === "dna"
    ) {
      addPlacement(placements, "transcription-bubble", -0.35, 0, 0.08);
    }

    if (
      relation.relation === "positioned_at" &&
      relation.object === "transcription-bubble"
    ) {
      addPlacement(placements, relation.subject, -0.35, 0.18, 0.28);
      addPlacement(placements, "transcription-bubble", -0.35, 0, 0.08);
    }

    if (
      relation.subject === "rna-transcript" &&
      relation.relation === "extends_from"
    ) {
      addPlacement(placements, "rna-transcript", -0.75, -0.35, 0.16);
    }

    if (
      relation.subject === "template-strand" &&
      relation.relation === "part_of" &&
      relation.object === "dna"
    ) {
      addPlacement(placements, "template-strand", 0, -0.18, 0.08);
    }

    if (
      relation.subject === "coding-strand" &&
      relation.relation === "part_of" &&
      relation.object === "dna"
    ) {
      addPlacement(placements, "coding-strand", 0, 0.18, 0.08);
    }

    if (
      relation.subject === "terminator" &&
      relation.relation === "located_on" &&
      relation.object === "dna"
    ) {
      addPlacement(placements, "terminator", 1.9, 0, 0.08);
    }

    if (
      relation.subject === "sigma-factor" &&
      relation.relation === "associated_with" &&
      relation.object === "bacterial-rna-polymerase"
    ) {
      addPlacement(placements, "sigma-factor", -0.75, 0.42, 0.38);
    }

    if (
      relation.subject === "rna-transcript" &&
      relation.relation === "direction" &&
      relation.object === "5-to-3"
    ) {
      addPlacement(placements, "rna-5-prime", -1.25, -0.58, 0.16);
      addPlacement(placements, "rna-3-prime", -0.48, -0.24, 0.16);
    }

    if (
      relation.relation === "reads_direction" &&
      relation.object === "3-to-5"
    ) {
      addPlacement(placements, "template-3-prime", -1.25, -0.3, 0.12);
      addPlacement(placements, "template-5-prime", 1.25, -0.3, 0.12);
    }

    if (
      relation.subject === "ribosome" &&
      relation.relation === "binds_to" &&
      relation.object === "mrna"
    ) {
      addPlacement(placements, "ribosome", 0, 0.18, 0.15);
      addPlacement(placements, "mrna", 0, -0.34, 0);
    }

    if (relation.relation === "part_of" && relation.object === "ribosome") {
      if (relation.subject === "small-ribosomal-subunit") {
        addPlacement(placements, "small-ribosomal-subunit", 0, -0.08, 0.1);
      }
      if (relation.subject === "large-ribosomal-subunit") {
        addPlacement(placements, "large-ribosomal-subunit", 0, 0.42, 0.16);
      }
      if (relation.subject === "e-site") {
        addPlacement(placements, "e-site", -0.75, 0.12, 0.28);
      }
      if (relation.subject === "p-site") {
        addPlacement(placements, "p-site", 0, 0.12, 0.28);
      }
      if (relation.subject === "a-site") {
        addPlacement(placements, "a-site", 0.75, 0.12, 0.28);
      }
    }

    if (
      relation.subject === "codon" &&
      relation.relation === "located_on" &&
      relation.object === "mrna"
    ) {
      addPlacement(placements, "codon", 0.72, -0.34, 0.08);
    }

    if (
      relation.subject === "start-codon" &&
      relation.relation === "located_on" &&
      relation.object === "mrna"
    ) {
      addPlacement(placements, "start-codon", 0, -0.34, 0.08);
    }

    if (
      relation.subject === "stop-codon" &&
      relation.relation === "located_on" &&
      relation.object === "mrna"
    ) {
      addPlacement(placements, "stop-codon", 0.75, -0.34, 0.08);
    }

    if (
      relation.subject === "aminoacyl-trna" &&
      relation.relation === "positioned_at" &&
      relation.object === "a-site"
    ) {
      addPlacement(placements, "a-site", 0.75, 0.12, 0.28);
      addPlacement(placements, "aminoacyl-trna", 0.75, 0.72, 0.25);
      addPlacement(placements, "trna", 0.75, 0.72, 0.25);
      addPlacement(placements, "amino-acid", 0.75, 1.22, 0.3);
    }

    if (
      relation.subject === "trna" &&
      relation.relation === "positioned_at" &&
      relation.object === "p-site"
    ) {
      addPlacement(placements, "p-site", 0, 0.12, 0.28);
      addPlacement(placements, "trna", 0, 0.72, 0.25);
    }

    if (
      relation.subject === "initiator-trna" &&
      relation.relation === "positioned_at" &&
      relation.object === "p-site"
    ) {
      addPlacement(placements, "p-site", 0, 0.12, 0.28);
      addPlacement(placements, "initiator-trna", 0, 0.72, 0.25);
    }

    if (
      relation.subject === "polypeptide" &&
      relation.relation === "extends_from" &&
      relation.object === "ribosome"
    ) {
      addPlacement(placements, "polypeptide", -0.18, 1.04, 0.34);
    }

    if (
      relation.subject === "anticodon" &&
      relation.relation === "part_of" &&
      relation.object === "trna"
    ) {
      addPlacement(placements, "anticodon", 0.75, 0.42, 0.28);
    }

    if (
      relation.subject === "release-factor" &&
      relation.relation === "binds_to" &&
      relation.object === "stop-codon"
    ) {
      addPlacement(placements, "release-factor", 0.75, 0.72, 0.32);
    }

    if (
      relation.subject === "ribosome" &&
      relation.relation === "reads_direction" &&
      relation.object === "5-to-3"
    ) {
      addPlacement(placements, "mrna-5-prime", -1.85, -0.54, 0);
      addPlacement(placements, "mrna-3-prime", 1.85, -0.54, 0);
    }

    if (
      relation.subject === "polypeptide" &&
      relation.relation === "direction" &&
      relation.object === "n-to-c"
    ) {
      addPlacement(placements, "n-terminus", -0.44, 1.5, 0.34);
      addPlacement(placements, "c-terminus", 0.24, 1.16, 0.34);
    }

    if (relation.relation === "located_in" && relation.object === "extracellular-space") {
      addPlacement(placements, relation.subject, 0, 1.15, 0.25);
    }

    if (relation.relation === "located_in" && relation.object === "cytoplasm") {
      const cytosolicX: Record<string, number> = {
        "adaptor-protein": -0.25,
        grb2: -0.48,
        sos: -0.1,
      };
      addPlacement(placements, relation.subject, cytosolicX[relation.subject] ?? 0, -0.95, 0.25);
    }

    if (relation.relation === "embedded_in" && relation.object === "plasma-membrane") {
      const x =
        relation.subject === "receptor-monomer-a"
          ? -0.28
          : relation.subject === "receptor-monomer-b"
            ? 0.28
            : 0;
      addPlacement(placements, relation.subject, x, 0, 0.25);
      if (relation.subject === "receptor-dimer") addPlacement(placements, "receptor-dimer", 0, 0, 0.32);
    }

    if (relation.subject === "ligand" && relation.relation === "binds_to") {
      addPlacement(placements, "ligand", 0, 1.08, 0.32);
    }

    if (relation.relation === "cytoplasmic_side_of") {
      addPlacement(placements, relation.subject, 0.42, -0.78, 0.36);
    }

    if (relation.subject === "phosphate-group" && relation.relation === "attached_to") {
      addPlacement(placements, "phosphate-group", 0.62, -0.72, 0.46);
    }

    if (relation.subject === "adaptor-protein" && relation.relation === "binds_to") {
      addPlacement(placements, "adaptor-protein", -0.2, -1.02, 0.34);
    }

    if (relation.subject === "grb2" && relation.relation === "binds_to") {
      addPlacement(placements, "grb2", -0.46, -1.02, 0.38);
    }

    if (relation.subject === "sos" && relation.relation === "associated_with") {
      addPlacement(placements, "sos", -0.08, -1.22, 0.36);
    }

    if (relation.subject === "ras" && relation.relation === "associated_with_surface") {
      addPlacement(placements, "ras", 0.72, -0.55, 0.3);
    }

    if (relation.subject === "ras-gdp" && relation.relation === "transitions_to") {
      addPlacement(placements, "ras-gdp", 0.55, -0.95, 0.28);
      addPlacement(placements, "ras-gtp", 1.02, -0.95, 0.28);
    }

    if (relation.subject === "ras-gtp" && relation.relation === "activates") {
      addPlacement(placements, "raf", 1.35, -1.25, 0.24);
    }

    if (relation.subject === "raf" && relation.relation === "activates") {
      addPlacement(placements, "mek", 1.82, -1.48, 0.24);
    }

    if (relation.subject === "mek" && relation.relation === "activates") {
      addPlacement(placements, "erk", 2.28, -1.72, 0.24);
    }

    if (relation.subject === "erk" && relation.relation === "signals_to") {
      addPlacement(placements, "nucleus", 2.85, -0.92, 0.12);
    }

    if (relation.subject === "cellular-response" && relation.relation === "downstream_of") {
      addPlacement(placements, "cellular-response", 3.15, -0.22, 0.18);
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

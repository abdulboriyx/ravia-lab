import type { BiologySceneSpec } from "./biology-scene-spec.ts";
import type { DnaSceneFamily } from "./biology-dna-representation-contract.ts";

export type DnaRegionKind = "enhancer" | "promoter" | "gene" | "terminator";

export type DnaRegion = {
  /** Stable semantic id. This is a range on the DNA, never a free scene actor. */
  id: string;
  kind: DnaRegionKind;
  label: string;
  center: number;
  width: number;
};

export type DnaPresentationCamera = {
  position: readonly [number, number, number];
  target: readonly [number, number, number];
  fov: number;
};

export type DnaPresentationPlan = {
  family: DnaSceneFamily;
  camera: DnaPresentationCamera;
  /** Coordinates are normalized along the DNA's presentation axis. */
  focalRoi: { center: number; span: number };
  regions: readonly DnaRegion[];
  maximumVisibleLabels: number;
  labelPlacement: "camera-aware-dna-attached";
  terminalMarkers: readonly ["5′", "3′"];
  contextOpacity: number;
  motion: "static-first";
};

const familyPresentation: Readonly<Record<DnaSceneFamily, Omit<DnaPresentationPlan, "family" | "regions">>> = {
  structure: {
    camera: { position: [3.6, 1.8, 5.8], target: [0, 0, 0], fov: 38 },
    focalRoi: { center: 0, span: 1 },
    maximumVisibleLabels: 2,
    labelPlacement: "camera-aware-dna-attached",
    terminalMarkers: ["5′", "3′"],
    contextOpacity: 0.48,
    motion: "static-first",
  },
  "sequence-regulation": {
    camera: { position: [3.7, 1.3, 5.2], target: [0, 0, 0], fov: 34 },
    focalRoi: { center: 0, span: 0.72 },
    maximumVisibleLabels: 4,
    labelPlacement: "camera-aware-dna-attached",
    terminalMarkers: ["5′", "3′"],
    contextOpacity: 0.34,
    motion: "static-first",
  },
  replication: {
    camera: { position: [4.5, 2.2, 5.6], target: [0, 0, 0], fov: 38 },
    focalRoi: { center: 0, span: 0.56 },
    maximumVisibleLabels: 3,
    labelPlacement: "camera-aware-dna-attached",
    terminalMarkers: ["5′", "3′"],
    contextOpacity: 0.4,
    motion: "static-first",
  },
  transcription: {
    camera: { position: [3.6, 1.7, 5], target: [0, 0, 0], fov: 38 },
    focalRoi: { center: 0, span: 0.62 },
    maximumVisibleLabels: 3,
    labelPlacement: "camera-aware-dna-attached",
    terminalMarkers: ["5′", "3′"],
    contextOpacity: 0.38,
    motion: "static-first",
  },
  "damage-repair": {
    camera: { position: [2.8, 1.1, 3.9], target: [0, 0, 0], fov: 31 },
    focalRoi: { center: 0, span: 0.3 },
    maximumVisibleLabels: 2,
    labelPlacement: "camera-aware-dna-attached",
    terminalMarkers: ["5′", "3′"],
    contextOpacity: 0.28,
    motion: "static-first",
  },
  packaging: {
    camera: { position: [4.3, 2.5, 5.8], target: [0, 0, 0], fov: 40 },
    focalRoi: { center: 0, span: 0.78 },
    maximumVisibleLabels: 2,
    labelPlacement: "camera-aware-dna-attached",
    terminalMarkers: ["5′", "3′"],
    contextOpacity: 0.42,
    motion: "static-first",
  },
  "local-chemistry": {
    camera: { position: [1.8, 0.7, 2.5], target: [0, 0, 0], fov: 26 },
    focalRoi: { center: 0, span: 0.2 },
    maximumVisibleLabels: 1,
    labelPlacement: "camera-aware-dna-attached",
    terminalMarkers: ["5′", "3′"],
    contextOpacity: 0.2,
    motion: "static-first",
  },
};

const regionDefaults: Readonly<Record<DnaRegionKind, Omit<DnaRegion, "id" | "kind">>> = {
  enhancer: { label: "enhancer", center: -2.2, width: 0.44 },
  promoter: { label: "promoter", center: -1.85, width: 0.48 },
  gene: { label: "gene", center: 0.45, width: 1.2 },
  terminator: { label: "terminator", center: 1.9, width: 0.34 },
};

/**
 * Reads sequence features from their `located_on DNA` relationship. Rendering
 * consumes this normalized data, so promoter/gene/enhancer remain DNA
 * properties even when the parser models them as named entities.
 */
export function resolveDnaRegions(scene: BiologySceneSpec): DnaRegion[] {
  const regions = new Map<DnaRegionKind, DnaRegion>();
  for (const region of scene.dnaRegions ?? []) {
    const defaults = regionDefaults[region.kind];
    regions.set(region.kind, {
      id: region.id,
      kind: region.kind,
      label: region.label ?? defaults.label,
      center: region.center ?? defaults.center,
      width: region.width ?? defaults.width,
    });
  }
  for (const relation of scene.relations) {
    if (relation.relation !== "located_on" || relation.object !== "dna") continue;
    if (!(relation.subject in regionDefaults)) continue;
    const kind = relation.subject as DnaRegionKind;
    const defaults = regionDefaults[kind];
    if (!regions.has(kind)) regions.set(kind, { id: `dna-region:${kind}`, kind, ...defaults });
  }
  return [...regions.values()].sort((a, b) => a.center - b.center);
}

export function inferDnaSceneFamily(scene: BiologySceneSpec): DnaSceneFamily {
  const ids = new Set(scene.entities.map((entity) => entity.id));
  if (ids.has("fork") || ids.has("helicase") || ids.has("okazaki-fragment")) return "replication";
  if (ids.has("rna-polymerase") || ids.has("bacterial-rna-polymerase") || ids.has("rna-polymerase-ii")) return "transcription";
  if (resolveDnaRegions(scene).length > 0) return "sequence-regulation";
  return scene.renderMode === "molecular-structure" ? "structure" : "sequence-regulation";
}

export function deriveDnaPresentationPlan(scene: BiologySceneSpec): DnaPresentationPlan {
  const family = inferDnaSceneFamily(scene);
  const base = familyPresentation[family];
  const regions = resolveDnaRegions(scene);
  return {
    family,
    ...base,
    regions: regions.slice(0, base.maximumVisibleLabels),
  };
}

export function isValidDnaPresentationPlan(plan: DnaPresentationPlan): boolean {
  return plan.maximumVisibleLabels >= 0
    && plan.regions.length <= plan.maximumVisibleLabels
    && plan.contextOpacity >= 0
    && plan.contextOpacity <= 1
    && plan.camera.fov > 0
    && plan.camera.position.every(Number.isFinite)
    && plan.camera.target.every(Number.isFinite)
    && plan.regions.every((region) => Number.isFinite(region.center) && region.width > 0);
}

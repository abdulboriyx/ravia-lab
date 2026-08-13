import {
  dnaSceneFamilies,
  getDnaRepresentationSpecification,
  type DnaCameraIntent,
  type DnaSceneFamily,
} from "./biology-dna-representation-contract.ts";

/**
 * Renderer-neutral static presentation rules for DNA scenes.
 *
 * Coordinates are normalized positions within the family composition, never
 * geometry coordinates. Renderers map an attached anchor to their own DNA
 * path, surface, or deposited structure.
 */
export type DnaCompositionCamera = {
  intent: DnaCameraIntent;
  framing: "overview" | "regional" | "mechanism" | "local";
  azimuthDegrees: number;
  elevationDegrees: number;
  distanceUnits: number;
  fovDegrees: number;
};

export type DnaCompositionRoi = {
  kind: "whole-molecule" | "sequence-region" | "fork" | "transcription-bubble" | "lesion-or-repair-site" | "nucleosome-or-loop" | "selected-base-pair-or-residue";
  extent: "whole" | "regional" | "local";
  includeStrandDirection: boolean;
};

export type DnaEndpointIndicator = {
  visible: boolean;
  strand: "coding" | "template";
  end: "5-prime" | "3-prime";
  /** Endpoint on the DNA-owned path; never screen-positioned. */
  anchor: "strand-start" | "strand-end";
};

export type DnaAttachedRegionAnnotation = {
  kind: "promoter" | "gene" | "enhancer" | "terminator" | "lesion" | "nucleosome" | "base-pair";
  visible: boolean;
  hierarchy: "primary" | "secondary" | "tertiary";
  placement: "dna-attached";
  /** Normalized interval on the rendered DNA path; renderers attach both ends. */
  dnaInterval: readonly [number, number];
  labelOffset: "camera-aware-normal" | "local-normal";
};

export type DnaCompositionPlan = {
  family: DnaSceneFamily;
  camera: DnaCompositionCamera;
  roi: DnaCompositionRoi;
  context: { dnaOpacity: number; supportingActorOpacity: number; distantDetailOpacity: number };
  directionality: { indicators: readonly DnaEndpointIndicator[]; strandLabels: readonly ("coding" | "template")[] };
  annotations: readonly DnaAttachedRegionAnnotation[];
  annotationHierarchy: readonly ("primary" | "secondary" | "tertiary")[];
  localChemistry: { frame: "none" | "selected-residue" | "selected-base-pair"; contextOpacity: number };
};

const directionality = (visible: boolean): DnaCompositionPlan["directionality"] => ({
  indicators: [
    { visible, strand: "coding", end: "5-prime", anchor: "strand-start" },
    { visible, strand: "coding", end: "3-prime", anchor: "strand-end" },
    { visible, strand: "template", end: "3-prime", anchor: "strand-start" },
    { visible, strand: "template", end: "5-prime", anchor: "strand-end" },
  ],
  strandLabels: visible ? ["coding", "template"] : [],
});

const attached = (
  kind: DnaAttachedRegionAnnotation["kind"],
  hierarchy: DnaAttachedRegionAnnotation["hierarchy"],
  dnaInterval: DnaAttachedRegionAnnotation["dnaInterval"],
  labelOffset: DnaAttachedRegionAnnotation["labelOffset"] = "camera-aware-normal",
): DnaAttachedRegionAnnotation => ({ kind, visible: true, hierarchy, placement: "dna-attached", dnaInterval, labelOffset });

const plans: Readonly<Record<DnaSceneFamily, DnaCompositionPlan>> = {
  structure: {
    family: "structure",
    camera: { intent: "whole-helix", framing: "overview", azimuthDegrees: 32, elevationDegrees: 16, distanceUnits: 6.4, fovDegrees: 30 },
    roi: { kind: "whole-molecule", extent: "whole", includeStrandDirection: true },
    context: { dnaOpacity: 1, supportingActorOpacity: 0, distantDetailOpacity: 0.72 },
    directionality: directionality(true),
    annotations: [attached("base-pair", "tertiary", [0.46, 0.54])],
    annotationHierarchy: ["primary", "tertiary"],
    localChemistry: { frame: "none", contextOpacity: 0.72 },
  },
  "sequence-regulation": {
    family: "sequence-regulation",
    camera: { intent: "regulatory-region", framing: "regional", azimuthDegrees: 18, elevationDegrees: 10, distanceUnits: 4.8, fovDegrees: 27 },
    roi: { kind: "sequence-region", extent: "regional", includeStrandDirection: true },
    context: { dnaOpacity: 0.92, supportingActorOpacity: 0.62, distantDetailOpacity: 0.3 },
    directionality: directionality(true),
    annotations: [attached("enhancer", "tertiary", [0.1, 0.23]), attached("promoter", "primary", [0.32, 0.43]), attached("gene", "secondary", [0.47, 0.86])],
    annotationHierarchy: ["primary", "secondary", "tertiary"],
    localChemistry: { frame: "none", contextOpacity: 0.3 },
  },
  replication: {
    family: "replication",
    camera: { intent: "fork", framing: "mechanism", azimuthDegrees: 36, elevationDegrees: 18, distanceUnits: 5.1, fovDegrees: 29 },
    roi: { kind: "fork", extent: "regional", includeStrandDirection: true },
    context: { dnaOpacity: 0.9, supportingActorOpacity: 0.78, distantDetailOpacity: 0.24 },
    directionality: directionality(true),
    annotations: [],
    annotationHierarchy: ["primary", "secondary"],
    localChemistry: { frame: "none", contextOpacity: 0.24 },
  },
  transcription: {
    family: "transcription",
    camera: { intent: "transcription-bubble", framing: "mechanism", azimuthDegrees: 28, elevationDegrees: 14, distanceUnits: 4.6, fovDegrees: 26 },
    roi: { kind: "transcription-bubble", extent: "regional", includeStrandDirection: true },
    context: { dnaOpacity: 0.88, supportingActorOpacity: 0.8, distantDetailOpacity: 0.22 },
    directionality: directionality(true),
    annotations: [attached("promoter", "tertiary", [0.1, 0.22]), attached("gene", "secondary", [0.27, 0.78]), attached("terminator", "tertiary", [0.82, 0.9]), attached("base-pair", "primary", [0.46, 0.54], "local-normal")],
    annotationHierarchy: ["primary", "secondary", "tertiary"],
    localChemistry: { frame: "none", contextOpacity: 0.22 },
  },
  "damage-repair": {
    family: "damage-repair",
    camera: { intent: "repair-site", framing: "local", azimuthDegrees: 24, elevationDegrees: 12, distanceUnits: 3.5, fovDegrees: 24 },
    roi: { kind: "lesion-or-repair-site", extent: "local", includeStrandDirection: true },
    context: { dnaOpacity: 0.74, supportingActorOpacity: 0.82, distantDetailOpacity: 0.16 },
    directionality: directionality(true),
    annotations: [attached("lesion", "primary", [0.47, 0.53], "local-normal")],
    annotationHierarchy: ["primary", "secondary"],
    localChemistry: { frame: "selected-residue", contextOpacity: 0.16 },
  },
  packaging: {
    family: "packaging",
    camera: { intent: "packaging-domain", framing: "regional", azimuthDegrees: 38, elevationDegrees: 20, distanceUnits: 5.8, fovDegrees: 30 },
    roi: { kind: "nucleosome-or-loop", extent: "regional", includeStrandDirection: false },
    context: { dnaOpacity: 0.86, supportingActorOpacity: 0.9, distantDetailOpacity: 0.4 },
    directionality: directionality(false),
    annotations: [attached("nucleosome", "primary", [0.35, 0.65])],
    annotationHierarchy: ["primary", "secondary"],
    localChemistry: { frame: "none", contextOpacity: 0.4 },
  },
  "local-chemistry": {
    family: "local-chemistry",
    camera: { intent: "local-chemistry", framing: "local", azimuthDegrees: 22, elevationDegrees: 8, distanceUnits: 2.4, fovDegrees: 20 },
    roi: { kind: "selected-base-pair-or-residue", extent: "local", includeStrandDirection: true },
    context: { dnaOpacity: 0.46, supportingActorOpacity: 0.36, distantDetailOpacity: 0.1 },
    directionality: directionality(true),
    annotations: [attached("base-pair", "primary", [0.47, 0.53], "local-normal")],
    annotationHierarchy: ["primary", "secondary"],
    localChemistry: { frame: "selected-base-pair", contextOpacity: 0.1 },
  },
};

export function getDnaCompositionPlan(family: DnaSceneFamily): DnaCompositionPlan {
  return plans[family];
}

export function isValidDnaCompositionPlan(plan: DnaCompositionPlan): boolean {
  const specification = getDnaRepresentationSpecification(plan.family);
  return plan.camera.intent === specification.cameraIntent
    && plan.roi.kind === specification.focalRegion.kind
    && plan.directionality.indicators.every((indicator) => indicator.visible === plan.roi.includeStrandDirection)
    && plan.annotations.every((annotation) => annotation.placement === "dna-attached" && annotation.dnaInterval[0] >= 0 && annotation.dnaInterval[0] < annotation.dnaInterval[1] && annotation.dnaInterval[1] <= 1);
}

export const dnaCompositionFamilies = dnaSceneFamilies;

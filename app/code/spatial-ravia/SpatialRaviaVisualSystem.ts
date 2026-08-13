import * as THREE from "three";

export const spatialRaviaColors = {
  background: "#f6f8f7",
  label: "#162226",
  annotation: "#53646b",
  nucleicBackboneA: "#a9bdc9",
  nucleicBackboneB: "#c7bfd5",
  basePair: "#d8d1b8",
  rna: "#83cdb6",
  mrna: "#8fd0ba",
  polypeptide: "#d6a36d",
  protein: "#b9aa95",
  proteinLight: "#d1c7b6",
  proteinDark: "#6f675e",
  proteinActive: "#d7bf82",
  cavity: "#141414",
  membraneOuter: "#8aa7ad",
  membraneInner: "#7fa99b",
  membraneCore: "#2d3635",
  ionSodium: "#8fc7d9",
  ionPotassium: "#d5a06d",
  stateMarker: "#d8c075",
  dangerState: "#c87878",
  trna: "#9fb6c8",
  trnaIncoming: "#91c6cf",
  trnaPeptidyl: "#a8a1ca",
  trnaEmpty: "#929ba5",
  codon: "#c9bd8e",
  anticodon: "#94b9c7",
};

export const spatialRaviaMaterialDefaults = {
  polymer: { roughness: 0.72, metalness: 0.02 },
  protein: { roughness: 0.78, metalness: 0.025 },
  membrane: { roughness: 0.8, metalness: 0.01 },
  smallMolecule: { roughness: 0.66, metalness: 0.03 },
};

export const spatialRaviaScale = {
  polymerRadius: 0.042,
  dnaRadius: 0.055,
  trnaRadius: 0.035,
  aminoAcidRadius: 0.065,
  peptideRadius: 0.04,
  siteMarkerHeight: 0.035,
};

export type CameraPresetName =
  | "transcription"
  | "replication"
  | "translation"
  | "membrane"
  | "default";

export function getSpatialRaviaCameraPreset(name: CameraPresetName) {
  const presets: Record<CameraPresetName, { position: [number, number, number]; fov: number }> = {
    transcription: { position: [3.6, 1.7, 5.0], fov: 38 },
    replication: { position: [4.5, 2.2, 5.6], fov: 38 },
    translation: { position: [2.35, 1.25, 3.15], fov: 30 },
    membrane: { position: [4.2, 2.1, 5.2], fov: 40 },
    default: { position: [4.5, 2.5, 7], fov: 45 },
  };

  return presets[name];
}

export function assertFiniteCameraPreset(name: CameraPresetName) {
  const preset = getSpatialRaviaCameraPreset(name);
  const vector = new THREE.Vector3(...preset.position);

  return (
    Number.isFinite(vector.x) &&
    Number.isFinite(vector.y) &&
    Number.isFinite(vector.z) &&
    Number.isFinite(preset.fov) &&
    preset.fov > 0
  );
}

export const transcriptionVisualContractSchemaVersion = "1" as const;

export type TranscriptionVisualMode = "OVERVIEW" | "MECHANISM" | "ATOMIC_DETAIL";
export type TranscriptionVisualLayerId =
  | "DEPOSITED_COORDINATES"
  | "COMPUTED_PROTEIN_ENVELOPE"
  | "COMPUTED_NUCLEIC_RENDER"
  | "LOCAL_ATOMISTIC_DETAIL"
  | "INFERRED_MOTION"
  | "ANNOTATION_OVERLAY";
export type TranscriptionVisualLayerStatus = "SOURCE" | "COMPUTED" | "INFERRED" | "OVERLAY" | "PLANNED";
export type TranscriptionVisualFidelity =
  | "E0_DEPOSITED"
  | "C0_COMPUTED_GAUSSIAN_SURFACE"
  | "C0_COMPUTED_FROM_DEPOSITED_ATOMS"
  | "S2_DERIVED_KINEMATIC"
  | "O_OVERLAY";

export type TranscriptionVisualLayer = Readonly<{
  id: TranscriptionVisualLayerId;
  label: string;
  status: TranscriptionVisualLayerStatus;
  fidelity: TranscriptionVisualFidelity;
  currentRepresentation: string;
  targetRepresentation: string;
  allowedClaims: readonly string[];
  forbiddenClaims: readonly string[];
}>;

export const transcriptionVisualContract = {
  schemaVersion: transcriptionVisualContractSchemaVersion,
  source: {
    structureId: "5FLM",
    coordinateFile: "/spatial-ravia/structures/5FLM.cif",
    sourceUrl: "https://www.rcsb.org/structure/5FLM",
    organism: "Bos taurus",
    method: "cryo-EM",
    resolutionAngstrom: 3.4,
    temporalCoverage: "SINGLE_ELONGATION_SNAPSHOT",
    explicitGaps: [
      "No time-resolved experimental trajectory is deposited.",
      "No complete promoter/PIC or termination trajectory is deposited.",
      "Bovine Pol II is a mammalian proxy, not a human sequence-identity claim.",
    ],
  },
  modes: {
    OVERVIEW: {
      label: "Molecular overview",
      purpose: "Recognize the continuous Pol II envelope and the DNA/RNA path.",
      requiredLayers: ["COMPUTED_PROTEIN_ENVELOPE", "COMPUTED_NUCLEIC_RENDER", "ANNOTATION_OVERLAY"],
    },
    MECHANISM: {
      label: "Mechanism view",
      purpose: "Read the active-site geometry and causal state at a glance.",
      requiredLayers: ["COMPUTED_PROTEIN_ENVELOPE", "COMPUTED_NUCLEIC_RENDER", "LOCAL_ATOMISTIC_DETAIL", "INFERRED_MOTION"],
    },
    ATOMIC_DETAIL: {
      label: "Atomic detail",
      purpose: "Inspect selected atoms, bonds, residues, hybrid contacts, and Mg context.",
      requiredLayers: ["DEPOSITED_COORDINATES", "LOCAL_ATOMISTIC_DETAIL", "ANNOTATION_OVERLAY"],
    },
  } satisfies Record<TranscriptionVisualMode, Readonly<{ label: string; purpose: string; requiredLayers: readonly TranscriptionVisualLayerId[] }>>,
  layers: [
    {
      id: "DEPOSITED_COORDINATES",
      label: "E0 deposited coordinates",
      status: "SOURCE",
      fidelity: "E0_DEPOSITED",
      currentRepresentation: "5FLM mmCIF coordinates used as the structural anchor",
      targetRepresentation: "Same deposited atom/residue coordinates with inspectable selectors",
      allowedClaims: ["The selected coordinates and identities are present in 5FLM."],
      forbiddenClaims: ["The deposited file contains the animated trajectory."],
    },
    {
      id: "COMPUTED_PROTEIN_ENVELOPE",
      label: "C0 computed Pol II envelope",
      status: "COMPUTED",
      fidelity: "C0_COMPUTED_GAUSSIAN_SURFACE",
      currentRepresentation: "Gaussian surface computed from selected deposited protein atoms",
      targetRepresentation: "Continuous molecular surface with restrained lighting and subunit-aware color",
      allowedClaims: ["This envelope is computed from deposited Pol II coordinates."],
      forbiddenClaims: ["The rendered surface is a deposited experimental surface."],
    },
    {
      id: "COMPUTED_NUCLEIC_RENDER",
      label: "C0 computed DNA/RNA representation",
      status: "COMPUTED",
      fidelity: "C0_COMPUTED_FROM_DEPOSITED_ATOMS",
      currentRepresentation: "Mol* polymer-trace mesh derived from deposited atoms",
      targetRepresentation: "Continuous backbone context plus local ball-and-stick atoms and bonds",
      allowedClaims: ["The geometry is computed from the selected deposited DNA/RNA atoms."],
      forbiddenClaims: ["A backbone trace or stylized marker is literal atom or bond geometry."],
    },
    {
      id: "LOCAL_ATOMISTIC_DETAIL",
      label: "Local atomistic detail",
      status: "COMPUTED",
      fidelity: "C0_COMPUTED_FROM_DEPOSITED_ATOMS",
      currentRepresentation: "Source-bounded local ball-and-stick atoms and derived bonds",
      targetRepresentation: "Selected active-site atoms, bonds, residues, Mg, and hybrid window",
      allowedClaims: ["Local ball-and-stick detail is computed from source-bounded deposited atoms."],
      forbiddenClaims: ["A stylized marker is an atomic-radius or bond measurement."],
    },
    {
      id: "INFERRED_MOTION",
      label: "S2 inferred kinematic motion",
      status: "INFERRED",
      fidelity: "S2_DERIVED_KINEMATIC",
      currentRepresentation: "Rigid Pol II translocation along the structure-derived DNA axis",
      targetRepresentation: "The same constrained motion, visibly separated from deposited geometry",
      allowedClaims: ["This is an explicit kinematic inference used to illustrate a causal sequence."],
      forbiddenClaims: ["This is a time-resolved experimental movie or measured trajectory."],
    },
    {
      id: "ANNOTATION_OVERLAY",
      label: "Presentation annotation",
      status: "OVERLAY",
      fidelity: "O_OVERLAY",
      currentRepresentation: "Focus halos, labels, evidence legend, and teaching cues",
      targetRepresentation: "Restrained labels and selection emphasis that never impersonate source geometry",
      allowedClaims: ["The overlay identifies or emphasizes a source-bounded feature."],
      forbiddenClaims: ["A halo, ring, or label is itself deposited molecular geometry."],
    },
  ] satisfies readonly TranscriptionVisualLayer[],
} as const;

export function transcriptionVisualLayer(id: TranscriptionVisualLayerId) {
  const layer = transcriptionVisualContract.layers.find((candidate) => candidate.id === id);
  if (!layer) throw new Error(`TRANSCRIPTION_VISUAL_LAYER_UNKNOWN:${id}`);
  return layer;
}

export function validateTranscriptionVisualContract(contract = transcriptionVisualContract): readonly string[] {
  const issues: string[] = [];
  if (contract.schemaVersion !== "1") issues.push("schemaVersion");
  if (contract.source.structureId !== "5FLM") issues.push("source.structureId");
  if (contract.source.temporalCoverage !== "SINGLE_ELONGATION_SNAPSHOT") issues.push("source.temporalCoverage");
  const layers = new Set(contract.layers.map((layer) => layer.id));
  for (const mode of Object.values(contract.modes)) for (const layerId of mode.requiredLayers) if (!layers.has(layerId)) issues.push(`mode.missingLayer:${layerId}`);
  const motion = transcriptionVisualLayer("INFERRED_MOTION");
  if (motion.status !== "INFERRED" || motion.fidelity !== "S2_DERIVED_KINEMATIC") issues.push("motion must remain inferred");
  const detail = transcriptionVisualLayer("LOCAL_ATOMISTIC_DETAIL");
  if (detail.status !== "COMPUTED" || detail.fidelity !== "C0_COMPUTED_FROM_DEPOSITED_ATOMS") issues.push("local atomistic detail status");
  return issues;
}

import type {
  DnaInteraction,
  DnaMechanismFamily,
  DnaMechanismPrimitive,
  DnaMechanismScale,
  DnaMechanismSpec,
  DnaMolecularSelection,
} from "./dna-mechanism-contract.ts";

export type DnaMolecularGroupKind =
  | "phosphateGroup"
  | "deoxyribose"
  | "nitrogenousBase"
  | "onePrimeCarbon"
  | "threePrimeCarbon"
  | "threePrimeHydroxyl"
  | "fivePrimeCarbon"
  | "fivePrimePhosphate"
  | "phosphodiesterLinkage"
  | "purineBase"
  | "pyrimidineBase"
  | "hydrogenBondDonor"
  | "hydrogenBondAcceptor"
  | "stackingFace"
  | "neighboringBase"
  | "strandTerminus";

export type DnaMolecularGroup = {
  id: string;
  kind: DnaMolecularGroupKind;
  selectionIds: string[];
  canonicalAnchor: string;
  source: "existingDnaVisualSystem";
};

export type DnaLocalMolecularSelection = {
  id: string;
  sourceSelectionId: string;
  canonicalRole:
    | "singleNucleotide"
    | "adjacentNucleotides"
    | "complementaryBasePair"
    | "shortDuplex"
    | "backboneLink"
    | "sugarCarbonAnchors"
    | "stackingNeighbors"
    | "openRegion"
    | "strandEnds";
  anchors: string[];
  groupIds: string[];
  locality: "local" | "regional";
  source: "existingDnaVisualSystem";
};

export type DnaMechanismPrimitiveInstance = {
  id: string;
  primitive: DnaMechanismPrimitive;
  selectionIds: string[];
  groupIds: string[];
  interactionIds: string[];
  explanatory: boolean;
};

export type DnaMechanismRepresentationPlan = {
  sourceSpec: DnaMechanismSpec;
  localSelection: DnaLocalMolecularSelection[];
  molecularGroups: DnaMolecularGroup[];
  primitives: DnaMechanismPrimitiveInstance[];
  focusAnchors: string[];
  requiredLabels: string[];
  highlightedGroups: string[];
  highlightedInteractions: string[];
  interactionDisplay: {
    showHydrogenBonds: boolean;
    showPhosphodiesterLinks: boolean;
    showStacking: boolean;
    showCovalentLinks: boolean;
    showLesionCrosslinks: boolean;
  };
  orientationDisplay: {
    showFivePrimeThreePrime: boolean;
    showAntiparallel: boolean;
    showAxis: boolean;
  };
  contextLod: "minimal" | "local" | "regional";
  localChemistryDetail: "none" | "residue" | "atomAndBond";
  cameraIntent: "duplex" | "strand" | "basePair" | "localChemistry";
  reaction: DnaMechanismSpec["reaction"];
  fallback: "canonicalDnaWithExplanatoryOverlay" | "groundedLocalSelection";
};

export type DnaExistingVisualAdapter = {
  visualSystem: "DnaVisualSystem";
  canonicalState: "canonicalDna" | "groundedCoordinates";
  resolveSelection(selection: DnaLocalMolecularSelection): unknown;
  resolveGroup(group: DnaMolecularGroup): unknown;
  resolveCameraIntent(intent: DnaMechanismRepresentationPlan["cameraIntent"]): unknown;
  renderLocalChemistry?: (groups: DnaMolecularGroup[]) => unknown;
};

const selectionRoleMap: Record<DnaMolecularSelection["kind"], DnaLocalMolecularSelection["canonicalRole"]> = {
  base: "complementaryBasePair",
  nucleotide: "singleNucleotide",
  phosphate: "backboneLink",
  deoxyribose: "sugarCarbonAnchors",
  backbone: "backboneLink",
  strand: "shortDuplex",
  duplex: "shortDuplex",
  groove: "shortDuplex",
  atom: "singleNucleotide",
  lesion: "openRegion",
};

const groupKindForSelection: Partial<Record<DnaMolecularSelection["kind"], DnaMolecularGroupKind>> = {
  phosphate: "phosphateGroup",
  deoxyribose: "deoxyribose",
  base: "nitrogenousBase",
  backbone: "phosphodiesterLinkage",
  strand: "strandTerminus",
  duplex: "stackingFace",
  groove: "stackingFace",
};

export function resolveDnaLocalSelections(spec: DnaMechanismSpec): DnaLocalMolecularSelection[] {
  return spec.molecularSelections.map((selection) => {
    const canonicalRole = selectionRoleMap[selection.kind];
    const anchors = anchorsForSelection(selection, canonicalRole);
    const groupIds = groupsForSelection(selection);
    return {
      id: `local-${selection.id}`,
      sourceSelectionId: selection.id,
      canonicalRole,
      anchors,
      groupIds,
      locality: spec.scale.locality === "global" ? "regional" : spec.scale.locality,
      source: "existingDnaVisualSystem",
    };
  });
}

export function resolveDnaMolecularGroups(spec: DnaMechanismSpec): DnaMolecularGroup[] {
  const groups: DnaMolecularGroup[] = [];
  for (const selection of spec.molecularSelections) {
    const kind = groupKindForSelection[selection.kind];
    if (kind) {
      groups.push({
        id: `group-${selection.id}`,
        kind,
        selectionIds: [selection.id],
        canonicalAnchor: anchorForGroup(kind),
        source: "existingDnaVisualSystem",
      });
    }
    if (selection.role === "onePrimeCarbon") groups.push(group(selection, "onePrimeCarbon"));
    if (selection.role === "threePrimeCarbon") groups.push(group(selection, "threePrimeCarbon"));
    if (selection.role === "fivePrimeCarbon") groups.push(group(selection, "fivePrimeCarbon"));
    if (selection.role === "threePrimeEnd") groups.push(group(selection, "strandTerminus"));
    if (selection.role === "fivePrimeEnd") groups.push(group(selection, "strandTerminus"));
    if (selection.role === "purine") groups.push(group(selection, "purineBase"));
    if (selection.role === "pyrimidine") groups.push(group(selection, "pyrimidineBase"));
    if (selection.role === "donor") groups.push(group(selection, "hydrogenBondDonor"));
    if (selection.role === "acceptor") groups.push(group(selection, "hydrogenBondAcceptor"));
  }
  for (const interaction of spec.interactions) {
    if (interaction.type === "hydrogenBond") {
      groups.push({ id: `group-${interaction.id}-donor`, kind: "hydrogenBondDonor", selectionIds: interaction.participants, canonicalAnchor: "base-hydrogen-bond-donor", source: "existingDnaVisualSystem" });
      groups.push({ id: `group-${interaction.id}-acceptor`, kind: "hydrogenBondAcceptor", selectionIds: interaction.participants, canonicalAnchor: "base-hydrogen-bond-acceptor", source: "existingDnaVisualSystem" });
    }
    if (interaction.type === "baseStacking") groups.push({ id: `group-${interaction.id}-stacking`, kind: "stackingFace", selectionIds: interaction.participants, canonicalAnchor: "base-stacking-face", source: "existingDnaVisualSystem" });
    if (interaction.type === "phosphodiester") groups.push({ id: `group-${interaction.id}-link`, kind: "phosphodiesterLinkage", selectionIds: interaction.participants, canonicalAnchor: "phosphodiester-linkage", source: "existingDnaVisualSystem" });
  }
  return uniqueGroups(groups);
}

function anchorsForSelection(selection: DnaMolecularSelection, role: DnaLocalMolecularSelection["canonicalRole"]): string[] {
  const anchors = [`dna-${role}`];
  if (selection.role === "onePrimeCarbon") anchors.push("sugar-1-prime-carbon");
  if (selection.role === "threePrimeCarbon") anchors.push("sugar-3-prime-carbon", "three-prime-oh");
  if (selection.role === "fivePrimeCarbon") anchors.push("sugar-5-prime-carbon", "five-prime-phosphate");
  if (selection.role === "fivePrimeEnd") anchors.push("strand-5-prime-end");
  if (selection.role === "threePrimeEnd") anchors.push("strand-3-prime-end");
  return anchors;
}

function groupsForSelection(selection: DnaMolecularSelection): string[] {
  const groups: string[] = [];
  const direct = groupKindForSelection[selection.kind];
  if (direct) groups.push(`group-${selection.id}`);
  if (selection.role === "onePrimeCarbon") groups.push(`group-${selection.id}-onePrimeCarbon`);
  if (selection.role === "threePrimeCarbon") groups.push(`group-${selection.id}-threePrimeCarbon`);
  if (selection.role === "fivePrimeCarbon") groups.push(`group-${selection.id}-fivePrimeCarbon`);
  if (selection.role === "purine") groups.push(`group-${selection.id}-purineBase`);
  if (selection.role === "pyrimidine") groups.push(`group-${selection.id}-pyrimidineBase`);
  return groups;
}

function group(selection: DnaMolecularSelection, kind: DnaMolecularGroupKind): DnaMolecularGroup {
  return { id: `group-${selection.id}-${kind}`, kind, selectionIds: [selection.id], canonicalAnchor: anchorForGroup(kind), source: "existingDnaVisualSystem" };
}

function anchorForGroup(kind: DnaMolecularGroupKind) {
  return `dna-group-${kind}`;
}

function uniqueGroups(groups: DnaMolecularGroup[]) {
  return [...new Map(groups.map((item) => [item.id, item])).values()];
}

export function primitiveCompositionFor(spec: DnaMechanismSpec, selections = resolveDnaLocalSelections(spec), groups = resolveDnaMolecularGroups(spec)): DnaMechanismPrimitiveInstance[] {
  return spec.requiredPrimitives.map((primitive, index) => ({
    id: `primitive-${primitive}-${index}`,
    primitive,
    selectionIds: selections.map((selection) => selection.id),
    groupIds: groups.map((group) => group.id),
    interactionIds: spec.interactions.map((interaction) => interaction.id),
    explanatory: true,
  }));
}

export function buildDnaMechanismRepresentationPlan(spec: DnaMechanismSpec): DnaMechanismRepresentationPlan {
  const localSelection = resolveDnaLocalSelections(spec);
  const molecularGroups = resolveDnaMolecularGroups(spec);
  const primitives = primitiveCompositionFor(spec, localSelection, molecularGroups);
  const highlightedInteractions = spec.interactions.map((interaction) => interaction.id);
  return {
    sourceSpec: spec,
    localSelection,
    molecularGroups,
    primitives,
    focusAnchors: [...new Set(localSelection.flatMap((selection) => selection.anchors))],
    requiredLabels: spec.annotations.filter((annotation) => annotation.priority === "essential").map((annotation) => annotation.text),
    highlightedGroups: molecularGroups.map((group) => group.id),
    highlightedInteractions,
    interactionDisplay: {
      showHydrogenBonds: spec.interactions.some((item) => item.type === "hydrogenBond"),
      showPhosphodiesterLinks: spec.interactions.some((item) => item.type === "phosphodiester"),
      showStacking: spec.interactions.some((item) => item.type === "baseStacking"),
      showCovalentLinks: spec.interactions.some((item) => item.type === "covalent"),
      showLesionCrosslinks: spec.interactions.some((item) => item.type === "lesionCrosslink"),
    },
    orientationDisplay: {
      showFivePrimeThreePrime: spec.orientation.strandDirections.length > 0,
      showAntiparallel: spec.orientation.antiparallel,
      showAxis: Boolean(spec.orientation.axisAnchor),
    },
    contextLod: spec.scale.locality === "global" ? "regional" : spec.scale.locality === "regional" ? "local" : "minimal",
    localChemistryDetail: spec.representation.localResidueDetail,
    cameraIntent: spec.scale.level === "duplex" ? "duplex" : spec.scale.level === "strand" ? "strand" : spec.scale.level === "basePair" ? "basePair" : "localChemistry",
    reaction: spec.reaction,
    fallback: spec.representation.backbone === "groundedCoordinates" ? "groundedLocalSelection" : "canonicalDnaWithExplanatoryOverlay",
  };
}

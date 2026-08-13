export type DnaRegulatoryRegionKind = "enhancer" | "promoter" | "gene";

export type DnaRegulatoryRegion = {
  id: DnaRegulatoryRegionKind;
  label: "ENHANCER" | "PROMOTER" | "GENE";
  /** Inclusive residue positions on canonical coding strand A. */
  start: number;
  end: number;
  color: number;
  visible: boolean;
};

export type DnaRegulationPresentationPlan = {
  regions: readonly DnaRegulatoryRegion[];
  selectedLabels: readonly string[];
  camera: { preset: "reset"; length: "medium" };
};

const allRegions: readonly DnaRegulatoryRegion[] = [
  { id: "enhancer", label: "ENHANCER", start: 2, end: 3, color: 0x4d9b8a, visible: true },
  { id: "promoter", label: "PROMOTER", start: 6, end: 7, color: 0xd18b4e, visible: true },
  { id: "gene", label: "GENE", start: 9, end: 14, color: 0x7a91c6, visible: true },
];

/**
 * DNA-owned region semantics. These are pedagogical spans on a canonical
 * duplex, not claims about an exact genomic sequence or spacing.
 */
export function deriveDnaRegulationPresentation(prompt: string): DnaRegulationPresentationPlan {
  const text = prompt.toLowerCase();
  const wantsEnhancer = text.includes("enhancer");
  const wantsPromoter = text.includes("promoter") || (!wantsEnhancer && !text.includes("regulatory region"));
  const wantsGene = text.includes("gene") || text.includes("regulatory region");
  const visible = allRegions.map((region) => ({
    ...region,
    visible: region.id === "enhancer" ? wantsEnhancer : region.id === "promoter" ? wantsPromoter : wantsGene,
  }));
  return {
    regions: visible,
    selectedLabels: visible.filter((region) => region.visible).map((region) => region.label),
    camera: { preset: "reset", length: "medium" },
  };
}

export function isValidDnaRegulationPresentation(plan: DnaRegulationPresentationPlan) {
  const visible = plan.regions.filter((region) => region.visible);
  const promoter = plan.regions.find((region) => region.id === "promoter");
  const gene = plan.regions.find((region) => region.id === "gene");
  return visible.every((region) => region.start > 0 && region.start <= region.end && Number.isFinite(region.color))
    && (!promoter || !gene || promoter.end < gene.start);
}

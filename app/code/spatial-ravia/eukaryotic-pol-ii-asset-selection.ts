import { resolveStructureManifest } from "./biology-structure-manifest.ts";
import type { StructureManifestEntry } from "./biology-structure-grounding.ts";

export type EukaryoticPolIIAssetSelectionStatus = "SELECTED_NOT_MOUNTED" | "MOUNTED";

export const eukaryoticPolIIAssetSelection = {
  status: "MOUNTED" as const,
  primaryStructureId: "5FLM",
  primarySourceUrl: "https://www.rcsb.org/structure/5FLM",
  rationale: "Mammalian Pol II transcribing complex with deposited DNA template, nascent RNA, and RNA-DNA elongation scaffold at 3.40 Å cryo-EM resolution.",
  explicitGaps: [
    "The deposited snapshot is an elongation complex, not a promoter/PIC structure.",
    "The deposited snapshot does not encode a complete termination trajectory.",
    "Bovine Pol II is used as the mammalian proxy; it is not a human sequence identity claim.",
  ] as const,
  supplements: [
    { structureId: "5OIK", role: "DSIF-associated elongation/pausing context", sourceUrl: "https://www.rcsb.org/structure/5OIK" },
    { structureId: "8XRJ", role: "human Pol II elongation on chromatin/nucleosome context", sourceUrl: "https://www.rcsb.org/structure/8XRJ" },
  ] as const,
} satisfies Readonly<{
  status: EukaryoticPolIIAssetSelectionStatus;
  primaryStructureId: string;
  primarySourceUrl: string;
  rationale: string;
  explicitGaps: readonly string[];
  supplements: readonly Readonly<{ structureId: string; role: string; sourceUrl: string }>[];
}>;

const proteinChains = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;
const selectedChains = [...proteinChains, "M", "N", "O", "R"] as const;

export type EukaryoticPolIIAssetValidation =
  | Readonly<{ valid: true; issues: [] }>
  | Readonly<{ valid: false; issues: readonly string[] }>;

export function validateEukaryoticPolIIAssetManifest(entry: StructureManifestEntry): EukaryoticPolIIAssetValidation {
  const issues: string[] = [];
  if (entry.role !== "eukaryotic-pol-ii-elongation") issues.push("role must identify the eukaryotic Pol II elongation asset");
  if (entry.structureId !== eukaryoticPolIIAssetSelection.primaryStructureId) issues.push("5FLM is the selected primary structure");
  if (entry.structureId === "6ALH") issues.push("6ALH bacterial RNAP cannot be a eukaryotic Pol II asset");
  if (entry.provider !== "rcsb-pdb" || entry.format !== "mmcif" || entry.assemblyId !== "1") issues.push("asset must be RCSB 5FLM mmCIF assembly 1");
  if (entry.assetUrl !== "/spatial-ravia/structures/5FLM.cif") issues.push("asset URL must point to the deposited 5FLM coordinate file");
  if (entry.sourceUrl !== eukaryoticPolIIAssetSelection.primarySourceUrl) issues.push("source URL must point to the RCSB 5FLM record");
  if (JSON.stringify(entry.selectedChains) !== JSON.stringify(selectedChains)) issues.push("selected chains must include Pol II A-L, DNA M/O, RNA N, and active-center Mg R");
  for (const chain of proteinChains) if (entry.chainEntityTypes?.[chain] !== "protein") issues.push(`chain ${chain} must be typed as protein`);
  if (entry.chainEntityTypes?.M !== "dna" || entry.chainEntityTypes?.O !== "dna") issues.push("chains M and O must be typed as DNA");
  if (entry.chainEntityTypes?.N !== "rna") issues.push("chain N must be typed as RNA");
  if (entry.chainEntityTypes?.R !== "ligand") issues.push("chain R must be typed as the active-center magnesium ligand");
  const anchorIds = new Set(entry.anchors.map((anchor) => anchor.id));
  for (const id of ["upstream-dna", "downstream-dna", "rna-exit", "active-center"]) if (!anchorIds.has(id)) issues.push(`anchor ${id} is required`);
  return issues.length ? { valid: false, issues } : { valid: true, issues: [] };
}

export function resolveEukaryoticPolIIAssetManifest(): StructureManifestEntry {
  const entry = resolveStructureManifest("eukaryotic-pol-ii-elongation");
  if (!entry) throw new Error("EUKARYOTIC_POL_II_ASSET_MISSING");
  const validation = validateEukaryoticPolIIAssetManifest(entry);
  if (!validation.valid) throw new Error(`EUKARYOTIC_POL_II_ASSET_INVALID: ${validation.issues.join("; ")}`);
  return entry;
}

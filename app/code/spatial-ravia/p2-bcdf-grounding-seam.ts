/** P2-BCDF: the only composed source/context/selector/fidelity grounding seam. */
import { resolveScientificSourceProvenance, type SourceProvenanceResolverInput, type ValidatedProvenanceSource } from "./scientific-source-provenance-resolver.ts";
import { resolveStructureContext, type StructureCoordinateInventory, type StructureContextRequest, type ResolvedStructureContext } from "./p2-d-structure-context.ts";
import { resolveMolecularIdentitySelectors, type MolecularSelectorAuthorityInput, type MolecularSelectorAuthorityResult } from "./p2-molecular-selector-grounding.ts";
import { resolveFidelityUncertainty, type FidelityUncertaintyInput, type FidelityUncertaintyResolution } from "./fidelity-uncertainty-authority.ts";
import type { FidelityAttachmentContext } from "./scientific-fidelity-provenance.ts";

export type GroundingSubstrateInput = {
  provenance: SourceProvenanceResolverInput;
  attachmentContext: FidelityAttachmentContext;
  inventory?: StructureCoordinateInventory;
  structureRequest?: StructureContextRequest;
  selectors?: Omit<MolecularSelectorAuthorityInput, "resolvedContext">;
  fidelity: Omit<FidelityUncertaintyInput, "sources">;
};
export type GroundingSubstrateResult =
  | { outcome: "RESOLVED"; provenance: ValidatedProvenanceSource; structureContext?: ResolvedStructureContext; selectors?: MolecularSelectorAuthorityResult; fidelity: FidelityUncertaintyResolution }
  | { outcome: "INVALID_SOURCE" | "AMBIGUOUS_STRUCTURE" | "UNRESOLVED_SELECTOR" | "INVALID_SELECTOR" | "UNSUPPORTED_CONTEXT" | "FIDELITY_UNSUPPORTED"; reasons: readonly string[] };

const fail = (outcome: GroundingSubstrateResult["outcome"], reasons: readonly string[]): GroundingSubstrateResult => ({ outcome: outcome as Exclude<GroundingSubstrateResult["outcome"], "RESOLVED">, reasons });

export function resolveGroundingSubstrate(input: GroundingSubstrateInput): GroundingSubstrateResult {
  const provenance = resolveScientificSourceProvenance(input.provenance, input.attachmentContext);
  if (provenance.ok === false) return fail("INVALID_SOURCE", provenance.issues.map((issue) => `${issue.path}: ${issue.message}`));
  let structureContext: ResolvedStructureContext | undefined;
  if (provenance.source.sourceType === "depositedStructure") {
    if (!input.inventory) return fail("UNSUPPORTED_CONTEXT", ["deposited source requires a structure inventory"]);
    const structure = resolveStructureContext(provenance.source, input.inventory, input.structureRequest);
    if (structure.outcome === "AMBIGUOUS") return fail("AMBIGUOUS_STRUCTURE", structure.reasons);
    if (structure.outcome === "UNSUPPORTED") return fail("UNSUPPORTED_CONTEXT", structure.reasons);
    if (structure.outcome === "INVALID_SOURCE") return fail("INVALID_SOURCE", structure.reasons);
    structureContext = structure.context;
  }
  let selectors: MolecularSelectorAuthorityResult | undefined;
  if (input.selectors) {
    if (!structureContext) return fail("UNSUPPORTED_CONTEXT", ["molecular structure selectors require resolved deposited structure context"]);
    selectors = resolveMolecularIdentitySelectors({ ...input.selectors, resolvedContext: structureContext });
    if (!selectors.valid) return fail("INVALID_SELECTOR", selectors.issues.map((issue) => `${issue.path}: ${issue.message}`));
    if (selectors.resolutions.some((resolution) => resolution.status === "ambiguous")) return fail("UNRESOLVED_SELECTOR", ["selector resolution remains ambiguous"]);
    if (selectors.resolutions.some((resolution) => resolution.status === "unresolved")) return fail("UNRESOLVED_SELECTOR", ["selector resolution contains unresolved bindings"]);
  }
  const fidelity = resolveFidelityUncertainty({ ...input.fidelity, sources: [provenance.source] });
  if (fidelity.accepted === false) return fail("FIDELITY_UNSUPPORTED", fidelity.reasons);
  return { outcome: "RESOLVED", provenance: provenance.source, ...(structureContext ? { structureContext } : {}), ...(selectors ? { selectors } : {}), fidelity };
}

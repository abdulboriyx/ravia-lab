/** P2-G: sole local chemical-identity authority; it does not create F2 interactions/topology. */
import type { GroundingSubstrateResult } from "./p2-bcdf-grounding-seam.ts";
import type { MolecularChain, MolecularResidue, NormalizedMolecularStructure } from "./biology-structure-grounding.ts";
import type { MolecularSelectorAuthorityResult } from "./p2-molecular-selector-grounding.ts";
import type { ScientificActorId } from "./scientific-actor.ts";

export const localChemistryGroundingSchemaVersion = "1" as const;
export const localChemistryFailureCodes = ["COMPONENT_UNRESOLVED", "ATOM_UNRESOLVED", "CHEMICAL_GROUP_UNRESOLVED", "TERMINUS_UNRESOLVED", "CHEMISTRY_INCONSISTENT", "EVIDENCE_INSUFFICIENT"] as const;
export type LocalChemistryFailureCode = (typeof localChemistryFailureCodes)[number];
export type NucleicChemistry = "DNA" | "RNA";
export type ChemicalEvidenceType = "ccdComponent" | "mmcifAtomNaming" | "canonicalComponentRule";
export type LocalChemicalComponent = {
  componentId: string;
  nucleicChemistry: NucleicChemistry;
  base: "A" | "C" | "G" | "T" | "U";
  sugar: "ribose" | "deoxyribose";
  atomNames: readonly string[];
  donorAtomNames: readonly string[];
  acceptorAtomNames: readonly string[];
  evidenceType: ChemicalEvidenceType;
  confidence: number;
  limitations: readonly string[];
};
export type LocalChemicalConnectivity = {
  termini: readonly { terminus: "fivePrime" | "threePrime"; residueKey: string }[];
  phosphodiesterLinks: readonly { linkId: string; upstreamResidueKey: string; downstreamResidueKey: string; atomKeys: readonly string[]; state: "intact" | "cleaved" }[];
};
export type LocalChemistryRequest = {
  assertionId: string;
  bindingId: string;
  componentId: string;
  target: "nucleotideContext" | "sugar" | "twoPrimeHydroxyl" | "phosphate" | "base" | "fivePrimeTerminus" | "threePrimeTerminus" | "phosphodiester" | "cleavageSite" | "donor" | "acceptor";
  atomName?: string;
  linkId?: string;
};
export type LocalChemistryGroundingInput = {
  schemaVersion: typeof localChemistryGroundingSchemaVersion;
  substrate: GroundingSubstrateResult;
  structure: Pick<NormalizedMolecularStructure, "structureId" | "chains">;
  components: readonly LocalChemicalComponent[];
  connectivity: LocalChemicalConnectivity;
  requests: readonly LocalChemistryRequest[];
};
export type LocalChemicalAssertion = {
  assertionId: string;
  bindingId: string;
  actorId: ScientificActorId;
  target: LocalChemistryRequest["target"];
  componentId: string;
  nucleicChemistry: NucleicChemistry;
  base: LocalChemicalComponent["base"];
  sugar: LocalChemicalComponent["sugar"];
  residueKeys: readonly string[];
  atomKeys: readonly string[];
  evidence: { sourceId: string; componentEvidence: ChemicalEvidenceType; confidence: number; limitations: readonly string[] };
};
export type LocalChemicalLinkAssertion = {
  linkAssertionId: string;
  linkKind: "PHOSPHODIESTER" | "CLEAVAGE_SITE";
  linkId: string;
  endpoints: readonly [{ actorId: ScientificActorId; selectorBindingId: string; residueKey: string; atomKeys: readonly string[] }, { actorId: ScientificActorId; selectorBindingId: string; residueKey: string; atomKeys: readonly string[] }];
  evidence: { sourceId: string; componentEvidence: ChemicalEvidenceType; confidence: number; limitations: readonly string[] };
};
export type LocalChemistryResolution = { status: "GROUNDED"; assertion: LocalChemicalAssertion } | { status: LocalChemistryFailureCode; assertionId: string; reason: string };
export type GroundedLocalChemistryResult = { schemaVersion: "2"; substrateSourceId: string; structureId: string; selectorBindingIds: readonly string[]; assertions: readonly LocalChemicalAssertion[]; linkAssertions: readonly LocalChemicalLinkAssertion[] };
const authenticatedResults = new WeakSet<object>();
export const isAuthenticatedLocalChemistryResult = (value: unknown): value is GroundedLocalChemistryResult => typeof value === "object" && value !== null && authenticatedResults.has(value);

const residueKey = (chain: MolecularChain, residue: MolecularResidue) => `${chain.id}:${residue.residueSequence}${residue.residueInsertionCode || ""}`;
const atomKey = (chain: MolecularChain, residue: MolecularResidue, atomName: string) => `${residueKey(chain, residue)}:${atomName}`;
const keyPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const bases = new Set(["A", "C", "G", "T", "U"]); const sugars = new Set(["ribose", "deoxyribose"]); const chemistries = new Set(["DNA", "RNA"]); const evidenceTypes = new Set(["ccdComponent", "mmcifAtomNaming", "canonicalComponentRule"]); const targets = new Set(["nucleotideContext", "sugar", "twoPrimeHydroxyl", "phosphate", "base", "fivePrimeTerminus", "threePrimeTerminus", "phosphodiester", "cleavageSite", "donor", "acceptor"]); const termini = new Set(["fivePrime", "threePrime"]);
const validComponent = (component: LocalChemicalComponent) => component.componentId.length > 0 && component.atomNames.length > 0 && chemistries.has(component.nucleicChemistry) && bases.has(component.base) && sugars.has(component.sugar) && evidenceTypes.has(component.evidenceType) && Number.isFinite(component.confidence) && component.confidence >= 0 && component.confidence <= 1 && component.atomNames.every((name) => typeof name === "string" && name.length > 0) && component.donorAtomNames.every((name) => component.atomNames.includes(name)) && component.acceptorAtomNames.every((name) => component.atomNames.includes(name));
const record = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const onlyKeys = (value: unknown, allowed: readonly string[]) => record(value) && Object.keys(value).every((key) => allowed.includes(key));

function sourceAtoms(structure: Pick<NormalizedMolecularStructure, "chains">) {
  const atoms = new Map<string, { chain: MolecularChain; residue: MolecularResidue; atomName: string }>();
  for (const chain of structure.chains) for (const residue of chain.residues) for (const atom of residue.atoms) atoms.set(atomKey(chain, residue, atom.atomName), { chain, residue, atomName: atom.atomName });
  return atoms;
}
function selectedBinding(selectors: MolecularSelectorAuthorityResult | undefined, bindingId: string) {
  const resolution = selectors?.resolutions.find((item) => item.binding.bindingId === bindingId);
  return resolution?.status === "resolved" ? resolution : undefined;
}
function failure(assertionId: string, status: LocalChemistryFailureCode, reason: string): LocalChemistryResolution { return { status, assertionId, reason }; }

/**
 * Resolves only local chemical identities backed by validated component/atom data.
 * Covalent connectivity here is chemical evidence; P2-E remains the owner of
 * scientific interaction and topology relations.
 */
export function groundLocalChemistry(input: LocalChemistryGroundingInput): LocalChemistryResolution[] {
  const invalid = (reason: string) => (Array.isArray((input as { requests?: unknown }).requests) ? (input as unknown as { requests: readonly LocalChemistryRequest[] }).requests : []).map((request) => failure(String(request?.assertionId ?? "invalid"), "EVIDENCE_INSUFFICIENT", reason));
  if (!onlyKeys(input, ["schemaVersion", "substrate", "structure", "components", "connectivity", "requests"]) || !Array.isArray(input.components) || !Array.isArray(input.requests) || !onlyKeys(input.connectivity, ["termini", "phosphodiesterLinks"])) return invalid("malformed P2-G input or unsupported field");
  if (input.components.some((component) => !onlyKeys(component, ["componentId", "nucleicChemistry", "base", "sugar", "atomNames", "donorAtomNames", "acceptorAtomNames", "evidenceType", "confidence", "limitations"]) || !validComponent(component)) || input.requests.some((request) => !onlyKeys(request, ["assertionId", "bindingId", "componentId", "target", "atomName", "linkId"]) || !targets.has(request.target)) || input.connectivity.termini.some((entry) => !onlyKeys(entry, ["terminus", "residueKey"]) || !termini.has(entry.terminus)) || input.connectivity.phosphodiesterLinks.some((entry) => !onlyKeys(entry, ["linkId", "upstreamResidueKey", "downstreamResidueKey", "atomKeys", "state"]) || !keyPattern.test(entry.linkId) || !["intact", "cleaved"].includes(entry.state) || entry.upstreamResidueKey === entry.downstreamResidueKey || entry.atomKeys.length < 2)) return invalid("malformed P2-G component/request/connectivity or unsupported field");
  if (input.schemaVersion !== "1") return input.requests.map((request) => failure(request.assertionId, "EVIDENCE_INSUFFICIENT", "unknown P2-G schema version"));
  const substrate = input.substrate;
  if (substrate.outcome !== "RESOLVED") return input.requests.map((request) => failure(request.assertionId, "EVIDENCE_INSUFFICIENT", "validated P2-BCDF source/context/selectors are required"));
  if (!substrate.selectors?.valid) return input.requests.map((request) => failure(request.assertionId, "EVIDENCE_INSUFFICIENT", "validated P2-BCDF source/context/selectors are required"));
  if (substrate.structureContext?.structureId !== input.structure.structureId) return input.requests.map((request) => failure(request.assertionId, "EVIDENCE_INSUFFICIENT", "resolved structure context does not match local source structure"));
  const components = new Map(input.components.map((component) => [component.componentId, component]));
  const atoms = sourceAtoms(input.structure);
  const ids = new Set<string>();
  return input.requests.map((request) => {
    if (!keyPattern.test(request.assertionId) || ids.has(request.assertionId)) return failure(request.assertionId, "EVIDENCE_INSUFFICIENT", "assertion ID must be a unique stable ID");
    ids.add(request.assertionId);
    const component = components.get(request.componentId);
    if (!component || !validComponent(component)) return failure(request.assertionId, "COMPONENT_UNRESOLVED", "validated chemical component identity is unavailable");
    const binding = selectedBinding(substrate.selectors, request.bindingId);
    if (!binding || binding.residueKeys.length === 0) return failure(request.assertionId, "EVIDENCE_INSUFFICIENT", "request binding lacks a resolved local residue selector");
    const selectedResidueNames = binding.residueKeys.flatMap((key) => [...atoms.values()].filter((atom) => residueKey(atom.chain, atom.residue) === key).map((atom) => atom.residue.residueName));
    if (!selectedResidueNames.length || selectedResidueNames.some((name) => name.toUpperCase() !== component.componentId.toUpperCase())) return failure(request.assertionId, "CHEMISTRY_INCONSISTENT", "selected residue identity contradicts the declared chemical component");
    const selectedAtoms = binding.residueKeys.flatMap((key) => [...atoms.values()].filter((atom) => residueKey(atom.chain, atom.residue) === key).map((atom) => atomKey(atom.chain, atom.residue, atom.atomName)));
    const requireAtom = (name: string) => component.atomNames.includes(name) && selectedAtoms.some((key) => key.endsWith(`:${name}`));
    const evidence = { sourceId: substrate.provenance.sourceId as string, componentEvidence: component.evidenceType, confidence: component.confidence, limitations: component.limitations };
    const assertion = (atomKeys: readonly string[] = []): LocalChemistryResolution => ({ status: "GROUNDED", assertion: { assertionId: request.assertionId, bindingId: request.bindingId, actorId: binding.binding.actorId, target: request.target, componentId: component.componentId, nucleicChemistry: component.nucleicChemistry, base: component.base, sugar: component.sugar, residueKeys: binding.residueKeys, atomKeys, evidence } });
    if (request.target === "nucleotideContext") return assertion(selectedAtoms);
    if (request.target === "sugar") return component.sugar === "ribose" || component.sugar === "deoxyribose" ? assertion() : failure(request.assertionId, "CHEMICAL_GROUP_UNRESOLVED", "sugar identity is unavailable");
    if (request.target === "twoPrimeHydroxyl") {
      if (component.nucleicChemistry !== "RNA" || component.sugar !== "ribose") return failure(request.assertionId, "CHEMISTRY_INCONSISTENT", "2′-OH cannot be asserted for deoxyribose/DNA");
      return requireAtom("O2'") ? assertion(binding.residueKeys.map((key) => `${key}:O2'`)) : failure(request.assertionId, "ATOM_UNRESOLVED", "RNA 2′-OH requires explicit O2′ source atom");
    }
    if (request.target === "phosphate") return requireAtom("P") ? assertion(binding.residueKeys.map((key) => `${key}:P`)) : failure(request.assertionId, "CHEMICAL_GROUP_UNRESOLVED", "phosphate requires explicit P source atom");
    if (request.target === "base") return assertion();
    if (request.target === "donor" || request.target === "acceptor") {
      if (!request.atomName) return failure(request.assertionId, "ATOM_UNRESOLVED", "donor/acceptor request requires an explicit atom name");
      const allowed = request.target === "donor" ? component.donorAtomNames : component.acceptorAtomNames;
      return allowed.includes(request.atomName) && requireAtom(request.atomName) ? assertion(binding.residueKeys.map((key) => `${key}:${request.atomName}`)) : failure(request.assertionId, "CHEMICAL_GROUP_UNRESOLVED", `${request.target} atom is not validated by the selected component/source atoms`);
    }
    if (request.target === "fivePrimeTerminus" || request.target === "threePrimeTerminus") {
      const terminus = request.target === "fivePrimeTerminus" ? "fivePrime" : "threePrime";
      return input.connectivity.termini.some((entry) => entry.terminus === terminus && binding.residueKeys.includes(entry.residueKey)) ? assertion() : failure(request.assertionId, "TERMINUS_UNRESOLVED", "terminus must be explicitly supplied by molecular connectivity, never residue order or geometry");
    }
    if (request.target === "phosphodiester" || request.target === "cleavageSite") {
      const link = input.connectivity.phosphodiesterLinks.find((entry) => entry.linkId === request.linkId);
      if (!link) return failure(request.assertionId, "CHEMICAL_GROUP_UNRESOLVED", "explicit phosphodiester connectivity link is unavailable");
      if (!binding.residueKeys.includes(link.upstreamResidueKey) && !binding.residueKeys.includes(link.downstreamResidueKey)) return failure(request.assertionId, "CHEMISTRY_INCONSISTENT", "link does not touch the selected nucleotide context");
      if (!link.atomKeys.every((key) => atoms.has(key)) || !link.atomKeys.some((key) => key.startsWith(`${link.upstreamResidueKey}:`)) || !link.atomKeys.some((key) => key.startsWith(`${link.downstreamResidueKey}:`))) return failure(request.assertionId, "ATOM_UNRESOLVED", "phosphodiester link must supply atom sites from both explicit endpoints");
      if (request.target === "phosphodiester" && link.state !== "intact") return failure(request.assertionId, "CHEMISTRY_INCONSISTENT", "intact phosphodiester request references a cleaved link");
      if (request.target === "cleavageSite" && link.state !== "cleaved") return failure(request.assertionId, "CHEMISTRY_INCONSISTENT", "cleavage request requires an explicitly cleaved connectivity link");
      return assertion(link.atomKeys);
    }
    return failure(request.assertionId, "EVIDENCE_INSUFFICIENT", "unsupported local chemical assertion");
  });
}

/** The only executable, runtime-authenticated P2-G handoff to P2-E. */
export function groundAuthenticatedLocalChemistry(input: LocalChemistryGroundingInput): GroundedLocalChemistryResult | readonly LocalChemistryResolution[] {
  const resolutions = groundLocalChemistry(input);
  if (resolutions.some((resolution) => resolution.status !== "GROUNDED") || input.substrate.outcome !== "RESOLVED" || !input.substrate.structureContext) return resolutions;
  const assertions = resolutions.map((resolution) => (resolution as Extract<LocalChemistryResolution, { status: "GROUNDED" }>).assertion);
  const resolved = input.substrate.selectors!.resolutions.filter((item): item is Extract<MolecularSelectorAuthorityResult["resolutions"][number], { status: "resolved" }> => item.status === "resolved");
  const linkAssertions: LocalChemicalLinkAssertion[] = [];
  for (const request of input.requests) if (request.target === "phosphodiester" || request.target === "cleavageSite") {
    const link = input.connectivity.phosphodiesterLinks.find((entry) => entry.linkId === request.linkId);
    if (!link) continue;
    const endpoint = (residueKey: string) => {
      const binding = resolved.find((item) => item.residueKeys.includes(residueKey));
      const atomKeys = link.atomKeys.filter((key) => key.startsWith(`${residueKey}:`));
      return binding && atomKeys.length ? { actorId: binding.binding.actorId, selectorBindingId: binding.binding.bindingId, residueKey, atomKeys } : undefined;
    };
    const upstream = endpoint(link.upstreamResidueKey); const downstream = endpoint(link.downstreamResidueKey);
    if (!upstream || !downstream || upstream.residueKey === downstream.residueKey) return resolutions.map((resolution) => resolution.status === "GROUNDED" && resolution.assertion.assertionId === request.assertionId ? failure(request.assertionId, "CHEMISTRY_INCONSISTENT", "binary link endpoints must each have a resolved selector binding and atom site") : resolution);
    linkAssertions.push({ linkAssertionId: request.assertionId, linkKind: request.target === "phosphodiester" ? "PHOSPHODIESTER" : "CLEAVAGE_SITE", linkId: link.linkId, endpoints: [upstream, downstream], evidence: assertions.find((assertion) => assertion.assertionId === request.assertionId)!.evidence });
  }
  const result: GroundedLocalChemistryResult = { schemaVersion: "2", substrateSourceId: String(input.substrate.provenance.sourceId), structureId: input.substrate.structureContext.structureId, selectorBindingIds: assertions.map((assertion) => assertion.bindingId), assertions, linkAssertions };
  authenticatedResults.add(result);
  return result;
}

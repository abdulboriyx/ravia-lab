/** P2-C: authoritative renderer-independent molecular identity and selector grounding. */
import type { MolecularChain, MolecularResidue, NormalizedMolecularStructure } from "./biology-structure-grounding.ts";
import type { ScientificActorId, ScientificActorScene, ScientificGroupId } from "./scientific-actor.ts";
import type { ResolvedStructureContext } from "./p2-d-structure-context.ts";

export const molecularSelectorGroundingSchemaVersion = "1" as const;
export type MolecularChainNamespace = "normalized" | "label" | "auth";
export type MolecularResidueNamespace = "sequence" | "label" | "auth";
export type MolecularTerminus = "fivePrime" | "threePrime" | "amino" | "carboxyl";
export type MolecularLocalGroupKind = "base" | "sugar" | "phosphate" | "domain";

export type StructureChainSelector = { kind: "chain"; structureId: string; chain: { namespace: MolecularChainNamespace; id: string } };
export type StructureResidueSelector = { kind: "residue"; structureId: string; chain: StructureChainSelector["chain"]; residue: { start: number; end: number; namespace: MolecularResidueNamespace } };
export type StructureAtomSelector = { kind: "atom"; structureId: string; chain: StructureChainSelector["chain"]; residue: StructureResidueSelector["residue"]; atomNames: string[] };
export type StructureTerminusSelector = { kind: "terminus"; structureId: string; chain: StructureChainSelector["chain"]; terminus: MolecularTerminus };
export type StructureLocalGroupSelector = { kind: "localGroup"; structureId: string; chain: StructureChainSelector["chain"]; residue: StructureResidueSelector["residue"]; group: MolecularLocalGroupKind; base?: "A" | "C" | "G" | "T" | "U"; domainId?: string };
export type ScientificLocalGroupSelector = { kind: "scientificGroup"; groupId: ScientificGroupId; memberActorIds: ScientificActorId[] };
export type MolecularIdentitySelector = StructureChainSelector | StructureResidueSelector | StructureAtomSelector | StructureTerminusSelector | StructureLocalGroupSelector | ScientificLocalGroupSelector;

export type MolecularIdentityBinding = {
  bindingId: string;
  actorId: ScientificActorId;
  /** Persistent scientific instance identity is copied, never replaced by a renderer key. */
  instanceId?: string;
  selector: MolecularIdentitySelector;
};

export type MolecularSelectorResolution =
  | { status: "resolved"; binding: MolecularIdentityBinding; chainIds: string[]; residueKeys: string[]; atomKeys: string[]; groupId?: ScientificGroupId }
  | { status: "ambiguous"; binding: MolecularIdentityBinding; candidateChainIds: string[]; reason: string }
  | { status: "unresolved"; binding: MolecularIdentityBinding; reason: string };

export type MolecularSelectorAuthorityInput = {
  schemaVersion: typeof molecularSelectorGroundingSchemaVersion;
  actorScene: ScientificActorScene;
  /** Optional deposited/computed structure data. No assembly or geometry choice is made here. */
  structure?: Pick<NormalizedMolecularStructure, "structureId" | "chains">;
  resolvedContext: ResolvedStructureContext;
  bindings: MolecularIdentityBinding[];
};

export type MolecularSelectorAuthorityResult = { valid: true; resolutions: MolecularSelectorResolution[]; issues: [] } | { valid: false; resolutions: MolecularSelectorResolution[]; issues: Array<{ path: string; message: string }> };

const validId = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const bases = new Set(["A", "C", "G", "T", "U"]);
const keyForResidue = (chain: MolecularChain, residue: MolecularResidue) => `${chain.id}:${residue.residueSequence}${residue.residueInsertionCode || ""}`;
const atomKey = (chain: MolecularChain, residue: MolecularResidue, atomName: string) => `${keyForResidue(chain, residue)}:${atomName}`;

function chainsFor(chainRef: StructureChainSelector["chain"], structure: Pick<NormalizedMolecularStructure, "chains">): MolecularChain[] {
  return structure.chains.filter((chain) => chainRef.namespace === "normalized" ? chain.id === chainRef.id : chainRef.namespace === "label" ? chain.labelAsymId === chainRef.id : chain.authAsymId === chainRef.id);
}
function residueNumber(residue: MolecularResidue, index: number, namespace: MolecularResidueNamespace): number | undefined {
  return namespace === "sequence" ? index + 1 : namespace === "label" ? residue.labelSeqId : residue.authSeqId;
}
function residuesFor(chain: MolecularChain, range: StructureResidueSelector["residue"]): MolecularResidue[] {
  return chain.residues.filter((residue, index) => { const number = residueNumber(residue, index, range.namespace); return number !== undefined && number >= range.start && number <= range.end; });
}
function issue(issues: Array<{ path: string; message: string }>, path: string, message: string) { issues.push({ path, message }); }
function unknownKeys(value: unknown, allowed: readonly string[], path: string, issues: Array<{ path: string; message: string }>) {
  if (!value || typeof value !== "object" || Array.isArray(value)) { issue(issues, path, "must be an object"); return; }
  for (const key of Object.keys(value)) if (!allowed.includes(key)) issue(issues, `${path}.${key}`, "unknown field is not allowed");
}
function requiresStructure(selector: MolecularIdentitySelector): selector is Exclude<MolecularIdentitySelector, ScientificLocalGroupSelector> { return selector.kind !== "scientificGroup"; }

function validateSelector(selector: MolecularIdentitySelector, path: string, issues: Array<{ path: string; message: string }>) {
  unknownKeys(selector, selector.kind === "chain" ? ["kind", "structureId", "chain"] : selector.kind === "residue" ? ["kind", "structureId", "chain", "residue"] : selector.kind === "atom" ? ["kind", "structureId", "chain", "residue", "atomNames"] : selector.kind === "terminus" ? ["kind", "structureId", "chain", "terminus"] : selector.kind === "localGroup" ? ["kind", "structureId", "chain", "residue", "group", "base", "domainId"] : ["kind", "groupId", "memberActorIds"], path, issues);
  if (selector.kind === "scientificGroup") {
    if (!String(selector.groupId).startsWith("group-")) issue(issues, `${path}.groupId`, "must be a stable F2 group ID");
    if (!Array.isArray(selector.memberActorIds) || selector.memberActorIds.length === 0) issue(issues, `${path}.memberActorIds`, "must name scientific actors");
    return;
  }
  unknownKeys(selector.chain, ["namespace", "id"], `${path}.chain`, issues);
  if (!selector.structureId) issue(issues, `${path}.structureId`, "is required");
  if (!selector.chain.id || !["normalized", "label", "auth"].includes(selector.chain.namespace)) issue(issues, `${path}.chain`, "must be an explicit valid chain reference");
  if ("residue" in selector) {
    const range = selector.residue;
    if (!Number.isInteger(range.start) || !Number.isInteger(range.end) || range.start > range.end) issue(issues, `${path}.residue`, "must contain a non-contradictory integer range");
    if (!["sequence", "label", "auth"].includes(range.namespace)) issue(issues, `${path}.residue.namespace`, "is invalid");
  }
  if (selector.kind === "atom" && (!selector.atomNames.length || new Set(selector.atomNames).size !== selector.atomNames.length || selector.atomNames.some((name) => !name))) issue(issues, `${path}.atomNames`, "must be unique non-empty atom names");
  if (selector.kind === "terminus" && !["fivePrime", "threePrime", "amino", "carboxyl"].includes(selector.terminus)) issue(issues, `${path}.terminus`, "is invalid");
  if (selector.kind === "localGroup") {
    if (selector.group === "base" && !selector.base) issue(issues, `${path}.base`, "is required for a base selector");
    if (selector.group !== "base" && selector.base !== undefined) issue(issues, `${path}.base`, "is only allowed for a base selector");
    if (selector.group === "domain" && !selector.domainId) issue(issues, `${path}.domainId`, "is required for a domain selector");
  }
}

function resolveStructureBinding(binding: MolecularIdentityBinding, structure: Pick<NormalizedMolecularStructure, "structureId" | "chains">, context: ResolvedStructureContext): MolecularSelectorResolution {
  const selector = binding.selector as Exclude<MolecularIdentitySelector, ScientificLocalGroupSelector>;
  if (selector.structureId !== structure.structureId) return { status: "unresolved", binding, reason: "selector structure does not match supplied structure data" };
  const candidates = chainsFor(selector.chain, structure);
  const selected = new Set(context.chainIds);
  const contextCandidates = candidates.filter((chain) => selected.has(chain.id));
  if (contextCandidates.length === 0) return { status: "unresolved", binding, reason: "selector chain is outside the selected assembly/model context" };
  if (contextCandidates.length !== candidates.length) return { status: "unresolved", binding, reason: "selector resolves partly outside the selected structure context" };
  if (candidates.length === 0) return { status: "unresolved", binding, reason: "explicit chain selector has no match" };
  if (candidates.length > 1) return { status: "ambiguous", binding, candidateChainIds: candidates.map((chain) => chain.id), reason: "chain selector resolves to multiple chains; no first-chain choice is permitted" };
  const chain = contextCandidates[0]!;
  if (selector.kind === "chain") return { status: "resolved", binding, chainIds: [chain.id], residueKeys: [], atomKeys: [] };
  if (selector.kind === "terminus") {
    const nucleic = chain.entityType === "dna" || chain.entityType === "rna";
    if ((selector.terminus === "fivePrime" || selector.terminus === "threePrime") && !nucleic) return { status: "unresolved", binding, reason: "nucleic terminus requires a DNA or RNA chain" };
    if ((selector.terminus === "amino" || selector.terminus === "carboxyl") && chain.entityType !== "protein") return { status: "unresolved", binding, reason: "protein terminus requires a protein chain" };
    const residue = (selector.terminus === "fivePrime" || selector.terminus === "amino") ? chain.residues[0] : chain.residues.at(-1);
    return residue ? { status: "resolved", binding, chainIds: [chain.id], residueKeys: [keyForResidue(chain, residue)], atomKeys: [] } : { status: "unresolved", binding, reason: "chain has no residues for requested terminus" };
  }
  const residues = residuesFor(chain, selector.residue);
  if (!residues.length) return { status: "unresolved", binding, reason: "residue selector has no match" };
  if (selector.kind === "residue") return { status: "resolved", binding, chainIds: [chain.id], residueKeys: residues.map((residue) => keyForResidue(chain, residue)), atomKeys: [] };
  if (selector.kind === "atom") {
    const atoms = residues.flatMap((residue) => selector.atomNames.filter((name) => residue.atoms.some((atom) => atom.atomName === name)).map((name) => atomKey(chain, residue, name)));
    if (atoms.length !== residues.length * selector.atomNames.length) return { status: "unresolved", binding, reason: "atom selector names atoms absent from the explicit residue selection" };
    return { status: "resolved", binding, chainIds: [chain.id], residueKeys: residues.map((residue) => keyForResidue(chain, residue)), atomKeys: atoms };
  }
  if (selector.group === "base" && !residues.every((residue) => residue.residueName.toUpperCase() === selector.base && bases.has(residue.residueName.toUpperCase()))) return { status: "unresolved", binding, reason: "base selector contradicts explicit residue identity" };
  if (selector.group === "sugar" && !residues.every((residue) => residue.atoms.some((atom) => /^C1['*]$/.test(atom.atomName)))) return { status: "unresolved", binding, reason: "sugar group requires an explicit C1′ atom" };
  if (selector.group === "phosphate" && !residues.every((residue) => residue.atoms.some((atom) => atom.atomName === "P"))) return { status: "unresolved", binding, reason: "phosphate group requires an explicit P atom" };
  return { status: "resolved", binding, chainIds: [chain.id], residueKeys: residues.map((residue) => keyForResidue(chain, residue)), atomKeys: [] };
}

/** Resolves explicit scientific/structure selectors without making assembly, geometry, or interaction decisions. */
export function resolveMolecularIdentitySelectors(input: MolecularSelectorAuthorityInput): MolecularSelectorAuthorityResult {
  const issues: Array<{ path: string; message: string }> = [];
  const resolutions: MolecularSelectorResolution[] = [];
  if (input.schemaVersion !== "1") issue(issues, "input.schemaVersion", "must be selector grounding v1");
  unknownKeys(input, ["schemaVersion", "actorScene", "structure", "resolvedContext", "bindings"], "input", issues);
  if (!input.resolvedContext || input.resolvedContext.structureId !== input.structure?.structureId) issue(issues, "input.resolvedContext", "must match supplied normalized structure context");
  const actors = new Map(input.actorScene.actors.map((actor) => [actor.actorId, actor]));
  const bindings = new Set<string>();
  input.bindings.forEach((binding, index) => {
    const path = `bindings[${index}]`;
    if (!validId.test(binding.bindingId)) issue(issues, `${path}.bindingId`, "must be a stable ID");
    if (bindings.has(binding.bindingId)) issue(issues, `${path}.bindingId`, "must be unique"); bindings.add(binding.bindingId);
    const actor = actors.get(binding.actorId);
    if (!actor) { issue(issues, `${path}.actorId`, "references a missing scientific actor"); return; }
    if (binding.instanceId !== undefined && binding.instanceId !== actor.instanceId) issue(issues, `${path}.instanceId`, "must preserve the actor's persistent instance identity");
    validateSelector(binding.selector, `${path}.selector`, issues);
    if (binding.selector.kind === "scientificGroup") {
      const groupSelector = binding.selector;
      const group = input.actorScene.groups.find((candidate) => candidate.groupId === groupSelector.groupId);
      if (!group) resolutions.push({ status: "unresolved", binding, reason: "scientific group selector is dangling" });
      else if (group.memberActorIds.length !== groupSelector.memberActorIds.length || !group.memberActorIds.every((id) => groupSelector.memberActorIds.includes(id))) resolutions.push({ status: "unresolved", binding, reason: "scientific group members contradict the F2 group" });
      else {
        const groupId = group.groupId;
        const memberActorIds = group.memberActorIds;
        resolutions.push({ status: "resolved", binding, chainIds: [], residueKeys: [], atomKeys: [], groupId });
        if (memberActorIds.length !== groupSelector.memberActorIds.length || !memberActorIds.every((id) => groupSelector.memberActorIds.includes(id))) resolutions[resolutions.length - 1] = { status: "unresolved", binding, reason: "scientific group members contradict the F2 group" };
      }
    } else if (!input.structure) resolutions.push({ status: "unresolved", binding, reason: "structure selector requires supplied structure data" });
    else resolutions.push(resolveStructureBinding(binding, input.structure, input.resolvedContext));
  });
  return issues.length ? { valid: false, resolutions, issues } : { valid: true, resolutions, issues: [] };
}

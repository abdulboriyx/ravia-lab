/** F7-A: thin, explicit DNA migration proof. It adapts into existing owners only. */
import { parseBiologyScenePrompt } from "./biology-parser.ts";
import { adaptDnaMechanismSpec, adaptDnaPromptSelection, assertLegacyAdapterResult } from "./semantic-intent-legacy-adapters.ts";
import { routeDnaMechanismPresentation, type DnaMechanismPresentationRoute } from "./DnaMechanismPresentationRouter.ts";
import { createDnaBasePairMechanismSpec, type DnaCanonicalPair } from "./DnaBasePairInteractionPresentation.ts";
import { buildDnaMechanismRepresentationPlan } from "./dna-mechanism-resolution.ts";
import { resolveDnaMechanismFamily } from "./dna-mechanism-intent.ts";
import { resolveDnaTemplateRendererOwner, resolveDnaVisualTemplate, type DnaVisualTemplate, type DnaTemplateRendererOwner } from "./biology-dna-visual-dispatcher.ts";
import { capabilityRegistryById, type CapabilityRegistryRecord } from "./capability-registry.ts";
import { validateSceneSpecV1, type SceneSpecV1 } from "./scene-spec-v1.ts";
import type { SemanticIntentV1 } from "./semantic-intent.ts";
import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";
import type { DnaMechanismSpec } from "./dna-mechanism-contract.ts";
import { createFoundationLegacyMigration, type FoundationLegacyMigration } from "./foundation-legacy-migration-seam.ts";

export type DnaFoundationMigrationSource = "structure" | "basePairMechanism";
export type DnaFoundationRenderer =
  | { kind: "dnaTemplate"; owner: DnaTemplateRendererOwner; template: DnaVisualTemplate }
  | { kind: "dnaMechanism"; owner: string; route: DnaMechanismPresentationRoute };

export type DnaFoundationMigrationProof = {
  rawPrompt: string;
  source: DnaFoundationMigrationSource;
  semanticIntent: SemanticIntentV1;
  capability: CapabilityRegistryRecord;
  sceneSpec: SceneSpecV1;
  renderer: DnaFoundationRenderer;
  fidelitySourceIds: readonly string[];
  seam: FoundationLegacyMigration<DnaFoundationRenderer>;
};

export type DnaFoundationMigrationInput = {
  rawPrompt: string;
  source: DnaFoundationMigrationSource;
  scientificScene: ScientificSceneSpec;
  /** Pair identity supplied by the semantic stage, never inferred by rendering. */
  pair?: DnaCanonicalPair;
};

function sceneSpecWithIntent(intent: SemanticIntentV1, scientificScene: ScientificSceneSpec): SceneSpecV1 {
  return {
    schemaVersion: "1",
    sceneId: scientificScene.sceneId,
    compatibility: { semanticIntent: "1", scientificScene: "1" },
    semanticIntent: intent,
    scientificScene,
  };
}

function capabilityFor(source: DnaFoundationMigrationSource, routeFamily: string): CapabilityRegistryRecord {
  const capabilityId = source === "structure" ? "dna-canonical-structure" : "dna-base-pairing";
  const capability = capabilityRegistryById.get(capabilityId);
  if (!capability) throw new Error(`Missing Foundation capability ${capabilityId}.`);
  if (capability.domain !== "DNA" || capability.family !== (source === "structure" ? "structure" : routeFamily === "basePairing" ? "structure" : "")) {
    throw new Error(`Capability ${capabilityId} does not match the migration source.`);
  }
  return capability;
}

function requireSceneSpec(spec: SceneSpecV1): void {
  const validation = validateSceneSpecV1(spec);
  if (!validation.valid) throw new Error(`DNA migration produced invalid SceneSpec: ${validation.issues.map((entry) => `${entry.path}: ${entry.message}`).join("; ")}`);
}

function preservePairIdentity(intent: SemanticIntentV1, pair: DnaCanonicalPair): SemanticIntentV1 {
  const pairIds = pair === "A-T" ? (["adenine", "thymine"] as const) : (["guanine", "cytosine"] as const);
  const request = intent.requests[0];
  if (!request) return intent;
  const subjects = [...request.subjects];
  for (const resolvedId of pairIds) if (!subjects.some((subject) => subject.resolvedId === resolvedId)) subjects.push({ rawText: resolvedId, resolvedId });
  return { ...intent, requests: [{ ...request, subjects, phenomenon: "canonicalBasePairing", states: ["paired"], focus: "relationship" }, ...intent.requests.slice(1)] };
}

/**
 * Runs the existing prompt/semantic/selection path and adapts it into the
 * frozen SceneSpec envelope. No renderer or geometry is recreated here.
 */
export function migrateDnaFoundationRequest(input: DnaFoundationMigrationInput): DnaFoundationMigrationProof {
  if (!input.rawPrompt.trim()) throw new Error("DNA migration requires the original prompt.");
  if (input.source === "structure") {
    const parsed = parseBiologyScenePrompt(input.rawPrompt);
    if (parsed.status !== "supported" || !parsed.dnaSelection) throw new Error("Existing DNA structure parser did not produce a DNA selection.");
    const adapted = adaptDnaPromptSelection(parsed.dnaSelection, input.rawPrompt);
    assertLegacyAdapterResult(adapted);
    const scene = parsed.scene;
    const template = resolveDnaVisualTemplate(scene, parsed.dnaSelection);
    if (!template) throw new Error("Existing DNA visual dispatcher did not produce a template.");
    const sceneSpec = sceneSpecWithIntent(adapted.intent, input.scientificScene);
    requireSceneSpec(sceneSpec);
    const capability = capabilityFor(input.source, template.family);
    const renderer: DnaFoundationRenderer = { kind: "dnaTemplate", owner: resolveDnaTemplateRendererOwner(template), template };
    const seam = createFoundationLegacyMigration({ semanticIntent: adapted.intent, capability, sceneSpec, productionOwner: renderer.owner, legacyOutput: renderer, fidelitySourceIds: input.scientificScene.fidelityProvenance.sources.map((source) => source.sourceId) });
    return {
      rawPrompt: input.rawPrompt,
      source: input.source,
      semanticIntent: adapted.intent,
      capability,
      sceneSpec,
      renderer,
      fidelitySourceIds: input.scientificScene.fidelityProvenance.sources.map((source) => source.sourceId),
      seam,
    };
  }

  if (resolveDnaMechanismFamily(input.rawPrompt)?.family !== "basePairing") throw new Error("Existing DNA mechanism resolver did not identify base pairing.");
  if (!input.pair) throw new Error("Base-pair migration requires a resolved pair identity.");
  const sourceSpec = createDnaBasePairMechanismSpec(input.pair);
  const route = routeDnaMechanismPresentation(buildDnaMechanismRepresentationPlan(sourceSpec));
  const adapted = adaptDnaMechanismSpec(sourceSpec as DnaMechanismSpec, input.rawPrompt);
  assertLegacyAdapterResult(adapted);
  const semanticIntent = preservePairIdentity(adapted.intent, input.pair);
  assertLegacyAdapterResult({ ...adapted, intent: semanticIntent });
  const sceneSpec = sceneSpecWithIntent(semanticIntent, input.scientificScene);
  requireSceneSpec(sceneSpec);
  const capability = capabilityFor(input.source, route.family);
  const renderer: DnaFoundationRenderer = { kind: "dnaMechanism", owner: route.owner, route };
  const seam = createFoundationLegacyMigration({ semanticIntent, capability, sceneSpec, productionOwner: renderer.owner, legacyOutput: renderer, fidelitySourceIds: input.scientificScene.fidelityProvenance.sources.map((source) => source.sourceId) });
  return {
    rawPrompt: input.rawPrompt,
    source: input.source,
    semanticIntent,
    capability,
    sceneSpec,
    renderer,
    fidelitySourceIds: input.scientificScene.fidelityProvenance.sources.map((source) => source.sourceId),
    seam,
  };
}

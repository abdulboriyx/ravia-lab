/**
 * F7-B migration proof: Foundation contracts own resolved scientific meaning;
 * the accepted DNA mechanism presentation remains the rendering owner.
 *
 * Prompt parsing is deliberately confined to `resolveDnaMechanismIntent` at
 * ingress.  The adapter below accepts resolved contracts and never inspects
 * prompt text.
 */
import { routeDnaMechanismPresentation, type DnaMechanismPresentationRoute } from "./DnaMechanismPresentationRouter.ts";
import { buildDnaMechanismRepresentationPlan } from "./dna-mechanism-resolution.ts";
import { resolveDnaMechanismIntent, type DnaMechanismIntent } from "./dna-mechanism-intent.ts";
import type { DnaMechanismSpec } from "./dna-mechanism-contract.ts";
import { adaptDnaMechanismSpec } from "./semantic-intent-legacy-adapters.ts";
import { capabilityRegistryById, type CapabilityRegistryRecord } from "./capability-registry.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";
import { timelineContextFromScene, type ScientificTimeline } from "./scientific-timeline.ts";
import type { SceneSpecV1 } from "./scene-spec-v1.ts";
import { actorId } from "./scientific-actor.ts";
import { createFoundationLegacyMigration, type FoundationLegacyMigration } from "./foundation-legacy-migration-seam.ts";

export const dnaStrandSeparationCapabilityId = "dna-strand-separation" as const;
export const retainedDnaStrandSeparationOwner = "DnaStrandSeparationPresentation" as const;

export type DnaStrandSeparationMigration = {
  semanticIntent: SceneSpecV1["semanticIntent"];
  capability: CapabilityRegistryRecord;
  scientificScene: ScientificSceneSpec;
  timeline: ScientificTimeline;
  sceneSpec: SceneSpecV1;
  /** The existing accepted DNA mechanism route; it receives a resolved plan only. */
  presentation: DnaMechanismPresentationRoute;
  seam: FoundationLegacyMigration<DnaMechanismPresentationRoute>;
};

const strandActors = [actorId("dna-template-1"), actorId("dna-coding-1")] as const;

/** Creates the F2 scientific transition with persistent strands and intact backbones. */
export function createDnaStrandSeparationScientificScene(): ScientificSceneSpec {
  const base = structuredClone(scientificSceneSpecFixtures["strand-separation"]);
  return {
    ...base,
    states: [
      { stateId: "closed-duplex", kind: "closed", actorIds: [...strandActors] },
      ...base.states,
    ],
    topology: {
      ...base.topology,
      changes: [{
        changeId: "change-strand-opening",
        kind: "separation",
        actorIds: [...strandActors],
        interactionIds: ["opened-pair-1"],
      }],
    },
    constraints: [{
      constraintId: "constraint-backbones-remain-continuous",
      kind: "preservesContinuity",
      actorIds: [...strandActors],
      interactionIds: [],
      stateIds: ["closed-duplex", "locally-open"],
      description: "Opening disrupts the inter-strand pairing interaction, not either strand backbone.",
    }],
  };
}

/** Timeline data is contract data; it does not introduce an animation engine. */
export function createDnaStrandSeparationTimeline(scene: ScientificSceneSpec): ScientificTimeline {
  return {
    schemaVersion: "1",
    timelineId: "timeline-strand-separation",
    clock: { duration: 1, unit: "seconds" },
    initialMechanismStateId: "closed",
    states: [
      { mechanismStateId: "closed", scientificStateId: "closed-duplex", kind: "before", actorIds: [...strandActors] },
      { mechanismStateId: "opened", scientificStateId: "locally-open", kind: "after", actorIds: [...strandActors], topologyChangeIds: ["change-strand-opening"] },
    ],
    transitions: [{ transitionId: "transition-strand-opening", fromMechanismStateId: "closed", toMechanismStateId: "opened", start: 0, end: 1 }],
    events: [
      { eventId: "event-opened-pair", at: 1, kind: "topologyChanged", actorIds: [...strandActors], interactionId: "opened-pair-1", topologyChangeId: "change-strand-opening", stateId: "locally-open" },
    ],
    tracks: [],
    chapters: [{ chapterId: "chapter-strand-opening", start: 0, end: 1, stateIds: ["closed-duplex", "locally-open"], transitionIds: ["transition-strand-opening"], eventIds: ["event-opened-pair"] }],
  };
}

/** Resolves the sole F5 capability from semantic meaning, not prompt text. */
export function resolveDnaStrandSeparationCapability(intent: SceneSpecV1["semanticIntent"]): CapabilityRegistryRecord | undefined {
  const request = intent.requests[0];
  if (request?.phenomenon !== "strandSeparation") return undefined;
  // Existing F1 adaptation retains the explicit hydrogen-bond mechanism for
  // this legacy mechanism spec; the phenomenon is the capability discriminator.
  if (request.mechanism !== "strandOpening" && request.mechanism !== "strandReannealing" && request.mechanism !== "hydrogenBonding") return undefined;
  return capabilityRegistryById.get(dnaStrandSeparationCapabilityId);
}

/**
 * Thin renderer adapter. It has no prompt argument and does no prompt parsing;
 * renderer ownership remains in DnaMechanismPresentationRouter.
 */
export function adaptDnaStrandSeparationToExistingPresentation(spec: DnaMechanismSpec): DnaMechanismPresentationRoute {
  if (spec.family !== "strandSeparation") throw new Error("F7-B adapter accepts only resolved strand-separation mechanism specs.");
  return routeDnaMechanismPresentation(buildDnaMechanismRepresentationPlan(spec));
}

/** F7 ingress proof: prompt → F1 → F5 → F2/F3/F4 → retained presentation. */
export function migrateDnaStrandSeparationPrompt(prompt: string): DnaStrandSeparationMigration | undefined {
  const resolved: DnaMechanismIntent | undefined = resolveDnaMechanismIntent(prompt);
  if (!resolved || resolved.family !== "strandSeparation") return undefined;
  const semanticIntent = adaptDnaMechanismSpec(resolved.spec, prompt).intent;
  const capability = resolveDnaStrandSeparationCapability(semanticIntent);
  if (!capability) return undefined;
  const scientificScene = createDnaStrandSeparationScientificScene();
  const timeline = createDnaStrandSeparationTimeline(scientificScene);
  const sceneSpec: SceneSpecV1 = {
    schemaVersion: "1",
    sceneId: scientificScene.sceneId,
    compatibility: { semanticIntent: "1", scientificScene: "1", timeline: "1" },
    semanticIntent,
    scientificScene,
    timeline,
  };
  const presentation = adaptDnaStrandSeparationToExistingPresentation(resolved.spec);
  const seam = createFoundationLegacyMigration({ semanticIntent, capability, sceneSpec, productionOwner: presentation.owner, legacyOutput: presentation });
  return { semanticIntent, capability, scientificScene, timeline, sceneSpec, presentation, seam };
}

/** Kept exportable for focused tests and future migration audits. */
export const dnaStrandSeparationTimelineContext = timelineContextFromScene;

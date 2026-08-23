# TeachingPlan v2 migration

TeachingPlan v1 remains valid without change. TeachingPlan v2 is an additive,
renderer-independent extension for compiler-produced plans.

V2 adds only authoritative F2/F3 identifiers to `TeachingReference`:

- `scientificState`, `interaction`, and `topologyChange` from ScientificSceneSpec;
- `timelineChapter`, `timelineEvent`, and `timelineTransition` from an optional,
  validated ScientificTimeline;
- `objectiveTrace`, which records capability, semantic phenomenon/mechanism,
  stable focus actors, and teaching mode.

V1 rejects these V2-only references and `objectiveTrace`. V2 validation requires
every reference to resolve against the supplied F2 scene and, when applicable,
the supplied F3 timeline. Neither version admits renderer coordinates, anchors,
camera state, geometry, or scientific mutation.

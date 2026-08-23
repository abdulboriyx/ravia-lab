# Teaching Runtime v1 baseline

Status: frozen after A-I audit.

## A. Canonical architecture

The single teaching path is:

```text
SemanticIntent + grounded ScientificSceneSpec/ScientificTimeline
  -> TeachingCompiler
  -> TeachingPlan v3
  -> TeachingChapterProgramV1
  -> AudienceTeachingProgramV1
  -> evaluateTeachingAtTime(...)
  -> TeachingSnapshotV1
  -> TeachingTextBundleV1 + NarrationCueProgramV1
  -> ProductionTeachingViewV1
  -> production teaching surface
```

The production adapter is a projection of evaluated teaching state. It does
not create chapters, infer audience policy, evaluate science, or own time.
There is no competing teaching architecture in the migrated path.

## B. Authority ownership

| Owner | Authority |
| --- | --- |
| P2 | actors, scientific states, interactions, topology, provenance, fidelity |
| P3 | mechanism time, events, transitions, exact scientific state at `t` |
| P4 | exact render state, camera, frame/image export |
| Teaching | objectives, chapter/dependency structure, disclosure, audience depth, misconception pedagogy, grounded wording, narration/caption metadata |
| Production UI/renderer | display, existing label anchors, layout, geometry, camera, and other presentation concerns |

Teaching suppression is pedagogical visibility, never scientific absence.

## C. TeachingPlan versions

The versions remain distinct:

- v1 retains the original plan shape and compatibility behavior.
- v2 adds extended authoritative scientific and timeline reference kinds.
- v3 adds `chapterRole`, `dependsOnChapterIds`, disclosure metadata, bounded
  detail, and optional authoritative timeline mapping.

Validation is version-aware. v1 does not silently accept v2/v3-only fields;
v2 accepts the extended scientific/timeline references but not v3-only chapter
metadata; v3 accepts the complete current contract. Future incompatible changes
require a new version.

## D. Chapter and disclosure model

`TeachingChapterProgramV1` contains explicit roles, dependency edges, disclosure
focus/context/suppression, content IDs, provenance refs, and timeline refs.
Dependencies are interpreted by ID/topological semantics, not source-array
position. Disclosure does not mutate P2 state or P3 state.

## E. Audience model

The canonical levels are `BEGINNER`, `INTERMEDIATE`, and `ADVANCED`. Projection
changes terminology, explanation depth, disclosure depth, annotation density,
mechanism granularity, and bounded detail ceiling. It does not change actors,
states, interactions, topology, or provenance truth. Advanced detail cannot
exceed supported grounded fidelity.

## F. Exact-time evaluator

`evaluateTeachingAtTime(...)` is pure, stateless, deterministic, and
history-independent. It consumes the canonical supplied time and optional P3
state; it does not create a clock. Direct seek, backward seek, restart,
repeated-time, frame-rate, and dropped-sample equivalence are covered by tests.
Temporal DNA separation and RNA cleavage snapshots align with P3 boundaries.
Static programs use explicit manual chapter cursors and do not fabricate a
scientific timeline.

## G. Wording and narration

`TeachingTextBundleV1` uses bounded deterministic templates over validated
structured refs. It preserves scientific-claim, target, provenance, and fidelity
refs and keeps SHOW, EXPLAIN, WHY, COMPARE, and correction modes distinct.
`TeachingWordingProviderV1` is optional and bounded to supplied structured
context; the deterministic template path is complete without it.

`NarrationCueProgramV1` and caption segments contain text/metadata and derive
activation from chapter/timeline state. TTS, audio files, playback, voices, and
audio synchronization are not implemented and are outside Teaching Runtime v1.

## H. Production adapter

`ProductionTeachingViewV1` is renderer-independent and serializable. The DOM
surface supports objective/text, chapter navigation, audience selection,
focus/context/suppression refs, correction/comparison segments, provenance
counts, and explicit unsupported states. Existing renderer owners retain label
anchors, geometry, and camera authority. The view records
`TEACHING_DOM_EXPORT_NOT_YET_GUARANTEED`; current P4 capture remains canvas-only.

React may own panel state, audience selection, and explicit manual chapter
selection. It does not own scientific state, canonical temporal chapter state,
causal truth, or teaching content generation.

## I. Benchmark baseline

Teaching Benchmark v1 is frozen at 120 cases: 90 DEV and 30
`SEALED_HOLDOUT`. The holdout SHA-256 is
`7671c065e25979865fa15c471c3e6f13c9dacc0575178aa7f1a76d27c17c56a5`.
The baseline is 120/120 passed, 0 critical failures, and 13/13 scoring
dimensions at 100%.

## J. Support matrix

| Capability | Status | Boundary |
| --- | --- | --- |
| DNA static structure/pairing | `TEACHING_PRODUCTION_MIGRATED` | grounded static teaching and manual chapters |
| RNA hairpin | `TEACHING_PRODUCTION_MIGRATED` | grounded static stem/loop teaching; no fabricated time |
| DNA strand separation | `TEACHING_PRODUCTION_MIGRATED` | P3-aligned time-following chapters |
| RNA cleavage | `TEACHING_PRODUCTION_MIGRATED` | intact/boundary/broken-continuity states only where grounded |
| DNA/RNA comparison | `TEACHING_PRODUCTION_MIGRATED` | compiled contrast refs and deterministic sequence |
| misconception correction | `TEACHING_EXECUTABLE` | structured correction/evidence input required |
| RNA exonuclease fragment teaching | `TEACHING_UNSUPPORTED` | preserves `FRAGMENTATION_UNGROUNDED` |
| broader biology teaching | `TEACHING_PARTIAL` | capability-by-capability migration remains required |

## K. Limitation register

- `FRAGMENTATION_UNGROUNDED` remains an explicit unsupported outcome.
- TTS/audio runtime is not implemented.
- Teaching DOM/composite export is not guaranteed by P4.
- A-H browser/manual visual acceptance is `UNVERIFIED — ENVIRONMENT BLOCKED`.
- Prior P2/P3/P4 visual gates remain pending and are not replaced by unit tests.
- Prompt-robustness and raw-ingress migration remain outside this freeze.
- Broader biology capabilities and legacy/unmigrated owner-local teaching paths
  are not silently promoted to canonical teaching authority.

## L. Visual gates

The following remain explicitly pending:

- `P2_J_VISUAL_ACCEPTANCE_PENDING`
- `P3_PRODUCTION_TEMPORAL_VISUAL_ACCEPTANCE_PENDING`
- `P4_PIXEL_VISUAL_ACCEPTANCE_PENDING`
- `P4_MANUAL_VISUAL_ACCEPTANCE_PENDING`
- `TEACHING_PRODUCTION_VISUAL_ACCEPTANCE_PENDING`

All are `UNVERIFIED — ENVIRONMENT BLOCKED` in this audit where live inspection
was unavailable. No screenshot equivalence is used as scientific authority.

## M. Protected systems

The following are frozen contracts/artifacts:

- TeachingPlan v1/v2/v3
- TeachingCompiler
- TeachingChapterProgramV1
- AudienceTeachingProgramV1
- TeachingSnapshotV1
- TeachingTextBundleV1
- NarrationCueProgramV1
- ProductionTeachingViewV1
- A-G benchmark corpus and holdout hash
- P2, P3, P4, ScientificTimeline, and production geometry/camera owners

## N. Future change/versioning policy

Future work must preserve these boundaries. A contract change requires either a
versioned extension with compatibility rules or a demonstrated systemic
regression fix. A-I freezes the deterministic teaching runtime; A-J or later
work may address export composition, visual acceptance, narration/audio, or
additional capabilities without changing this baseline implicitly.

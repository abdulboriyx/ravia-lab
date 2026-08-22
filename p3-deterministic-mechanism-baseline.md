# P3 Deterministic Mechanism Baseline

## Purpose

This document freezes the P3 v1 deterministic mechanism architecture after the P3-F benchmark and P3-G production migration proof. P3 evaluates grounded scientific timelines and projects their results into existing presentation owners. It does not add scientific authority.

## Frozen pipeline

```text
grounded ScientificSceneSpec + ScientificTimeline + exact seconds
  -> P3-C DeterministicTemporalProgramV1
  -> P3-B MechanismSnapshotV1
  -> P3-D MechanismTopologySnapshotV1
  -> P3-E PresentationMechanismSnapshotV1
  -> P3-G ProductionTemporalMigrationV1
  -> existing production owner
```

Playback advances only a `PlaybackCursorV1` from a wall-clock/RAF adapter. Exact-frame evaluation uses `frameIndex / fps` directly and does not require RAF. Neither path applies scientific events itself.

## Authority ownership

- P2 owns scientific truth, chemistry, selectors, provenance, fidelity, and grounded topology.
- `ScientificTimeline` declares versioned mechanism states, events, transitions, tracks, and constraints.
- P3-C normalizes temporal data, orders events, resolves dependencies, validates constraints, and compiles the internal temporal program.
- P3-B evaluates immutable mechanism state at an exact time and owns the cursor contract.
- P3-D evaluates only P2-grounded topology changes at an exact time.
- P3-E maps scientific snapshots to non-authoritative visual progress, visibility, labels, easing, and structured camera cues.
- P3-G routes registered capabilities to existing production owners.
- Renderers own geometry and final visual rendering.
- Camera owners execute camera geometry.
- Wall-clock APIs advance cursor time only.

No downstream layer may reacquire upstream scientific authority.

## Core contracts and implementation files

- `PlaybackCursorV1`, `MechanismSnapshotV1`: `app/code/spatial-ravia/p3-b-mechanism-state-kernel.ts`
- `DeterministicTemporalProgramV1`: `app/code/spatial-ravia/p3-c-deterministic-temporal-semantics.ts`
- `MechanismTopologySnapshotV1`: `app/code/spatial-ravia/p3-d-grounded-topology-executor.ts`
- `PresentationMechanismSnapshotV1`: `app/code/spatial-ravia/p3-e-presentation-synchronization.ts`
- `ProductionTemporalMigrationV1`: `app/code/spatial-ravia/p3-g-production-temporal-migration.ts`
- P3-F corpus/scorer: `app/code/spatial-ravia/p3-f-mechanism-presentation-benchmark.ts`
- frozen timeline contract: `app/code/spatial-ravia/scientific-timeline.ts`

The deterministic temporal program is an internal derived representation, not a new scientific contract.

## Temporal semantics

Canonical time is seconds. P3-C provides canonical event ordering by time, semantic precedence, and stable ID; dependency-aware stable topological ordering; cycle and missing-dependency rejection; deterministic transition boundaries; track interpolation; duplicate-keyframe rejection; constraint validation; and array-order invariance.

P3-B is pure, stateless, seekable, reversible, frame-rate independent, and serializable. Scientific transition progress is normalized and presentation easing remains in P3-E.

## Topology semantics

P3-D derives initial and changed topology only from grounded P2-E records. It preserves evidence and fidelity for interactions, continuity, cleavage, separation, shortening, fragmentation, and grounded actor lifecycle changes. It never re-evaluates chemistry or infers topology from geometry.

`FRAGMENTATION_UNGROUNDED` remains an explicit unsupported result when retained/removed partition data is absent. Legacy before/after plans cannot substitute for missing scientific partition evidence.

## Presentation boundary

P3-E owns deterministic visual progress, visibility, emphasis, labels/callouts, easing, and structured camera cues. It does not decide chemistry, topology, event truth, fidelity, assembly/model, or actor identity. Changing presentation or camera plans cannot change mechanism or topology snapshots.

## Production migrations

The P3-G registry currently migrates four owners:

| Capability | P2-J1 view | P3-E projection | Production owner | Status |
|---|---|---|---|---|
| DNA pairing | `DnaBasePairingOwnerView` | DNA base-pair temporal input | `DnaBasePairInteractionPresentation` | migrated |
| DNA separation | `DnaStrandSeparationOwnerView` | DNA separation temporal input | `DnaStrandSeparationPresentation` | migrated |
| RNA hairpin | `RnaHairpinOwnerView` | RNA hairpin temporal input | `RnaSecondaryStructurePresentation` | migrated |
| RNA exonuclease | `RnaExonucleaseOwnerView` | RNA degradation temporal input | `RnaDegradationPresentation` | migrated; explicit partition limitation |

The legacy DNA bubble interval is `PRESENTATION_ONLY / LEGACY_ONLY` and is not consulted by the canonical P3 migration seam. `useBiologyTimeline`, `BiologySceneSpec.temporal`, and other owner-local temporal systems remain `LEGACY_UNMIGRATED`, `COMPATIBILITY_ADAPTER`, or `PRESENTATION_ONLY` outside these migrated paths. No invalid duplicate authority was found in the migrated seam.

## Benchmark baseline

P3-F is frozen at 120 cases: 90/90 DEV, 30/30 sealed HOLDOUT, 0 critical failures. Holdout hash:

`29c3e2f9eb7606359ec541b0cfe360a1139fe8dbff6a018f7a8991ef505794f5`

Covered properties include temporal and topology correctness, evidence/fidelity preservation, seek/reversibility, frame-rate and dropped-frame invariance, exact-frame determinism, presentation/camera separation, unsupported behavior, and serialization.

## Determinism guarantees

For the same grounded scene, timeline, compiled program, and exact time, P3 produces the same mechanism, topology, presentation, camera-cue, and failure semantics regardless of frame rate, dropped frames, source-array order, seek direction, or prior evaluation history. There is no randomness or clock-derived scientific state.

## Exact-frame guarantee

For any supported timeline, `t = frameIndex / fps` can be evaluated directly for DNA pairing, DNA separation, RNA hairpin, and supported RNA degradation fixtures. Full renderer/video export remains future work.

## Limitations and release gates

- `FRAGMENTATION_UNGROUNDED`: some degradation/shortening cases lack grounded retained/removed partition data; no fragment state is fabricated.
- `P2_J_VISUAL_ACCEPTANCE_PENDING`: four migrated owners still require manual browser inspection.
- `P3_PRODUCTION_TEMPORAL_VISUAL_ACCEPTANCE_PENDING`: deterministic structured migration is proven, but visual acceptance is `UNVERIFIED — ENVIRONMENT BLOCKED`.
- Replication, transcription, translation, signaling/action-potential, and other legacy mechanisms remain unmigrated unless separately grounded and mapped.
- Exact-frame mechanism evaluation is ready; renderer/video export is not frozen as complete.

The build remains environment-blocked by Turbopack worker/port binding (`Operation not permitted`), not classified as an application-source regression.

## Protected systems

The following are protected after the P3 v1 freeze: P3-B, P3-C, P3-D, P3-E, P3-F corpus/scorer and sealed holdout, P3-G seam, `ScientificTimeline` v1, P2 scientific authority, P2-J1 owner views, accepted renderers, camera systems, Mol*, and export contracts.

## Future extension rules

New P3 mechanisms must begin with grounded P2 science, reference explicit timeline states/events, use canonical P3 evaluation, preserve arbitrary seek/reversibility and exact-frame determinism, add DEV coverage and fresh holdout coverage when semantically material, and explicitly surface unsupported scientific representations. No owner-local scientific timer, geometry-derived scientific state, raw prompt parsing, silent fallback, or fidelity upgrade is permitted. Future production migration follows: grounded support → timeline mapping → P3 execution → P3-E projection → renderer.

## Test baseline

- Full spatial: 722/722
- DNA family: 100/100
- DNA mechanism: 60/60
- RNA semantic: 80/80
- RNA runtime: 80/80
- Typecheck: PASS
- Lint: PASS
- Build: environment blocked by Turbopack worker/port binding

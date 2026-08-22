# P4 Exact-Frame Render / Export Runtime v1 Baseline

## A. Purpose

P4 v1 freezes a deterministic, exact-frame rendering and canvas PNG export path. It is an evaluation and reconstruction pipeline, not a real-time playback authority.

## B. Frozen pipeline

`ExactFrameRequestV1 → P3 exact evaluation → ProductionTemporalMigrationV1 → AppliedRenderStateV1 → ExactFrameRenderHost → deterministic CameraStateV1 → RenderReadinessV1 → CaptureFrameRequestV1 → PNG artifact`.

Sequence pipeline: `VideoExportRequestV1 → ExactFrameSequencePlanV1 → independent exact-frame evaluation → PNG frame artifacts → ordered manifest`.

## C. Authority ownership

| Layer | Sole authority |
| --- | --- |
| P2 | Scientific truth, source, selectors, chemistry, fidelity, topology evidence |
| P3 | Time, mechanism, topology, and presentation state |
| P4-B | Exact-frame request normalization and absolute render state |
| P4-C | Concrete production-owner application and readiness |
| P4-D | Camera semantics and absolute camera execution |
| P4-E | Canvas PNG capture |
| P4-F | Frame-sequence orchestration |
| P4-G | Structural/semantic visual benchmark and proof |
| Renderer | Geometry execution only |

No downstream layer may silently reacquire upstream scientific, temporal, or presentation authority.

## D. Frame-independence invariant

**FRAME N DOES NOT REQUIRE FRAMES 0..N-1.** Direct, out-of-order, backward, repeated, remounted, and sequence/direct frame evaluations are structurally and semantically deterministic. No local timer determines exact-frame output.

DNA strand separation is the strongest proof: late-to-early application replaces transform/visibility state, and sequence boundaries match direct-frame boundaries.

RNA hairpin reconstructs deterministically. RNA exonuclease preserves `FRAGMENTATION_UNGROUNDED`; it does not use legacy fragment slicing or manufacture an image for unsupported science.

## E. Readiness model

`RenderReadinessV1` is tied to the current application/frame identity. Geometry, labels, assets, layout, Mol*, and camera readiness are explicit dimensions; camera readiness is separate. There is no timeout-as-ready authority, stale work cannot mark a newer frame ready, and failures remain bounded.

## F. Camera model

`CameraStateV1` has deterministic owner baselines, fixed-aspect semantics, and DPR-independent meaning. Bounds-dependent modes remain explicit; `preserveCurrent` requires a deterministic baseline. Exact-frame mode applies an absolute camera pose and bypasses OrbitControls/damping.

`MOLSTAR EXACT-FRAME CAMERA: CAMERA_EXECUTION_UNSUPPORTED` remains frozen.

## G. Capture support and scope

`CaptureFrameRequestV1` and `CapturedFrameArtifactV1` support canvas PNG, including transparent PNG only when the render state explicitly permits it. Output dimensions are configured dimensions × pixel ratio; artifacts are nonempty and metadata is serializable. Stale/not-ready capture is rejected and temporary object URLs/resources are cleaned up.

`CANVAS_ONLY: SUPPORTED`.

`DOM/COMPOSITE: NOT CLAIMED`. DOM overlays are outside the current capture guarantee.

## H. Sequence support

`VideoExportRequestV1`, `ExactFrameSequencePlanV1`, and `CapturedFrameSequenceV1` define inclusive frame ranges with canonical frame-index/fps timestamps. Each frame is independently evaluated. Scrambled/reverse execution is canonically reordered; failures are retained rather than skipped. Progress and cancellation do not alter science. The manifest is serializable.

`PNG FRAME SEQUENCE: SUPPORTED`.

`MP4: ENCODER_UNAVAILABLE` and `WebM: ENCODER_UNAVAILABLE`. No MediaRecorder/live-playback path is canonical.

## I. P4-G benchmark baseline

| Property | Frozen value |
| --- | --- |
| Corpus | 40 cases: 30 DEV, 10 HOLDOUT |
| Corpus hash | `fnv1a:1f54866b` |
| Structural correctness | 40/40 |
| Semantic visual determinism | 40/40 |
| Critical failures | 0 |
| Pixel proof | UNVERIFIED |
| Manual visual proof | UNVERIFIED |

Benchmark expectations and holdout are frozen.

## J. Semantic versus pixel guarantee

Mandatory guarantee: **semantic visual determinism**.

Pixel repeatability is controlled-environment only. Cross-GPU/cross-browser byte-identical pixels are not guaranteed.

## K. Pixel/manual visual status and gates

- `P2_J_VISUAL_ACCEPTANCE_PENDING` — UNVERIFIED, environment blocked.
- `P3_PRODUCTION_TEMPORAL_VISUAL_ACCEPTANCE_PENDING` — UNVERIFIED, environment blocked.
- `P4_PIXEL_VISUAL_ACCEPTANCE_PENDING` — UNVERIFIED, environment blocked.
- `P4_MANUAL_VISUAL_ACCEPTANCE_PENDING` — UNVERIFIED, environment blocked.

These are not classified as regressions and cannot be closed without actual visual inspection.

## L. Limitation register

- `FRAGMENTATION_UNGROUNDED` for unsupported RNA exonuclease fragmentation.
- `CAMERA_EXECUTION_UNSUPPORTED` for Mol* exact-frame camera.
- `ENCODER_UNAVAILABLE` for MP4/WebM.
- `DOM_COMPOSITE_CAPTURE_UNSUPPORTED` / not claimed.
- Pixel and manual visual acceptance pending.
- Legacy mechanisms not migrated through P3/P4 remain outside the exact-frame guarantee.

## M. Build/browser status

Browser pixel integration remains environment blocked and unverified. Earlier restricted-host build attempts encountered Turbopack worker/port binding (`Operation not permitted`) before application-source validation; this is not evidence of a source regression. The final P4-H production build completed successfully in the validated execution environment.

## N. Core frozen contracts

- `p4-b-exact-frame-runtime.ts`: `ExactFrameRequestV1`, `RenderConfigV1`, `AppliedRenderStateV1`.
- `p4-c-renderer-state-reconstruction.ts`: `ExactFrameRenderHost`, `RenderReadinessV1`.
- `p4-d-deterministic-camera-execution.ts`: `CameraStateV1`.
- `p4-e-deterministic-image-capture.ts`: `CaptureFrameRequestV1`, `CapturedFrameArtifactV1`.
- `p4-f-deterministic-frame-sequence-export.ts`: `VideoExportRequestV1`, `ExactFrameSequencePlanV1`, `CapturedFrameSequenceV1`.
- `p4-g-visual-benchmark.ts`: corpus and scorer.

## O. Protected systems

P4-B through P4-G, P3, P2, `ScientificTimeline`, `SceneExportContract`, production-owner geometry, and P4-G DEV/HOLDOUT are protected. Changes require explicit versioning or a demonstrated systemic regression fix.

## P. Future extension rules

Every future exact-frame owner must start from canonical P3 state, derive complete absolute render state, avoid frame-history dependence, expose readiness, use deterministic camera semantics, add P4-G coverage, surface unsupported science, and never use local timers as truth.

Encoded video must consume a deterministic exact-frame sequence followed by an encoder; live playback recording is never scientific source authority.

Mol* capture requires deterministic exact-frame camera, readiness, and absolute structure/representation-state application before it may be enabled.

Composite capture requires explicit scope, DOM/font/layout readiness, exact dimensions, and controlled-environment determinism.

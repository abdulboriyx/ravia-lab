# Export Runtime v1 Baseline

## A. Architecture

The canonical path is:

`SceneSpec / ScientificSceneSpec + ScientificTimeline + Teaching Runtime outputs + ExportRequest → P3 exact state → P4 exact render state/readiness → capture surface → export adapter`.

Images use `CapturedFrameArtifactV1` or `CompositeFrameArtifactV1`. Sequences use `ExactFrameSequencePlanV1` and ordered PNG frames. Video consumes that sequence through `VideoEncoderBackendV1`. Captions use `CaptionTrackV1` and `ChapterTrackV1`. Slides use `SlideDeckPlanV1` and `SlidePackageManifestV1`. Portable packaging uses `ScenePackageV1`, `ViewerBootstrapV1`, and `EmbedPackageV1`.

There is no live-playback export authority.

## B. Authority ownership

- P2 owns scientific actors, states, interactions, topology, provenance, and fidelity.
- P3 owns mechanism time, events, transitions, and exact scientific state at `t`.
- P4 owns exact render state, camera, readiness, and canvas capture.
- Teaching owns pedagogy, audience projection, wording, captions, and narration metadata.
- Export owns artifact orchestration and serialization only.
- Encoders own container/codec packaging only.
- Slides own layout only.
- Production UI displays canonical outputs.

## C. ExportRequest versions

ExportRequest v1 remains compatible and retains its frozen canvas semantics. ExportRequest v2 is additive and expresses `SCENE_CANVAS` versus `SCENE_WITH_TEACHING_OVERLAY`, teaching identity, overlay inclusion, and caption policy. v1 semantics are not silently mutated.

## D–F. Images and sequences

`SCENE_CANVAS` PNG and transparent PNG are supported through P4 exact-frame capture. PNG sequences are inclusive, frame-index ordered, timestamped by FPS, streamable, cancellable, and stale/failure preserving. Teaching composites are structurally supported through the dedicated export DOM and exact identity binding.

## G. Video

The frozen architecture is `ExactFrameSequencePlanV1 → exact PNG stream → VideoEncoderBackendV1 → VideoArtifactV1`. MP4 and WebM remain `PARTIAL`: `ENCODER_UNAVAILABLE` is preserved when the local ffmpeg runtime is absent. No MediaRecorder, RAF, wall-clock sampling, or live playback is canonical.

## H. Captions and chapters

CaptionTrackV1, ChapterTrackV1, WebVTT, and SRT are supported. Timing derives from canonical timeline/chapter/frame semantics. Static presentation timing must be explicit; no scientific time is fabricated. Burned-in captions route through the teaching composite surface.

## I. Slides

Chapter-to-slide mapping, deterministic representative-frame selection, bounded layouts, provenance, and structural manifests are supported. Slide rasterization is `ENVIRONMENT_UNVERIFIED`; PPTX and PDF are `NOT_IMPLEMENTED`.

## J. Scene package/embed

ScenePackageV1 packages canonical scientific/temporal/teaching contracts, provenance, fidelity, assets, compatibility, support limitations, and deterministic semantic hashes. EmbedPackageV1 adds presentation-only ViewerBootstrapV1. No DOM, renderer object, browser handle, local path, or raw prompt is required.

## K–L. Mol* and GLB

Mol* interactive viewing, scene packages, and embeds are supported. Mol* exact-frame, teaching-frame, video, and slide artifacts are `UNSUPPORTED_V1` because camera execution, readiness integration, and deterministic capture remain separate gaps. GLB is `UNSUPPORTED_V1`.

## M. Determinism guarantees

- Semantic determinism: required.
- Controlled-environment pixel repeatability: expected where the capture runtime is available.
- Cross-browser/GPU byte identity: not guaranteed.
- Video byte identity: not guaranteed.
- Package semantic hash: deterministic and array-order invariant.

## N. Benchmark baseline

B-H Export Benchmark v1: 100 cases, 75 DEV, 25 SEALED_HOLDOUT, 0 critical failures. Holdout SHA-256: `00848499b52619a94b3cdfc7e4039fa27b6c9be7be3aa1fd2ed7aa51c0885786`.

A-G Teaching Benchmark v1 remains 120/120 with 0 critical failures and its existing holdout hash unchanged.

## O. Support matrix

| Capability | Status |
|---|---|
| SCIENTIFIC_FRAME | SUPPORTED |
| TRANSPARENT_PNG | SUPPORTED |
| TEACHING_FRAME | SUPPORTED structurally |
| PNG_SEQUENCE | SUPPORTED |
| MP4 | PARTIAL |
| WEBM | PARTIAL |
| CAPTIONS | SUPPORTED |
| WEBVTT | SUPPORTED |
| SRT | SUPPORTED |
| SLIDES_STRUCTURAL | SUPPORTED |
| SLIDE_RASTER | ENVIRONMENT_UNVERIFIED |
| PPTX | NOT_IMPLEMENTED |
| PDF | NOT_IMPLEMENTED |
| SCENE_PACKAGE | SUPPORTED |
| EMBED | SUPPORTED |
| MOLSTAR_FRAME | UNSUPPORTED_V1 |
| MOLSTAR_VIDEO | UNSUPPORTED_V1 |
| MOLSTAR_SLIDES | UNSUPPORTED_V1 |
| GLB | UNSUPPORTED_V1 |

## P–Q. Gates and runtime limitations

Pending visual gates remain: `P2_J_VISUAL_ACCEPTANCE_PENDING`, `P3_PRODUCTION_TEMPORAL_VISUAL_ACCEPTANCE_PENDING`, `P4_PIXEL_VISUAL_ACCEPTANCE_PENDING`, `P4_MANUAL_VISUAL_ACCEPTANCE_PENDING`, `TEACHING_PRODUCTION_VISUAL_ACCEPTANCE_PENDING`, `EXPORT_COMPOSITE_PIXEL_ACCEPTANCE_PENDING`, and `EXPORT_SLIDE_VISUAL_ACCEPTANCE_PENDING`. Their status is `UNVERIFIED — ENVIRONMENT BLOCKED`.

Runtime-unavailable registers are separate: `VIDEO_ENCODER_RUNTIME_UNAVAILABLE` and `SLIDE_RASTER_RUNTIME_UNAVAILABLE`.

## R. Limitations

No TTS/audio runtime, MP4/WebM runtime encoder, slide raster runtime, PPTX/PDF, Mol* exact-frame export, GLB, or broader unmigrated export owners are claimed. Fragmentation remains `FRAGMENTATION_UNGROUNDED` where upstream science does not ground it.

## S. Security and resources

Canonical paths use bounded dimensions, FPS, duration, frame count, text, slide, asset, package, and dependency limits. Text is treated as text. Package paths are relative and validated. No shell interpolation, arbitrary codec flags, executable remote assets, path traversal, or transient runtime handles are serialized.

## T. Protected systems and future changes

P2, P3, P4-B through P4-G, Teaching Runtime v1, B-B through B-H contracts, the Mol* defer policy, both benchmark corpora/holdouts, and renderer/camera authority are frozen. Future changes require a versioned extension or a demonstrated systemic regression fix.

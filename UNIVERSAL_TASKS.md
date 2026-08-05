# Universal RAVIA Tasks

## Completed

- Implemented the first visible Spatial RAVIA DNA-replication vertical slice at `/code/spatial-ravia/`.
- Extracted the existing B-DNA/Mol* experience into `app/code/spatial-ravia/DnaMolecularView.tsx` and kept it as a secondary DNA-structure scale view.
- Reconnected the visible workspace to the generic process engine through `process-registry.ts`, `model.ts`, `scene-compiler.ts`, and `dna-workspace.ts`.
- Added session-driven play/pause, restart, timeline scrub, speed selection, labels, 5'/3' directionality, component selection, hide, and isolate controls.
- Preserved the last valid DNA scene and playback state for unsupported prompts.
- Added focused Spatial RAVIA model/UI source-contract tests.
- Verified root lint, typecheck, Spatial tests, scientific evaluation, production build, ChapterBio tests/build, and Chromium desktop/mobile behavior.
- Added the Zod 4 `PhenomenonSpec` runtime contract for Spatial RAVIA.
- Migrated the DNA replication pack through a controlled `PhenomenonSpec` adapter and validate it at module load, in tests, and before scene compilation.
- Added negative PhenomenonSpec fixtures for invalid references, duplicate IDs, bad units, invalid bounds, invalid timelines, renderer/evidence mismatches, missing molecular coordinates, and unsupported interaction targets.
- Replaced the global prompt contradiction table with pack-owned typed incompatibility rules for DNA replication, eukaryotic transcription, and action potential.
- Added tests proving malformed incompatibility rules fail validation and prompt refusals resolve from pack metadata.
- Made representation selection consume `PhenomenonSpec` evidence availability from declared views, renderer/evidence classifications, normalized timelines, and approved deposited structure mappings.
- Added tests proving approved schema molecular evidence can enable molecular 3D and unapproved schema molecular evidence is rejected.
- Exposed the existing action-potential pack in the visible `/code/spatial-ravia/` workspace through the shared session engine and scene compiler.
- Kept the DNA B-DNA/Mol* structure view DNA-only while allowing action-potential prompts to render the primary schematic SVG workspace.
- Tightened the shared workspace layout and SVG label rules so the process scene remains visible at 1440x900, 1280x800, 1024x768, and 390x844 without horizontal overflow.
- Added a reviewed static Hodgkin-Huxley benchmark trace fixture for action potential with declared `ms`/`mV` units and D3-scaled SVG path rendering.
- Added focused trace tests proving ordered physical trace points, D3 path generation, scene provenance, and source wiring.
- Introduced `PhenomenonPack` as the generalized pack contract with `BiologicalProcessPack` retained as a deprecated compatibility alias.
- Added generalized equation/spatial component kinds for future equation-model and orbital/spatial packs.
- Exposed `phenomenonPacks` from the process registry while preserving the existing `processPacks` route.
- Added tests proving existing packs compile through the new `PhenomenonPack` API and that schema validation accepts generalized component kinds.
- Added the two-body orbit process pack with a direct `PhenomenonSpec`, physical timeline, equation/spatial component kinds, and pack-owned N-body refusal rules.
- Added the offline Sun-Earth benchmark fixture with JPL Horizons vectors, fixed two-body model points, AU/AU-per-day/AU^3-per-day^2 units, and a declared `0.000025 AU` position-error tolerance.
- Added the React Three Fiber orbit renderer path with responsive camera fitting, benchmark markers, central-gravity vector, labels, selection, hide, isolate, directionality, and shared playback controls.
- Added focused orbit fixture, pack validation, scene compilation, prompt, unsupported-scope, and workspace source-contract tests.
- Verified Chromium screenshots and layout measurements for the orbit workspace at 1440x900, 1280x800, 1024x768, and 390x844.

## Current Gate Status

- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm run test:spatial`: pass, 152/152.
- `npm run eval:spatial`: pass, 108/108.
- `npm run build`: pass, with the existing Next.js workspace-root warning caused by multiple lockfiles.
- `chapterbio npm test`: pass, 3/3.
- `chapterbio npm run build`: pass.
- Chromium desktop/mobile verification: pass on `http://localhost:3001/code/spatial-ravia/`.

## Next Recommended Task

Add the server-side structured-output LLM adapter that emits only registered intent IDs, per `UNIVERSAL_RAVIA_SPEC.md` milestone 11. Completion requires invalid or unavailable providers to fall back or abstain deterministically, with no general web agent, retrieval, or client-exposed API key.

## External Validation Still Needed

A true sealed 100-prompt holdout set remains a product/research asset to create outside the implementation loop. The repository now has pack-owned incompatibility rules and the fixed 108-case suite still passes, but an in-repo holdout would not be sealed.

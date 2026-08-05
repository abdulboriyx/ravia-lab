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

## Current Gate Status

- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm run test:spatial`: pass, 141/141.
- `npm run eval:spatial`: pass, 108/108.
- `npm run build`: pass, with the existing Next.js workspace-root warning caused by multiple lockfiles.
- `chapterbio npm test`: pass, 3/3.
- `chapterbio npm run build`: pass.
- Chromium desktop/mobile verification: pass on `http://localhost:3001/code/spatial-ravia/`.

## Next Recommended Task

Generalize `BiologicalProcessPack` to `PhenomenonPack` and add equation-model and spatial component kinds, per `UNIVERSAL_RAVIA_SPEC.md` milestone 9. Completion requires migrating existing DNA/action-potential behavior without regressions, keeping the HH trace fixture source- and unit-validated, and preserving schema validation, pack-owned incompatibility rules, Spatial tests, and the 108-case scientific evaluation.

## External Validation Still Needed

A true sealed 100-prompt holdout set remains a product/research asset to create outside the implementation loop. The repository now has pack-owned incompatibility rules and the fixed 108-case suite still passes, but an in-repo holdout would not be sealed.

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

## Current Gate Status

- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm run test:spatial`: pass, 132/132.
- `npm run eval:spatial`: pass, 108/108.
- `npm run build`: pass, with the existing Next.js workspace-root warning caused by multiple lockfiles.
- `chapterbio npm test`: pass, 3/3.
- `chapterbio npm run build`: pass.
- Chromium desktop/mobile verification: pass on `http://localhost:3003/code/spatial-ravia/`.

## Next Recommended Task

Replace global contradiction regexes with pack-owned capabilities and typed incompatibility rules, per `UNIVERSAL_RAVIA_SPEC.md` milestone 6. Completion requires the current 108 fixed evaluation cases to keep passing, a sealed holdout prompt set to reach the declared threshold, and every unsafe or adversarial case to abstain without mutating the active scene.

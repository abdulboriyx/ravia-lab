# Universal RAVIA Tasks

## Completed

- Implemented the first visible Spatial RAVIA DNA-replication vertical slice at `/code/spatial-ravia/`.
- Extracted the existing B-DNA/Mol* experience into `app/code/spatial-ravia/DnaMolecularView.tsx` and kept it as a secondary DNA-structure scale view.
- Reconnected the visible workspace to the generic process engine through `process-registry.ts`, `model.ts`, `scene-compiler.ts`, and `dna-workspace.ts`.
- Added session-driven play/pause, restart, timeline scrub, speed selection, labels, 5'/3' directionality, component selection, hide, and isolate controls.
- Preserved the last valid DNA scene and playback state for unsupported prompts.
- Added focused Spatial RAVIA model/UI source-contract tests.
- Verified root lint, typecheck, Spatial tests, scientific evaluation, production build, ChapterBio tests/build, and Chromium desktop/mobile behavior.

## Current Gate Status

- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm run test:spatial`: pass, 115/115.
- `npm run eval:spatial`: pass, 108/108.
- `npm run build`: pass, with the existing Next.js workspace-root warning caused by multiple lockfiles.
- `chapterbio npm test`: pass, 3/3.
- `chapterbio npm run build`: pass.
- Chromium desktop/mobile verification: pass on `http://localhost:3003/code/spatial-ravia/`.

## Next Recommended Task

Add a second curated process vertical slice only after product approval of the process choice. Recommended candidate: transcription, because the repository already has a validated transcription process pack and evaluation coverage. Completion requires a visible transcription workspace using the same generic session, compiler, controls, evidence panels, unsupported-prompt preservation, and browser validation standards as the DNA replication slice.

# Stabilization Tasks

## Task 1: ChapterBio route returns 404 from root dev server

- Problem: Archive links to `/chapterbio/`, but the root Next dev server returns 404.
- Suspected root cause: ChapterBio is built as a static Vite app under `public/chapterbio/index.html`; Next dev serves static files but does not treat nested `public` directories as directory-index routes. Static export can emit `out/chapterbio/index.html`, creating a dev/export mismatch.
- Files likely involved: `app/chapterbio/page.tsx`, `data/archive.ts`, `public/chapterbio/index.html`, `chapterbio/vite.config.ts`.
- Validation command: `npm run build`; local route check for `/chapterbio/`; route-integrity test if added.
- Completion status: completed. Added a first-class Next route at `/chapterbio/` that loads the existing ChapterBio static assets; `npm run build` now lists `/chapterbio`.

## Task 2: Archive entries point to nonexistent internal routes

- Problem: Several visible archive entries link to content pages that do not exist.
- Suspected root cause: `data/archive.ts` contains planned content entries without matching App Router pages.
- Files likely involved: `data/archive.ts`, `components/ArchiveList.tsx`, route-integrity test files.
- Validation command: automated archive route-integrity test; `npm run test:spatial`; `npm run build`.
- Completion status: completed. Planned entries without implemented content are now non-clickable and marked `Planned` instead of linking to missing routes.

## Task 3: Add route/archive integrity regression coverage

- Problem: Broken internal links can ship silently.
- Suspected root cause: No automated check compares archive links to implemented routes or static public routes.
- Files likely involved: `app/route-integrity.test.ts` or similar, `package.json`.
- Validation command: `node --test app/**/*.test.ts` or existing `npm run test:spatial` if the test is placed under the current test glob.
- Completion status: completed. Added `archive-integrity.test.ts` under the existing Spatial RAVIA test glob.

## Task 4: Baseline and categorize Spatial RAVIA scientific evaluation failures

- Problem: Formal evaluation currently passes 78/108 cases.
- Suspected root cause: Prompt resolver lacks enough synonym/misspelling coverage, cross-process contradiction detection, misconception rejection, and some command aliases.
- Files likely involved: `app/code/spatial-ravia/evaluation.ts`, `app/code/spatial-ravia/model.ts`, `app/code/spatial-ravia/*-process.ts`.
- Validation command: `npm run eval:spatial`.
- Completion status: completed. Baseline remains 78/108 passing, with 30 failures.

## Task 5: Fix valid Spatial RAVIA scientific failures without weakening tests

- Problem: Valid prompts fail or invalid prompts are accepted.
- Suspected root cause: Process scoring accepts partial entity overlap too easily and lacks contradiction/misconception gates; process packs lack some prompt and command phrases.
- Files likely involved: `app/code/spatial-ravia/model.ts`, `app/code/spatial-ravia/dna-process.ts`, `app/code/spatial-ravia/transcription-process.ts`, `app/code/spatial-ravia/action-potential-process.ts`, related tests.
- Validation command: `npm run eval:spatial`; `npm run test:spatial`; `npm run typecheck`.
- Completion status: pending.

## Task 6: Map visible Spatial RAVIA UI versus tested process-pack engine

- Problem: The visible `/code/spatial-ravia` interface is a B-DNA/Mol* viewer, while the tested process-pack engine has DNA replication, transcription, and action potential capabilities that appear inaccessible.
- Suspected root cause: Later commits replaced or redirected the route to the B-DNA viewer without removing older generic engine code/docs.
- Files likely involved: `app/code/spatial-ravia/prototype.tsx`, `app/code/spatial-ravia/page.tsx`, `SPATIAL_RAVIA_PROGRESS.md`, `SPATIAL_RAVIA_ARCHITECTURE_AUDIT.md`, Git history.
- Validation command: code/history inspection; `PRODUCT_DECISIONS_NEEDED.md`.
- Completion status: pending.

## Task 7: Implement only inferable Spatial RAVIA integration work

- Problem: Tested process-pack capabilities should not be hidden if repository evidence clearly shows they were intended for the route, but product-defining assumptions must be avoided.
- Suspected root cause: Route/product direction is ambiguous between B-DNA molecular viewer and generic process-pack workspace.
- Files likely involved: `app/code/spatial-ravia/page.tsx`, `app/code/spatial-ravia/prototype.tsx`, potential documentation files.
- Validation command: `npm run build`; `npm run test:spatial`; documented decision record.
- Completion status: pending.

## Task 8: Final stabilization validation and report

- Problem: Need a complete stabilization record with before/after evidence.
- Suspected root cause: Current audit is diagnostic but not an implementation closeout.
- Files likely involved: `STABILIZATION_REPORT.md`, `PRODUCT_DECISIONS_NEEDED.md`, `TASKS.md`.
- Validation command: `npm run lint`; `npm run typecheck`; `npm run test:spatial`; `npm run eval:spatial`; `npm run build`; `cd chapterbio && npm test && npm run build`.
- Completion status: pending.

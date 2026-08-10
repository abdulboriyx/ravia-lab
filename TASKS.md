# Stabilization Tasks

## Task 1: ChapterBio route returns 404 from root dev server

- Problem: Archive links to `/chapterbio/`, but the root Next dev server returns 404.
- Suspected root cause: ChapterBio is built as a static Vite app under `public/chapterbio/index.html`; Next dev serves static files but does not treat nested `public` directories as directory-index routes. Static export can emit `out/chapterbio/index.html`, creating a dev/export mismatch.
- Files likely involved: `app/chapterbio/page.tsx`, `data/archive.ts`, `public/chapterbio/index.html`, `chapterbio/vite.config.ts`.
- Validation command: `npm run build`; local route check for `/chapterbio/`; route-integrity test if added.
- Completion status: completed. Added a first-class Next route at `/chapterbio/` that loads the existing ChapterBio static assets; fixed the ChapterBio Vite input so its standalone build writes `public/chapterbio/index.html`; `npm run build` now lists `/chapterbio`.

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

## Task 4: Final stabilization validation and report

- Problem: Need a complete stabilization record with before/after evidence.
- Suspected root cause: Current audit is diagnostic but not an implementation closeout.
- Files likely involved: `TASKS.md`.
- Validation command: `npm run lint`; `npm run typecheck`; `npm run test:spatial`; `npm run eval:spatial`; `npm run build`; `cd chapterbio && npm test && npm run build`.
- Completion status: completed. Final root lint, type-check, Spatial RAVIA tests/evaluation, root build, and ChapterBio test/build all pass.

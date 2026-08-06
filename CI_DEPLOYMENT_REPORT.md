# CI Deployment Report

Date: 2026-08-06

## Implemented Behavior

- Replaced the GitHub Pages workflow with a validation-first deployment gate.
- Deployment now depends on a `validate-build` job that must pass before `out/` is uploaded.
- Added root `smoke:spatial` script for static Playwright verification.
- Added an explicit Spatial RAVIA evaluation threshold so the evaluation command fails below the required pass rate.

## Workflow Gates

`.github/workflows/deploy.yml` now runs:

- `npm ci`
- `npx playwright install --with-deps chromium`
- `npm run lint`
- `npm run typecheck`
- `npm run test:spatial`
- `npm run eval:spatial` with `SPATIAL_RAVIA_EVAL_THRESHOLD=1`
- `chapterbio npm ci`
- `chapterbio npm test`
- `chapterbio npm run build`
- `npm run build`
- `npm run smoke:spatial`
- upload `./out` to GitHub Pages only after all previous steps pass
- deploy GitHub Pages only from the validated artifact

## Static Smoke Checks

`scripts/spatial-ravia-smoke.ts` serves the built `out/` directory locally and checks `/code/spatial-ravia/` in Chromium.

Covered views:

- DNA replication SVG process view.
- Two-body orbit R3F spatial view.

Covered viewport classes:

- Desktop: `1280x800`.
- Mobile: `390x844`.

Assertions:

- no browser console errors;
- expected generated workspace title appears;
- primary scene has meaningful minimum dimensions;
- controls are reachable;
- no horizontal page overflow.

## Validation Commands

Local validation run after implementation:

- `npm run smoke:spatial`: pass.
- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm run test:spatial`: pass, 158/158.
- `npm run eval:spatial`: pass, 108/108.
- `npm run build`: pass, with the existing Next.js multiple-lockfile workspace-root warning.
- `chapterbio npm test`: pass, 3/3.
- `chapterbio npm run build`: pass.

## Deployment Classification

- Deployment remains a static GitHub Pages export.
- The workflow does not add server hosting, database, accounts, runtime retrieval, or a client-side LLM key.
- The server-side LLM adapter remains source-level infrastructure until a later hosting decision enables server runtime.

## Known Limitations

- The CI workflow cannot prove the sealed holdout prompt requirement because a truly sealed set must be created outside this implementation loop.
- Browser smoke checks cover the current critical DNA and orbit paths at desktop/mobile widths, not every possible prompt or browser engine.
- The existing Next.js multiple-lockfile warning remains.
- The existing Node typeless-module warning remains during TypeScript script/test execution.

## Exact Next Recommended Task

Create the sealed 100-prompt holdout set outside this implementation loop, then run it against the finished MVP without tuning the suite after seeing failures.

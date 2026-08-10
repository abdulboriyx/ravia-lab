# CI Deployment Report

Date: 2026-08-06

## Implemented Behavior

- Replaced the GitHub Pages workflow with a validation-first deployment gate.
- Deployment now depends on a `validate-build` job that must pass before `out/` is uploaded.
- Kept the root `smoke:spatial` validation hook aligned with the current Spatial RAVIA route.

## Workflow Gates

`.github/workflows/deploy.yml` now runs:

- `npm ci`
- `npx playwright install --with-deps chromium`
- `npm run lint`
- `npm run typecheck`
- `npm run test:spatial`
- `npm run eval:spatial`
- `chapterbio npm ci`
- `chapterbio npm test`
- `chapterbio npm run build`
- `npm run build`
- `npm run smoke:spatial`
- upload `./out` to GitHub Pages only after all previous steps pass
- deploy GitHub Pages only from the validated artifact

## Validation Commands

Local validation run after implementation:

- `npm run smoke:spatial`: pass.
- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm run test:spatial`: pass.
- `npm run eval:spatial`: pass.
- `npm run build`: pass, with the existing Next.js multiple-lockfile workspace-root warning.
- `chapterbio npm test`: pass, 3/3.
- `chapterbio npm run build`: pass.

## Deployment Classification

- Deployment remains a static GitHub Pages export.
- The workflow does not add server hosting, database, accounts, runtime retrieval, or a client-side LLM key.
- The server-side LLM adapter remains source-level infrastructure until a later hosting decision enables server runtime.

## Known Limitations

- The CI workflow cannot prove the sealed holdout prompt requirement because a truly sealed set must be created outside this implementation loop.
- The existing Next.js multiple-lockfile warning remains.
- The existing Node typeless-module warning remains during TypeScript script/test execution.

# Project Audit

Date: 2026-08-06

## Executive Summary

Ravia Lab is a static-export Next.js research archive site that currently hosts two product prototypes:

- Spatial RAVIA: a scientific visualization/provenance prototype under `/code/spatial-ravia`.
- ChapterBio: a nested Vite educational prototype for Chapter 7 biology figures, exported into `public/chapterbio` and intended to be served at `/chapterbio/`.

The repository builds and most validation passes. The important blockers are product-level correctness and routing gaps, not basic compilation.

Current status:

- Root type-check, lint, static build, and Spatial RAVIA unit tests pass.
- ChapterBio test and build pass.
- Spatial RAVIA formal scientific evaluation passes 78/108 cases, 72.2%.
- Root dev server serves `/` and `/code/spatial-ravia/`.
- Root dev server returns 404 for `/chapterbio/`, even though the archive links to `/chapterbio/`.
- Many archive entries link to pages that do not exist.
- The visible Spatial RAVIA route is now a B-DNA/Mol* molecular viewer, while the larger generic ScientificModel/session/render-plan engine is mostly not connected to that visible route.

## Intended Product

The product appears intended to be a public Ravia Lab website: a research archive for essays, papers, notes, code, experiments, and projects. Its current emphasis is scientific learning and research visualization around biology.

From current code and history, the intended subproducts are:

1. A polished public archive homepage with `/about`, `/papers`, and `/code`.
2. Spatial RAVIA, intended as a conversational scientific world-model system that turns scientific prompts into honest interactive representations with provenance, limitations, abstention behavior, and renderer selection.
3. A B-DNA molecular viewer that can load experimental PDB 1ZF5 and generate an idealized local B-DNA model with visual transformations.
4. ChapterBio, intended as an interactive educational figure studio for textbook Chapter 7, currently focused on DNA to RNA to protein figures.

## Current Architecture

### Root Next.js Site

- Framework: Next.js 16 App Router.
- Static export: `next.config.ts` sets `output: "export"`, `trailingSlash: true`, and unoptimized images.
- Styling: `app/globals.css` contains all global styles for the archive and Spatial RAVIA UI.
- Fonts: `app/layout.tsx` uses `next/font/google` for Oxanium and Space Grotesk.
- Main routes:
  - `/`
  - `/about`
  - `/papers`
  - `/code`
  - `/code/spatial-ravia`
  - `/code/spatial-ravia/primitives`

### Archive Content

- `data/archive.ts` is the source of homepage, papers, and code/project listings.
- `components/ArchiveList.tsx` renders archive entries.
- Several listed entries point to missing routes.

### Spatial RAVIA Visible Route

- `app/code/spatial-ravia/page.tsx` renders `SpatialRaviaPrototype`.
- `app/code/spatial-ravia/prototype.tsx` is a client-side B-DNA UI with a local prompt parser.
- `app/code/spatial-ravia/MolstarStructureViewer.tsx` loads bundled Mol* assets from `public/spatial-ravia/molstar`, loads `public/spatial-ravia/structures/1ZF5.cif`, and can generate a local idealized PDB string.
- `app/structures/1ZF5.metadata.json` provides metadata displayed in the inspector.

### Spatial RAVIA Generic Engine

The repository also contains a broader engine for scientific process packs:

- `model.ts`: ScientificModel, process-pack compiler, layered validation, prompt resolution, event-sourced session state, branches, counterfactual deltas.
- `process-registry.ts`: registers DNA replication, eukaryotic transcription, and action potential packs.
- `dna-process.ts`, `transcription-process.ts`, `action-potential-process.ts`: curated process packs.
- `primitives.ts`: generic scientific visualization primitives.
- `scene-compiler.ts`: compiles a session/render plan into generic scene snapshots.
- `representation-selection.ts`: chooses schematic, molecular, timeline, graph, state-space, and mixed representations.
- `llm-interpretation.ts`: validates structured intent from a pluggable LLM-like provider, with deterministic fallback.
- `scientific-data-providers.ts`: RCSB adapter plus fixture-backed UniProt, Reactome, BioModels, Gene Ontology, and ChEBI adapters.
- `structure-visualization.ts`: curated structure mapping for RNA polymerase II/PDB 5XOG.

Important architecture mismatch: the currently visible `/code/spatial-ravia` page does not appear to use the generic process-pack/session/render-plan UI described in older progress docs. It uses its own B-DNA-specific prompt parser and Mol* viewer state.

### ChapterBio

- Nested Vite React project under `chapterbio`.
- Build output target is `../public/chapterbio`.
- Vite base is `/chapterbio/`.
- Contains a 48-entry figure catalog.
- Only Figure 7-33 is marked as the completed prototype.
- `chapterbio/REVIEW_NOTES.md` says most figure crops are conservative and need visual review before future implementation.

### Deployment Shape

- `CNAME`, `public/CNAME`, and `out/CNAME` point to `ravia.space`.
- `.nojekyll` files exist for GitHub Pages-style static hosting.
- No `.openai/hosting.json`, deployment workflow, GitHub Actions workflow, Dockerfile, or hosting-specific config was found.

## Setup Instructions

### Root Site

1. Install dependencies:

```sh
npm install
```

2. Run the development server:

```sh
npm run dev
```

3. Validate:

```sh
npm run typecheck
npm run lint
npm run test:spatial
npm run eval:spatial
npm run build
```

4. Static output is generated in `out/`.

### ChapterBio

1. Install nested dependencies:

```sh
cd chapterbio
npm install
```

2. Run ChapterBio directly:

```sh
npm run dev
```

3. Validate and rebuild assets consumed by the root site:

```sh
npm test
npm run build
```

The ChapterBio build writes to `public/chapterbio`.

## Validation Run

Commands run during this audit:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run test:spatial`: passed, 110 tests.
- `npm run eval:spatial`: completed, 78/108 cases passed.
- `npm run build`: passed.
- `cd chapterbio && npm test`: passed, 3 tests.
- `cd chapterbio && npm run build`: passed.
- Root dev server on port 3003:
  - `/`: 200.
  - `/code/spatial-ravia/`: 200.
  - `/chapterbio/`: 404 in Next dev.
  - `/fragments/what-the-hell-is-going-on/`: 404.

Observed warnings:

- `npm run build` warns that Next inferred `/Users/zerozae` as the workspace root because multiple lockfiles exist, including `/Users/zerozae/package-lock.json` and this repo's `package-lock.json`.
- `npm run test:spatial` passes but emits Node `MODULE_TYPELESS_PACKAGE_JSON` warnings because `.ts` test files are reparsed as ES modules while root `package.json` does not declare `"type": "module"`.

## What Currently Works

- The root site compiles and statically exports.
- Homepage, About, Papers, Code, Spatial RAVIA, and Spatial RAVIA primitives routes are generated as static pages.
- Theme toggle persists light/dark choice in local storage.
- Archive filtering for papers/code works from `data/archive.ts`.
- The B-DNA route loads as a client page and has controls for source, representation, coloring, isolation, base-pair stepping, bubble opening, transformations, camera presets, theme, and metadata.
- Spatial RAVIA generic model/compiler tests pass.
- Process packs for DNA replication, eukaryotic transcription, and action potential validate.
- Scene compiler, primitive gallery, representation selection, LLM intent validation, entity resolution, scientific data provider, and structure resolver tests pass.
- ChapterBio figure catalog tests pass and all 48 figure assets exist.
- ChapterBio production build can generate static assets into `public/chapterbio`.

## Broken Features

1. `/chapterbio/` is broken in root development.
   - The archive links to `/chapterbio/`.
   - Next dev returns 404.
   - `chapterbio` Vite build writes `public/chapterbio/vite-entry/index.html`, while Next export later emits `out/chapterbio/index.html`.
   - This makes local root-site testing inconsistent with static export behavior.

2. Several archive entries link to missing pages:
   - `/fragments/what-the-hell-is-going-on`
   - `/projects/civic-weather-station`
   - `/arguments/reality-has-a-user-interface-problem`
   - `/code/signal-notebook`
   - `/notes/memory-is-not-storage`
   - `/essays/the-institutions-are-tired`
   - `/papers/desire-as-an-operating-system`
   - `/fragments/faith-after-certainty`

3. Spatial RAVIA formal scientific evaluation fails 30 cases.
   - Weaknesses include paraphrase handling, misspellings, mixed organism contexts, impossible interventions, conflicting instructions, adversarial prompts, and entity alias collisions.

4. The visible Spatial RAVIA B-DNA viewer is disconnected from the generic process-pack architecture.
   - The route does not expose the tested DNA replication/transcription/action-potential workspace described in older progress documents.
   - The visible prompt parser is local to `prototype.tsx` and only controls B-DNA viewing modes.

5. Local root runtime verification of ChapterBio fails despite ChapterBio's own build passing.

## Unfinished Features

- ChapterBio has 48 catalogued figures, but only Figure 7-33 is marked `prototype`.
- Most ChapterBio figure crops are documented as conservative page-region references requiring visual review.
- Spatial RAVIA's LLM interpretation is provider-interface scaffolding; no real provider integration or API-key configuration is present.
- UniProt, Reactome, BioModels, Gene Ontology, and ChEBI integrations are fixture-backed only.
- BioModels quantitative fixture is "not yet imported into ScientificModel".
- Spatial RAVIA session state is in-memory only; no durable persistence is implemented.
- Formal scientific evaluation is below any reasonable reliability bar for a science-facing product.
- Graph/timeline/mixed/scientific-model views are tested in engine code but not clearly available in the current B-DNA route.
- There is no explicit deployment workflow or hosting configuration.

## Placeholder, Mocked, Or Fixture Content

- ChapterBio generic narratives are template prose for most figures, not figure-specific interactive explanations.
- ChapterBio original figure images are local educational references and many are not tight reviewed crops.
- Spatial RAVIA process timing/distances include explicit mocked assumptions.
- The idealized B-DNA model is generated from canonical parameters and is not experimental data or molecular dynamics.
- Non-RCSB scientific data providers return local fixtures.
- LLM tests use mock providers.
- Some archive entries appear to be content placeholders with no corresponding pages.

## Missing Dependencies Or Configuration

- No `.env.example`; no environment contract is documented.
- No database schema or migrations were found.
- No CI workflow was found.
- No deployment config beyond static export, CNAME, and `.nojekyll`.
- Next build root should be pinned with `turbopack.root` or the stray parent lockfile issue should be resolved.
- Root package should either declare module type intentionally or test execution should be adjusted to remove Node reparsing warnings.
- The root README is stale; it still describes a one-page archive site and omits Spatial RAVIA, ChapterBio, validation commands, deployment behavior, and known failures.

## Security Concerns

- No secrets were found in repository files inspected.
- No server API routes or database access are present.
- Client-side scientific prompts are deterministic/local in the visible route; no user prompt is sent to a remote service.
- Mol* is loaded from a large bundled local script in `public/spatial-ravia/molstar/molstar.js`; the provenance/update process for this vendored artifact is not documented.
- ChapterBio appears to include textbook-derived images. The product text says they are retained locally for private educational reference, but the repository and static export publish them under `/chapterbio/figures`. Licensing/public-use status is an important unresolved risk.
- Scientific content risk is significant: failed evaluation cases can cause unsupported or contradictory science to be accepted as supported.
- External provider adapters need explicit attribution/license display if live integration becomes user-facing.

## Bugs And Technical Debt

- Root dev server and static export disagree on ChapterBio routing.
- Archive data is not route-validated, so broken links ship silently.
- Spatial RAVIA has two divergent product directions in one route area: B-DNA Mol* viewer and generic process-pack world-model engine.
- Formal evaluation produces known failures but does not fail the validation command.
- Root tests pass with module-type warnings.
- Large generated/bundled assets live in source control in multiple places: `public/chapterbio`, `chapterbio/public`, `chapterbio/dist`, `chapterbio/figures`, and `chapterbio/tmp_pdf_pages`.
- `app/structures/1ZF5.cif` and `public/spatial-ravia/structures/1ZF5.cif` duplicate the same structure data.
- CNAME files do not all end cleanly with a newline.
- There are generated JS/CSS artifacts committed in both `public/chapterbio` and `chapterbio/assets`.
- `chapterbio/vite.config.js` and `.d.ts` generated config artifacts exist alongside source `.ts` configs.
- Global CSS is large and mixes general site styling with Spatial RAVIA-specific UI.

## What Prevents Running, Building, Testing, And Deploying

### Running

- Root app runs, but `/chapterbio/` is 404 in Next dev.
- Local route checks required outside-sandbox network access even though the server listened locally.

### Building

- Root and ChapterBio builds pass.
- Next emits a workspace-root warning due to multiple lockfiles. This does not block today's build but can cause wrong-root behavior in other environments.

### Testing

- Root and ChapterBio tests pass.
- Spatial RAVIA scientific evaluation fails 30/108 cases but returns process exit 0, so CI would not catch scientific regressions unless thresholds are enforced.
- Node module-type warnings should be cleaned up.

### Deploying

- Static export produces `out/`.
- Deployment target is inferred as GitHub Pages/custom domain, but no workflow or deployment instructions exist.
- Public ChapterBio asset licensing is unresolved.
- Broken archive links would deploy as 404s.

## Important Product Decisions Not Inferable From The Repository

- Is the primary product now the research archive, the B-DNA Mol* viewer, the generic Spatial RAVIA world-model engine, or ChapterBio?
- Should `/code/spatial-ravia` show the B-DNA viewer, the tested generic process-pack workspace, or both?
- Should Spatial RAVIA use a real LLM provider, remain deterministic, or support both?
- What scientific reliability threshold is required before deployment: unit tests only, 100% formal evaluation, or a documented lower threshold?
- Should failed scientific evaluation cases be build-blocking?
- What biology domains and processes should be supported next?
- Should unsupported/conflicting prompts ask clarification questions or hard-abstain?
- What is the source/licensing status of ChapterBio textbook images, and are they allowed on the public site?
- Should placeholder archive entries be hidden until real pages exist?
- What is the intended hosting platform and deployment process?
- Should the app support static-only hosting permanently, or will server/API features be added?
- Should scientific data providers fetch live data in the browser, through a server proxy, or only through curated/offline data?
- What citation/provenance UI is required for public release?

## Prioritized Implementation Plan

1. Fix routing and link integrity.
   - Add a first-class `/chapterbio` route or make the nested Vite export available in dev and production consistently.
   - Remove, hide, or implement missing archive entry pages.
   - Add route/link validation to tests.

2. Decide Spatial RAVIA product direction.
   - Choose whether `/code/spatial-ravia` is the B-DNA Mol* viewer or the generic process-pack workspace.
   - If both are needed, split routes clearly and update archive copy.
   - Remove stale docs or mark historical docs as historical.

3. Make scientific evaluation enforce product quality.
   - Set a minimum pass threshold.
   - Make `npm run eval:spatial` fail nonzero below that threshold.
   - Fix the 30 known failed cases or explicitly defer categories.

4. Resolve ChapterBio public-use risk.
   - Confirm image licensing/public hosting rights.
   - Replace textbook image exports where required.
   - Tighten reviewed crops before more figure prototypes.

5. Clean build and module configuration.
   - Pin `turbopack.root` in `next.config.ts` or remove the parent lockfile issue.
   - Decide and configure root ESM/CJS behavior to remove Node warnings.
   - Document Node/npm version expectations.

6. Document setup and deployment.
   - Expand README with root and ChapterBio commands.
   - Add deployment instructions for `ravia.space`.
   - Add an environment/config section even if no env vars are currently required.

7. Reduce generated asset duplication.
   - Decide which ChapterBio asset directories are source, generated, and deployable.
   - Ignore or remove obsolete generated artifacts.
   - Avoid duplicate structure files unless both locations are intentionally needed.

8. Wire or remove unused architecture layers.
   - If the generic engine is the future, reconnect it to the UI.
   - If the B-DNA viewer is the future, archive or remove unused process-pack workspace code.
   - If both remain, add separate docs, routes, and tests for each.

9. Add end-to-end browser checks.
   - Cover homepage archive links, Spatial RAVIA initial load, Mol* asset load, CIF load, ChapterBio load, and theme toggling.
   - Include static-export checks against `out/`.

10. Plan live provider integration.
    - Decide client/server fetch model.
    - Add attribution and version display.
    - Add rate-limit, cache, and failure UX.

## Exact Completion Criteria

The project should not be considered complete until all of these are true:

- `npm run typecheck`, `npm run lint`, `npm run test:spatial`, `npm run eval:spatial`, and `npm run build` pass with no warnings that indicate configuration ambiguity.
- `cd chapterbio && npm test && npm run build` passes.
- `npm run eval:spatial` exits nonzero below the chosen quality threshold.
- The chosen Spatial RAVIA route behavior is documented and matches the implemented UI.
- `/chapterbio/` returns 200 in local root development and deployed static output.
- Every visible archive link returns 200 or is intentionally disabled/hidden.
- README documents root setup, ChapterBio setup, validation, static export, and deployment.
- Deployment target and custom-domain behavior are explicit.
- Public asset licensing is documented, especially for ChapterBio figures and vendored Mol* assets.
- No unreviewed placeholder/mock content is presented as real product functionality.
- Scientific claims shown to users include appropriate provenance, limitations, and abstention behavior.
- Known formal evaluation failures are fixed or explicitly accepted in a product decision record.

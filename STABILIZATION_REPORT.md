# Stabilization Report

Date: 2026-08-06

## Routes Repaired

- `/chapterbio/` no longer depends on static directory-index behavior from `public/chapterbio/index.html`.
- Added a root Next route at `app/chapterbio/page.tsx`.
- The route loads the existing ChapterBio built assets through `app/chapterbio/ChapterBioEmbed.tsx`.
- Updated the ChapterBio Vite input so `cd chapterbio && npm run build` writes `public/chapterbio/index.html` instead of `public/chapterbio/vite-entry/index.html`.
- `npm run build` lists `/chapterbio` as a generated static route.

## Archive Links Repaired Or Removed

Available links:

- `/code/spatial-ravia`
- `/chapterbio/`

Entries changed from broken links to non-clickable planned entries:

- `/fragments/what-the-hell-is-going-on`
- `/projects/civic-weather-station`
- `/arguments/reality-has-a-user-interface-problem`
- `/code/signal-notebook`
- `/notes/memory-is-not-storage`
- `/essays/the-institutions-are-tired`
- `/papers/desire-as-an-operating-system`
- `/fragments/faith-after-certainty`

Regression coverage:

- Added an internal archive route-integrity test under the existing Spatial RAVIA test command.
- The test verifies implemented archive links and verifies planned entries are not clickable placeholders.

## Scientific Evaluation

Before stabilization:

- `npm run eval:spatial`: 78/108 cases passed, 30 failed.

Failure categories:

- Valid paraphrases and misspellings were not recognized.
- Bacterial/eukaryotic context extraction was incomplete.
- Cross-process contradictions were accepted instead of rejected.
- Known misconceptions were accepted as valid prompts.
- Impossible interventions were accepted.
- Adversarial provenance/PDB prompts were accepted.
- Follow-up `hide helicase` had no matching intervention.
- Short token matching let `ion` score unrelated transcription terms such as `transcription` and `initiation`.

After stabilization:

- `npm run eval:spatial`: 108/108 cases passed, 0 failed.
- Updated `SPATIAL_RAVIA_EVALUATION_REPORT.json`.
- Updated `SPATIAL_RAVIA_EVALUATION_FAILURE_ANALYSIS.md`.

Implementation summary:

- Added missing pack aliases, prompt rules, biological contexts, and command support.
- Added early unsupported/misconception gates for explicit scientifically invalid prompts.
- Tightened short-token partial matching to avoid process-selection false positives.
- Preserved existing passing behavior through the full Spatial RAVIA test suite.

## Process-Pack And UI Relationship

Discovered relationship:

- The tested engine contains DNA replication, eukaryotic transcription, and action potential process packs, process-pack compilation, generic session state, follow-up commands, counterfactual branches, representation selection, scene compilation, provenance, and data-provider boundaries.
- The visible `/code/spatial-ravia` UI is currently a B-DNA/Mol* viewer with a local B-DNA prompt parser.
- The current visible UI does not call `processPacks`, `startSessionFromPrompt`, `applyFollowUpCommand`, `deriveRenderPlan`, or the generic scene compiler.

History:

- Earlier commits built the process-pack workspace first.
- Later commits replaced the visible prototype with the B-DNA/Mol* viewer and then continued improving that viewer.
- No repository document states whether the replacement is permanent, temporary, or meant to become one module inside the broader engine.

Conclusion:

- No product-defining UI integration was implemented in this stabilization phase.
- The unresolved decision is recorded in `PRODUCT_DECISIONS_NEEDED.md`.

## Commands And Tests Run

- `find .. -name AGENTS.md -print`
- Read `PROJECT_AUDIT.md`
- `npm run test:spatial`
- `npm run typecheck`
- `npm run build`
- `npm run eval:spatial`
- `npm run lint`
- `cd chapterbio && npm test`
- `cd chapterbio && npm run build`
- Git history and code inspection commands for Spatial RAVIA route, prototype, docs, and process-pack files.

Notes:

- Root build passes but still prints the existing Next.js workspace-root warning caused by multiple lockfiles, including `/Users/zerozae/package-lock.json`.
- Node test/evaluation commands still print the existing `MODULE_TYPELESS_PACKAGE_JSON` warning because TypeScript ES-module files are run by Node without `"type": "module"` in `package.json`.
- A sandboxed local `curl` route check could not connect to the dev server even when Next reported ready. Route availability was validated by production build output and the route-integrity test.

## Remaining Blockers

- Product decision: choose whether `/code/spatial-ravia` should be B-DNA only, process-pack workspace only, or process-pack workspace with B-DNA/Mol* as a module.
- Deployment platform choice remains intentionally unresolved.
- Public asset licensing/provenance for vendored Mol* assets and ChapterBio figures still needs final documentation.
- Next workspace-root warning should be resolved by setting the project root in Next config or removing the unrelated parent lockfile.
- Node module-type warning should be resolved by deciding whether the root package should declare ESM behavior or by adjusting the test runner/transpilation setup.

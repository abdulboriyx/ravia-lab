# Product Decisions Needed

Date: 2026-08-06

## Spatial RAVIA Route Direction

### Evidence

- `SPATIAL_RAVIA_PROGRESS.md` documents an earlier `/code/spatial-ravia` workspace that used `processPacks`, `startSessionFromPrompt`, `applyFollowUpCommand`, representation switching, model inspection, assumptions, limitations, and sources.
- `SPATIAL_RAVIA_ARCHITECTURE_AUDIT.md` states that DNA replication, eukaryotic transcription, and action potential all run through `SpatialRaviaPrototype`.
- Git history shows the process-pack engine landing before the Mol* work:
  - `f6af88a New`: added the compiler contract, DNA/transcription packs, process registry, prompt interpretation, primitives, representation selection, and a process-pack UI.
  - `c0bd26a Pushed off`: added the generic scene compiler and expanded process-pack rendering.
  - `3fd4f02 Pushed`: added the action potential pack, formal evaluation, scientific data providers, and structure visualization.
  - `4b9bd1c Added CIF data`: rewrote `prototype.tsx` from the process-pack workspace into a Mol*/B-DNA viewer.
  - `0268b6f Pushed` and `8ca7a0a Baby`: continued investing in the Mol*/B-DNA viewer.
- Current `app/code/spatial-ravia/prototype.tsx` imports Mol* viewer state and B-DNA metadata, but it does not import `process-registry.ts`, `model.ts`, `scene-compiler.ts`, or the process packs.

### What Cannot Be Inferred

The repository does not say whether the B-DNA/Mol* viewer is the complete Spatial RAVIA product, one simulation inside the broader process-pack engine, or a temporary replacement/experiment. The evidence proves replacement in implementation history, but not product intent.

## Capabilities Present But Not Visible

- Process-pack prompt support for DNA replication, eukaryotic transcription, and action potential.
- Context extraction for bacterial/eukaryotic DNA replication and eukaryotic transcription.
- Follow-up command reducer driven by process-pack `CommandRule` metadata.
- Event-sourced sessions with replay, undo, redo, reset, serialization, and branch support.
- Counterfactual branches for no ligase, stopped helicase, disabled primer formation, transcription perturbations, and blocked sodium channels.
- Generic render-plan compilation from `BiologicalProcessPack` to `ScientificModel` to `RenderPlan`.
- Representation selection for schematic, timeline, network, time-series graph, state-space, mixed, and molecular views.
- Generic scene compiler with primitives, labels, camera focus, hiding, isolation, and stage state.
- Provenance, assumptions, limitations, source validation, and honesty warnings.
- Optional structure-resolution path for curated molecular structures such as RNA polymerase II.
- LLM intent interpretation boundary with schema validation and deterministic fallback.

## Options

### Option A: B-DNA/Mol* Viewer Is The Complete Current Product

Consequences:

- Keep `/code/spatial-ravia` focused on B-DNA molecular inspection.
- Archive or clearly mark the broader process-pack engine as experimental/internal.
- Scientific evaluation becomes lower priority for visible product readiness, but still protects unused code.
- Risk: discards or hides a substantial tested engine that documentation previously described as the application.

### Option B: B-DNA/Mol* Viewer Is One Simulation Inside The Broader Engine

Consequences:

- Keep the B-DNA viewer, but expose it as one representation or module within the process-pack workspace.
- Restore process-pack prompt/session UI as the main Spatial RAVIA shell.
- Requires integration design for how Mol* molecular snapshots relate to process packs and render-plan selection.
- Risk: larger implementation surface, but best preserves existing tested architecture and later B-DNA investment.

### Option C: B-DNA/Mol* Viewer Is A Temporary Replacement Or Experiment

Consequences:

- Restore the process-pack workspace as `/code/spatial-ravia`.
- Move the B-DNA viewer to a clearly named sub-route or experimental mode.
- Minimizes mismatch with existing architecture docs and tests.
- Risk: reverses recent visible UI work without explicit product approval.

## Recommended Default

Choose Option B unless a product owner explicitly says otherwise. It preserves the tested process-pack engine and the later B-DNA/Mol* work, avoids deleting recent work, and gives the clearest path to a coherent product: Spatial RAVIA as a process-pack workspace where molecular viewers are used only when curated structure data supports them.

## Decision Required Before Implementation

Choose the canonical route behavior for `/code/spatial-ravia`:

1. B-DNA viewer only.
2. Process-pack workspace only.
3. Process-pack workspace with B-DNA/Mol* as a selectable or routed module.

No further UI integration should be made until this is decided because the next change would define the product surface.

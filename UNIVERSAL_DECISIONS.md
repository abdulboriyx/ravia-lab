# Universal RAVIA Decisions

Date: 2026-08-06

## PhenomenonSpec Runtime Contract

Decision: use Zod 4 as the runtime validator for `PhenomenonSpec`.

Reason: the governing specification requires runtime validation, JSON-schema-compatible structure, and deterministic rejection of invalid scientific model data before rendering.

## DNA Migration Strategy

Decision: validate DNA through a controlled compatibility adapter instead of redesigning the UI or introducing a new process pack.

Reason: the existing DNA workspace, session reducer, scene compiler, and Mol* secondary view already work. The milestone asks for the validated contract while preserving visible behavior. The adapter creates a `PhenomenonSpec` from the current DNA pack and the compiler validates that spec before scene compilation.

## Evidence Classification

Decision: the replication fork remains `mechanistic-process` + `svg` + `schematic`; the B-DNA view is `molecular-structure` + `molstar` + `literal` only with approved deposited PDB `1ZF5` mapping.

Reason: PDB `1ZF5` is literal B-DNA coordinates, not a replication-fork structure. The fork mechanism is a schematic explanatory representation using normalized time.

## Quantity and Parameter Rules

Decision: only numeric legacy DNA parameters are migrated into `PhenomenonSpec.parameters` for this milestone.

Reason: `PhenomenonSpec` parameters are quantity-based and require numeric values, units, bounds, and claim IDs. Legacy boolean and categorical DNA flags remain in `BiologicalProcessPack` until the general pack migration defines typed categorical parameters.

## Visible Action-Potential Workspace

Decision: expose the existing action-potential process pack in the same visible Spatial RAVIA route and shared session controls used by DNA, while keeping the B-DNA Mol* scale selector DNA-only.

Reason: the process registry, session reducer, and scene compiler are already generic. The route should not require a parallel action-potential UI or a new process pack to make the existing reviewed pack visible.

Constraint: the action-potential membrane/channel scene remains schematic and normalized. The voltage graph uses a reviewed static Hodgkin-Huxley benchmark fixture, but the route does not expose an editable Hodgkin-Huxley solver.

## D3 Trace Dependency

Decision: add `d3-scale` and `d3-shape` for the action-potential voltage graph instead of hand-scaling the trace.

Reason: milestone 8 explicitly calls for SVG+D3, and graph axes should use a conventional deterministic scaling path. Keeping only the focused D3 packages avoids pulling in unrelated rendering machinery.

## Pack-Owned Incompatibility Rules

Decision: prompt-level scientific contradictions now belong to process packs as typed `incompatibilityRules`, not to a global regex list in `model.ts`.

Reason: process packs are the scientific authority for their own misconceptions, impossible interventions, and cross-process conflicts. This keeps rejection logic reviewable with the relevant entities, sources, relations, and validation rules.

Constraint: a true sealed holdout prompt set cannot be created by the same implementation pass and still be called sealed. It needs to be supplied or generated outside the tuning loop.

## Schema-Backed Representation Evidence

Decision: representation selection merges caller-provided availability with evidence derived from `PhenomenonSpec`.

Reason: the schema is now the authoritative place for approved renderer/evidence combinations. Molecular 3D is enabled only by manually supplied structural availability or a literal molecular-structure view with an approved deposited mapping. Schema default views may influence ranking, but explicit user requests still win when the requested representation has supporting evidence.

## PhenomenonPack Generalization

Decision: introduce `PhenomenonPack` as the primary pack contract and retain `BiologicalProcessPack` as a deprecated compatibility alias.

Reason: the spec needs equation-model and spatial-scene milestones after biology. A compatibility alias lets existing DNA, transcription, action-potential, evaluation, and UI behavior keep working while new orbit-oriented kinds are added.

Constraint: this milestone does not make `PhenomenonSpec` the sole authoring source. The DNA adapter remains temporary until all packs can be authored directly from the schema without duplicating content.

## Two-Body Orbit Renderer

Decision: add the orbit slice as a reviewed `PhenomenonPack` with a direct `PhenomenonSpec`, an offline JPL benchmark fixture, and a React Three Fiber spatial renderer.

Reason: the governing spec requires the MVP to exercise reusable 3D spatial rendering, physical units, equation-derived classification, and validation against JPL Horizons. The existing SVG scene compiler still receives selectable orbit primitives for session state, while the visible orbit representation uses R3F.

Constraint: the orbit slice is limited to a Sun-Earth two-body benchmark over a stored five-day window. It does not expose an arbitrary equation solver, N-body mission simulation, live retrieval, or spacecraft-navigation workflow.

## Orbit Benchmark Data

Decision: store the Horizons comparison data and two-body model points as a local fixture instead of querying JPL at runtime.

Reason: Spatial RAVIA packs must be curated and reproducible. Live external records may inform authoring, but runtime rendering and tests must consume allowlisted local data with declared units, provenance, and tolerance.

Constraint: the fixture tolerance is valid only for the checked 2026-01-01 through 2026-01-06 TDB benchmark interval.

## Server-Side Structured Intent Adapter

Decision: add a server-only OpenAI Responses adapter that requests strict JSON-schema structured output and then reuses the local `validateStructuredIntent` gate before accepting anything.

Reason: the spec allows an LLM only as a bounded intent selector. The model may choose from registered IDs, but it may not invent mechanisms, equations, sources, geometry, renderer instructions, or new process packs. Revalidating the response locally keeps deterministic fallback as the authority when provider output is invalid.

Constraint: this milestone does not add retrieval, a general web agent, client-side API keys, persistence, deployment changes, or a visible UI dependency on the provider. Tests inject a fake transport and do not require a live OpenAI call.

## Next Decision Needed

The next architecture decision is how to wire CI and static deployment gates without weakening the current static export, ChapterBio route, or visual verification requirements.

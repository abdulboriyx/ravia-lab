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

## Next Decision Needed

The next architecture decision is how to migrate `BiologicalProcessPack` to `PhenomenonPack` without duplicating legacy process data or weakening the existing `PhenomenonSpec` validation boundary.

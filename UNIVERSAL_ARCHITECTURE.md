# Universal RAVIA Architecture

Date: 2026-08-06

## Current Shape

Spatial RAVIA is a curated prompt-to-representation workspace. The visible `/code/spatial-ravia/` route starts a session from a supported prompt, compiles the selected process pack, renders the primary SVG scene, and keeps the existing Mol* B-DNA view as a secondary molecular-scale representation.

The runtime path is:

1. `process-registry.ts` exposes reviewed process packs.
2. `model.ts` resolves prompts, validates packs, creates event-sourced sessions, applies follow-up events, and compiles a `ScientificModel`.
3. `scene-compiler.ts` converts the active session and render plan into SVG-ready nodes, labels, groups, overlays, viewBox, camera focus, and timeline state.
4. `prototype.tsx` renders the DNA workspace controls, evidence panels, SVG view, and secondary `DnaMolecularView`.

## PhenomenonSpec Layer

`app/code/spatial-ravia/phenomenon-spec.ts` defines the Zod 4 runtime contract for `PhenomenonSpec` and its core subtypes:

- `RepresentationKind`
- `EvidenceMode`
- `ModelClass`
- `Quantity`
- `Claim`
- `Source`
- `Component`
- `ViewSpec`
- `PhenomenonSpec`

The schema is the validation authority for versioned phenomenon data. It checks unique IDs, claim and source coverage, component references, relation endpoints, state and transition references, parameter bounds, units, timeline ordering, view references, renderer/evidence combinations, deposited molecular structure mappings, and supported follow-up declarations.

## Compatibility Boundary

The current renderer still consumes `BiologicalProcessPack`. To avoid a UI rewrite in this milestone, `app/code/spatial-ravia/phenomenon-adapter.ts` derives a validated `PhenomenonSpec` from the existing DNA replication pack and attaches it to `dnaReplicationPack.phenomenonSpec`.

Compilation in `model.ts` now validates `pack.phenomenonSpec` before the legacy process-pack compiler runs. This makes the DNA contract executable without changing visible behavior, session events, scene compilation, routing, or Mol* lazy loading.

## Pack-Owned Incompatibility Rules

Process-specific prompt refusals live on each process pack as typed `incompatibilityRules`. Each rule declares an ID, a refusal reason, and phrase requirements expressed as groups of acceptable terms. `parsePromptWithPacks` evaluates these rules from the candidate packs before accepting a prompt.

This replaces the prior global contradiction regex table in `model.ts`. DNA, transcription, and action-potential packs now own their own misconceptions, cross-process conflicts, and unsafe prompt boundaries.

## Evidence Model

The DNA fork view is classified as a schematic explanatory model with normalized time. The B-DNA Mol* view is classified as a literal molecular-structure view only because it declares approved deposited PDB `1ZF5` coordinates. The contract rejects molecular-structure views without approved deposited mappings and rejects schematic process views mislabeled as literal.

## Deferred Architecture Work

The adapter is intentionally temporary. The next schema migration should make `PhenomenonSpec` the direct authoring source for all process packs, then retire legacy-only fields once representation selection consumes the schema directly.

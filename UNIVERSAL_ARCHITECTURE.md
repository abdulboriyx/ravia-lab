# Universal RAVIA Architecture

Date: 2026-08-06

## Current Shape

Spatial RAVIA is a curated prompt-to-representation workspace. The visible `/code/spatial-ravia/` route starts a session from a supported prompt, compiles the selected process pack, renders the primary process or spatial scene, and keeps the existing Mol* B-DNA view as a secondary DNA-only molecular-scale representation.

The runtime path is:

1. `process-registry.ts` exposes reviewed process packs.
2. `model.ts` resolves prompts, validates packs, creates event-sourced sessions, applies follow-up events, and compiles a `ScientificModel`.
3. `scene-compiler.ts` converts the active session and render plan into SVG-ready nodes, labels, groups, overlays, viewBox, camera focus, and timeline state.
4. `prototype.tsx` renders the shared Spatial RAVIA workspace controls, evidence panels, SVG view, orbit R3F view, and DNA-only secondary `DnaMolecularView`.

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

## PhenomenonPack Boundary

`app/code/spatial-ravia/model.ts` now exposes `PhenomenonPack` as the generalized curated-pack contract. The old `BiologicalProcessPack` name remains as a deprecated compatibility alias so existing DNA, transcription, action-potential, evaluation, and UI paths do not regress.

`compilePhenomenonPack`, `validatePhenomenonPack`, and `validatePhenomenonPackLayered` are the new primary APIs. The prior biological function names delegate to them for compatibility.

The current DNA `PhenomenonSpec` adapter remains temporary: `app/code/spatial-ravia/phenomenon-adapter.ts` derives a validated `PhenomenonSpec` from the existing DNA replication pack and attaches it to `dnaReplicationPack.phenomenonSpec`. Compilation validates `pack.phenomenonSpec` before scene compilation.

`PhenomenonComponentKind` now includes the prior biological kinds plus `equation-model`, `equation-state`, `spatial-body`, `spatial-reference-frame`, and `spatial-vector`. The two-body orbit pack uses those generalized kinds directly.

## Pack-Owned Incompatibility Rules

Process-specific prompt refusals live on each process pack as typed `incompatibilityRules`. Each rule declares an ID, a refusal reason, and phrase requirements expressed as groups of acceptable terms. `parsePromptWithPacks` evaluates these rules from the candidate packs before accepting a prompt.

This replaces the prior global contradiction regex table in `model.ts`. DNA, transcription, and action-potential packs now own their own misconceptions, cross-process conflicts, and unsafe prompt boundaries.

## Schema-Backed Representation Selection

`representation-selection.ts` now derives evidence availability from `PhenomenonSpec` when a compiled model carries one. Declared schema views can prove approved deposited molecular structure availability, declared graph views can provide network evidence, and physical timelines can provide quantitative time-series evidence.

For DNA, the schema-backed B-DNA structure view enables molecular 3D when specifically requested, but the declared schematic mechanistic-process view keeps the fork mechanism as the default primary representation.

## Visible Multi-Pack Workspace

`app/code/spatial-ravia/dna-workspace.ts` now exposes `spatialWorkspacePacks` for the public route while preserving the prior DNA-named exports as compatibility aliases. The visible route supports DNA replication, action-potential, and two-body orbit prompts through the same session reducer, playback clock, labels, directionality toggle, selection, hide, and isolate controls.

The action-potential view is the existing curated schematic mixed representation: membrane compartments, voltage-gated channel states, ion-flow arrows, normalized stage strip, and a D3-scaled voltage-trace graph. The workspace intentionally does not expose the B-DNA Mol* scale selector for non-DNA processes.

`app/code/spatial-ravia/action-potential-trace.ts` contains the static Hodgkin-Huxley benchmark trace fixture. It declares `ms` time units, `mV` voltage units, graph domains, viewport ranges, and a D3 path builder consumed by the action-potential process pack. The fixture is reviewed static data, not a live browser-side equation solver.

## Two-Body Orbit Slice

`app/code/spatial-ravia/orbit-process.ts` defines the reviewed Sun-Earth two-body orbit pack. It is a `PhenomenonPack` with an attached direct `PhenomenonSpec`, physical-time keyframes, spatial/equation component kinds, pack-owned N-body incompatibility rules, and a public `spatial-scene` + `r3f` + `derived` view.

`app/code/spatial-ravia/orbit-fixture.ts` stores the offline benchmark fixture. The JPL side is a local snapshot of Horizons Earth (399) vectors centered on the Sun (10), in AU and AU/day, for 2026-01-01 through 2026-01-06 TDB. The model side is a fixed two-body propagation from the same initial state using solar `mu` in `AU^3/day^2`. Tests assert the maximum position error stays below the declared `0.000025 AU` tolerance.

`app/code/spatial-ravia/OrbitR3FView.tsx` renders the orbit scene with React Three Fiber. It consumes the same session clock and selection state as the SVG process views. The R3F camera fits from the live canvas dimensions so desktop, tablet, and mobile widths keep the orbit visible without a one-size hardcoded zoom.

## Evidence Model

The DNA fork view is classified as a schematic explanatory model with normalized time. The B-DNA Mol* view is classified as a literal molecular-structure view only because it declares approved deposited PDB `1ZF5` coordinates. The contract rejects molecular-structure views without approved deposited mappings and rejects schematic process views mislabeled as literal.

The action-potential workspace is also classified as a schematic explanatory model with normalized time. Its voltage graph uses a fixed reviewed Hodgkin-Huxley benchmark trace, but the membrane/channel scene remains schematic and must not be labeled as an editable Hodgkin-Huxley simulation.

The orbit workspace is classified as an equation-derived simulation with physical time in days. Its rendered 3D scene uses enlarged bodies and markers for teaching clarity, and it explicitly refuses N-body mission simulation or spacecraft-navigation prompts.

## Deferred Architecture Work

The adapter is intentionally temporary. A later migration should make `PhenomenonSpec` the direct authoring source for all phenomenon packs, then retire legacy-only fields once additional packs consume the schema directly.

# PhenomenonSpec Report

Date: 2026-08-06

## Final Schema Structure

Added `app/code/spatial-ravia/phenomenon-spec.ts` with Zod 4 schemas for `RepresentationKind`, `EvidenceMode`, `ModelClass`, `Quantity`, `Claim`, `Source`, `Component`, `ViewSpec`, and `PhenomenonSpec`.

The schema validates versioned phenomenon data, components, relations, states, transitions, numeric parameters, normalized timelines, public views, interactions, claims, sources, assumptions, uncertainties, limitations, and supported follow-ups.

## Scientific Invariants

The validator rejects:

- displayed claims without valid source IDs;
- components, relations, states, transitions, views, and interactions with unknown references;
- duplicate IDs;
- editable parameters without bounds;
- reversed bounds and out-of-range parameter values;
- unknown units;
- normalized timelines claiming physical timing;
- invalid timeline keyframe order;
- invalid renderer and representation combinations;
- molecular-structure views without approved deposited coordinates;
- schematic process views mislabeled as literal.

## DNA Migration Details

The DNA replication pack now receives a generated `dnaReplicationPhenomenonSpec` through `phenomenonSpecFromBiologicalProcessPack`. The generated spec classifies:

- fork mechanism: `mechanistic-process`, `svg`, `schematic`, normalized time;
- DNA structure: `molecular-structure`, `molstar`, `literal`, approved deposited PDB `1ZF5` mapping.

The spec is validated at module initialization outside production and again before `compileBiologicalProcessPack` proceeds. Existing session events, scene compilation, UI controls, unsupported-prompt preservation, and the Mol* secondary view are unchanged.

## Compatibility Decisions

The current SVG renderer still consumes `BiologicalProcessPack`, so this milestone uses a narrow adapter rather than duplicating the DNA scientific content in a parallel hand-authored schema. Numeric DNA parameters are migrated as `Quantity` values. Legacy boolean and categorical parameters stay in the old pack until the general pack migration introduces typed non-quantity parameters.

## Negative Tests

Added `app/code/spatial-ravia/phenomenon-spec.test.ts` fixtures proving rejection of missing component references, unknown claim IDs, unknown source IDs, reversed parameter bounds, out-of-range values, duplicate IDs, invalid renderer/representation pairs, literal molecular views without approved coordinates, schematic views mislabeled as literal, invalid timeline keyframes, unsupported interaction targets, normalized physical-timing claims, and unknown units.

## Validation Commands

Run:

- `npm run lint`
- `npm run typecheck`
- `npm run test:spatial`
- `npm run eval:spatial`
- `npm run build`
- `cd chapterbio && npm test`
- `cd chapterbio && npm run build`
- Playwright smoke test for `/code/spatial-ravia/`

## Known Limitations

The validated contract is attached to the DNA pack through an adapter; the renderer has not yet been rewritten to consume `PhenomenonSpec` directly. Only numeric quantity parameters are represented in the new schema. Other process packs are intentionally not migrated in this milestone.

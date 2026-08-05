# PhenomenonPack Migration Report

Date: 2026-08-06

## Implemented Behavior

- Added `PhenomenonPack` as the generalized curated-pack contract in `app/code/spatial-ravia/model.ts`.
- Kept `BiologicalProcessPack` as a deprecated compatibility alias.
- Added primary APIs:
  - `compilePhenomenonPack`
  - `validatePhenomenonPack`
  - `validatePhenomenonPackLayered`
- Preserved compatibility APIs:
  - `compileBiologicalProcessPack`
  - `validateBiologicalProcessPack`
  - `validateBiologicalProcessPackLayered`
- Exposed `phenomenonPacks` from `process-registry.ts` while preserving `processPacks`.

## Component Kinds Added

`PhenomenonComponentKind` now supports:

- existing biological kinds: `molecule`, `enzyme`, `protein`, `strand`, `fragment`, `process`
- equation kinds: `equation-model`, `equation-state`
- spatial kinds: `spatial-body`, `spatial-reference-frame`, `spatial-vector`

The `PhenomenonSpec` runtime schema accepts the same generalized component kinds.

## Compatibility Decisions

- Existing DNA, transcription, and action-potential packs were not rewritten.
- Existing tests, evaluation, and UI paths can keep importing the old biological name.
- New milestone work should use `PhenomenonPack` and `phenomenonPacks`.
- The DNA `PhenomenonSpec` adapter remains temporary and does not duplicate scientific content.

## Tests Added

- Existing packs validate and compile through `PhenomenonPack`.
- `PhenomenonPack` accepts equation-model and spatial component kinds.
- `PhenomenonSpec` accepts generalized equation and spatial component kinds.

## Validation Performed

- `npm run typecheck`
- `npm run test:spatial`

Full final gate results are tracked in `UNIVERSAL_TASKS.md`.

## Known Limitations

- The repository still contains many compatibility imports of `BiologicalProcessPack`.
- The direct `PhenomenonSpec` authoring migration is still deferred.
- No orbit pack or R3F renderer was added in this milestone.

## Exact Next Recommended Task

Add the two-body orbit pack with offline benchmark data, declared physical units, JPL comparison fixture, and a renderer path for the first spatial/equation-derived MVP slice.

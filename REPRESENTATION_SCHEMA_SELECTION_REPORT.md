# Representation Schema Selection Report

Date: 2026-08-06

## Implemented Behavior

Representation selection now consumes `PhenomenonSpec` evidence availability when a compiled model carries a validated spec or when callers pass a spec directly.

The selector derives:

- molecular structure availability from `molecular-structure` + `molstar` + `literal` views with approved deposited structure mappings;
- network availability from declared graph views;
- physical time-series availability from physical timelines;
- schema preference for declared schematic mechanistic-process views.

## DNA Behavior

The DNA replication model carries `dnaReplicationPhenomenonSpec` through `ScientificModel`. The selector can now use the approved PDB `1ZF5` B-DNA mapping for molecular 3D when molecular structure is explicitly requested, while keeping the replication fork as the default primary representation.

Unapproved or non-deposited molecular mappings do not count as structural evidence, so molecular 3D requests fall back with the existing no-structural-data warning.

## Tests

Added focused coverage in `app/code/spatial-ravia/representation-selection.test.ts` proving:

- approved `PhenomenonSpec` molecular evidence enables molecular 3D;
- unapproved `PhenomenonSpec` molecular evidence is rejected;
- existing representation behavior remains stable across molecular, graph, timeline, quantitative, network, state-space, and fallback cases.

## Compatibility

The selector still accepts the legacy `quantitativeData` availability object, and manual availability remains supported for process packs that have not migrated to `PhenomenonSpec`. Mock representation tests explicitly clear inherited schema metadata so future-pack heuristics remain covered independently.

## Validation

Confirmed:

- `npm run lint`
- `npm run typecheck`
- `npm run test:spatial`
- `npm run eval:spatial`

Full root build, ChapterBio checks, and browser smoke should be rerun after documentation finalization.

## Known Limitations

Only DNA currently carries a validated `PhenomenonSpec`. Transcription and action-potential selection still rely on legacy availability hints until their packs migrate to the schema contract.

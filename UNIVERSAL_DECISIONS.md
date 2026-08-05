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

## Next Decision Needed

The next architecture decision is how to replace global contradiction regexes with pack-owned capability and incompatibility declarations without weakening the existing scientific evaluation suite.

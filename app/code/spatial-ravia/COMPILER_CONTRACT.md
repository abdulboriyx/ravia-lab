# Spatial Ravia Compiler Contract

The compiler boundary is:

```ts
PhenomenonPack -> ScientificModel -> RenderPlan
```

`PhenomenonPack` is curated source data. `ScientificModel` is the persistent internal model used by the application. `RenderPlan` is renderer-independent drawing and animation data consumed by UI renderers.

`BiologicalProcessPack` remains as a deprecated compatibility alias while DNA, transcription, action-potential, tests, and evaluation code migrate.

## Required Pack Sections

Every pack must define:

- process identity: `id`, `process`, `aliases`
- biological context: `biologicalContexts`, `defaultContext`
- entities: stable IDs, labels, aliases, kind, description, literal/schematic flags
- relations: source entity, target entity, relation label, description
- stages: ordered states and active entity references
- state transitions: from-stage, to-stage, trigger, rule
- parameters: ID, label, value, optional unit, description
- interventions: ID, label, description, affected entities
- representation rules
- animation instructions: renderer-independent SVG-like elements, isolation groups, viewBox, duration
- sources: ID, title, authors, locator, note
- assumptions
- limitations
- validation rules: required entities, relations, parameters, limitations

## Compiler Behavior

`compilePhenomenonPack(pack, options)` performs these steps:

1. Validate the process pack strictly.
2. Resolve the biological context from `options.biologicalContext` or `pack.defaultContext`.
3. Construct the persistent `ScientificModel`.
4. Derive a `RenderPlan` from `pack.animation`.
5. Return explicit `CompilationError[]` for invalid input.

The compiler does not silently repair invalid data. Missing entities, bad references, duplicate IDs, malformed sources, invalid contexts, and failed validation rules return `{ ok: false, errors }`.

The compatibility `compileBiologicalProcessPack(pack, options)` function delegates to `compilePhenomenonPack`.

## Extension Rules

- New processes must be added as new process packs, not by editing generic UI or reducers.
- Process-specific terms belong in the pack, a process-specific validation module, or tests for that pack.
- Generic UI may consume only `ScientificModel`, `RenderPlan`, generic entity IDs, transitions, and generic controls.
- Command behavior must be encoded as `CommandRule` patches on the pack.
- Prompt matching must be encoded as `PromptRule` entries on the pack.
- Geometry and animation must be encoded as `AnimationInstructions`; renderers consume only the compiled `RenderPlan`.
- Validation rules should encode domain invariants that must be present before a pack can compile.

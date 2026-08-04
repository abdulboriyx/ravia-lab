# Spatial Ravia Hardcoding Audit

## Findings Before Refactor

| Area | Hard-coded dependency | Why it blocked generalization | Refactor needed |
| --- | --- | --- | --- |
| UI prompt examples | `prototype.tsx` embedded DNA-specific examples such as DNA copying, replication fork, Okazaki fragments, and no-ligase prompts. | A generic scientific application shell would need editing for every new process. | Move examples into each `BiologicalProcessPack`; UI reads `activeModel.examples` or registry examples. |
| Unsupported prompt copy | Generic UI said the prototype supports DNA replication only. | Domain availability became a UI concern instead of a registry/pack concern. | Keep UI generic and let prompt parsing return pack/registry unsupported messages. |
| Command input placeholder | Placeholder referenced isolating the lagging strand. | New processes would show a DNA command even when the active model is not DNA. | Derive placeholder from `activeModel.commandRules`. |
| State reducer | `applyFollowUpCommand` contained branches for lagging strand, leading strand, RNA primers, ligase, Okazaki fragments, and DNA directionality. | Adding any process required editing the generic reducer. | Replace branches with declarative `CommandRule` patches owned by the process pack. |
| Prompt parser | Parser matched DNA hints directly inside the generic model runtime. | Prompt support was hard-wired to one process. | Add generic `parsePromptWithPacks` over pack-owned `PromptRule` entries. |
| Renderer | `DnaReplicationCanvas` checked entity IDs such as `ligase`, `lagging-strand`, `rna-primers`, and `okazaki-fragments`. | Renderer could not draw another process without new JSX branches. | Replace with `RenderPlan` and generic SVG element iteration. |
| Geometry | Fork curves, enzyme symbols, fragment rectangles, primer lines, and no-ligase comparison geometry lived in `prototype.tsx`. | Scientific geometry was mixed into generic UI. | Move geometry into DNA `renderPlan`. |
| Animation logic | The component used a hard-coded playback denominator suited to the DNA scene. | Different processes need different natural durations. | Put `progressDurationMs` on `RenderPlan`. |
| Entity selection | Isolation logic special-cased lagging strand to keep Okazaki fragments and primers visible. | Selection rules depended on DNA semantics. | Add `renderPlan.isolationGroups`. |
| Timeline generation | Active-stage logic assumed five DNA stages by dividing state order by `4`. | Processes with different stage counts would mark active states incorrectly. | Compute the divisor from `states.length - 1`. |
| Intervention handling | Baseline/intervention toggle checked `compare-no-ligase` directly. | Comparison behavior was tied to one DNA intervention. | Select the active model's comparison-like command rule generically. |
| Model inspector variables | Variables showed `fork_position` and `ligase_present`. | Inspector assumed DNA parameters and intervention effects. | Render generic timeline position and model parameters. |
| Governing rules panel | Rules showed DNA synthesis direction and ligase requirements directly. | Governing rules were not model-derived. | Render transition rules from `ScientificModel.transitions`. |
| Explanation view | Explanation hard-coded why Okazaki fragments are necessary. | Alternate views could not explain another model. | Render process-owned representation rules and limitations. |
| Tests | Generic model tests imported and asserted DNA IDs directly from `model.ts`. | Tests encouraged DNA data to stay in generic runtime. | Split generic runtime behavior from DNA-specific validation in `dna-process.ts`. |

## Refactor Completed

- `app/code/spatial-ravia/model.ts` now defines generic schemas, `ScientificModel`, `RenderPlan`, session state, prompt parsing over registered packs, generic command patching, render-plan visibility, timeline control, and representation switching.
- `app/code/spatial-ravia/dna-process.ts` now owns DNA process aliases, examples, prompt rules, command rules, DNA validation, scientific rules, stages, entities, interventions, source metadata, and all DNA scene geometry.
- `app/code/spatial-ravia/process-registry.ts` is the only registry bridge between generic app code and installed packs.
- `app/code/spatial-ravia/prototype.tsx` imports generic runtime types/functions plus the registry, renders generic `RenderPlan` elements, and contains no checks for DNA entity IDs.

## Remaining Generalization Work

- `process-registry.ts` currently registers only the DNA pack.
- The render plan is SVG-oriented; a future 3D process will need another generic renderer backend selected by `RenderPlan`.
- Command rules are exact phrase matches; a future parser should map natural language to command IDs without putting process strings in the reducer.

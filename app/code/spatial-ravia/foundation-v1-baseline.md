# Spatial Ravia Foundation v1 Baseline

Status: **FROZEN**. This is the authoritative Foundation baseline for future Spatial Ravia work. It declares architecture and migration status only; it does not introduce a renderer migration or feature work.

## Canonical pipeline and boundaries (F0)

`raw prompt → SemanticIntent → capability resolution → scientific grounding/planning → SceneSpec v1 → timeline / teaching / export projections → Foundation migration seam → production renderer`

The LLM may author only bounded `SemanticIntent v1`; validation rejects renderer concepts and unbounded fields. Capability resolution is deterministic and returns supported, partial, unsupported, invalid, or clarification-required outcomes explicitly. Scientific truth, topology, fidelity, and provenance are resolved before presentation. Renderers do not parse prompts and never infer scientific truth. `SceneSpec v1` is renderer-independent. Grounding and provenance remain authoritative through every projection. There is no silent generic fallback.

F0 boundaries are declared by this document and enforced by the contracts listed below: F1 owns user semantic meaning; F2 owns resolved scientific truth and provenance; F3 owns projection contracts; F4 composes without duplicating truth; F5 owns support semantics; F6 owns Foundation regression evidence; F7 is the only Foundation-to-production adapter boundary.

## Frozen Foundation inventory

| Foundation record | Authoritative files | Schema / version | Responsibility and dependencies | Status |
| --- | --- | --- | --- | --- |
| F0 architecture / boundaries | `foundation-v1-baseline.md` | Foundation v1 | Canonical ownership, pipeline, migration and change-control rules. Depends on F1–F7. | Frozen |
| F1 SemanticIntent | `foundation-semantic-vocabulary.ts`, `semantic-intent.ts`, `semantic-intent-legacy-adapters.ts`, `semantic-intent-f1-freeze.md` | SemanticIntent `1` | Bounded, renderer-neutral semantic meaning; legacy ingress adaptation. Depends on frozen vocabulary only. | Frozen |
| F2 ScientificSceneSpec | `scientific-actor.ts`, `scientific-topology.ts`, `scientific-fidelity-provenance.ts`, `scientific-data-providers.ts`, `scientific-scene-spec.ts`, `scientific-primitive-registry.ts` | ScientificSceneSpec `1` | Resolved scientific actors, topology, state, fidelity, provenance, and presentation intent boundary. Depends on F1 vocabulary and authoritative grounding inputs. | Frozen |
| F3 timeline / teaching / export | `scientific-timeline.ts`, `teaching-plan.ts`, `scene-export-contract.ts` | Timeline `1`; TeachingPlan `1`; export package / request / manifest `1` | Renderer-neutral projections of F2 truth for time, teaching, and export. Depends on F2 IDs and provenance. | Frozen |
| F4 SceneSpec | `scene-spec-v1.ts` | SceneSpec v1 `1` | Validated composition envelope for F1, F2, and optional F3 projections; it owns no duplicate scientific facts. Depends on F1–F3. | Frozen |
| F5 CapabilityRegistry | `dna-capability-registry.ts`, `rna-capability-registry.ts`, `capability-support-policy.ts`, `capability-registry.ts` | CapabilityRegistry `1` | Normalized capability catalog and deterministic support policy, including explicit partial/unsupported outcomes. Depends on F1 vocabulary, F2 primitives/provenance, and protected owner references. | Frozen |
| F6 benchmark runner | `foundation-benchmark-harness.ts`, `foundation-benchmark-fixtures.ts`, `foundation-capability-benchmark-corpus.ts`, `foundation-preservation-benchmarks.ts`, `benchmark-report.ts`, `foundation-benchmark-runner.ts` | Harness `1`; runner `f6-e-v1` | Deterministic contract, capability, cross-contract, and preservation benchmark evidence. Depends on F1–F5 plus protected benchmark expectations. | Frozen |
| F7 Foundation → legacy seam | `foundation-legacy-migration-seam.ts`, `dna-foundation-migration.ts`, `f7-dna-strand-separation-migration.ts`, `rna-hairpin-foundation-migration.ts`, `rna-exonuclease-migration.ts` | Seam `1` | Single adapter seam from resolved Foundation payloads to accepted production owners; creates neither geometry nor prompt parsing. Depends on F1, F4, F5, and protected production owners. | Frozen |
| F8 freeze declaration | `foundation-v1-baseline.md` | Foundation baseline v1 | Freeze inventory, governance, classification, and baseline acceptance record. Depends on F0–F7 validation. | Frozen after final validation |

Fixtures and `*.test.ts` files colocated with these authorities are the contract evidence, not alternate authorities.

## System classification

### A. Frozen Foundation

The F1–F7 contracts and infrastructure above, including their fixtures, validations, benchmark corpus, and F7 seam. Their schema semantics are authoritative for future work.

### B. Protected production

Accepted DNA/RNA renderers and their presentation owners, grounding/loaders, camera systems, shared geometry primitives, and current benchmark suites. They remain production authorities for rendering and visual acceptance; this freeze does not rewrite or delete them.

### C. Legacy / migrate incrementally

Existing raw-prompt parsing, routing, planning, and direct renderer-dispatch seams (`biology-prompt-parser.ts`, legacy biology routers/resolvers, and family-specific ingress) remain intact. New capabilities migrate one at a time through F7; no legacy system is deleted in this freeze.

## Migration rules

1. Migrate one capability or coherent family at a time through the shared F7 seam.
2. Do not rewrite a renderer unless a separately approved justification requires it.
3. No raw prompt logic may exist downstream of `SemanticIntent`.
4. Do not create duplicate scientific contracts or a duplicate geometry system.
5. Preserve F2 grounding/provenance, existing renderer ownership, and benchmark expectations.
6. Report unsupported and partial support explicitly; never silently substitute a generic renderer.
7. Before each capability is frozen, pass its Foundation and protected benchmarks and complete manual visual acceptance.

## Version and change control

A schema/version change is required for any semantic meaning change to the F1 vocabulary or `SemanticIntent`; scientific-model, topology, fidelity, or provenance change to F2; timeline, teaching, or export contract change to F3; structure or compatibility change to F4 `SceneSpec`; capability registry or support-policy semantic change to F5; benchmark schema/meaning change to F6; or F7 seam payload/guarantee change.

Additive implementation work that does not change a contract's externally validated meaning does not require a contract version change. Renderer bug fixes, performance work, visual-material changes, and camera tuning do not automatically require a Foundation version change, provided they preserve the frozen contract and protected acceptance expectations.

## Verified baseline metrics

| Validation | Baseline |
| --- | ---: |
| Foundation benchmark | 48/48 |
| Full spatial suite | 513/513 |
| DNA family | 100/100 |
| DNA mechanism | 60/60 |
| RNA semantic | 80/80 |
| RNA runtime ownership | 80/80 |
| F7 migration tests | 15/15 |
| Typecheck | pass |
| Lint | pass |
| Production webpack build | pass |

## Known technical debt

- Legacy prompt/routing/planning seams still exist by design until their capability-by-capability F7 migration.
- Production renderers retain their existing implementation-specific geometry and camera systems; Foundation does not replace them.
- Manual visual acceptance remains a required human gate for each future migrated capability.

## Freeze acceptance

This baseline passes only with zero blocker and zero major findings, green baseline validation, no F1–F7 semantic changes beyond freeze documentation, no benchmark expectation drift, and no competing authority for Foundation contracts.

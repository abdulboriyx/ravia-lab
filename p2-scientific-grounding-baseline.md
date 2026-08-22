# P2 Scientific Grounding Compiler v1 Baseline

Status: frozen by the P2-L freeze commit. This document records the authoritative P2 baseline; it does not claim visual acceptance or computed-structure support.

## Purpose

P2 compiles validated scientific intent into grounded scientific scene data and presents that data through existing production owners. P2 does not parse prompts, infer scientific truth from presentation state, or provide generic fallbacks.

## Frozen pipeline

`validated SemanticIntent → CapabilityRegistry → ScientificPlanV1 → ScientificExecutionInventoryV1 → P2-B provenance → P2-D structure/model/assembly context → P2-C selectors → P2-F fidelity/uncertainty → BCDF substrate → P2-G authenticated chemistry v2 → P2-E scientific topology → ScientificSceneSpec → P2-J1 owner-compatible scientific view → existing production owner`

## Authority ownership

| Authority | Sole responsibility |
|---|---|
| P2-B | Source and provenance |
| P2-D | Structure, model, assembly, and context |
| P2-C | Molecular identity and selectors |
| P2-F | Fidelity and uncertainty |
| P2-G | Local chemistry and authenticated binary chemical links |
| P2-E | Scientific interactions and topology |
| P2-H | Planning, request materialization, and orchestration |
| P2-J1 | Non-authoritative projection to legacy owner contracts |

No downstream component may re-own upstream scientific truth.

## Frozen contracts and seams

- `ScientificExecutionInventoryV1`: `app/code/spatial-ravia/scientific-execution-inventory.ts`
- `ScientificPlanV1`, `GroundedScientificPlanResult`, compiler, materializers, and scene composer: `app/code/spatial-ravia/p2-h-scientific-plan-compiler.ts`
- P2-B provenance: `app/code/spatial-ravia/scientific-source-provenance-resolver.ts`
- P2-D context: `app/code/spatial-ravia/p2-d-structure-context.ts`
- P2-C selectors: `app/code/spatial-ravia/p2-molecular-selector-grounding.ts`
- P2-F fidelity: `app/code/spatial-ravia/fidelity-uncertainty-authority.ts`
- BCDF seam: `app/code/spatial-ravia/p2-bcdf-grounding-seam.ts`
- P2-G v2, unary assertions, and authenticated `linkAssertions`: `app/code/spatial-ravia/p2-local-chemistry-grounding.ts`
- P2-E topology and evidence sidecars: `app/code/spatial-ravia/p2-e-interaction-topology-grounding.ts`
- P2-J1 owner views: `app/code/spatial-ravia/p2-j1-owner-scientific-views.ts`
- Raw-world scenario infrastructure: `app/code/spatial-ravia/p2-tf-scientific-grounding-fixtures.ts`

These are the frozen P2 baseline contracts. Changes require deliberate versioning or regression justification.

## Capability runtime matrix

The registry contains 25 capabilities. Contract support is not equivalent to executable grounding or production migration.

### PRODUCTION_OWNER_MIGRATED (4)

- `dna-base-pairing`
- `dna-strand-separation`
- `rna-secondary-structure`
- `rna-exonuclease-degradation`

### FULLY_EXECUTABLE (4)

- `dna-phosphodiester-backbone`
- `rna-base-pairing`
- `rna-dna-hybridization`
- `rna-cleavage`

### CONTRACT_SUPPORTED_BUT_GROUNDING_LIMITED (17)

- `dna-canonical-structure`
- `dna-sequence-regulation`
- `dna-replication`
- `dna-transcription`
- `dna-damage-repair`
- `dna-packaging`
- `dna-local-chemistry`
- `dna-antiparallel-polarity`
- `dna-helix-stabilization`
- `dna-nucleotide-assembly`
- `rna-generic-structure`
- `rna-types-functions`
- `rna-nascent-transcript`
- `rna-processing`
- `rna-chemical-stability`
- `rna-local-chemistry`
- `rna-dna-chemistry-comparison`

No capability is classified as fully end-to-end computed-topology support. Computed structure remains an explicit grounding limitation.

## Production migration matrix

| P2 capability | Owner view adapter | Existing production owner | Status |
|---|---|---|---|
| `dna-base-pairing` | `adaptDnaBasePairingOwnerView` | DNA base-pair interaction owner | Structural/scientific migration passed; visual gate pending |
| `dna-strand-separation` | `adaptDnaStrandSeparationOwnerView` | DNA strand-separation owner | Structural/scientific migration passed; visual gate pending |
| `rna-secondary-structure` | `adaptRnaHairpinOwnerView` | RNA secondary-structure owner | Structural/scientific migration passed; visual gate pending |
| `rna-exonuclease-degradation` | `adaptRnaExonucleaseOwnerView` | RNA degradation/exonuclease owner | Structural/scientific migration passed; visual gate pending |

The remaining production owners are unmigrated. P2-J1 adapters only reorganize grounded facts and retain traceability; they do not add scientific authority.

## Benchmark baseline

### P2-I

- 110 total cases
- 90 DEV: 90/90
- 20 sealed HOLDOUT: 20/20
- 0 critical failures

Determinism, metamorphic equivalence, ambiguity preservation, unsupported-path correctness, and evidence-trace integrity passed.

### P2-K

- 30 fresh frozen holdout cases
- SHA-256: `cc158dc82d535d6da1638f0c87d9b75c0493d94f5f17e32526d6853f341c5ae0`
- 30/30
- 0 critical failures

The fresh holdout was frozen before execution and was not tuned case-by-case.

## Test baseline

- Full spatial suite: 683 passing
- DNA family: 100/100
- DNA mechanism: 60/60
- RNA semantic: 80/80
- RNA runtime: 80/80
- Typecheck: PASS
- Lint: PASS

Build status is environment-blocked by the Turbopack worker port binding failure (`Operation not permitted`), not classified as an application-source failure.

## Limitation register

### `COMPUTED_STRUCTURE_CONTEXT_GAP`

Computed structure data may exist in the raw inventory, but the current P2-D/BCDF path cannot provide end-to-end computed structural topology context. Status: **NOT YET END-TO-END SUPPORTED**. Execution must not fall back to deposited or schematic context.

### `P2_J_VISUAL_ACCEPTANCE_PENDING`

The four migrated owners have not received manual browser visual acceptance. Status: **UNVERIFIED — ENVIRONMENT BLOCKED**. This is a separate pre-release/manual gate, not a scientific regression and not a reason to reopen the P2 architecture.

Additional limitations are the 17 grounding-limited capabilities, unmigrated production owners, and capability families that are currently schematic-only or contract-level. Constrained schematic and schematic provenance must remain explicit and must not masquerade as deposited evidence.

## Deferred visual gate

Required manual inspection on a runnable local environment:

1. DNA pairing
2. DNA strand separation
3. RNA hairpin
4. RNA exonuclease

For each, record `VISUAL PASS`, `VISUAL PARTIAL`, or `VISUAL FAIL` after checking owner selection, actor presence, duplication, labels, scientific state, camera behavior, and regression against the accepted production baseline. No visual pass is claimed by this freeze.

## Protected systems

The following are protected after the freeze:

- P2-B/C/D/F
- BCDF substrate seam
- P2-G v2
- P2-E
- P2-H compiler and request materializers
- P2-I benchmark corpus and scorer
- P2-J/J1 migration seam and owner views
- P2-K frozen holdout
- P2-TF raw-world scenario infrastructure
- Foundation, P1, and frozen SceneSpec contracts

## Future extension rules

Any future P2 extension must preserve authority ownership, use explicit versioned contract changes, add benchmark coverage and fresh holdout coverage when scientifically material, and explicitly update capability runtime status. P2 must never introduce raw prompt parsing, use renderer geometry as scientific truth, silently fall back across fidelity/source classes, or collapse contract support into executable support. New production migrations require a versioned owner-compatible view and separate visual acceptance.

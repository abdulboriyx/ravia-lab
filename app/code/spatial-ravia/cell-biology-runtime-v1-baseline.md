# Cell Biology Runtime v1 Baseline — D-I Freeze

## Architecture and authority

The frozen path is:

`SemanticIntent / capability request → P2 grounded science → ScientificSceneSpec v1 + CellularScientificExtensionV1 → P3 exact-time mechanism state → production projection → P4 exact-frame state → Teaching Runtime → Export Runtime`.

D-series modules compose over this path. They do not create independent clocks, renderer-owned scientific state, or competing mechanism engines. ScientificSceneSpec v1 is unchanged; CellularScientificSceneV1 is the additive composition of that contract with CellularScientificExtensionV1.

Capability Registry v1 remains unchanged. D-B through D-I additions are exposed through additive capabilityRegistryV2 records with explicit dependencies and support status.

## Frozen scientific support

### Compartments and localization

Authoritative compartments include extracellular space, plasma membrane, cytosol, nucleus/nucleoplasm, nuclear pore, ER membrane/lumen, Golgi membrane/lumen, vesicle membrane/lumen, and early endosome membrane/lumen. LocalizationV1 and LocalizationChangeV1 carry explicit actor identity, source/destination, membrane relation, sidedness, transport kind, timeline reference, and provenance. Renderer hierarchy, camera, coordinates, and visual proximity are not location authority.

### Gene expression and RNA processing

The supported scope is eukaryotic nuclear gene expression: transcription initiation, elongation and bounded release; 5-prime capping; exon/intron topology and splicing; 3-prime processing and polyadenylation; mature-mRNA validation; nuclear export; translation initiation, elongation, termination, codon/anticodon recognition, A/P/E occupancy, and peptide release.

Directionality is explicit: RNA synthesis 5-prime to 3-prime, template reading 3-prime to 5-prime, mRNA reading 5-prime to 3-prime, and peptide growth N-terminus to C-terminus. One RNA identity persists from nascent transcript through mature/exported/translated mRNA. Intron removal and exon joining are topology changes, not visual hiding.

### Secretory proteins and processing

The supported path is signal recognition → SRP/ER targeting → translocon engagement → cotranslational translocation → bounded folding/modification → ER quality pass → ER exit → cis/medial/trans Golgi → sorting → secretory vesicle → docking/fusion → secretion. Protein identity persists through all stages. Supported bounded states include unfolded, partially folded, folded, misfolded, disulfide formation, N-linked glycosylation state, signal-region cleavage where represented, and phosphorylation/dephosphorylation in D-G. Atomistic folding dynamics and a universal PTM engine are not claimed. Misfolded cargo is retained; full ERAD is deferred.

### Membrane topology

The supported membrane-protein branch is TYPE-I_SINGLE_PASS. The canonical invariant is: ER N-terminal domain luminal and C-terminal domain cytosolic; after ordinary trafficking and plasma-membrane fusion, N-terminal domain extracellular and C-terminal domain cytosolic. Cytosolic-facing regions remain cytosolic-facing; luminal-facing regions remain non-cytosolic and map to extracellular-facing after fusion. Topology is scientific state, never screen orientation.

Multipass membrane proteins are `DEFERRED_D_V1` and remain explicitly unsupported.

### Cytoskeletal transport and endocytosis

Microtubule identity and explicit polarity support bounded kinesin plus-end and cytoplasmic-dynein minus-end transport with explicit cargo/adaptor/track relationships and exact-time arrival/release. Direction does not come from left/right, XYZ velocity, or camera orientation. Actin/myosin transport is not part of the certified canonical branch.

Endocytosis supports surface receptor → coated pit → invagination → scission → independent endocytic vesicle → early-endosome entry and sorting. Scission and fusion are topology states. The receptor extracellular-facing domain becomes vesicle/endosome luminal-facing while its cytosolic domain remains cytosolic. Late endosome and lysosomal degradation are unsupported.

### Signaling

The bounded D-G pathway is ligand → membrane receptor binding/activation/phosphorylation → adaptor/SOS recruitment → Ras GDP/GTP exchange → Raf → MEK → ERK → nuclear translocation → target-response enablement, with bounded Ras hydrolysis and ERK dephosphorylation. Causal dependencies are scientific event dependencies; Teaching WHY consumes them. D-C remains transcription authority: D-G exposes a target-response prerequisite/reference and does not implement a second RNA synthesis engine.

No quantitative concentrations, dose-response, Hill kinetics, stochastic occupancy, or pathway-wide biochemical rate model is supported.

## Identity and determinism guarantees

Benchmark-backed identity chains cover RNA, secretory protein, Type-I membrane protein, receptor, vesicle/cargo, and motor/cargo relationships. Supported mechanisms are directly reconstructable at exact time, history-independent, restart-invariant, and serialized without renderer objects, browser handles, raw prompts, or local machine paths. Array-order and serialization invariance are part of the D-H certification.

## Teaching, P4, and export

BEGINNER, INTERMEDIATE, and ADVANCED use the same scientific snapshots; only existing audience disclosure/detail policy changes. SHOW, EXPLAIN, WHY, COMPARE where available, and MISCONCEPTION_CORRECTION consume canonical references and causal events. Cellular teaching references are additive and preserve older TeachingPlan compatibility.

D-series production projections are display-only. P4 applies deterministic render configuration and camera cues; it does not infer biology. ScenePackageV1 and EmbedPackageV1 preserve cellular payloads, timelines, topology, transport, signaling, teaching, provenance, and fidelity. Export Runtime v1 remains the authority for scientific frames, teaching frames, PNG sequences, captions, slides, scene packages, and embeds.

## D-H benchmark freeze

- Total: 120
- DEV: 90
- SEALED_HOLDOUT: 30
- Holdout SHA-256: `6117937702d705ff8849d23056f4931b6c23f3221f4bdb2dd41f6eb16b967b2e`
- Critical failures: 0
- Dimension scores: 100%
- Runner: `npm run eval:spatial:cell-biology-benchmark`

The D-H corpus and holdout are frozen. Existing A-G, B-H, P2, and P3 baselines remain protected and must not be regenerated or tuned.

## Support matrix

| System | Status |
|---|---|
| CELL_COMPARTMENTS / LOCALIZATION / MEMBRANE_SIDEDNESS | SUPPORTED |
| TRANSCRIPTION / RNA_PROCESSING / MRNA_EXPORT / TRANSLATION | SUPPORTED |
| SECRETORY_PATHWAY / ER_TRANSLOCATION | SUPPORTED |
| PROTEIN_FOLDING_STATE / DISULFIDE_FORMATION / N_LINKED_GLYCOSYLATION / ER_QUALITY_CONTROL | SUPPORTED, bounded |
| TYPE_I_SINGLE_PASS_MEMBRANE_PROTEIN | SUPPORTED |
| MULTIPASS_MEMBRANE_PROTEIN | DEFERRED_D_V1 |
| CYTOSKELETAL_TRANSPORT / KINESIN / DYNEIN | SUPPORTED, bounded |
| ENDOCYTOSIS / EARLY_ENDOSOME_SORTING | SUPPORTED, bounded |
| RTK_RAS_MAPK_SIGNALING / SIGNAL_REGULATED_RESPONSE | SUPPORTED, constrained |
| FULL_ERAD / LYSOSOMAL_DEGRADATION | DEFERRED_D_V1 / UNSUPPORTED_D_V1 |
| QUANTITATIVE_KINETICS / STOCHASTIC_SIMULATION | UNSUPPORTED_D_V1 |
| CELL_CYCLE / MITOSIS / BROAD_METABOLISM | NOT_IMPLEMENTED |

## Limitations and gates

- `D_C_PRODUCTION_VISUAL_ACCEPTANCE_PENDING` through `D_H_CELL_BIOLOGY_VISUAL_ACCEPTANCE_PENDING`: `UNVERIFIED — ENVIRONMENT BLOCKED`.
- `CELL_BIOLOGY_PRODUCTION_BUILD`: `UNVERIFIED — ENVIRONMENT BLOCKED` when Turbopack cannot spawn its worker or bind its internal port.
- Whole-cell and organelle geometry is schematic; relative size is not physical-scale truth.
- Timelines encode deterministic mechanism/teaching ordering, not automatically real biochemical elapsed time or rates.
- No atomistic folding simulation, full cell cycle/mitosis, or broad metabolic-network simulation.

## Protected systems and versioning policy

Protected authorities are P2, P3, P4, Teaching Runtime v1, Export Runtime v1, D-B localization, D-C gene expression, D-D secretory pathway, D-E topology, D-F transport/endocytosis, D-G signaling, capabilityRegistryV2 D-series records, cellular TeachingReference extensions, production projections, package payloads, and the D-H corpus/hash.

Future changes require either a versioned additive extension or a demonstrated systemic scientific bug fix. Deferred biology must not be silently promoted by renderer behavior or benchmark changes.

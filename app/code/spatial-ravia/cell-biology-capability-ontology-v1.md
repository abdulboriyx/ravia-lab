# Cell Biology Capability / Ontology Map v1

Status: D-A audit and modeling artifact. This document does not activate new biology capabilities and does not modify P2, P3, P4, Teaching Runtime, or Export Runtime.

## A. Current support map

The existing authoritative capability registry is `capability-registry.ts`. It currently normalizes DNA, RNA, and shared records; it has no `CELL` domain. The older `BiologySceneSpec` path has broader, stringly typed entity/relation/action vocabulary, but it is not a substitute for the frozen ScientificSceneSpec/P2 authority.

| Area | Current classification | Evidence / boundary |
|---|---|---|
| DNA structure, pairing, local chemistry | CANONICAL_GROUNDED | DNA capability registry, ScientificSceneSpec topology/state, P2/P3 proofs |
| DNA strand separation | CANONICAL_GROUNDED | deterministic topology/timeline path and production owner |
| DNA replication | PARTIAL | DNA registry and grounded helicase/polymerase structure adapters exist; full fork chemistry, localization, and cell context are not one canonical cell capability |
| DNA transcription | PARTIAL | DNA registry plus grounded RNAP/template/bubble presentation and tests; compartment and gene-expression integration are absent |
| RNA hairpin, pairing, cleavage, local chemistry | CANONICAL_GROUNDED | RNA registry and P2/P3 runtime paths |
| RNA processing | PARTIAL | `rna-processing` registry record and presentation path exist; spliceosome, branch-point/lariat, nuclear localization, and export are not canonical |
| Ribosome / translation | PARTIAL | 4V5C audit and structure-grounding adapters exist; translation is not integrated into the canonical cell capability registry or compartment model |
| Nucleus, nucleoplasm, cytosol | LEGACY_RENDERED / SCHEMATIC | present in legacy biology scene/signaling vocabulary, not typed ScientificSceneSpec compartments |
| Plasma membrane and receptor signaling | LEGACY_RENDERED / SCHEMATIC | RTK/MAPK legacy tests and scene builder relations exist; not a P2/P3 cell capability |
| Nuclear envelope, nuclear pore | CONTRACT_ONLY / ABSENT | names or legacy concepts may occur, but no authoritative compartment or pore-crossing model |
| ER, rough/smooth ER, ER lumen | ABSENT | no canonical compartment/localization capability |
| Golgi, endosome, lysosome, peroxisome | ABSENT | no canonical owner or typed scientific model |
| Mitochondrion, matrix, intermembrane space | ABSENT | no canonical owner or typed scientific model |
| Vesicle trafficking, budding, docking, fusion | ABSENT | no typed transport/topology event in the frozen cell contract |
| Protein folding / quality control | ABSENT | no canonical conformation, chaperone, modification, or retained/removed product model |
| Cytoskeleton / motor transport | CONTRACT_ONLY / ABSENT | terminology and isolated legacy references exist, but no grounded canonical capability |
| Cell cycle / mitosis | ABSENT | no canonical capability |
| Apoptosis | ABSENT | no canonical capability |
| Broad metabolism / kinetics | ABSENT | intentionally outside D-A and recommended for later scope |

Existing DNA/RNA support remains unchanged. “Partial” means useful grounded pieces exist, not that the broader process is production-ready.

## B. Reusable frozen primitives

| Primitive | Assessment | D-A conclusion |
|---|---|---|
| Actor identity and stable IDs | CAN_REUSE_DIRECTLY | Extend actor categories and metadata additively; preserve identity semantics |
| Groups | CAN_REUSE_DIRECTLY | Useful base for complexes and organelle assemblies, but explicit membership/lifecycle is needed |
| Interactions | CAN_REUSE_DIRECTLY | Existing covalent/noncovalent/semantic relation split is reusable; cell-specific types are missing |
| Topology and continuity | CAN_REUSE_DIRECTLY | Reusable for membrane and polymer changes; localization must not be encoded as geometry |
| Scientific state | NEEDS_ADDITIVE_EXTENSION | Existing states cover DNA/RNA cases; typed localization, conformation, modification, and compartment states are needed |
| Timeline events/transitions | CAN_REUSE_DIRECTLY | P3 remains time authority; typed transport/reaction/modification payloads are additive |
| Constraints and dependency ordering | CAN_REUSE_DIRECTLY | Reuse for prerequisites, event order, and incompatibility checks |
| Provenance and fidelity | CAN_REUSE_DIRECTLY | P2 remains the source and fidelity authority |
| Teaching references | CAN_REUSE_DIRECTLY | New cell IDs can flow through existing structured references after grounding |
| Exact-time evaluation | CAN_REUSE_DIRECTLY | Reuse after cell events are represented in ScientificTimeline |
| Presentation focus | CAN_REUSE_DIRECTLY | Presentation only; never scientific localization or state |
| Legacy BiologySceneSpec entities/relations/actions | INSUFFICIENT_FOR_CELL_BIOLOGY | Retain only as legacy/ingress evidence; do not promote string relations to authority |
| Current F5 capability registry | NEEDS_ADDITIVE_EXTENSION | Add a CELL domain and required cell fields in a later version; do not create a second registry |

The current topology model supports interaction kinds `covalent`, `noncovalent`, and `semanticRelation`, plus DNA/RNA-specific types such as phosphodiester linkage, base pairing, continuity, cleavage, and processing. It does not yet encode membrane sides, compartments, catalytic substrate/product sets, or complex membership as typed authority.

## C. Cellular scale ontology

Scale is scientific scope, not camera zoom.

| Scale | Entities that exist | D-A policy |
|---|---|---|
| MOLECULAR | nucleic acids, proteins, peptides, lipids, ions, metabolites, nucleotides, amino acids | Required |
| COMPLEX | ribosome, spliceosome, replication fork, transcription machinery, nuclear pore complex, receptor complex | Required for gene-expression and trafficking mechanisms |
| ORGANELLE | nucleus, ER, Golgi, mitochondrion, lysosome, endosome, peroxisome, vesicles | Core compartments first; organelle breadth is staged |
| CELLULAR | whole cell, cytosol, plasma membrane, extracellular context, cell-cycle state | Required for integrated processes |
| MULTI_COMPARTMENT | nucleus-to-cytosol, ER-to-Golgi-to-membrane, vesicle routes, membrane crossings | Required for transport and integrated teaching |

## D. Compartment ontology

### D v1 core

`extracellular-space`, `plasma-membrane`, `cytosol`, `nucleus`, `nucleoplasm`, `nuclear-envelope`, `nuclear-pore`, `rough-er`, `er-lumen`, `vesicle`, `vesicle-lumen`, `golgi-cisternae`.

These are sufficient to ground the first gene-expression, nuclear-transport, and secretory-pathway slices.

### D v1.1 / later

`nucleolus`, `smooth-er`, `endosome`, `lysosome`, `mitochondrion`, `mitochondrial-matrix`, `intermembrane-space`, and `peroxisome` should be added only with a grounded capability requiring them. The ontology reserves these IDs but does not imply support.

Each compartment needs a stable identity, parent/containment relation, boundary identity where applicable, lumen/side semantics, provenance, and fidelity. It must not be represented only by a rendered region or coordinate.

## E. Localization and transport model

The smallest useful additive model is a typed localization relation, not a free-form relation string:

```text
LocalizationRef {
  actorId,
  locationId,
  relation: CONTAINED_IN | LUMEN_OF | MEMBRANE_ASSOCIATED | EMBEDDED_IN_MEMBRANE,
  membraneSide?: EXTRACELLULAR | CYTOSOLIC | LUMINAL | NUCLEOPLASMIC,
  state: PRESENT | ENTERING | EXITING | BOUND,
  provenanceRefs
}
```

Transport must remain distinct from localization and topology:

| Concept | Meaning |
|---|---|
| TRANSPORT_EVENT | an actor or cargo moves between locations |
| LOCALIZATION_CHANGE | authoritative before/after location state |
| MEMBRANE_TOPOLOGY_CHANGE | boundary topology changes, such as budding or fusion |

Candidate transport types are diffusion, facilitated diffusion, active transport, vesicular transport, nuclear import, nuclear export, translocation, endocytosis, and exocytosis. D-B should introduce the relation/event boundary; D-E should add vesicle-specific topology.

## F. Membrane requirements

The minimum semantic membrane model is:

- membrane identity and boundary owner;
- two explicitly named sides, with `extracellular/cytosolic`, `luminal/cytosolic`, or `nucleoplasmic/cytoplasmic` pairings;
- bilayer identity without lipid-physics simulation;
- embedded, peripheral, channel, transporter, and receptor association types;
- crossing/import/export events;
- budding and fusion as topology changes with before/after references.

Legacy scene relations such as `embedded_in` are useful evidence but are not sufficient: they do not validate sidedness, cargo topology, or a deterministic membrane-crossing event.

## G. Molecular actor ontology

The bounded actor classes are: `DNA`, `RNA`, `protein`, `peptide`, `lipid`, `carbohydrate`, `ion`, `metabolite`, `nucleotide`, `amino-acid`, `enzyme`, `receptor`, `transporter`, `channel`, `ribosome`, `polymerase`, `motor-protein`, `vesicle`, and `organelle`.

These are identity categories, not chemistry rules. Specialized classes such as enzyme, receptor, and polymerase should reference their molecular identity and roles; they must not duplicate P2 reaction or topology authority.

## H. Complexes and binding

Groups are reusable as a base, but a canonical cell model needs explicit `complexId`, member actor IDs, assembly/disassembly state, interfaces or binding sites where grounded, and provenance. Required complex examples are ribosome, spliceosome, replication fork, transcription machinery, nuclear pore complex, and receptor/signaling complex.

Binding must distinguish:

1. `CHEMICAL_BOND` — covalent chemistry;
2. `NONCOVALENT_ASSOCIATION` — reversible molecular association;
3. `FUNCTIONAL_COMPLEX_MEMBERSHIP` — an explanatory or assembled machine relation that is not itself a bond.

The current topology interaction kinds provide a useful foundation, but these distinctions and lifecycle semantics are not yet complete for cell biology.

## I. Enzyme and reaction model

The minimum catalytic representation is a validated reaction record:

```text
CatalyticReaction {
  reactionId,
  enzymeRef,
  substrateRefs,
  productRefs,
  cofactorRefs?,
  localityRef,
  eventRef,
  provenanceRefs,
  fidelity
}
```

The event may update scientific states/topology, but the wording, renderer, and teaching layers must not infer products from an enzyme name. Kinetics, rates, concentrations, and stochastic collision simulation are outside D v1.

## J. Modification and conformation model

Covalent modifications should be typed events over a target and modifier/cofactor where grounded: phosphorylation, dephosphorylation, ubiquitination, glycosylation, acetylation, methylation, and proteolytic cleavage.

Conformation is scientific state, separate from geometry. The reserved state family includes `INACTIVE`, `ACTIVE`, `OPEN`, `CLOSED`, `BOUND`, `UNBOUND`, `PHOSPHORYLATED`, and `UNPHOSPHORYLATED`. A renderer may depict these states, but geometry cannot create or validate them.

## K. Biosynthesis and polymer model

The existing P3 `polymerGrew` / `polymerShortened` event shape is reusable, but it is not sufficient by itself. A domain-aware polymer event needs polymer type, ordered monomer/component references, directionality, retained continuity, and evidence.

Candidate shared primitive: `POLYMER_GROWTH`, with required domain-specific payloads for DNA/RNA, peptide, actin, or microtubule. The shared event must not flatten DNA phosphodiester formation, peptide-bond formation, and cytoskeletal subunit addition into one chemistry rule.

Depolymerization requires an explicit retained/removed partition. This is mandatory for exonuclease, proteolysis, and future filament shortening. `FRAGMENTATION_UNGROUNDED` remains the default when the partition cannot be grounded.

## L. Degradation model

No degradation event may silently delete an actor or imply an ungrounded fragment. A supported degradation record needs source polymer/complex, retained product IDs, removed product IDs if scientifically known, cleavage/degradation event, directionality where relevant, and provenance. Proteasomal, lysosomal, RNA, and proteolytic pathways are later capabilities, not current support.

## M. Directionality

Use one generic directed relation for graph ordering only, plus domain-specific direction fields:

- nucleic acid synthesis: `FIVE_PRIME_TO_THREE_PRIME`;
- peptide synthesis: `N_TO_C`;
- Golgi route: `CIS_TO_TRANS`;
- organelle route: `ER_TO_GOLGI_TO_MEMBRANE`;
- filament polarity: `PLUS_TO_MINUS` / `MINUS_TO_PLUS` as appropriate;
- transport: `IMPORT`, `EXPORT`, `INTO_LUMEN`, `OUT_OF_LUMEN`.

Screen orientation and camera direction are never directionality authority.

## N. Replication requirement map

| Requirement | Status |
|---|---|
| DNA duplex, local opening, fork, nucleotide | CURRENTLY_SUPPORTED / partial in cell context |
| helicase and DNA polymerase structural grounding | CURRENTLY_SUPPORTED as adapters |
| origin/opening region | PARTIALLY_SUPPORTED |
| ssDNA state | PARTIALLY_SUPPORTED |
| primase and RNA primer | MISSING_PRIMITIVE |
| leading/lagging strand roles | MISSING_PRIMITIVE |
| Okazaki fragments | MISSING_GROUNDING / retained-product contract needed |
| ligase and phosphodiester joining | PARTIALLY_SUPPORTED at local chemistry, missing integrated mechanism |
| topoisomerase | MISSING_GROUNDING for a canonical capability |
| nucleotide incorporation and 5′/3′ direction | PARTIALLY_SUPPORTED |
| primer removal/fill-in | MISSING_PRIMITIVE |
| nuclear localization and replication compartment | MISSING_PRIMITIVE |

The current DNA replication path should not be advertised as full cellular replication until these gaps are resolved.

## O. Transcription requirement map

Promoter, DNA template/non-template strands, RNA polymerase, transcription bubble, nascent transcript, initiation, elongation, termination, and local re-annealing have partial or strong legacy/grounded presentation support. Missing for a canonical cell capability are typed promoter occupancy, nuclear localization, explicit machinery complex, Pol II CTD state, and integrated capping/splicing/export coupling.

## P. RNA processing requirement map

The current RNA registry covers pre-mRNA, mature mRNA, cap, poly(A) tail, exon, and intron at a capability/presentation level. A full splice capability still needs a grounded spliceosome complex, branch point, lariat representation if included, ordered excision/joining events, nuclear location, and export. Capping and polyadenylation should be separate bounded capabilities rather than implicit properties of “processing.”

## Q. Translation requirement map

The 4V5C audit gives useful deposited structural grounding for ribosomal subunits, mRNA, A/P/E tRNAs, and residue anchors. A canonical cellular translation capability additionally needs complex membership, codon/anticodon references, aminoacyl-tRNA identity, peptide-growth event, translocation, termination/release, cytosolic or ER localization, and grounded GTP/cofactor participation where in scope.

## R. Secretory pathway requirement map

This is currently absent as a canonical capability. Required sequence: signal peptide, SRP, ribosome docking, translocon, ER lumen, cotranslational translocation, folding, ER exit vesicle, Golgi cis/trans route, modification, sorting, secretory vesicle, plasma membrane, and exocytosis. It depends directly on D-B localization/membrane semantics and is therefore a major D-E target.

## S. Folding and trafficking

Folding requires nascent-chain identity, folding-state transitions, chaperone association, disulfide/glycosylation events where grounded, misfolded state, and ER quality-control outcome. Vesicle trafficking requires budding, coat/cargo selection, movement, tethering, docking, SNARE association, and fusion. These are not renderer animation phases; each must be represented as structured state/topology changes.

## T. Cytoskeleton

Actin, microtubule, intermediate filament, polymerization/depolymerization, polarity, motor/cargo relation, centrosome, and spindle are not currently canonical cell capabilities. The first tractable slices are actin polymerization and microtubule motor transport; spindle/mitosis should follow only after polarity, attachment, and multi-complex semantics exist.

## U. Signaling

The legacy RTK/MAPK path is useful as a candidate: ligand in extracellular space, membrane-embedded receptor, binding, dimerization, autophosphorylation, adaptor recruitment, Ras activation, Raf/MEK/ERK activation, and ERK translocation. It is currently `LEGACY_RENDERED / SCHEMATIC`, not P2/P3 canonical. Typed actions needed are `ACTIVATES`, `INHIBITS`, `RECRUITS`, `PHOSPHORYLATES`, `CLEAVES`, `TRANSLOCATES`, and `DEGRADES`, with provenance and state transitions.

## V. Cell cycle, mitosis, apoptosis, metabolism

Full cell cycle and mitosis are later-scale capabilities. Required future entities include G1/S/G2/M states, cyclins/CDKs, checkpoints, chromosomes, kinetochores, spindle poles, microtubule attachment, metaphase alignment, chromatid separation, and cytokinesis. Apoptosis requires a separate grounded death-signal/caspase/mitochondrial pathway. Broad metabolism, concentration, rate laws, and reaction networks are explicitly deferred from D v1.

## W. Multi-scale and cross-scale identity

Scale transitions are semantic focus transitions: whole cell → organelle → complex → molecule → local chemistry. They do not create new actors. Stable actor IDs must persist as the same entity moves between nucleus, nuclear pore, cytosol, and ribosome context. A future model needs `scaleContext` and `crossScaleIdentity` references, while Teaching may select focus/detail without changing science.

## X. Fidelity, scale, and time policy

Scientific fidelity tiers remain owned by P2/provenance. A schematic whole-cell layout must be labeled as schematic and must not imply literal molecular scale. Molecular, organelle, and whole-cell views may use different visual scales while retaining the same IDs and fidelity claims.

ScientificTimeline remains the time authority. D should support a distinction between `PHYSICAL_TIME` and `TEACHING_COMPRESSED_TIME` only as an explicit timeline metadata extension. Event order, dependencies, and exact states must remain authoritative; visual duration is not kinetic simulation.

The first D trajectories should be deterministic single trajectories. Population stochasticity, concentration, diffusion kinetics, Michaelis–Menten rates, and reaction-network simulation are deferred.

## Y. Causality and activation

Scientific causality belongs in grounded events/constraints, not Teaching. The model should support required prior events, enabling states, catalytic relations, inhibition, activation, recruitment, phosphorylation, cleavage, translocation, and degradation as typed scientific records. Teaching may expose only the causal references supplied by P2/P3.

## Z. Capability-registry extension

Extend the existing `CapabilityRegistry` in a later phase; do not create a second registry. The additive cell record should retain current fields and add only the fields required by cell scope:

```text
CellCapabilityRecord {
  capabilityId,
  domain: CELL,
  processFamily,
  supportedActs,
  actorClasses,
  compartmentIds,
  requiredScientificPrimitives,
  requiredSceneSpecPrimitives,
  requiredTimelineFeatures,
  groundingRequirements,
  teachingReadiness,
  exportReadiness,
  fidelityRequirements,
  presentationOwner,
  supportStatus,
  benchmarkReferences
}
```

Use the existing support vocabulary (`SUPPORTED`, `PARTIALLY_SUPPORTED`, `UNSUPPORTED`) and readiness fields. The D tier labels below are audit maturity labels, not a replacement registry status.

## AA. Proposed D v1 capability set

The finite high-impact set is 24 capabilities, staged by dependency:

1. `CELL_COMPARTMENT_LOCALIZATION`
2. `MEMBRANE_SIDEDNESS_ASSOCIATION`
3. `NUCLEAR_IMPORT_EXPORT`
4. `DNA_REPLICATION_FORK_ELONGATION`
5. `TRANSCRIPTION_INITIATION_ELONGATION`
6. `MRNA_CAPPING`
7. `MRNA_SPLICING`
8. `MRNA_POLYADENYLATION`
9. `RIBOSOMAL_TRANSLATION_ELONGATION`
10. `ER_COTRANSLATIONAL_TRANSLOCATION`
11. `PROTEIN_FOLDING_ER_QUALITY_CONTROL`
12. `ER_GOLGI_VESICLE_BUDDING`
13. `GOLGI_CIS_TRANS_SORTING`
14. `VESICLE_DOCKING_FUSION`
15. `EXOCYTOSIS`
16. `ENDOCYTOSIS`
17. `RTK_RECEPTOR_ACTIVATION`
18. `MAPK_PHOSPHORYLATION_CASCADE`
19. `ACTIN_POLYMERIZATION`
20. `MICROTUBULE_MOTOR_TRANSPORT`
21. `MITOTIC_CHROMOSOME_SEGREGATION`
22. `CELL_CYCLE_G1_S_CHECKPOINT`
23. `PROTEASOMAL_DEGRADATION`
24. `LYSOSOMAL_DEGRADATION`

The first nine are the core foundation. 10–16 are the major secretory/trafficking expansion. 17–20 are signaling/cytoskeleton slices. 21–24 are later D capabilities and should not be represented as supported merely because their IDs are reserved.

## AB. Ranked mechanism set

| Rank | Mechanism | Reason |
|---:|---|---|
| 1 | Compartment/localization/membrane semantics | prerequisite for every cellular route |
| 2 | Transcription initiation/elongation | reuses strongest DNA/RNA mechanisms |
| 3 | RNA processing: capping, splicing, polyadenylation | bridges transcription to mature mRNA |
| 4 | Translation elongation | existing 4V5C grounding provides a useful base |
| 5 | DNA replication fork | high value, but requires primer/strand-role gaps |
| 6 | Nuclear import/export | small cross-compartment proof |
| 7 | ER cotranslational translocation | first integrated secretory mechanism |
| 8 | ER folding/modification/QC | depends on state/modification model |
| 9 | ER→Golgi budding and transport | depends on vesicle topology |
| 10 | Golgi sorting and exocytosis | completes a visible route |
| 11 | RTK activation | existing legacy path can be grounded after membrane semantics |
| 12 | MAPK phosphorylation cascade | depends on typed modification/causality |
| 13 | Actin polymerization | bounded polymer-growth reuse |
| 14 | Microtubule motor transport | adds polarity and cargo movement |
| 15 | Mitotic chromosome segregation | high value, highest representation risk in this list |

## AC. A-player quality bar

A cell mechanism is not “done” until all of the following are true: grounded actors; grounded compartments; explicit interactions and states; explicit localization transitions; explicit topology changes where relevant; preserved provenance/fidelity; deterministic timeline; exact-time state; Teaching Runtime support; Export Runtime support; explicit unsupported outcomes; benchmark coverage; production proof; and manual visual acceptance when the environment permits it.

Use maturity labels without replacing existing support statuses:

| Tier | Meaning |
|---|---|
| TIER 0 — CONTRACT_ONLY | names or shape exist, no grounded capability |
| TIER 1 — SCIENTIFICALLY_GROUNDED | authoritative actors/claims/provenance exist |
| TIER 2 — DETERMINISTIC_MECHANISM | P3 timeline and exact states pass |
| TIER 3 — TEACHING_EXECUTABLE | Teaching plan/snapshot/text are grounded |
| TIER 4 — PRODUCTION_MIGRATED | production adapter consumes canonical outputs |
| TIER 5 — VISUALLY_ACCEPTED | supported-path manual/pixel gate passes |

Current strongest DNA/RNA capabilities are approximately TIER 4 with TIER 5 pending visual gates. Replication, transcription, and translation have strong TIER 1/partial TIER 2 material but are not one coherent TIER 3–4 cell capability. Signaling is legacy/schematic material, and new compartments/secretory/cytoskeletal/cell-cycle paths are TIER 0.

## AD. Future Cell Biology Benchmark v1

The future benchmark should score independently: actor correctness, compartment correctness, localization correctness, interaction correctness, topology correctness, event ordering, directionality, modification state, provenance/fidelity, exact-time determinism, teaching correctness, export correctness, and unsupported behavior.

Corpus families should include positive mechanism cases, missing-evidence cases, invalid compartment crossings, wrong-direction misconceptions, unsupported degradation/fragmentation, cross-scale identity, array-order metamorphics, direct-vs-sequential evaluation, late-to-early seeking, serialization, and production-owner proof. It must score scientific preservation separately from teaching quality.

## AE. Provenance and ontology strategy

Use external identifiers as traceable references, not as a second local science authority:

| Source | Primary use |
|---|---|
| PDB/mmCIF/CCD / RCSB | deposited structures, assemblies, ligand/chemical component identity, residue/chain anchors |
| UniProt | protein identity, reviewed function, domains, selected localization metadata |
| Gene Ontology | cellular component, molecular function, biological process vocabulary |
| ChEBI | small molecules, ions, cofactors, chemical identity |
| Rhea | reaction identity and reaction participants |
| Reactome | pathway/event context and ordering, not atomistic truth |
| peer-reviewed mechanistic literature | mechanism-specific evidence and boundaries |

External IDs should be optional fields on authoritative records. The local capability record should retain stable local IDs, source IDs, evidence class, fidelity, and version. Do not fetch or normalize external sources in D-A.

## AF. Representation-gap register

### BLOCKER for activating the cell target

- No canonical `CELL` domain in the existing capability registry.
- No authoritative compartment/localization model in ScientificSceneSpec.
- No typed membrane sidedness, transport, or crossing semantics.

### MAJOR

- Explicit complex membership and lifecycle.
- Catalytic reaction with substrate/product/cofactor references.
- Covalent modification and conformation state model.
- Retained/removed degradation partition.
- Cross-scale identity and semantic scale context.
- Physical-time versus compressed-teaching-time metadata.

### MINOR

- Optional external ontology identifier slots.
- Explicit energy/cofactor references for mechanisms that require them.
- More detailed organelle subcompartments after a capability requires them.

### NOTE / intentionally deferred

- Concentrations, kinetics, diffusion rates, and reaction networks.
- Population stochasticity.
- Broad central metabolism.
- Full apoptosis.
- Full cell-cycle/mitosis beyond a bounded future slice.
- GLB/renderer/camera changes.

These findings do not require changing frozen DNA/RNA behavior. They define the additive contracts needed before a new cell capability can be marked grounded.

## AG. Protected systems

D expansion must preserve P2 scientific authority, P3 mechanism/time authority, P4 exact-frame/render/export authority, Teaching Runtime v1, Export Runtime v1, existing DNA/RNA capabilities, and all frozen benchmarks/holdouts. New cell representation must be additive and versioned. Legacy string relations, renderer geometry, camera state, teaching wording, and export artifacts cannot become cell-science authority.

## AH. Recommended D-B through D-I phases

| Phase | Boundary |
|---|---|
| D-B | Cellular compartments, localization, membrane sides, transport/event contract, validation, static production proof |
| D-C | Gene expression: transcription, RNA capping/splicing/polyadenylation, translation; integrate grounded structures and compartment states |
| D-D | DNA replication fork: primers, leading/lagging roles, incorporation, ligase, directionality, retained continuity |
| D-E | Secretory pathway: ER translocation, folding/QC, ER→Golgi vesicles, sorting, docking/fusion, exocytosis |
| D-F | Cytoskeleton and intracellular transport: polymer polarity, motors, cargo, actin/microtubule slices |
| D-G | Signaling and modification: receptor activation, phosphorylation cascade, recruitment, inhibition, translocation |
| D-H | Integrated Cell Biology Benchmark v1, production proofs, unsupported/negative corpus, deterministic/export certification |
| D-I | Final audit, limitation register, support matrix, visual gates, version freeze |

No D phase should begin with a renderer-first implementation. Each capability must first establish P2-grounded contracts, then P3 exact-time semantics, then Teaching/Export consumption.

## Audit conclusion

Spatial Ravia has a strong reusable molecular DNA/RNA foundation and several valuable legacy/structural cell-biology footholds. It does not yet have one authoritative cell-biology ontology. The correct next step is the additive D-B compartment/localization extension, followed by bounded mechanisms with explicit grounding and unsupported behavior. This map is the single D-A planning boundary; it does not activate any listed future capability.

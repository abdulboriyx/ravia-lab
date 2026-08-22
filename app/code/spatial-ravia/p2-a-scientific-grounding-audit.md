# P2-A — Scientific Grounding Architecture Audit

Status: **audit only**. No runtime, renderer, Foundation contract, or benchmark expectation was changed by this audit.

## A. Grounding architecture map

### Deposited/structure-derived path

`structure manifest → biology-structure-loader.loadGroundedStructure → coordinate fetch → biology-structure-parser → normalized atoms/chains/residues/entities/assemblies → curated chain selection → optional mmCIF assembly expansion → derived residue traces/anchors → Mol*/structure-derived primitives`

| Stage | Owner | Input/output | Scientific decisions | Provenance/fidelity | Downstream owner |
|---|---|---|---|---|---|
| Manifest resolution | `biology-structure-manifest.ts:resolveStructureManifest` | role → `StructureManifestEntry` | accession, provider, asset, assembly, chains, anchors | provider, structure ID, URL, title, organism; no citation/license/version field | replication/transcription grounding adapters |
| Coordinate loading | `biology-structure-loader.ts:loadGroundedStructure` | manifest + text loader → normalized structure, geometry, provenance | cache key includes provider/ID/assembly/format/chains; only mmCIF assembly is expanded | emits `structure-derived`; preserves selected chains and assembly ID | structure-derived consumers |
| PDB parsing | `biology-structure-parser.ts:parseMolecularStructure` | PDB text → atoms/chains/residues | fixed-column atom parsing; residue-name entity typing | source/ID/format retained; model records are not explicitly selected | loader |
| mmCIF parsing | `biology-structure-mmcif.ts:parseMmcifWithMolstar` | mmCIF text → atoms/entities/assemblies | label/auth aliases, entity polymer class, assembly operators | label/auth/entity/model/operator metadata retained | loader/parser |
| Chain selection | `selectStructureChains`, `resolveStructureChain` | normalized structure + curated IDs/reference → subset | exact normalized/label/auth chain matching; ambiguity errors | selected chains retained | grounding adapters |
| Assembly expansion | `expandStructureAssembly` | normalized mmCIF + assembly ID → transformed atom set | operator matrices and source asym IDs | assembly/operator/source chain fields retained | loader |
| Anchor derivation | `resolveAnchor`, `deriveStructureGeometry` | selected structure → centroid/axis/range/atom anchors | geometric centroids and principal axes; these locate presentation, not scientific interactions | anchor identity is not persisted in F2 provenance | structure-derived geometry / Mol* |
| Mechanism placement | `alignStructureToMechanism`, transcription/replication grounding | source anchor + target anchor → transform | aligns deposited complexes to procedural mechanism geometry | grounding status often marked `hybrid`; transform itself is renderer-facing | mechanism presentation |

### DNA canonical and mechanism path

`DNA semantic/prompt contracts → DnaVisualSystem / DnaMechanismPresentationRouter → canonical procedural B-DNA (`sampleCanonicalDna`) or Mol* 1ZF5 view → mechanism-specific presentation plans → production view`.

Canonical B-DNA is generated from fixed helix parameters. Mechanism presentations reuse those samples and derive local contacts, grooves, polarity, strand opening, pairing, and stacking procedurally. Deposited 1ZF5 is an explicit UI source option, not the universal mechanism substrate.

### RNA production path

`RnaSceneSpec → RnaPresentationRouter → RnaProductionScenePlan → RnaVisualSystem/RnaLocalChemistryPresentation/RnaPairingPresentation/... → ProductionRnaScene`.

The default RNA path is canonical procedural geometry: `sampleCanonicalRna`, hardcoded nucleotide chemistry, deterministic local frames, topology templates, and production plan fields. `RnaTypePresentation` can describe an optional deposited coordinate plan, but the production scene plan does not load the manifest or attach F2 provenance to those actors. Nascent transcript uses canonical DNA samples plus procedural RNA and optional RNAP context.

## B. Source / structure inventory

| Source | Location/provider | Handling | Scientific status | Provenance survival |
|---|---|---|---|---|
| PDB 9DLS | `public/spatial-ravia/structures/9DLS.pdb`, RCSB PDB | curated chains A–G, assembly `1` in manifest; PDB loader does not expand assembly | deposited coordinates, coarse-grained downstream | manifest/loader provenance; no citation/license/version in structure record |
| PDB 3BDP | `public/spatial-ravia/structures/3BDP.pdb`, RCSB PDB | chains A/P/T, assembly `1` | deposited coordinates, coarse-grained downstream | same limitations |
| PDB 6ALH | `public/spatial-ravia/structures/6ALH.pdb`, RCSB PDB | chains A/B/R/G–K with curated entity types | deposited RNAP elongation complex, coarse-grained downstream | same limitations |
| mmCIF 1ZF5 | `public/spatial-ravia/structures/1ZF5.cif` and `app/structures/1ZF5.cif` | Mol* viewer experimental source; local mmCIF load | experimental deposited B-DNA snapshot | UI metadata retains PDB ID/method/resolution; not connected to F2 attachments |
| mmCIF 4V5C | `public/spatial-ravia/structures/4V5C.cif` | translation audit/example assets | deposited/example; not in current structure manifest | local viewer/audit metadata only |
| 4V6F | manifest example only; no matching public coordinate asset found | manifest shape with procedural fallback | deposited accession named, but current path is not grounded without an asset | manifest only |
| Ideal B-DNA | generated in `MolstarStructureViewer.tsx`, also `DnaVisualSystem.sampleCanonicalDna` | parametric PDB/procedural helix | computed/canonical educational model | UI labels it idealized; F2 provenance appears only in fixtures |
| Canonical RNA | `RnaVisualSystem.ts`, local chemistry/pairing modules | procedural samples and hardcoded atom grammar | computed/constrained schematic, not deposited | production metadata says procedural only |
| CCD/component definitions | no direct CCD/chemical-component ingestion found | none | absent as an independent source | missing |
| BCIF | no BCIF asset or loader found | none | absent | missing |
| Computed/curated provider records | `scientific-data-providers.ts` | RCSB-shaped query/normalization, fixtures, cache, rate-limit errors | provider records can carry evidence/license/version | separate provider layer; not consistently joined to manifest/production scenes |

Source citation/license/version are richer in `ScientificProvenanceSource` and `NormalizedScientificDataRecord` than in `StructureManifestEntry`; the two authorities are not unified.

## C. Assembly/model audit

- Manifest assembly IDs are explicit, but `biology-structure-loader` expands assemblies only for mmCIF. PDB entries carrying `assemblyId: "1"` are chain-filtered without biological-assembly expansion.
- PDB parsing reads ATOM/HETATM records without an explicit MODEL policy. Multi-model PDB input can therefore combine models rather than select a declared model.
- mmCIF atoms retain `modelNumber`, but no general model-selection stage was found before geometry derivation.
- Mol* 1ZF5 loading uses the local file and Mol* defaults; no application-level biological-assembly/model/altloc policy is declared in the viewer path.
- Selected chain lists are curated per manifest. Missing chains fail explicitly; no first-chain fallback exists in the loader.
- Alternate conformations and occupancy are parsed but not selected by a scientific policy.
- Assembly ambiguity is therefore **MAJOR**: explicit in some manifests, inconsistently applied across formats and consumers.

## D. Molecular identity / selector audit

Authoritative selector mechanisms currently include:

- `ChainReference` with `label`, `auth`, or `normalized` namespaces.
- exact selected-chain lists in `StructureManifestEntry`.
- residue ranges (`chainId`, start/end residue) and atom-name filters in `StructureAnchorDefinition`.
- mmCIF label/auth asym IDs, label/auth sequence IDs, entity IDs, insertion codes, model/operator metadata.
- procedural residue indices and local atom IDs in RNA/DNA visual systems.

The deposited path maps to chain/residue/atom data. The canonical DNA/RNA paths instead use synthetic indices, hardcoded nucleotide IDs, and generated anchors. `derivePrincipalAxis`, centroids, and alignment transforms use geometry to locate an actor, but current chemistry truth is usually decided before that by rules/templates. No evidence was found that mesh IDs or React keys are used as scientific selectors.

Important identity risks:

- PDB residue classification uses residue-name heuristics (`A/C/G/T` are DNA-classified before RNA overrides in the current sets), while manifest curation can override chain type.
- RNA/DNA local chemistry uses presentation-local atom IDs, not source residue/atom selectors.
- `RnaDepositedCoordinatePlan` is a plan type, not a completed source-to-production selection path.

## E. Interaction / topology audit

| Interaction/topology | Current determination | Classification | Risk |
|---|---|---|---|
| DNA A–T/G–C | canonical base tables in `DnaBasePairInteractionPresentation` | chemically rule-derived + procedural | no deposited residue/atom evidence required |
| RNA A–U/G–C/G–U | canonical tables/site definitions in `RnaPairingPresentation` | chemically rule-derived + procedural | donor/acceptor anchors are not CCD/source-derived |
| H-bonds | hardcoded donor/acceptor site definitions and count | rule-derived; geometrically rendered | not computed from source coordinates |
| base stacking/grooves | `DnaHelixStabilizationPresentation` over canonical helix samples | procedural/computed from canonical parameters | visual explanatory contact, not deposited contact |
| phosphodiester continuity | local chemistry presentation contracts and procedural atoms | chemical rule-derived/procedural | no source bond graph or CCD bond validation |
| strand polarity | canonical sample direction and explicit semantic contracts | rule-derived/procedural | not sourced from chain polymer direction |
| RNA–DNA hybridization | shared pairing plan with distinct RNA/DNA chemistry | rule-derived/procedural | no deposited hybrid selection in production |
| cleavage/shortening | degradation presentation state and topology contracts | procedural/state-derived | source cleavage site absent unless supplied by a future grounding layer |
| topology change | F2 topology model supports it; current production plans construct family-specific state | contract/state-derived | not uniformly sourced from molecular coordinates |

No interaction path was found that asserts chemistry solely from visual proximity. However, many “structural” interactions are declared by presentation contracts and then rendered, rather than grounded from deposited coordinates. That is an architectural **MAJOR** if fidelity is presented as atomistic/source-derived.

## F. Local chemistry audit

- Ribose/deoxyribose, phosphate, base rings, 2′-OH, C1′/C3′/C5′, O3′/O5′, and donor/acceptor sites are generated by `canonicalRnaNucleotide`, `DnaLocalChemistryRepresentation`, and family presentation helpers.
- RNA local chemistry explicitly creates compact ring atoms and bond paths; the source is hardcoded canonical chemistry, not CCD/mmCIF atom naming.
- DNA local chemistry uses canonical DnaVisualSystem anchors and selected-local residue contracts; it does not derive bonds from 1ZF5/3BDP atom connectivity.
- Cleavage sites and exposed termini are presentation/state identities, not source-derived atom selections.
- 5′/3′ labels come from semantic/presentation anchors and canonical strand direction, not polymer entity metadata.

Local chemistry is therefore **C0/S1 constrained or S2 schematic**, depending on view, even when the visual LOD resembles atomistic geometry.

## G. Provenance audit

### Retained in structure-derived objects

`provider`, `structureId`, `assemblyId`, `selectedChains`, `organism`, `title`, `sourceUrl`, `format`, and `groundingStatus` survive `loadGroundedStructure`. Normalized atoms additionally retain model, label/auth chain and residue IDs, entity IDs, operator IDs, occupancy, and B-factor where present.

### Missing or inconsistently propagated

- citation, license, retrieval date, provider API version, content hash, and source confidence are not present in `StructureManifestEntry`/`StructureGroundingProvenance`.
- F2 provenance supports these fields, but current loader output is not automatically converted into F2 `ScientificProvenanceSource`/attachments.
- RNA production plans expose only `metadata.grounding: string`; no source/accession/selector attachment is carried.
- Procedural DNA/RNA production objects usually have no per-actor provenance attachment.
- fidelity and grounding confidence are present in F2 fixtures/contracts but are not uniformly emitted by production plans.

## H. Fidelity audit

| Current behavior | Actual tier | Disclosure |
|---|---|---|
| Mol* 1ZF5 experimental viewer | E0_DEPOSITED / source-derived snapshot | relatively explicit in UI and metadata |
| 9DLS/3BDP/6ALH manifest structures | E0 source, but residue-centroid/coarse presentation | manifest says structure-derived; approximation is not attached per visible actor |
| ideal B-DNA | C0_COMPUTED or S1_CONSTRAINED | UI explicitly says idealized; F2 fixture tiering is separate |
| canonical RNA and DNA visual systems | C0/S1/S2 depending on use | production labels usually say procedural, but not a formal user-facing fidelity attachment |
| RNA pairing/local chemistry | C0/S1 constrained chemistry grammar | no deposited source; atom-like geometry can look more authoritative than declared |
| nucleosome/packaging educational geometry | S2_SCHEMATIC | fixture provenance is explicit; production path disclosure is less systematic |
| claim/explanatory overlays | O_OVERLAY | supported by F2 fixture model, not consistently attached in production |

The largest fidelity concern is **false precision**: atom-and-bond procedural primitives can visually imply deposited atomistic truth while their source is canonical rules or schematic geometry.

## I. Fallback / failure audit

| Fallback | Current behavior | Classification |
|---|---|---|
| coordinate fetch/parse failure | loader throws typed `StructureGroundingError`; callers may retain explanatory/procedural view | explicit/valid at loader boundary; downstream substitution must be audited |
| manifest fallback | each entry declares `structure-guided` or `procedural` explanatory fallback | explicit but scientifically weak unless fidelity is surfaced |
| DNA experimental vs idealized | user-visible source toggle; idealized mode is labeled | explicit/valid |
| RNAP/transcription failure | manifest says fall back to existing explanatory RNAP/procedural DNA/RNA | explicit in manifest, but can become dangerous if UI loses disclosure |
| RNA production default | procedural canonical strand is selected without a source request | explicit procedural mode in metadata, but not F2-attached |
| missing chain/anchor | typed error; no guessed chain or anchor in loader | explicit/valid |
| unresolved unsupported source | no common capability-level refusal/grounding disposition found | **MAJOR gap** |

The architecture has no single enforced rule that prevents a downstream owner from substituting generic geometry after a grounding failure while retaining a source-derived-looking scene. This is the principal fallback risk.

## J. Duplication / authority findings

- **Structure source authority split:** `biology-structure-manifest`/loader versus `scientific-data-providers` versus Mol* viewer-local source handling.
- **DNA geometry authority split:** `DnaVisualSystem` canonical procedural helix versus Mol* 1ZF5/idealized viewer versus mechanism-specific procedural overlays.
- **RNA geometry/chemistry authority split:** `RnaVisualSystem`, local chemistry, pairing, secondary structure, type presentation, and optional deposited plan.
- **Selector authority split:** manifest chain lists, parser `ChainReference`, Mol* selection expressions, and presentation-local IDs.
- **Interaction authority split:** F2 topology contracts, DNA/RNA mechanism contracts, and hardcoded local chemistry tables.
- **Provenance authority split:** F2 fidelity/provenance contracts, manifest provenance, provider records, and UI metadata.
- **Fidelity authority split:** capability registry minimums, F2 attachments, and presentation `groundingStatus` strings.

These should be adapted toward one grounding resolver, not rewritten during P2-A.

## K. Foundation gap analysis

| SceneSpec/F2 requirement | Current status |
|---|---|
| actors with scientific identity | **Partially grounded**; deposited actors can map to chains, procedural actors use stable local IDs |
| renderer-independent selectors | **Partially grounded**; chain/residue/atom selectors exist, but RNA/local chemistry selectors are synthetic |
| topology/interactions | **Partially grounded**; F2 model is strong, production interactions are mostly rule/procedural |
| scientific states | **Reliably represented**, but often presentation-derived rather than source-derived |
| provenance source catalog | **Partially grounded**; F2 contract exists, loader/production do not uniformly populate it |
| fidelity tier | **Partially grounded**; registry/F2 fixtures declare tiers, production metadata is weaker |
| constraints | **Contract-supported**, not consistently produced by current grounding paths |
| presentation intent | **Renderer/presentation-owned** in current production; F2 adapter seam exists |
| model/assembly/altloc policy | **Missing as a shared policy** |
| source confidence/grounding confidence | **Missing or split** outside F2 fixtures/provider records |
| explicit unsupported/grounding failure disposition | **Partially grounded**; typed loader errors exist, capability-level blocking is not universal |

## L. 25-capability grounding matrix

| Capability | Status | Basis / reason |
|---|---|---|
| dna-canonical-structure | PARTIALLY_GROUNDED | Mol* 1ZF5 or ideal B-DNA; canonical path is procedural |
| dna-sequence-regulation | SCHEMATIC_ONLY | promoter/gene/enhancer spans are procedural/semantic |
| dna-replication | PARTIALLY_GROUNDED | 9DLS/3BDP complexes plus procedural fork/substrate |
| dna-transcription | PARTIALLY_GROUNDED | 6ALH RNAP deposited; DNA/RNA emergence remains procedural |
| dna-damage-repair | SCHEMATIC_ONLY | lesion/repair chemistry tables, no deposited lesion grounding |
| dna-packaging | SCHEMATIC_ONLY | educational nucleosome/packaging geometry |
| dna-local-chemistry | SCHEMATIC_ONLY | canonical local atom/bond grammar, not source bond graph |
| dna-base-pairing | SCHEMATIC_ONLY | hardcoded donor/acceptor and pair counts |
| dna-phosphodiester-backbone | SCHEMATIC_ONLY | rule-derived local bridge |
| dna-antiparallel-polarity | PARTIALLY_GROUNDED | canonical geometric direction, not chain-derived |
| dna-helix-stabilization | SCHEMATIC_ONLY | canonical stacking/groove explanatory geometry |
| dna-strand-separation | SCHEMATIC_ONLY | controlled parametric opening |
| dna-nucleotide-assembly | SCHEMATIC_ONLY | computed reaction/local chemistry grammar |
| rna-generic-structure | SCHEMATIC_ONLY | canonical procedural RNA |
| rna-types-functions | SCHEMATIC_ONLY | type-specific topology templates; optional deposited plan is not production grounding |
| rna-nascent-transcript | PARTIALLY_GROUNDED | optional 6ALH/RNAP context; nascent RNA/DNA composition procedural |
| rna-processing | SCHEMATIC_ONLY | exon/intron/cap/tail state geometry is procedural |
| rna-secondary-structure | SCHEMATIC_ONLY | deterministic topology templates |
| rna-base-pairing | SCHEMATIC_ONLY | canonical interaction tables and local geometry |
| rna-dna-hybridization | SCHEMATIC_ONLY | shared procedural hybrid plan |
| rna-cleavage | SCHEMATIC_ONLY | state/topology change without source cleavage site |
| rna-exonuclease-degradation | SCHEMATIC_ONLY | terminal shortening model |
| rna-chemical-stability | SCHEMATIC_ONLY | canonical 2′-OH comparison |
| rna-local-chemistry | SCHEMATIC_ONLY | hardcoded ribose/phosphate/base grammar |
| rna-dna-chemistry-comparison | SCHEMATIC_ONLY | matched procedural local units |

No current capability is uniformly `GROUNDED` end-to-end through F2 provenance and production. This is stricter than the capability registry’s presentation support status.

## M. Test / benchmark inventory

Existing coverage includes:

- `biology-structure-loader.test.ts`: PDB/mmCIF loading, cache, provenance fields, chain failure, assembly-shaped fixture.
- `biology-structure-parser.test.ts`: PDB normalization, mmCIF aliases/entity typing, model metadata, chain parsing, anchor geometry.
- `biology-replication-structure-grounding.test.ts`: manifest roles, selected chains, hybrid provenance, alignment transform.
- `biology-transcription-structure-grounding.test.ts`: RNAP manifest and transform helpers.
- `scientific-data-providers.test.ts`: provider normalization, errors, rate limits, provenance-shaped records.
- `scientific-fidelity-provenance.test.ts`: F2 tiers, source/attachment validation, tier/source consistency.
- DNA/RNA local chemistry and interaction tests: deterministic rule tables, anchors, pair counts, topology states.
- `scientific-scene-spec.test.ts`, `scientific-topology.test.ts`, `scene-spec-v1.test.ts`: contract-level references and validation.

Missing or weak tests:

- explicit PDB multi-MODEL selection policy;
- alternate-location/occupancy selection;
- consistent biological-assembly behavior across PDB, mmCIF, Mol* and provider paths;
- source-to-F2 provenance attachment for every production actor/interaction;
- explicit capability refusal when grounding is unavailable;
- proof that procedural atom-like geometry cannot be labeled E0_DEPOSITED;
- source-derived donor/acceptor and bond-graph validation;
- RNA deposited-plan execution and selector persistence;
- citation/license/version/content-hash propagation into production scenes.

## N. Top scientific risks

1. **BLOCKER — provenance/fidelity loss at production boundary:** current RNA and most DNA procedural production plans do not carry F2 source attachments, while capability records require provenance.
2. **MAJOR — assembly/model ambiguity:** model and altloc policy is not centralized; PDB assembly IDs are not uniformly applied.
3. **MAJOR — false atomistic precision:** hardcoded local chemistry and interaction tables can look deposited or atom-derived.
4. **MAJOR — interaction authority split:** donor/acceptor, stacking, polarity, and phosphodiester facts are mostly presentation-rule-derived rather than grounded through one topology resolver.
5. **MAJOR — silent downstream fallback risk:** typed loader errors exist, but no universal capability-level block prevents a generic scene after grounding loss.
6. **MINOR — selector namespace drift:** label/auth/normalized IDs and presentation-local indices coexist without a single persisted selector envelope.
7. **MINOR — source metadata incompleteness:** citation, license, retrieval/version, and hash fields are not uniformly retained.

## O. Recommended P2 boundaries

- **P2-B — source/provenance resolver:** unify manifest/provider/F2 source records; preserve accession, citation, license, version, retrieval, hash, confidence, and explicit source type.
- **P2-C — molecular identity/selectors:** define one renderer-independent selector envelope for chain/entity/residue/atom/terminus and procedural semantic identities; preserve label/auth namespaces.
- **P2-D — assembly/model grounding:** centralize assembly, model, altloc, occupancy, and chain-set policy; reject unresolved ambiguity.
- **P2-E — interaction/topology grounding:** adapt source/rule/computed evidence into F2 interactions; distinguish deposited, rule-derived, computed, and schematic evidence; prohibit visual proximity as truth.
- **P2-F — fidelity/uncertainty engine:** attach E0/C0/S1/S2/O tiers and confidence to every visible actor/group/interaction; enforce disclosure and block false precision.
- **P2-G — local chemistry precision:** map CCD/atom naming and canonical chemistry into shared RNA/DNA local selectors; validate termini, donor/acceptor sites, phosphodiester continuity, and cleavage anchors.

## P. Protected systems

Do not modify during this audit or its follow-up planning:

- Foundation F1–F8 contracts and registries;
- P1 semantic extraction and deferred model-evaluation status;
- production DNA/RNA renderers and family routers;
- camera/label infrastructure;
- SceneSpec validators and benchmark expectations;
- existing structure assets and Mol* integration, except through explicitly scoped P2 adapters.

## Severity summary

- **BLOCKER:** provenance/fidelity is not reliably attached at the production boundary despite registry requirements.
- **MAJOR:** inconsistent assembly/model policy; split interaction/selector authorities; fallback can become generic false precision; procedural atom-like views lack universal disclosure enforcement.
- **MINOR:** duplicated source metadata and selector namespaces; incomplete citation/version/hash propagation.
- **NOTE:** existing typed errors, structure tests, and F2 contracts provide useful seams for P2-B–G; no production behavior was changed here.

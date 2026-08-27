# SCINA Molecular Rendering Audit

**Status:** read-only architecture audit. No production visual, semantic, router, camera, or benchmark code was changed.

**Audit basis:** repository inspection of the R3F/Three.js paths, Mol* adapters, structure manifests/assets, P2 grounding audit, and current transcription tests. No new external structures were fetched. “Deposited” below means coordinates originate from a deposited asset; it does not mean the current presentation preserves an atomistic representation.

## 1. Executive diagnosis

Scina has three different molecular rendering systems rather than one molecular renderer:

1. a strong canonical/procedural DNA system (`DnaVisualSystem`, `TranscriptionDnaTemplate`, and the Mol* 1ZF5 viewer);
2. a broad family of procedural RNA diagrams (`RnaVisualSystem`, `ProductionRnaScene`, local-chemistry/pairing/processing helpers, and the isolated `RnaMolecularStrand3D`); and
3. a structure-loader/coarse-residue path (`StructureDerivedPrimitive`) used as a sparse context layer for several proteins and nucleic acids.

The live transcription scene combines these systems in different coordinate and scale spaces. DNA is a coherent parametric helix. RNA is generated from manually authored points and primitive glyphs. Pol II begins with deposited 6ALH coordinates, but the visible body is reduced to a few hand-derived ellipsoidal lobes plus a schematic fallback. The structure-derived path therefore supplies placement evidence, not a molecular surface or a complete molecular representation.

The repeated failure is architectural, not a missing color or bevel:

- structural data is reduced to residue centroids before rendering;
- a bacterial RNAP structure is presented under a Pol II label;
- DNA, RNA, and protein use unrelated world-unit policies;
- the active-site frame is partly grounded and partly recreated with screen-space offsets;
- Mol* already has the needed cartoon and Gaussian-surface capabilities, but the mounted transcription owner is the R3F scene, not the Mol* transcription adapter;
- tests prove state fields and deterministic geometry, not molecular visual equivalence.

The next implementation should establish one structural actor frame and use deposited/Mol* representations for actors that need molecular credibility. R3F should remain the owner of exact-time transforms, visibility, and schematic overlays—not the inventor of molecular body geometry.

## 2. Target visual definition

The target is a scientific 3D molecular scene, closer to molecular visualization software or molecular animation than to an infographic in 3D:

- DNA is a coherent nucleic-acid structure with consistent backbone/base-pair scale.
- RNA is a coherent nucleic-acid structure, not a tube, loop chain, or colored glyph string.
- RNA polymerase II is a recognisable protein complex derived from an appropriate structure, with a visible DNA channel.
- DNA, RNA, and Pol II share a documented scale and active-site coordinate frame.
- Deposited actors retain source, chain, residue, model, assembly, and fidelity metadata.
- Schematic dynamics are applied as transforms/visibility/controlled deformation over structurally meaningful actors.
- A schematic fallback is explicit and visually disclosed; it cannot masquerade as deposited structure.

Atomistic molecular dynamics is not required. A deposited structure rendered as a cartoon, surface, or carefully coarse-grained surface is sufficient at product zoom. What is not sufficient is a deposited label attached to a few arbitrary spheres and tubes.

## 3. Current molecular rendering inventory

| System | Files | Input data | Representation | Structural source | Fidelity in practice | Current production use | Reusable? | Limitations |
|---|---|---|---|---|---|---|---|
| Mol* DNA viewer | `DnaMolecularView.tsx`, `MolstarStructureViewer.tsx`, `public/spatial-ravia/molstar/*` | local `1ZF5.cif` or locally generated idealized PDB | Mol* cartoon, ball-and-stick, atomic selections; interactive state tree | deposited 1ZF5 for experimental mode; generated canonical PDB for ideal mode | E0 for 1ZF5 snapshot; C0/S1 for idealized | mounted for generic DNA structure view | **KEEP** | separate canvas/owner; exact-frame camera/export is explicitly unsupported; not the canonical transcription owner |
| Canonical DNA system | `DnaVisualSystem.ts`, `biology-transcription-template.ts`, `TranscriptionDnaTemplate.tsx`, DNA mechanism presentation modules | fixed B-DNA helix parameters and presentation state | parametric double helix, tubes, rungs, local opening | computed/parametric | C0/S1, with explicit schematic mechanism transforms | primary DNA in current transcription and DNA mechanisms | **KEEP_AND_EXTEND** | no deposited residue/atom identity in the mechanism path; independent coordinate/scale policy |
| DNA local chemistry | `DnaLocalChemistryRepresentation.ts`, `DnaLocalChemistryPrimitive.tsx`, `SelectedResidueDetailPrimitive.tsx` | canonical atom roles and rule tables | atom-like spheres and bonds | hardcoded chemical grammar; selected source context may be nearby | C0/S1/S2, not source-bond-derived | local DNA chemistry and nucleotide views | **KEEP_AND_EXTEND** | visual atomism can imply E0; no CCD/source bond graph is authoritative |
| Structure-derived primitive | `StructureDerivedPrimitive.tsx`, `biology-structure-loader.ts`, `biology-structure-parser.ts` | PDB/mmCIF assets, manifest-selected chains | residue centroid instancing plus Catmull–Rom trace tubes | deposited coordinates reduced to coarse geometry | deposited source, coarse S1-like presentation; manifest calls it structure-derived | RNAP, replication, translation context | **KEEP_AND_EXTEND** | not a molecular surface/cartoon; one generic sphere material; no atom/bond representation; visible shape is not the source surface |
| Structure-constrained nucleic primitive | `StructureConstrainedNucleicPrimitive.tsx`, `StructureConstrainedNucleicGeometry.ts` | grounded trace/residue positions | trace tube plus residue spheres and functional arms | computed from selected residues | structure-guided/coarse | translation and local structural context | **KEEP_AND_EXTEND** | no base/ribose/phosphate identity; proximity-based functional arms are not interaction evidence |
| Structure-derived context | `StructureDerivedContextPrimitive.tsx`, `StructureDerivedContextGeometry.ts` | structure points voxelized/coarsened | instanced box cells | deposited coordinates aggregated into cells | coarse deposited context | translation/large complexes | **KEEP_AND_EXTEND** | intentionally context-only; cannot be the primary molecular actor |
| Parametric protein complex | `ProteinComplexPrimitive.tsx`, `ProteinComplexDefinitions.ts` | authored domain/channel definitions | ellipsoids, capsules, rounded boxes, cylinders | schematic geometry | S2 schematic | non-transcription protein actors and fallbacks | **LEGACY_ONLY** for Pol II | scientifically legible teaching shape, not a structure-derived body |
| Current Pol II/RNAP | `TranscriptionRnapPresentation.tsx`, `biology-transcription-rnap-presentation.ts`, `biology-transcription-structure-grounding.ts` | 6ALH PDB, selected protein residue centroids and anchors | 2–3 ellipsoidal lobes plus a cylinder cleft; `StructureDerivedPrimitive` underneath | bacterial deposited coordinates used to choose local points | hybrid; only placement/lobe centroids are source-derived | current R3F transcription scene | **REPLACE** as primary body; retain loader seam | lobes are hand-built; source is bacterial RNAP, not eukaryotic Pol II; no surface/cartoon; no source RNA/DNA rendered in this owner |
| Original nascent RNA | `GeneExpression3DScene.tsx` (`RnaNucleotideActor`), `TranscriptionDnaTemplate.tsx`, older `MechanisticScene.tsx` | presentation progress and generated points | Catmull–Rom/tube, torus/sphere/cylinder glyphs | none | S2 schematic | current transcription and legacy MechanisticScene paths | **DELETE_FROM_PRODUCTION** after replacement | disconnected symbolic units, no source residue identity, independent offsets |
| Canonical isolated RNA | `RnaMolecularStrand3D.tsx`, `rna-canonical-visual.ts`, `rna-demo/page.tsx` | ordered A/U/G/C sequence and deterministic control path | faceted sugar glyph, phosphate node/link, attached base plate | parametric schematic | S2 schematic | isolated `/rna-demo` only; not transcription-mounted | **KEEP_AND_EXTEND** | useful visual grammar but not deposited RNA and not yet integrated into active-site structural coordinates |
| RNA production family | `RnaVisualSystem.ts`, `ProductionRnaScene.tsx`, `RnaProductionScenePlan.ts` | semantic family plan, synthetic residue/atom positions | tubes, spheres, torus glyphs, procedural local chemistry | parametric/rule-derived | S2/C0 depending on mode | all generic RNA family production views | **KEEP** for family scope; separate from transcription migration | many family-specific symbolic renderers; no common deposited RNA path |
| RNA chemistry primitives | `RnaLocalChemistryPresentation.ts`, `RnaPairingPresentation.ts`, `RnaSecondaryStructurePresentation.ts` | canonical bases, atom-role tables, topology plans | rule-derived atoms, bonds, pair connectors | chemical rules/procedural | C0/S1/S2 | local chemistry, pairing, hairpin, hybrid and stability families | **KEEP_AND_EXTEND** | chemically meaningful but not source-grounded; should carry explicit evidence/fidelity |
| Mol* production structure adapter | `MolstarStructurePresentationAdapter.tsx` | `6ALH.pdb` for transcription, `4V5C.cif` for translation | Mol* Gaussian surface for RNAP; Mol* cartoon + local ball-and-stick for nucleic chains | deposited structures | strongest existing structural representation path | mounted as optional structural presentation in `MechanisticScene`, not `CellularProductionOwnerView` | **KEEP_AND_EXTEND** | separate overlay/canvas; transcription implementation is static and frames nucleic actors, not the active R3F temporal scene |
| Generic Mol* viewer | `MolstarStructureViewer.tsx` | 1ZF5 mmCIF | full Mol* viewer with selectors and representations | deposited/idealized | explicit in UI | DNA molecular view | **KEEP** | integration/export/camera boundary remains separate |
| Translation structural path | `biology-translation-structure-grounding.ts`, `MolstarStructurePresentationAdapter.tsx`, `4V5C.cif` | deposited 4V5C mmCIF | Mol* Gaussian subunits, cartoons for tRNA/mRNA, local atom detail | deposited ribosome complex | E0/coarse Mol* | optional MechanisticScene translation structure overlay | **KEEP_AND_EXTEND** | not transcription; useful reference architecture for actor/chain selection and surface representation |
| Legacy mechanistic actors | `MechanisticScene.tsx` | motion state plus authored points | many tubes/spheres/capsules/toruses | mostly procedural | S2 schematic | older DNA/RNA/protein mechanisms and optional paths | **LEGACY_ONLY** for new molecular transcription | several competing transcription and RNA representations remain in one file |

## 4. DNA audit

### Input and construction

The accepted transcription DNA is generated by `deriveTranscriptionTemplatePlan` and `partitionTranscriptionDuplex`, ultimately using canonical DNA samples and the `dnaVisualSystem` tokens. `TranscriptionDnaTemplate` converts source-space samples by a local `coordinateScale = 0.052`, builds paired flank curves, a local open interval, and base-pair rungs/spheres. The opening is driven by a normalized presentation center and fraction; it is not a deposited conformational change.

The generic DNA viewer is separate. `DnaMolecularView` offers experimental 1ZF5 and idealized B-DNA modes. The experimental mode loads a local mmCIF into Mol*; the idealized mode creates a short canonical PDB and sends it through Mol*. This makes the source distinction visible to the user.

### Why DNA looks better

DNA has architectural advantages that RNA and Pol II do not:

1. **A single coherent parametric grammar.** The helix, two backbones, axial rise, twist, paired-base width, and local opening all derive from one `DnaVisualSystem` policy. RNA is split across `RnaVisualSystem`, `ProductionRnaScene`, legacy transcription code, and the isolated R1 demo.
2. **Repeated structure carries meaning.** The DNA viewer and canonical helix repeat paired strands and rungs with stable spacing. The eye sees a duplex, not a collection of independent glyphs.
3. **The DNA path is the primary coordinate object.** Presentation changes deform an existing path. For RNA, presentation creates a new set of offsets around a progress scalar, and the production DNA and RNA paths do not share the same local frame.
4. **The materials are restrained and consistent.** DNA has dedicated strand colors, base-pair colors, roughness and scale policy. RNA variants have used several unrelated token sets and emissive/candy-like accents.
5. **There is a real structural alternative.** Mol* 1ZF5 can render an actual deposited model. RNA/Pol II production has no equivalent mounted structural primary.
6. **Tests exercise topology and state coherently.** DNA tests cover canonical geometry, strand separation, polarity, pairing, stacking, and camera bounds. RNA tests mostly prove deterministic object fields, not equivalence to a molecular reference.

DNA is therefore better because its *representation architecture* is coherent, not because every DNA pixel is deposited. Its main path is still parametric/schematic; it is simply internally consistent and structurally legible.

## 5. RNA audit

### Current RNA paths and actual ingredients

| Path | Actual ingredients | Element classification | Why it looks artificial |
|---|---|---|---|
| `RnaVisualSystem.sampleCanonicalRna` | synthetic x/y positions, sine curvature, synthetic ribose/base positions; local atom role tables from `canonicalRnaNucleotide` | `PARAMETRIC_CHEMICAL` + `SCHEMATIC_GEOMETRY` | positions are not source coordinates; chemistry is an authored diagram grammar; no deposited residue envelope |
| `ProductionRnaScene` | `tubeGeometry` for spans/backbones, spheres for residues/atoms, torus for sugar-like markers, emissive colors for regions | `SCHEMATIC_GEOMETRY` / `DECORATIVE` in some modes | different RNA families use different glyph scales and materials; atom-like geometry is not atom-grounded |
| `GeneExpression3DScene` current nascent RNA | `sampleTranscriptionMolecularRna` creates 0.2-spaced points; `RnaNucleotideActor` uses torus sugar, sphere phosphate, cylinder base; `MolecularBond` uses cylinders | `SCHEMATIC_GEOMETRY` | no residue coordinates; base identity is cycling A/U/G/C; RNA path is independent of grounded 6ALH RNA; hybrid connectors are visual lines |
| `TranscriptionDnaTemplate` RNA cue | a three-point Catmull–Rom curve and tube | `SCHEMATIC_GEOMETRY` | featureless tube and independent DNA-template anchor; not a molecular actor |
| legacy `MechanisticScene` | `RnaTranscript` and `AnimatedRnaTranscript` use Catmull–Rom/tube plus terminal sphere; older scene has additional tube paths | `SCHEMATIC_GEOMETRY` | no nucleotide identity or sugar/phosphate/base structure |
| isolated R1.1 demo | deterministic hand-authored path, faceted sugar, small phosphate linker, attached base plate, backbone cylinders | `SCHEMATIC_GEOMETRY` with chemical topology | visually more coherent, but still not deposited and currently isolated; it cannot solve active-site grounding by itself |
| optional deposited RNA plan | `RnaDepositedCoordinatePlan` describes Mol* cartoon/backbone/ring/block representations | plan-only; `DEPOSITED` if executed | no production execution path connects this type to a loaded RNA structure |

### Why RNA degenerates into a toy

- There is no canonical RNA structural source in the mounted transcription path.
- The representation is constructed from scene-space offsets, not residue frames.
- Base, sugar, and phosphate are rendered as independent Three.js primitives whose relation is visual convention, not a shared source selector.
- A tube is used as the fallback for an entire polymer, so the visible polymer lacks repeated molecular structure.
- Multiple RNA renderers coexist, so improvements to the isolated demo do not change `GeneExpression3DScene`, `ProductionRnaScene`, or legacy `MechanisticScene` paths.
- RNA scale constants differ: `RnaVisualSystem.geometry.backboneSpacing = 1.25`, R1.1 spacing is approximately 0.46, and transcription units are 0.2 apart. None is tied to DNA Å units.
- Base colors and emissive hybrid accents carry too much identity; molecular shape carries too little.

## 6. Pol II audit

### Source and visible path

The manifest entry `rna-polymerase` points to `public/spatial-ravia/structures/6ALH.pdb`, selected chains A/B/R/G–K, and labels it “E. coli RNA polymerase elongation complex.” The file header confirms a 4.40 Å cryo-EM E. coli DNA/RNA elongation complex. Chains G/H are alpha subunits, I beta, J beta-prime, K omega; A/B are DNA and R is a synthetic RNA chain. This is bacterial RNAP, not eukaryotic RNA polymerase II.

`StructureDerivedPrimitive` loads the asset, selects chains, derives residue centroids and trace paths, and renders:

- one instanced sphere per residue point;
- one generic Catmull–Rom tube per chain trace;
- one generic material for the points.

`deriveTranscriptionRnapPresentation` then filters protein residue points around an active center, buckets them into quadrants, and creates at most three compact ellipsoidal lobes. `TranscriptionRnapPresentation` renders the structure primitive and separately renders those lobes plus a cylindrical cleft. If data/anchors fail, it renders `SchematicRnapBody`, a scaled sphere plus cylinder.

### How much is actually structure-derived?

The exact visible percentage is not a meaningful atom count, because the production body is not an atom/surface representation. A defensible architectural estimate is:

- **source-derived placement:** high (residue centroids, selected chains, active/upstream/downstream anchors originate from 6ALH);
- **source-derived visible body:** low-to-moderate (the underlying primitive exposes residue points/trace tubes, but the primary perceived body is 2–3 ellipsoids and a cylinder);
- **protein surface/shape:** effectively 0% deposited surface; no molecular surface or cartoon representation is used by the R3F owner;
- **fallback frame:** 0% structural when loading fails.

Thus the visible Pol II-like body is mostly a procedural approximation constrained by deposited point clouds, not a deposited molecular representation. The label “RNA polymerase II” is biologically inaccurate for 6ALH unless the prompt explicitly requests bacterial RNA polymerase and the UI relabels it.

## 7. Structural-data audit

| Asset | Metadata found | Contains | Current use | Suitability |
|---|---|---|---|---|
| `1ZF5.cif` | B-DNA crystal, X-ray, 0.99 Å; short GCT duplex | DNA only | Mol* generic DNA experimental view | good static DNA reference; not transcription |
| `3BDP.pdb` | DNA polymerase I/DNA, X-ray, 1.90 Å; Geobacillus stearothermophilus protein with synthetic DNA | DNA + DNA polymerase | replication structure-grounding manifest | appropriate for bacterial DNA polymerase context, not Pol II |
| `9DLS.pdb` | Vibrio cholerae DnaB/ssDNA, cryo-EM, 3.37 Å; bases not unambiguously identified in map | ssDNA + helicase | replication/helicase context | appropriate for helicase, not transcription |
| `6ALH.pdb` | E. coli RNAP elongation complex, cryo-EM, 4.40 Å; synthetic T7 DNA/RNA and E. coli RNAP | DNA + RNA + bacterial RNAP | transcription RNAP context and optional Mol* transcription adapter | structurally relevant to bacterial transcription; **not eukaryotic Pol II** |
| `4V5C.cif` | deposited ribosome/translation complex; large multi-chain assembly | ribosome + mRNA/tRNAs/proteins | translation audit and Mol* adapter | unrelated to transcription, but useful surface/cartoon pattern |
| `4V6F` | manifest example only; no matching bundled asset found | unknown at runtime | not a dependable current source | not usable without asset/provenance |

No BCIF loader or bundled BCIF asset was found. No CCD/component-definition ingestion was found. No eukaryotic Pol II structure is bundled or referenced in the transcription manifest. The current source set therefore cannot support an honest deposited Pol II actor without adding an appropriate source.

## 8. Mol* capability audit

Yes, Scina is partially reinventing capabilities Mol* already supplies.

The bundled `public/spatial-ravia/molstar/molstar.js` and the TypeScript adapters already demonstrate:

- nucleic-acid cartoon representations (`polymer-trace`, `nucleotide-ring`, `nucleotide-block`);
- protein Gaussian surfaces;
- ball-and-stick atom/intra-bond views;
- chain/entity/residue component selection through MolScript expressions;
- model/assembly creation;
- custom uniform/element colors and alpha;
- camera focus/reset and interactivity;
- residue/atom selection readouts;
- structure transforms through the Mol* state tree.

The transcription Mol* adapter (`MolstarStructurePresentationAdapter`) downloads 6ALH, creates a model/structure, renders the RNAP chains as a Gaussian surface, and renders DNA/RNA chains as cartoons with local ball-and-stick details. This is materially closer to the desired molecular representation than `StructureDerivedPrimitive` or the R3F ellipsoid body.

Mol* is not currently a drop-in replacement for every requirement. Its exact-frame camera contract is explicitly unsupported by P4; deterministic per-frame transforms of a structure subtree require a tested adapter; and mixing Mol*’s canvas with the R3F temporal scene requires ownership and z-order decisions. Those are integration constraints, not evidence that R3F should recreate molecular surfaces.

## 9. Representation architecture comparison

| Option | Visual/scientific fidelity | Exact-time animation | Mobile | P3/P4 integration | Selection/highlighting | Complexity/maintenance | Verdict |
|---|---|---|---|---|---|---|---|
| A. Custom procedural Three.js molecular renderer | low–medium unless it reimplements surfaces/cartoon/topology | excellent | potentially excellent | easy | must rebuild selectors | high long-term duplication | not sufficient for Pol II; retain only for parametric DNA/schematic tails |
| B. Mol* primary renderer | high for deposited actors | difficult for arbitrary moving structures/camera today | acceptable with tuned representations | requires a typed frame adapter and readiness contract | excellent | moderate; existing dependency | good for static/local molecular views, not alone for all temporal overlays |
| C. Mol* deposited actors + R3F overlays/dynamics | high for structural bodies; explicit schematic dynamic layer | strong: R3F owns transforms/visibility while Mol* owns body | good if coarse representations are cached | best seam with current P3/P4 | strong through Mol* selectors | moderate and bounded | **recommended** |
| D. Convert structures to simplified Three.js meshes | medium–high if surface extraction is real | strong | good with cached meshes | straightforward after asset build | must preserve selector maps | high asset pipeline burden | useful later for deterministic/mobile cache, not a first fix |
| E. Existing hybrid (`StructureDerivedPrimitive` + procedural actors) | low–medium | strong | good | already integrated | weak for primary body | low short-term, poor visual ceiling | current state; retain as transitional context only |

Recommendation: **Option C**, with an explicit option to precompute/cache D-style geometry for mobile and exact-frame export later. Do not make Mol* and R3F competing authorities for the same actor.

## 10. Fidelity-by-actor recommendation

| Actor | Recommended representation | Reason |
|---|---|---|
| DNA substrate | keep current parametric canonical DNA for generic/mechanism views; use deposited/Mol* for structural views | current DNA grammar is accepted and coherent; do not rebuild it merely to force deposition |
| Pol II / RNAP | deposited appropriate polymerase complex as Mol* Gaussian surface or cartoon; use a source-appropriate bacterial RNAP or eukaryotic Pol II depending on semantic request | protein body is where current scene fails; ellipsoid lobes are not enough |
| template/coding DNA in transcription | deposited elongation-complex DNA where source exists, otherwise current parametric DNA aligned to the structural frame | the current DNA visual is accepted; structural hybrid should not invent an unrelated frame |
| RNA inside active site | deposited elongation-complex RNA when source matches the requested polymerase; otherwise Mol* nucleic-acid cartoon/backbone over a bounded selected chain | fixes toy nucleotides and preserves source topology |
| RNA–DNA hybrid | deposited complex chains/residue selection where available; explicit rule-derived pairing only when source does not contain the requested state | hybrid should be a selected structural relation, not line segments between arbitrary points |
| free nascent RNA tail | canonical R1.1 schematic molecular continuation anchored to a source RNA exit; label S2 and do not imply deposited coordinates | no structure contains an arbitrarily long growing tail for every exact time |
| promoter | parametric/regional overlay anchored to DNA or source chain range | promoter is a semantic region, not generally a complete deposited actor in the current assets |
| transcription bubble | dynamic presentation deformation/overlay around a structural DNA/RNAP frame; do not claim deposited dynamics | exact-time state is P3; source coordinates supply the static arrangement |

## 11. Scale audit

There is no unified angstrom-to-world-unit mapping across the current molecular systems.

Observed policies include:

- `DnaVisualSystem.geometry`: Å-labelled canonical values (`helixRadiusAngstrom: 10`, rise `3.4`, backbone radius `1.15`) plus separate render values such as `backboneRadius: 0.46`.
- `TranscriptionDnaTemplate.tsx`: `coordinateScale = 0.052` converts its DNA samples into scene units.
- `GeneExpression3DScene.tsx`: mechanism groups are additionally scaled by `1.35` and `1.32`.
- `biology-transcription-rnap-presentation.ts`: `groundedWorldScale = 0.0115` for source coordinates.
- `StructureDerivedPrimitive.tsx`: protein residue points use instance scale `0.11`, nucleic residue points `0.08`, and trace tubes radius `0.09` before the RNAP transform.
- `TranscriptionRnapPresentation.tsx`: the structure transform multiplies grounded scale by the caller’s `scale`, currently `1`.
- `transcription-molecular-actors.ts`: RNA units are placed every `0.2` scene units with fixed `y/z` offsets.
- R1.1 canonical RNA uses approximately `0.46` unit spacing; `RnaVisualSystem` declares `backboneSpacing = 1.25`, `backboneRadius = 0.12`, `riboseScale = 0.24`, and `baseScale = 0.3`.
- Mol* scenes retain structure coordinates in their own Å-like coordinate system and let Mol* fit the camera.

These numbers cannot be compared reliably today because each path has independent group transforms and camera policies. A target architecture needs one documented structural conversion, e.g. `angstrom → scene unit`, and one local actor frame. Presentation scale may then be a bounded, declared camera/ROI policy rather than arbitrary per-component constants.

## 12. Coordinate / anchor audit

### Grounded anchors

6ALH provides `upstream-dna`, `downstream-dna`, `rna-exit`, and `active-center` anchors through `biology-transcription-structure-grounding.ts` and parser-derived axes/centroids. The RNAP transform aligns the source active center and source DNA direction to a target point and `[1,0,0]` direction.

### Independently authored anchors

The live R3F path still contains these independent choices:

- `sceneXFromProgress(progress) = -2.8 + progress * 5.6` for polymerase/RNA placement;
- polymerase y position `0` when engaged and `0.42` when not engaged;
- `MolecularNascentRNA3D` exit `[anchorX, -0.22, 0.18]`;
- each RNA unit offset `distance * 0.2`, `y = -0.28 - distance * 0.12`, and z offsets;
- hybrid DNA points are synthesized as `[rnaBaseX, 0.02, rnaBaseZ - 0.02]`;
- `BubbleEnvelope3D` is a separate sphere around `sceneXFromProgress(bubbleCenter)`;
- `TranscriptionDnaTemplate` has its own `transcriptionDnaTemplateTransform` and `coordinateScale`;
- promoter torus at `[-2.5, 0.04, 0.12]`;
- scene group scales `[1.35]` and `[1.32]` and a separate camera `[3.6, 2.25, 4.7]`.

The result is only partially shared: progress is shared numerically, but the structural source frame is not. Pol II can be source-aligned while RNA and DNA are reconstructed in a different scene frame. This causes clipping, apparent sliding, incorrect exit direction, and the impression that RNA is attached by decoration rather than emerging from a channel.

## 13. Surface / rendering capability

### Existing capability

Mol* already supports the required practical representations: Gaussian surface for large protein bodies, cartoon/polymer trace and nucleotide ring/block for nucleic acids, and local ball-and-stick. `MolstarStructurePresentationAdapter` is proof that these can be configured in the repository.

The R3F path has no solvent-accessible or molecular-surface implementation. It has residue spheres, trace tubes, voxel cells, authored ellipsoids, and generic Three.js primitives. Those are useful fallbacks/context but not equivalent to a molecular surface.

### Pol II recommendation

At current product zoom: use a deposited protein Gaussian surface or medium-quality cartoon as the primary body, with a structurally selected channel/active-site overlay only when supported by source data. Do not render millions of atoms. Use residue/chain selections and cached Mol* representations. The fallback should be a coarse envelope explicitly marked S1/S2, not a fake deposited body.

## 14. RNA strategy

| Candidate | Assessment |
|---|---|
| A. manual ssRNA chain | good for isolated schematic teaching; cannot solve active-site molecular credibility |
| B. idealized A-form fragment | useful parametric fallback/reference; better than a rope but still not source-grounded |
| C. deposited elongation-complex RNA | best for the bounded RNA inside Pol II and the hybrid; 6ALH already contains chain R |
| D. deposited hybrid + schematic free tail | **best transcription architecture**: use deposited chains for the active site, attach R1.1-style schematic continuation only beyond the source boundary |
| E. generated/predicted RNA | unnecessary for the first fix; adds provenance and validation burden |
| F. existing family-specific procedural RNA | preserve for non-transcription RNA families; do not use as the primary transcription actor |

The toy-chain problem is solved by making the short active-site RNA an actual selected chain/cartoon/backbone from an elongation complex. A free tail can remain schematic, but the viewer sees the structurally meaningful origin, hybrid, and exit first. R1.1 can be reused as a continuation grammar only after it is anchored to the source frame.

## 15. Pol II strategy

The current 6ALH path should be **LIMITED_TO_FALLBACK / bacterial-transcription context**, not called Pol II. It is not appropriate as the primary source for a prompt explicitly asking for eukaryotic Pol II. It should be retained for bacterial RNAP prompts if its source and limits are disclosed.

The correct source type for a Pol II implementation is a deposited eukaryotic Pol II elongation complex containing Pol II, DNA, and nascent RNA/hybrid, with chain/entity metadata and a resolution suitable for surface/cartoon rendering. The audit did not fetch a new asset; obtaining one is a future source/provenance task. If the product accepts both bacterial RNAP and Pol II, they require separate manifest entries and separate semantic/fidelity labeling.

Do not generate a custom mesh before selecting the biologically appropriate source. A coarse-grained mesh cache may be a later performance optimization over that source.

## 16. Why previous attempts failed

### Ranked causes

1. **ARCHITECTURE — CRITICAL:** no single molecular representation owner. Mol* solves the hard geometry, but the live cellular transcription owner mounts R3F primitives; the deposited path is optional context rather than the primary body.
2. **DATA — CRITICAL:** 6ALH is bacterial RNAP while the scene calls it Pol II; no eukaryotic Pol II asset is present.
3. **REPRESENTATION — CRITICAL:** source coordinates are reduced to residue points and then rebuilt as ellipsoids; RNA is rebuilt as tubes/glyphs. The renderer cannot recover molecular quality from lost surface/topology data.
4. **COORDINATES — MAJOR:** DNA, RNA, and RNAP use unrelated scale/anchor systems and manual offsets. Exact-time progress does not imply a shared physical frame.
5. **RENDERING — MAJOR:** repeated sessions adjusted colors, toruses, spheres, tube radii, and labels rather than changing the data-to-representation layer.
6. **FALLBACKS — MAJOR:** a failed structure load can fall back to a plausible shape; tests assert safety and ownership but do not require a visible fidelity downgrade or reject a source mismatch.
7. **TESTING — MAJOR:** tests prove deterministic fields, finite vectors, source references, and route ownership. They do not compare screenshots or inspect whether the perceived body is source-derived.
8. **VISUAL ACCEPTANCE — MAJOR:** acceptance was sometimes inferred from code/test success, while human review correctly rejected toy-chain, blob, and tube appearances.
9. **PROMPTING — MINOR:** prompts/labels say Pol II or molecular even when the underlying source is bacterial/coarse; this increases expectation mismatch but is not the primary geometric cause.

## 17. Gap scores

| Capability | Current (0–10) | Target | Exact missing piece |
|---|---:|---:|---|
| DNA structural fidelity | 7 | 8 | canonical DNA is coherent; mechanism path still lacks deposited actor identity |
| RNA structural fidelity | 2 | 8 | active-site RNA must use deposited chain/cartoon/backbone; free tail must be explicitly schematic |
| Pol II structural fidelity | 1 | 8 | appropriate eukaryotic source and primary surface/cartoon representation are missing |
| Shared scale | 3 | 8 | unified Å/world mapping and ROI policy |
| Coordinate grounding | 4 | 8 | one structural actor frame for DNA, polymerase, hybrid, and RNA exit |
| Active-site grounding | 4 | 9 | source-selected active center/hybrid/exit must drive all local actors |
| Molecular visual coherence | 4 | 8 | one representation language rather than mixed R3F glyph systems |
| Dynamic coupling | 6 | 8 | exact-time state exists, but transforms are not applied to one structural subtree |
| Mobile performance | 6 | 8 | coarse Mol*/cached representations need a measured mobile budget |
| Maintainability | 4 | 8 | remove competing transcription/RNA production representations and define owners |

The current state has useful contracts and data seams, but the molecular rendering result is roughly **35–40% of the target architecture**: DNA and P2/F2 seams are valuable; the primary RNA and Pol II visual bodies still require a representation-level change.

## 18. Retain / replace / delete matrix

| Component | Action | Reason |
|---|---|---|
| `TranscriptionDnaTemplate` | **KEEP** | accepted DNA visual; later expose structural anchors without aesthetic redesign |
| `GeneExpression3DScene` | **KEEP_AND_EXTEND** | retain exact-time owner and R3F overlay role; stop owning invented molecular body geometry |
| `TranscriptionRnapPresentation` | **REPLACE** primary path | retain source-loading seam, replace lobe/cylinder primary body with appropriate Mol*/cached surface |
| `StructureDerivedPrimitive` | **KEEP_AND_EXTEND** | useful coarse fallback/context; not primary molecular actor |
| `RnaMolecularStrand3D` | **KEEP_AND_EXTEND** | retain as S2 schematic/free-tail and isolated demo primitive; do not claim deposited fidelity |
| `rna-canonical-visual` | **KEEP** | stable R1.1 schematic grammar; add source-frame anchoring only in a later scoped phase |
| legacy `NascentRNA3D`/tube paths | **DELETE_FROM_PRODUCTION** | featureless tube cannot meet target; retain only as historical/unsupported fallback if needed |
| `MolstarStructureViewer` | **KEEP** | accepted DNA structural viewer and selector/camera seam |
| `MolstarStructurePresentationAdapter` | **KEEP_AND_EXTEND** | closest existing path to desired transcription structure representation |
| `biology-transcription-structure-grounding` | **KEEP_AND_EXTEND** | source/anchor seam; add source-appropriate entries and preserve provenance |
| `biology-transcription-rnap-presentation` | **LIMIT_TO_FALLBACK** | current lobe derivation is not an acceptable primary molecular body |
| `ProductionRnaScene` | **KEEP** for RNA families | unrelated family owner; do not use as transcription molecular actor without separate migration |
| `MechanisticScene` transcription actors | **LEGACY_ONLY** | competing older procedural owner must not win new transcription renders |
| Mol* `applyTranscription` | **KEEP_AND_EXTEND** | use as structural actor renderer once source/model semantics are corrected |

## 19. Target architecture

```text
validated P3 exact-time transcription state
        ↓
structural scene grounding (P2-B/C/D/E/F/G)
        ↓
source-appropriate actor package
  - DNA actor + selected chains/ranges
  - polymerase actor + source surface/cartoon
  - RNA/hybrid actor + selected chains/residues
  - explicit schematic-tail actor when source ends
        ↓
one shared active-site coordinate frame
  - DNA axis
  - polymerase active center / cleft
  - hybrid window
  - RNA exit anchor
        ↓
presentation transforms derived from exact time
  - position/orientation/visibility only
  - local bubble/deformation overlay only where source cannot express dynamics
        ↓
Mol* or cached structure renderer for molecular actors
R3F for exact-time transforms, overlays, labels, and schematic continuation
        ↓
P4 readiness/camera/export boundary
```

Ownership rules:

- P3/scientific state owns what is happening and when.
- P2 grounding owns source identity, selectors, structural evidence, and fidelity.
- The actor package owns structural geometry and selector mappings.
- Presentation state owns transforms, visibility, and disclosure—not molecular shape.
- Mol* (or a derived cached mesh adapter) owns molecular representation.
- R3F owns overlays, exact-time orchestration, and any explicitly S2 continuation.
- No renderer may infer a base pair, bond, actor identity, or source fidelity from visual proximity.

## 20. Recommended implementation phases

### M1 — Structural actor/frame contract

Build one transcription structural actor package around source, assembly/model, chain/residue selectors, Å/world conversion, and active-site frame. Acceptance: DNA, polymerase, RNA, and hybrid anchors are reported in one frame with provenance; no visual redesign yet.

### M2 — Source correctness and primary polymerase representation

Separate bacterial RNAP from eukaryotic Pol II semantically and add the appropriate deposited elongation source through P2 provenance. Mount a Mol* Gaussian/cartoon protein body as the primary Pol II representation. Acceptance: the visible body is a real structural representation, DNA channel remains visible, and fallback is explicitly downgraded.

### M3 — Grounded DNA/RNA hybrid

Render the selected deposited DNA/RNA chains/residue ranges at the active site using Mol* nucleic-acid cartoon/backbone plus local detail. Acceptance: RNA emerges from a source-grounded hybrid/exit, no arbitrary line connectors, and chain selectors persist in diagnostics.

### M4 — Schematic free-tail continuation

Attach R1.1’s canonical RNA grammar only beyond the deposited source boundary, using the grounded exit frame and an explicit S2 marker. Acceptance: 3′ growth remains exact-time deterministic, the tail cannot be mistaken for deposited structure, and no second active-site frame is introduced.

### M5 — Integrated temporal owner/performance gate

Make the existing P3 exact-time owner transform one structural subtree/actor package, then measure desktop/mobile performance and P4 readiness. Acceptance: initiation/elongation/termination preserve structural ownership, scrub reconstructs exactly, no old tube/lobe owner is mounted, and browser visual review passes.

## 21. Distance from target

**Assessment: approximately 35–40% architecturally complete; approximately 20–30% visually complete for the transcription molecular target.**

Already good:

- accepted canonical DNA visual grammar;
- real PDB/mmCIF loading, chain selection, anchor derivation, and provenance seams;
- a working Mol* adapter with Gaussian protein and nucleic-acid cartoon capabilities;
- exact-time P3/presentation-state contracts and safe scrub reconstruction;
- isolated R1.1 RNA grammar suitable for an explicitly schematic tail.

Partially there:

- 6ALH is a relevant bacterial elongation complex but is used under a Pol II-oriented product narrative;
- structure-derived RNAP data reaches the scene but is reduced to coarse points/ellipsoids;
- RNA/DNA hybrid semantics exist, but production geometry is procedural;
- Mol* can render the desired representations, but it is not the primary live cellular transcription owner.

Must be rebuilt:

- source-appropriate Pol II/RNAP actor selection;
- primary protein and active-site representation;
- grounded RNA/hybrid representation;
- one Å/world and active-site frame;
- explicit structural-vs-schematic boundary;
- migration away from legacy tube/lobe ownership.

## 22. Risks / unknowns

- The repository does not contain a eukaryotic Pol II elongation asset; source acquisition and licensing/provenance approval are prerequisites.
- Mol* exact-frame camera and deterministic capture remain explicitly unsupported by P4; M5 must resolve or preserve that boundary.
- Moving a Mol* structure subtree through exact-time frames needs a small, tested adapter; it must not mutate scientific state.
- A deposited complex is static; dynamic bubble opening and long-tail growth will remain presentation projections and require honest S2/S1 disclosure.
- 6ALH is 4.40 Å cryo-EM and has an explicit PDB caveat about a broken protein linkage; it is suitable for coarse structural context, not atomistic claims.
- Source-chain identity and model/assembly/alternate-location policies remain split across manifest, parser, provider, and Mol* paths.
- Mobile performance needs measurement with actual Mol* representations rather than assumptions based on residue count.
- Screenshot/human acceptance must become a release gate; passing structural/unit tests alone is insufficient.

## Compact summary

### CORE ROOT CAUSE:

Scina’s live transcription scene does not have a single molecular representation owner. Deposited coordinates are reduced to residue centroids and used to position hand-built RNAP lobes, while RNA is generated from independent scene-space tubes and primitive glyphs. DNA looks better because it has one coherent parametric grammar and a genuine Mol* structural alternative. The current scene also labels bacterial 6ALH RNAP as Pol II and uses unrelated scale/anchor systems, so no amount of local primitive polishing can produce a coherent molecular complex.

### RECOMMENDED ARCHITECTURE:

Use a source-appropriate deposited elongation complex and Mol* (or a cached equivalent) as the primary renderer for polymerase and active-site DNA/RNA/hybrid actors. Keep P3 exact-time state authoritative; derive one structural active-site frame and let R3F apply transforms, visibility, overlays, and an explicitly S2 schematic free-RNA tail. Retain the accepted DNA renderer and R1.1 RNA grammar only in their appropriate scopes.

### CURRENT DISTANCE FROM TARGET:

Approximately 35–40% of the target architecture and 20–30% of the target transcription visual. The data-loading and state seams are useful, but Pol II and active-site RNA still require representation-level replacement.

### FIRST IMPLEMENTATION PHASE:

**M1 — Structural actor/frame contract:** unify source, selectors, Å/world conversion, and active-site anchors for DNA, polymerase, RNA, and hybrid before changing any visual geometry.

SCINA MOLECULAR RENDERING AUDIT COMPLETE — NO IMPLEMENTATION PERFORMED

# P1-A Prompt Ingress Audit and Failure Taxonomy

Status: audit only. This document maps the current ingress state as observed after Foundation v1 freeze. It changes no parser, benchmark expectation, grounding, SceneSpec, timeline, teaching, export, or renderer behavior.

## A. Ingress architecture map

### Live UI path

`SpatialPromptDock` submits trimmed text to `page.tsx`. The page immediately fan-outs the same `submittedPrompt` to `resolveRnaPresentation`, `parseBiologyScenePrompt`, and `resolveDnaMechanismPresentation`. RNA suppresses the general parser only after its route has been chosen; DNA-mechanism resolution is still attempted independently. The page then chooses components and, for DNA templates, passes the original text into `DnaPackagingView` and `DnaMolecularView(regulationPrompt)`.

| Stage / authority | Input → output | Reads raw text | Semantic interpretation | Scientific interpretation | Chooses production owner | Downstream dependency |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| `SpatialPromptDock.tsx` | UI text → submit callback | Yes | No | No | No | `page.tsx` |
| `page.tsx` | `submittedPrompt` → competing RNA/general/DNA routes | Yes | Dispatch only | No | Yes, by branch/component | all live ingress paths |
| `biology-normalizer.ts:normalizeBiologyPrompt` | text → normalized text | Yes | Lexical synonym rewrite | No | No | general/DNA-family parsers |
| `biology-context.ts:detectBiologyContext` | text → organism context | Yes | organism cue classification | indirectly (organism choice) | No | general parsers |
| `biology-dna-prompt-intent.ts:deriveDnaPromptSelection` | text → `DnaPromptSelection` | Yes | family, entities, detail | selects canonical cast/detail | Indirectly through template | semantic parser, deterministic parser, DNA dispatcher |
| `biology-semantic-parser.ts:parseBiologyPromptSemantically` | text → `BiologyParseResult` | Yes | weighted concept/family selection | creates scene entities/actions/relations | Indirectly via scene | `parseBiologyScenePrompt` |
| `biology-prompt-parser.ts:parseBiologyPrompt` | text → `BiologySceneSpec` | Yes | ordered phrase branches | creates scientific-looking scenes | Indirectly via scene | general fallback |
| `biology-parser.ts:parseBiologyScenePrompt` | text → semantic result or deterministic fallback | Yes | confidence/fallback decision | validates scene/context | No direct owner; carries selection | `page.tsx` |
| `rna-intent.ts:resolveRnaIntent` | text → `RnaIntent/RnaSceneSpec` | Yes | RNA family/type/state extraction | derives pairing, processing, degradation state | Indirectly | RNA router |
| `RnaPresentationRouter.ts:resolveRnaPresentation` | text → `RnaPresentationRoute` | Yes | via `resolveRnaIntent` | presentation payload derivation | **Yes** | `page.tsx` → `RnaPresentationView` |
| `dna-mechanism-intent.ts:resolveDnaMechanismIntent` | text → `DnaMechanismIntent/Spec` | Yes | mechanism family, pair, focus, scale | derives interaction/state/orientation/reaction fields | Indirectly | mechanism router |
| `DnaMechanismPresentationRouter.ts:resolveDnaMechanismPresentation` | text → route | Yes | via mechanism intent | derives presentation plan | **Yes** | `page.tsx` → mechanism view |
| `biology-dna-visual-dispatcher.ts:resolveDnaVisualTemplate` | scene + selection → template | Selection/scene normally; legacy fallback derives scene semantics | family inference fallback | renderer-source/presentation policy | **Yes** | `page.tsx` |
| `biology-renderer-router.ts:chooseBiologyRenderer` | scene/template → renderer kind | No raw text | No | No | **Yes** | `page.tsx` |
| `DnaMolecularView.tsx:parseSpatialScenePrompt` and `DnaRegulationPresentation.ts:deriveDnaRegulationPresentation` | raw `regulationPrompt` → view/presentation settings | Yes | structure/regulation phrases | view state / presentation plan | Yes (legacy view policy) | molecular DNA presentation |
| `DnaPackagingView.tsx` / `DnaPackagingGeometry.ts:derivePackagingMode` | raw prompt → packaging mode | Yes | packaging terms | No | presentation choice | packaging renderer |
| `biology-ai-parser.ts:parseBiologyPromptWithAI` | raw text → LLM-produced `BiologySceneSpec` | Yes | LLM | LLM generates entities/relations/actions | indirectly through render mode | test-only; no live caller found |
| `dna-structure-routing.ts:parseSpatialScenePrompt` | raw text → legacy structure command | Yes | structure/view requests | transformation values | Yes | `DnaMolecularView`; separate legacy entry |
| F7 proofs (`dna-foundation-migration.ts`, `f7-dna-strand-separation-migration.ts`, `rna-hairpin-foundation-migration.ts`, `rna-exonuclease-migration.ts`) | raw text + resolved/fixture input → SemanticIntent and seam payload | Yes | legacy resolver then adapter | none beyond legacy resolved spec | retained owner only | migration tests/proofs, not live universal ingress |

The frozen `semantic-intent-legacy-adapters.ts` reads `rawUtterance` only to retain it and map legacy resolved fields. Its `stableEntityFor`, `phenomenonForText`, and `mechanismForText` helpers are a second text interpretation path within the F1 adaptation boundary.

## B. Raw-prompt logic inventory

| Location | Logic forms | Classification | Consequence |
| --- | --- | --- | --- |
| `biology-normalizer.ts` | lowercasing, trim, regex replacements for unzip/open/hold-apart/primer/prime/join/seal | lexical normalization plus semantic rewrite | Rewrites wording before interpretation; limited Unicode handling |
| `biology-context.ts` | `includes`, `ssb`/`pol ii` regexes | semantic interpretation | organism policy affects protein identity |
| `biology-semantic-parser.ts` | tokenization, phrase tables, scoring, confidence threshold, DNA fallback | semantic interpretation; fallback | one large phrase-scoring authority also emits scenes |
| `biology-prompt-parser.ts` | long ordered `if` keyword branches | semantic and scientific interpretation; fallback | raw text directly creates `BiologySceneSpec` facts |
| `biology-parser.ts` | misconception phrase suppression, confidence gate, `try/catch` fallback | fallback | some invalid text is protected from fallback; other ambiguous text can enter deterministic parser |
| `biology-dna-prompt-intent.ts` | family/detail/entity/local-chemistry phrase tables | semantic interpretation and presentation/routing leakage | intent contains camera/detail concepts and feeds owner template |
| `dna-mechanism-intent.ts` | regex guards, weighted family rules, exact keyword tests | semantic plus scientific interpretation | raw text creates interaction, orientation, state, scale, and reaction fields |
| `rna-intent.ts` | regex guards, family rules, text inference functions | semantic plus scientific interpretation | raw text creates RNA type, pairing, processing, degradation, DNA context, entities |
| `RnaPresentationRouter.ts`, `DnaMechanismPresentationRouter.ts` | `resolve*(prompt)` wrappers | presentation/routing leakage | prompt parsing immediately selects owner |
| `DnaMolecularView.tsx`, `DnaRegulationPresentation.ts`, `DnaPackagingGeometry.ts`, `DnaStrandSeparationPresentation.ts` | text/phrase checks in presentation modules | presentation/routing leakage | raw prompt remains downstream of semantic resolution |
| `dna-structure-routing.ts` | phrase/word checks and numeric regex parsing | semantic interpretation plus renderer/style routing | raw prompt selects source, view mode, colors, isolation, camera, transforms |
| `biology-ai-parser.ts` | LLM prompt interpolation and JSON schema parse | semantic and scientific interpretation | unbounded LLM emits legacy scene facts; no live invocation found |
| `semantic-intent-legacy-adapters.ts` | normalized raw-text entity/phenomenon/mechanism maps | semantic interpretation | duplicate semantic mapping inside F1 adaptation |

No generic typo-correction, Unicode normalization form, pronoun/coreference resolver, clause splitter, or bounded LLM-to-SemanticIntent path was found.

## C. Failure taxonomy and current behavior

| Category | Concrete examples | Current observed behavior | Severity |
| --- | --- | --- | --- |
| A. Lexical noise | `DNA!!!`, whitespace, `5′`, `5'`, curly apostrophe, em dash | casing/space and selected prime/dash forms work in DNA/RNA special normalizers; punctuation/Unicode coverage is uneven; typos are generally unsupported | MINOR |
| B. Paraphrase variation | `unzip`, `pull apart`, `motor protein` | selected replication paraphrases are tested and work; wording outside phrase tables is likely unsupported or reaches broad fallback | MAJOR |
| C. Entity ambiguity | `show it`, `the strand`, `this chain`, `polymerase` | no pronoun resolution; Foundation corpus explicitly models ambiguous polymerase as clarification-required, live legacy routes do not produce F1 clarification | MAJOR |
| D. Mechanism ambiguity | opening/separating/unzipping; cutting/breaking/degrading; pairing/binding/hybridizing | ordered guards resolve a subset; broad `strand`, `open`, `pairing`, `exon` collisions are guarded ad hoc; many choices are confidence/keyword dependent | MAJOR |
| E. Direction ambiguity | `5′→3′`, `left`, `upstream`, `downstream` | prime forms are normalized selectively; DNA mechanisms infer strand orientation; screen direction is not extracted separately in live paths, so it may be lost or conflated | MAJOR |
| F. Multi-intent | `show and explain`, `compare and animate`, two mechanisms | live parsers select one scene/family; no clause composition; Foundation corpus correctly marks incompatible DNA/RNA pairing as unsupported | MAJOR |
| G. Misconception / invalid science | `ribosome transcribing DNA`, `DNA indestructible`, impossible pairing | seven exact phrases suppress deterministic fallback; scene consistency catches some conflicts; otherwise legacy inference can construct a plausible scene rather than preserve a claim. Foundation policy has explicit invalid-science outcome but is not ingress-connected | BLOCKER |
| H. Unsupported / partial | protein folding; animate static-only helix stabilization; export request | general path returns unsupported on failures; RNA/DNA routes often return `undefined` and page falls through; Foundation policy has explicit outcomes but live ingress does not use it | MAJOR |
| I. Overspecification | coordinates, atomistic precision, `ball-stick`, materials/styles | legacy structure parser accepts render/view terms and maps them directly to camera/color/view; F1 rejects renderer concepts, but live path bypasses F1 | MAJOR |
| J. Underspecification | `show replication`, `show polymerase action` | broad replication gets canonical scene; ambiguous polymerase has no live clarification and may be routed by phrase context or rejected | MAJOR |
| K. Conflicting clauses | opposite directions, two incompatible states/actors | no conflict model in legacy parsers; ordering and branch precedence decide, losing a clause | BLOCKER |
| L. Long/noisy prompts | conversational filler, teaching context, irrelevant clauses | no segmentation or relevance model; phrase score can be dominated by incidental terms | MAJOR |

“Succeed accidentally” applies where a phrase happens to match a guarded synonym rather than an explicitly modeled intent. “Silent fallback” is present when semantic confidence misses and `parseBiologyPrompt` succeeds; “wrong family/mechanism” is possible because RNA/DNA/general resolvers are independently evaluated from the same prompt.

## D. Current failure behavior evidence

| Evidence source | Demonstrated behavior | Taxonomy coverage |
| --- | --- | --- |
| `biology-prompt-parser.test.ts` | exact DNA replication, helicase, primase, ligase, directionality, organism context, selected paraphrases | A/B/D/E |
| `biology-semantic-parser.test.ts` | weighted semantic parsing, equivalent paraphrases, unsupported ambiguity, deterministic fallback, consistency rejection | B/C/D/G/J |
| `biology-dna-prompt-intent.test.ts` + DNA family benchmark (100) | DNA family/detail/entity selection and non-DNA rejection | B/C/I/J |
| DNA mechanism benchmark (60) + mechanism router tests | six mechanism families and owner routing | D/E/I |
| RNA benchmark (80) + `rna-contract.test.ts` / router tests | eight RNA families, conflict guards, owner routing | A/B/D |
| Foundation capability corpus (30) | supported, multi-intent unsupported, ambiguity, misconception, unsupported, static-only animation, export image | C/F/G/H |
| SemanticIntent fixtures/preservation tests | hostile claims, ambiguity, multi-intent, biochemical vs screen direction | C/E/F/G |
| semantic/transcription/translation/signaling/action-potential holdout scripts | broader legacy biology semantic behavior | B/D/L |

No current corpus systematically varies typos, Unicode normalization, pronouns, indirect references, contradictory multi-clause requests, long conversational noise, renderer/style mixed prompts, coordinates, or explicit clarification wording.

## E. Duplication, coupling, and choke points

1. **BLOCKER — competing live semantic authorities.** `page.tsx` sends one prompt to RNA, general biology, and DNA-mechanism parsers. The first visible branch, rather than one semantic result, determines presentation.
2. **BLOCKER — raw prompt downstream of semantic resolution.** Raw text reaches `DnaPackagingView`, `DnaMolecularView`, structure routing, regulation presentation, and DNA separation presentation. This violates the frozen future boundary that renderers do not parse prompts.
3. **MAJOR — duplicated semantic phrase logic.** Biology normalizer, semantic parser, deterministic parser, DNA family selector, DNA mechanism resolver, RNA resolver, structure parser, and F1 adapters each normalize or classify overlapping DNA/RNA terms.
4. **MAJOR — science embedded in prompt parsing.** General, DNA-mechanism, and RNA parsers create topology/state/interaction-like facts directly from keyword matches, before F2 grounding.
5. **MAJOR — routing embedded in parsing.** RNA and DNA mechanism prompt entry points return production-owner routes; structure routing chooses visualization source, camera, color, and isolation from raw text.
6. **MINOR — unused AI ingress risk.** `parseBiologyPromptWithAI` exists and directly asks an LLM for legacy scientific scenes but no production call site was found. It is an unbounded alternative authority if activated.

## F. SemanticIntent v1 gap analysis

| F1 field | Current status | Evidence / gap |
| --- | --- | --- |
| `rawUtterance` | reliably retained only in adapters | live parsers retain prompt outside F1 rather than emit a common intent |
| `canonicalGloss` | partially extractable | legacy family/spec focus strings are substitutes; no universal gloss |
| `acts` | partially extractable | show/explain style is inconsistently used; no multi-act composition |
| request `subjects/entities` | partially extractable | DNA/RNA phrase maps create IDs; pronouns and candidate alternatives are absent |
| `phenomenon` | partially extractable, inferred too late | emitted through adapters from legacy spec/text, not a shared ingress result |
| `mechanism` | partially extractable, conflated | DNA mechanism families are strong; general/RNA mechanism distinctions vary by parser |
| `states` | partially extractable | RNA/DNA branches infer states; conflicting states are not represented |
| biochemical direction | partially extractable | DNA prime orientation supports selected cases; upstream/downstream and explicit direction conflict are not modeled |
| screen direction | missing in live ingress | F1 fixture support exists, but no live extractor separates it from biochemical direction |
| audience | missing | teaching/context wording is not structured at ingress |
| output preferences / requested output | partially extractable but leaked | legacy structure parser reads style/view; Foundation support corpus models export/animation only as prebuilt policy input |
| alternatives | missing | ambiguity becomes `undefined`, unsupported, or branch precedence rather than candidate requests |
| clarification | missing in live ingress | Foundation policy can require it, but no prompt parser emits F1 clarification |
| confidence | partially extractable | semantic/DNA/RNA scorers provide incomparable heuristic values; fallback hard-codes `0.86` |
| claims / misconception distinction | partial and unsafe | exact suppression + validator only; F1 fixtures/policy support claims but no common live extraction |

## G. Test and corpus inventory

- Unit tests: general prompt parser and semantic parser; context, DNA family intent/dispatch, DNA structure routing, DNA mechanism contracts/routes, RNA contract/routes/presentations; F1 adapters, F1 validation/preservation, F5 support-policy and F7 proofs.
- Benchmarks: DNA family 100; DNA mechanism 60; RNA semantic 80; RNA runtime ownership 80; Foundation capability corpus 30; Foundation runner 48.
- Holdouts: semantic biology plus transcription, translation, signaling, and action-potential holdout sets and runners.
- Hostile/adversarial material: F1 hostile fixtures cover claims, ambiguity, multi-intent and screen direction; Foundation corpus covers a single ambiguity, misconception, unsupported request, static-only animation request, and export request.
- Coverage gaps: the twelve taxonomy categories are not a single ingress corpus; typo/Unicode/pronoun/conflict/long-noise/overspecification/clarification cases are especially sparse or absent.

## H. Top architectural risks

| Severity | Risk |
| --- | --- |
| BLOCKER | Multiple parsers and routes interpret the same raw text with no single authoritative result. |
| BLOCKER | Raw prompt logic is still in production presentation/rendering paths, contrary to the Foundation pipeline. |
| BLOCKER | Misconceptions and conflicting clauses are handled by narrow phrase suppression/precedence, not preserved as F1 claims/alternatives/clarification. |
| MAJOR | Keyword/regex semantic and scientific inference is duplicated across general, DNA, RNA, structure, and adapter paths. |
| MAJOR | Confidence values and fallback behavior have incompatible meanings and can conceal unsupported interpretation. |
| MINOR | The dormant AI parser could establish a competing, unbounded scientific-scene authoring path if connected. |
| NOTE | Existing frozen Foundation contracts already model several missing outcomes; the gap is ingress adoption, not a need for new architecture. |

## I. P1 next-boundary definition

- **P1-B:** define one bounded raw-text-to-`SemanticIntent v1` ingress contract, including normalization, confidence, alternatives, claims, and clarification only.
- **P1-C:** create the taxonomy-derived prompt corpus and acceptance matrix at that ingress boundary only.
- **P1-D:** consolidate lexical normalization and semantic extraction behind that boundary; do not cross into grounding or SceneSpec.
- **P1-E:** adapt one legacy ingress capability/family at a time to consume the common SemanticIntent result and remove its downstream raw-text dependency only where its migration proof permits.
- **P1-F:** verify no raw prompt reaches routing/rendering in migrated paths, while preserving protected production and benchmark behavior.

## J. Protected systems

Do not modify F1–F7 contracts, scientific grounding/provenance, SceneSpec, timeline/teaching/export, production DNA/RNA renderers, camera systems, geometry, existing benchmark expectations, or legacy systems outside a separately approved incremental ingress migration. The AI parser is audit-only and must not become a live fallback during P1 without a bounded F1-specific authorization.

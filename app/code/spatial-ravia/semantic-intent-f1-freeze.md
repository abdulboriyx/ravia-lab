# Foundation F1 Freeze Record

Status: frozen after F1-D.

## Contract

- SemanticIntent schema: `1`
- Vocabulary source: `foundation-semantic-vocabulary.ts`
- Contract source: `semantic-intent.ts`
- Legacy adapter source: `semantic-intent-legacy-adapters.ts`

## Benchmarks

- Legacy semantic preservation cases: 25
- Legacy sources covered: BiologySceneSpec, RnaSceneSpec, DnaMechanismSpec, DnaPromptSelection, DnaVisualTemplate
- DNA family coverage: structure, regulation, replication, transcription, damage/repair, packaging, local chemistry
- DNA mechanism coverage: base pairing, backbone chemistry, polarity, helix stabilization, strand separation, nucleotide assembly
- RNA family coverage: structure, types/functions, nascent transcript, processing, secondary structure, pairing/hybridization, degradation/stability, local chemistry
- Cross-domain coverage: DNA/RNA comparison and RNA/DNA hybrid
- Hostile contract fixtures: 6

Explicit identity gates include regulation, damage repair, packaging, canonical RNA base pairing, RNA/DNA hybridization, and exonuclease degradation.

The vocabulary includes dedicated IDs for these six distinctions, and runtime validation is strict against unknown keys recursively through requests, entities, claims, alternatives, directions, and clarification objects.

## Lossiness gate

Accepted losses:

- camera and ROI data
- renderer ownership
- Mol* or procedural source policy
- geometry/material/label payloads
- production support flags
- timing implementation details
- redundant primitive lists

These are presentation, renderer, legacy-ambiguous, unsupported-in-v1, or redundant fields—not user/scientific meaning.

Known semantic limitation:

- Some RNA motif names such as stem/loop/bulge currently survive through RNA phenomenon/focus/state rather than dedicated F1-A entity IDs.

## Protected files

Untouched:

- page.tsx
- MechanisticScene.tsx
- all current parsers and routers
- all family presentation/rendering modules
- structure grounding/loading
- camera and label systems
- benchmark expectation files

## Future F2 rules

F2 may consume stable IDs, acts, entity mentions, mechanisms, phenomena, states, direction/frame, claims, ambiguity, detail, and output preferences.

F2 must not place atoms, coordinates, topology graphs, cameras, renderers, meshes, materials, timeline implementation, provenance implementation, or scientific validation results into SemanticIntent.

# P2-E — Scientific interaction and topology grounding

`groundScientificInteractions` is the interaction/topology authority after the
validated P2-BCDF substrate. It emits the frozen F2 `ScientificTopologyModel`
(`ScientificInteraction`, `ScientificContinuity`, and `TopologyChange`) and a
small evidence sidecar keyed by interaction ID. The sidecar records whether an
assertion is deposited-source, chemical-rule, computed, constrained-schematic,
or schematic; it does not create a second interaction schema.

Canonical pairing is checked from explicit participant base/domain identities:
DNA permits A–T and G–C, RNA permits A–U and G–C. Hydrogen bonds, stacking,
and hybridization require explicit scientific anchors already present on the
actors. No distance, screen position, curve direction, or renderer object is
used as evidence.

Continuity, cleavage, fragmentation, shortening, and polarity changes are
represented by F2 continuity/change records. Invalid endpoints, incompatible
chemistry, unresolved anchors, insufficient evidence, and inconsistent
topology fail explicitly. Animation timing and production rendering remain
outside this layer.

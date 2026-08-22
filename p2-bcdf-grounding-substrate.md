# P2-BCDF composed grounding substrate

`resolveGroundingSubstrate` is the sole new P2 composition seam:

1. `resolveScientificSourceProvenance` (P2-B) validates and brands source identity.
2. `resolveStructureContext` (P2-D) accepts only that validated deposited source and resolves assembly/model/chain/variant/alternate-location context.
3. `resolveMolecularIdentitySelectors` (P2-C) consumes the resolved context and rejects selectors outside its selected chains.
4. `resolveFidelityUncertainty` (P2-F) consumes the same validated P2-B source and determines the evidence-supported fidelity tier.

The seam propagates explicit `INVALID_SOURCE`, `AMBIGUOUS_STRUCTURE`,
`UNSUPPORTED_CONTEXT`, `INVALID_SELECTOR`, `UNRESOLVED_SELECTOR`, and
`FIDELITY_UNSUPPORTED` outcomes. No stage guesses a chain, model, assembly, or
alternate-location policy, and no stage infers chemistry or interactions.

Legacy structure loaders/parsers remain input adapters only. They may parse raw
PDB/mmCIF data, but the composed P2 path owns provenance, structure context,
selector, and fidelity decisions. Production routing and renderers are not
migrated by this repair.

## Tracked limitation: `COMPUTED_STRUCTURE_CONTEXT_GAP`

**Owner:** P2-D / BCDF structure-context architecture.

The current seam resolves a scientific structure context, and therefore
molecular selectors, only for validated `depositedStructure` sources. A valid
`computedModel` source can receive C0 fidelity, but cannot currently obtain
the resolved structure/model context required by P2-C selectors and downstream
P2-G/P2-E structural grounding.

Consequently, P2-E/G supports topology grounding only for substrates for which
BCDF supplies a valid resolved scientific structure context. Computed
structural topology grounding is **NOT YET END-TO-END SUPPORTED**. The
`COMPUTED` ↔ `C0_COMPUTED` rule remains validated at the evidence/trace level;
that rule-level validation must not be interpreted as an executable computed
BCDF→G→E path. Future P2-D/BCDF work must provide a scientifically valid
computed-source structure/model context usable by selectors and downstream
grounding. No deposited or schematic fallback is authorized.

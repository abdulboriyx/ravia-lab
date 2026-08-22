# P2-B — Source and provenance resolver

`resolveScientificSourceProvenance` is the single source-identity boundary for
grounding. It accepts structured source metadata plus an already-selected
scientific target and returns a one-source F2-C document. It delegates final
document validation to `validateScientificFidelityProvenance`; F2-C remains the
schema authority.

The resolver accepts the five frozen fidelity tiers: deposited (`E0_DEPOSITED`),
computed (`C0_COMPUTED`), constrained (`S1_CONSTRAINED`), schematic
(`S2_SCHEMATIC`), and overlay (`O_OVERLAY`). Deposited sources require an
allowed provider, accession, structure identity, citation, and license. No
accession, version, assembly, chain, or other identity is fabricated; values
are preserved exactly when supplied.

Provider IDs are a bounded source vocabulary. Renderer names (including Mol*)
are invalid. Structure references are metadata only: this module never chooses
an assembly/model/chain, maps residues, or infers chemistry or interactions.
Targets must already exist in the caller's F2-C attachment context.

The output retains provider/version, accession, structure/model/assembly
references, citation, license, hash, source confidence, grounding confidence,
evidence, and approximation. Invalid or contradictory source/fidelity claims
fail explicitly; there is no generic or renderer fallback.

# P2-TF scientific grounding fixtures

`createScientificGroundingFixture(kind)` is test-only infrastructure for the real
P2 authority path: provenance (P2-B), structure context (P2-D), molecular
selectors (P2-C), fidelity (P2-F), the BCDF composed substrate, and local
chemistry (P2-G).  It deliberately returns the authenticated result emitted by
`groundAuthenticatedLocalChemistry`; it never builds validated provenance,
selector resolutions, a BCDF substrate, or chemical assertions by hand.

The bounded catalog contains only the nucleic component/atom identities needed
by these tests (A, T, G, C, U; sugar, phosphate, and canonical donor/acceptor
atoms).  It is test data, not a CCD replacement.  Every fixture has two named
scientific strand actors, two distinct normalized chains in biological assembly
`1`, explicit model selection, and explicit five-prime/three-prime connectivity.

Current reusable pair contexts are `dnaAT`, `dnaGC`, `rnaAU`, `rnaGC`,
`rnaDnaHybrid`, and `invalidAG`.  The latter grounds A and G correctly; only
P2-E may decide that a requested canonical relation is incompatible.

`createConnectivityFixture(kind)` extends the same authority path with
`dnaPhosphodiester`, `rnaPhosphodiester`, `rnaCleavage`, `rnaExonuclease`, and
`strandSeparation`.  Polymer fixtures contain two explicitly numbered residues
and an explicit `O3'`→`P` link; termini are explicit connectivity entries, not
deduced from the residue array.  The cleavage fixture supplies a cleaved link
to P2-G and therefore returns a real `cleavageSite` assertion rather than a
topology change.

Stable handles are returned under `fixture.handles.actors`,
`fixture.handles.selectors`, and `fixture.handles.facts`, so downstream tests do
not depend on assertion ordering.  A copied public-shaped chemistry object is
not authenticated, which demonstrates the runtime handoff boundary that later
P2-E migration must consume.

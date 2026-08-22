# P1-G5 — Adversarial Corpus Freeze

`p1-adversarial-corpus.ts` is the single P1 adversarial corpus authority. It references G1–G4 data, excludes two near-duplicate G1 cases retained more precisely in G2, normalizes difficulty, records deterministic partitions, and publishes development and sealed-holdout views.

P1-H may execute and tune against `p1DevelopmentCorpus` only. It must not inspect sealed-holdout case outcomes. The benchmark runner refuses a holdout entry; sealed holdout opens at P1-K only. Any post-opening modification requires a corpus version increment and a newly sealed split. Hidden holdout wording must never become parser phrase logic.

Scoring is per-dimension with binary exact/invariant checks and a case-level critical-error gate. Critical errors include cross-domain identity substitution, direction conflation, claim loss/rewriting, omitted required clarification, valid-to-invalid classification, dropped explicit acts, and invented meaning. The development baseline is diagnostic only; G5 makes no behavior changes.

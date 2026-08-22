/** Public metadata for P1-G8. The prompt/expectation records live only in the
 * sealed module; development runners must not import this partition. */
export const p1G8HoldoutV4Manifest = {
  version: "p1-holdout-v4",
  createdAt: "2026-08-21",
  caseCount: 60,
  partition: "sealedHoldout",
  sealed: true,
  source: "independently authored compositional generalization corpus",
  categories: {
    lexicalParaphrase: 5,
    implicitEntity: 5,
    ambiguityClarification: 5,
    mechanismDistinction: 5,
    compoundAssociation: 5,
    acts: 5,
    claims: 5,
    biochemicalDirection: 5,
    localChemistry: 5,
    crossDomain: 5,
    misconceptionValidity: 5,
    multiIntent: 5,
  },
  difficulty: { MEDIUM: 5, HARD: 40, ADVERSARIAL: 15 },
  domains: { DNA: 22, RNA: 19, CROSS_DOMAIN: 19 },
  leakageCheck: "independent exact-text, token, skeleton, rare-phrase, and semantic-template audit passed",
  manifestHash: "sha256:f599a7f38c3962e339b76cf28c7239645c55eadd5bc0fdc917974cf2a17184ee",
  normalDevelopmentRunner: "refuses sealed corpus; no import path",
} as const;

export type P1G8HoldoutV4Manifest = typeof p1G8HoldoutV4Manifest;

/**
 * P1-G6 metadata only. Prompt/expectation records live in the sealed module
 * and are intentionally not imported by development benchmark runners.
 */
export const p1G6HoldoutV2Manifest = {
  version: "p1-holdout-v2",
  createdAt: "2026-08-21",
  caseCount: 35,
  partition: "sealedHoldout",
  sealed: true,
  source: "newly authored independent corpus",
  categories: {
    lexicalParaphrase: 4,
    ambiguityClarification: 5,
    scientificClaims: 4,
    multiIntent: 5,
    entityCompleteness: 4,
    mechanismDistinction: 4,
    biochemicalDirection: 4,
    crossDomain: 5,
  },
  difficulty: { MEDIUM: 3, HARD: 25, ADVERSARIAL: 7 },
  domains: { DNA: 11, RNA: 11, CROSS_DOMAIN: 13 },
  leakageCheck: "token/skeleton/phrase-template audit passed",
  manifestHash: "sha256:951e96b861b8d2f2729776f72408620fa485591087564953fef71516a779edcd",
  normalDevelopmentRunner: "refuses sealed corpus; no import path",
} as const;

export type P1G6HoldoutV2Manifest = typeof p1G6HoldoutV2Manifest;

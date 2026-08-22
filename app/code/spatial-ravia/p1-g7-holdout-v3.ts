/** Public metadata for P1-G7. Prompt and expectation records remain in the
 * sealed module and are never imported by development evaluation runners. */
export const p1G7HoldoutV3Manifest = {
  version: "p1-holdout-v3",
  createdAt: "2026-08-21",
  caseCount: 48,
  partition: "sealedHoldout",
  sealed: true,
  source: "independently authored post-K3B generalization corpus",
  categories: {
    lexicalParaphrase: 4,
    implicitEntity: 4,
    ambiguityClarification: 4,
    mechanismDistinction: 4,
    compoundAssociation: 4,
    acts: 4,
    claims: 4,
    biochemicalDirection: 4,
    localChemistry: 4,
    crossDomain: 4,
    misconceptionValidity: 4,
    multiIntent: 4,
  },
  difficulty: { MEDIUM: 4, HARD: 32, ADVERSARIAL: 12 },
  domains: { DNA: 16, RNA: 15, CROSS_DOMAIN: 17 },
  leakageCheck: "independent token, skeleton, rare-phrase, and semantic-template audit passed",
  manifestHash: "sha256:ec1768eb41da1edf85b88988fe776e82db16286ec2fb63d7162d1b95455beab3",
  normalDevelopmentRunner: "refuses sealed corpus; no import path",
} as const;

export type P1G7HoldoutV3Manifest = typeof p1G7HoldoutV3Manifest;

import type { ChainReference } from "./biology-structure-grounding.ts";

/** Curated from 4V5C deposited entity descriptions, not coordinate ordering. */
export const translation4v5cAudit = {
  provider: "rcsb-pdb",
  structureId: "4V5C",
  format: "mmcif" as const,
  assemblyId: "1",
  largeSubunitEntityIds: Array.from({ length: 32 }, (_, index) => String(index + 26)),
  smallSubunitEntityIds: Array.from({ length: 21 }, (_, index) => String(index + 1)),
  rnaSubtypeOverrides: {
    "1": "rRNA", "22": "tRNA", "23": "tRNA", "24": "mRNA", "25": "tRNA", "36": "rRNA", "37": "rRNA",
  },
  mRNA: { namespace: "label", id: "X" } satisfies ChainReference,
  aSiteTRNA: { namespace: "label", id: "Y" } satisfies ChainReference,
  pSiteTRNA: { namespace: "label", id: "V" } satisfies ChainReference,
  eSiteTRNA: { namespace: "label", id: "W" } satisfies ChainReference,
  evidence: {
    mRNA: "Deposited entity 24 description: MRNA.",
    aSiteTRNA: "Deposited entity 25 description: A-SITE PHE-TRNA PHE.",
    pSiteTRNA: "Deposited entity 22 description: P-SITE TRNA FMET.",
    eSiteTRNA: "Deposited entity 23 description: E-SITE TRNA PHE.",
  },
  /** Deposited label sequence numbering: canonical anticodon 34–36 and resolved 3′ CCA tails. */
  tRNAResidueAnchors: {
    a: { anticodonLabelSeqIds: [34, 35, 36], acceptorLabelSeqIds: [75, 76, 77] },
    p: { anticodonLabelSeqIds: [34, 35, 36], acceptorLabelSeqIds: [75, 76, 77] },
    e: { anticodonLabelSeqIds: [34, 35, 36], acceptorLabelSeqIds: [74, 75, 76] },
  },
  fallback: "Retain the existing procedural translation scene if coordinates or assembly resolution fail.",
} as const;

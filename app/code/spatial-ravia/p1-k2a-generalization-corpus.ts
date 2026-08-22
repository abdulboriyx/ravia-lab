/** P1-K2A: new paraphrased development-v2 generalization fixtures. */
export const p1K2aGeneralizationCorpus = [
  { id: "k2a-direction-001", prompt: "RNA is nibbled starting at the five-prime terminus", direction: "fiveToThree" },
  { id: "k2a-direction-002", prompt: "shorten the RNA from its 3 prime terminus", direction: "threeToFive" },
  { id: "k2a-ambiguity-001", prompt: "what process is acting on this polymer?", clarification: true },
  { id: "k2a-ambiguity-002", prompt: "attach the RNA strand to the DNA strand", clarification: true },
  { id: "k2a-ambiguity-003", prompt: "which enzyme is opening this polymer?", clarification: true },
  { id: "k2a-entities-001", prompt: "display DNA copying together with helicase", entities: ["dna", "helicase", "replicationFork"] },
  { id: "k2a-entities-002", prompt: "show the replication fork and its helicase", entities: ["dna", "helicase", "replicationFork"] },
  { id: "k2a-multi-001", prompt: "show the A-G pair while the RNA strand folds", mechanisms: ["hydrogenBonding", "rnaSecondaryFolding"] },
  { id: "k2a-multi-002", prompt: "compare an RNA-DNA hybrid and explain its pairing", phenomena: ["rnaDnaHybridization"] },
  { id: "k2a-multi-003", prompt: "show RNA cleavage and explain the phosphodiester break", mechanisms: ["rnaCleavage", "phosphodiesterLinkage"] },
] as const;

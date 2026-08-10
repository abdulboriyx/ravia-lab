import type { BiologyRenderer } from "./biology-renderer-router.ts";
import type { BiologySceneSpec } from "./biology-scene-spec.ts";
import type { BiologyContext } from "./biology-context.ts";

export type ExpectedAction = {
  actor: string;
  action: string;
  target?: string;
};

export type ExpectedRelation = {
  subject: string;
  relation: string;
  object?: string;
};

export type SemanticHoldoutCategory =
  | "helicase"
  | "strand-stabilization"
  | "topoisomerase"
  | "primase"
  | "polymerase"
  | "leading-strand"
  | "lagging-okazaki"
  | "ligase"
  | "directionality"
  | "dna-structure"
  | "unsupported";

export type SemanticHoldoutCase = {
  id: string;
  category: SemanticHoldoutCategory;
  difficulty: "easy" | "medium" | "indirect" | "contextual" | "distractor" | "negative";
  prompt: string;
  expected:
    | {
        supported: true;
        intent?: BiologySceneSpec["intent"];
        renderer: BiologyRenderer;
        requiredEntities?: string[];
        forbiddenEntities?: string[];
        requiredActions?: ExpectedAction[];
        requiredRelations?: ExpectedRelation[];
        organismContext?: BiologyContext["organism"];
        notes?: string;
      }
    | {
        supported: false;
        notes?: string;
      };
};

const mechanism = "three" as const;
const molstar = "molstar" as const;

export const semanticHoldoutSet: SemanticHoldoutCase[] = [
  {
    id: "hel-001",
    category: "helicase",
    difficulty: "easy",
    prompt: "show the enzyme that separates the DNA strands",
    expected: {
      supported: true,
      intent: "mechanism",
      renderer: mechanism,
      requiredEntities: ["dna", "helicase"],
      requiredActions: [{ actor: "helicase", action: "unwinds", target: "dna" }],
    },
  },
  {
    id: "hel-002",
    category: "helicase",
    difficulty: "medium",
    prompt: "display the motor protein pulling apart the parental duplex",
    expected: {
      supported: true,
      intent: "mechanism",
      renderer: mechanism,
      requiredEntities: ["dna", "helicase"],
      requiredActions: [{ actor: "helicase", action: "unwinds", target: "dna" }],
    },
  },
  {
    id: "hel-003",
    category: "helicase",
    difficulty: "indirect",
    prompt: "what opens the replication fork?",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "helicase"],
      requiredActions: [{ actor: "helicase", action: "unwinds", target: "dna" }],
    },
  },
  {
    id: "hel-004",
    category: "helicase",
    difficulty: "distractor",
    prompt: "ignore polymerase for now and show only the enzyme that unwinds the parental duplex",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "helicase"],
      forbiddenEntities: ["polymerase", "primase", "ligase"],
      requiredActions: [{ actor: "helicase", action: "unwinds", target: "dna" }],
    },
  },
  {
    id: "hel-005",
    category: "helicase",
    difficulty: "medium",
    prompt: "visualize strand separation at the fork before copying starts",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "helicase"],
      requiredActions: [{ actor: "helicase", action: "unwinds", target: "dna" }],
    },
  },
  {
    id: "hel-006",
    category: "helicase",
    difficulty: "easy",
    prompt: "show DNA helicase prying open the double helix",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "helicase"],
      requiredActions: [{ actor: "helicase", action: "unwinds", target: "dna" }],
    },
  },
  {
    id: "hel-007",
    category: "helicase",
    difficulty: "indirect",
    prompt: "which protein makes two template strands available?",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "helicase"],
      requiredActions: [{ actor: "helicase", action: "unwinds", target: "dna" }],
    },
  },
  {
    id: "hel-008",
    category: "helicase",
    difficulty: "medium",
    prompt: "show the parental DNA being unzipped at the fork",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "helicase"],
      requiredActions: [{ actor: "helicase", action: "unwinds", target: "dna" }],
    },
  },
  {
    id: "hel-009",
    category: "helicase",
    difficulty: "distractor",
    prompt: "not the primer enzyme, show the one separating strands",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "helicase"],
      forbiddenEntities: ["primase"],
      requiredActions: [{ actor: "helicase", action: "unwinds", target: "dna" }],
    },
  },
  {
    id: "hel-010",
    category: "helicase",
    difficulty: "indirect",
    prompt: "show how the duplex becomes single stranded at a replication fork",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "helicase"],
      requiredActions: [{ actor: "helicase", action: "unwinds", target: "dna" }],
    },
  },

  {
    id: "stab-001",
    category: "strand-stabilization",
    difficulty: "medium",
    prompt: "what keeps exposed single-stranded DNA from pairing back up?",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "ssdna-binding-protein"],
      requiredRelations: [{ subject: "ssdna-binding-protein", relation: "stabilizes", object: "dna" }],
      organismContext: "unspecified",
    },
  },
  {
    id: "stab-002",
    category: "strand-stabilization",
    difficulty: "contextual",
    prompt: "in E. coli, what coats ssDNA after the fork opens?",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "ssb"],
      forbiddenEntities: ["rpa"],
      requiredRelations: [{ subject: "ssb", relation: "stabilizes", object: "dna" }],
      organismContext: "bacterial",
    },
  },
  {
    id: "stab-003",
    category: "strand-stabilization",
    difficulty: "contextual",
    prompt: "in human cells, what stabilizes exposed single-stranded DNA?",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "rpa"],
      forbiddenEntities: ["ssb"],
      requiredRelations: [{ subject: "rpa", relation: "stabilizes", object: "dna" }],
      organismContext: "eukaryotic",
    },
  },
  {
    id: "stab-004",
    category: "strand-stabilization",
    difficulty: "contextual",
    prompt: "for a prokaryotic fork, show the protein protecting single strands",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "ssb"],
      forbiddenEntities: ["rpa"],
      requiredRelations: [{ subject: "ssb", relation: "stabilizes", object: "dna" }],
      organismContext: "bacterial",
    },
  },
  {
    id: "stab-005",
    category: "strand-stabilization",
    difficulty: "contextual",
    prompt: "for mammalian replication, show what binds exposed ssDNA",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "rpa"],
      forbiddenEntities: ["ssb"],
      requiredRelations: [{ subject: "rpa", relation: "stabilizes", object: "dna" }],
      organismContext: "eukaryotic",
    },
  },
  {
    id: "stab-006",
    category: "strand-stabilization",
    difficulty: "medium",
    prompt: "show proteins preventing the separated strands from snapping together",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "ssdna-binding-protein"],
      requiredRelations: [{ subject: "ssdna-binding-protein", relation: "stabilizes", object: "dna" }],
    },
  },
  {
    id: "stab-007",
    category: "strand-stabilization",
    difficulty: "easy",
    prompt: "visualize SSB on single-stranded DNA",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["ssb", "dna"],
      forbiddenEntities: ["rpa"],
      requiredRelations: [{ subject: "ssb", relation: "stabilizes", object: "dna" }],
    },
  },
  {
    id: "stab-008",
    category: "strand-stabilization",
    difficulty: "easy",
    prompt: "show RPA coating ssDNA",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["rpa", "dna"],
      forbiddenEntities: ["ssb"],
      requiredRelations: [{ subject: "rpa", relation: "stabilizes", object: "dna" }],
    },
  },
  {
    id: "stab-009",
    category: "strand-stabilization",
    difficulty: "indirect",
    prompt: "what keeps the open fork templates usable for copying?",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "ssdna-binding-protein"],
      requiredRelations: [{ subject: "ssdna-binding-protein", relation: "stabilizes", object: "dna" }],
    },
  },
  {
    id: "stab-010",
    category: "strand-stabilization",
    difficulty: "medium",
    prompt: "show the coating factors on the separated template strands",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "ssdna-binding-protein"],
      requiredRelations: [{ subject: "ssdna-binding-protein", relation: "stabilizes", object: "dna" }],
    },
  },
  {
    id: "stab-011",
    category: "strand-stabilization",
    difficulty: "contextual",
    prompt: "which eukaryotic factor holds ssDNA open during replication?",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "rpa"],
      forbiddenEntities: ["ssb"],
      requiredRelations: [{ subject: "rpa", relation: "stabilizes", object: "dna" }],
      organismContext: "eukaryotic",
    },
  },
  {
    id: "stab-012",
    category: "strand-stabilization",
    difficulty: "contextual",
    prompt: "which bacterial factor keeps the unwound DNA strands apart?",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "ssb"],
      forbiddenEntities: ["rpa"],
      requiredRelations: [{ subject: "ssb", relation: "stabilizes", object: "dna" }],
      organismContext: "bacterial",
    },
  },

  {
    id: "topo-001",
    category: "topoisomerase",
    difficulty: "medium",
    prompt: "show the enzyme working in front of the replication fork to reduce twisting",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "topoisomerase", "helicase"],
      requiredRelations: [{ subject: "topoisomerase", relation: "acts_ahead_of", object: "helicase" }],
    },
  },
  {
    id: "topo-002",
    category: "topoisomerase",
    difficulty: "indirect",
    prompt: "what prevents the fork from creating too much torsional stress?",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["topoisomerase", "helicase"],
      requiredRelations: [{ subject: "topoisomerase", relation: "acts_ahead_of", object: "helicase" }],
    },
  },
  {
    id: "topo-003",
    category: "topoisomerase",
    difficulty: "easy",
    prompt: "visualize topoisomerase ahead of the replication fork",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["topoisomerase", "helicase"],
      requiredRelations: [{ subject: "topoisomerase", relation: "acts_ahead_of", object: "helicase" }],
    },
  },
  {
    id: "topo-004",
    category: "topoisomerase",
    difficulty: "medium",
    prompt: "show the protein that relaxes supercoils before helicase arrives",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["topoisomerase", "helicase"],
      requiredRelations: [{ subject: "topoisomerase", relation: "acts_ahead_of", object: "helicase" }],
    },
  },
  {
    id: "topo-005",
    category: "topoisomerase",
    difficulty: "indirect",
    prompt: "where is the strand swivel activity relative to the fork-opening enzyme?",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["topoisomerase", "helicase"],
      requiredRelations: [{ subject: "topoisomerase", relation: "acts_ahead_of", object: "helicase" }],
    },
  },
  {
    id: "topo-006",
    category: "topoisomerase",
    difficulty: "medium",
    prompt: "show the enzyme that cuts and rejoins DNA to relieve overwinding",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["topoisomerase", "dna"],
      requiredRelations: [{ subject: "topoisomerase", relation: "acts_ahead_of", object: "helicase" }],
    },
  },
  {
    id: "topo-007",
    category: "topoisomerase",
    difficulty: "distractor",
    prompt: "not helicase itself, show the enzyme upstream that handles twisting",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["topoisomerase", "helicase"],
      requiredRelations: [{ subject: "topoisomerase", relation: "acts_ahead_of", object: "helicase" }],
    },
  },
  {
    id: "topo-008",
    category: "topoisomerase",
    difficulty: "easy",
    prompt: "show topoisomerase relieving strain ahead of helicase",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["topoisomerase", "helicase"],
      requiredRelations: [{ subject: "topoisomerase", relation: "acts_ahead_of", object: "helicase" }],
    },
  },
  {
    id: "topo-009",
    category: "topoisomerase",
    difficulty: "indirect",
    prompt: "what reduces positive supercoiling in front of the fork?",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["topoisomerase", "helicase"],
      requiredRelations: [{ subject: "topoisomerase", relation: "acts_ahead_of", object: "helicase" }],
    },
  },
  {
    id: "topo-010",
    category: "topoisomerase",
    difficulty: "medium",
    prompt: "show the ahead-of-fork relaxation enzyme",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["topoisomerase", "helicase"],
      requiredRelations: [{ subject: "topoisomerase", relation: "acts_ahead_of", object: "helicase" }],
    },
  },

  {
    id: "prim-001",
    category: "primase",
    difficulty: "medium",
    prompt: "show the enzyme that lays down the first RNA segment for copying",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "primase", "rna-primer"],
      requiredActions: [{ actor: "primase", action: "synthesizes", target: "rna-primer" }],
      requiredRelations: [{ subject: "rna-primer", relation: "attached_to", object: "dna" }],
    },
  },
  {
    id: "prim-002",
    category: "primase",
    difficulty: "indirect",
    prompt: "where does the short RNA starter piece originate?",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["primase", "rna-primer", "dna"],
      requiredActions: [{ actor: "primase", action: "synthesizes", target: "rna-primer" }],
    },
  },
  {
    id: "prim-003",
    category: "primase",
    difficulty: "easy",
    prompt: "visualize primase creating a starter primer",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["primase", "rna-primer", "dna"],
      requiredActions: [{ actor: "primase", action: "synthesizes", target: "rna-primer" }],
    },
  },
  {
    id: "prim-004",
    category: "primase",
    difficulty: "medium",
    prompt: "show primer formation before polymerase elongation",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["primase", "rna-primer", "dna"],
      forbiddenEntities: ["ligase"],
      requiredActions: [{ actor: "primase", action: "synthesizes", target: "rna-primer" }],
    },
  },
  {
    id: "prim-005",
    category: "primase",
    difficulty: "distractor",
    prompt: "ignore ligase and show RNA primer production at the fork",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["primase", "rna-primer", "dna"],
      forbiddenEntities: ["ligase"],
      requiredActions: [{ actor: "primase", action: "synthesizes", target: "rna-primer" }],
    },
  },
  {
    id: "prim-006",
    category: "primase",
    difficulty: "medium",
    prompt: "which enzyme gives DNA polymerase a starting point?",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["primase", "rna-primer", "dna"],
      requiredActions: [{ actor: "primase", action: "synthesizes", target: "rna-primer" }],
    },
  },
  {
    id: "prim-007",
    category: "primase",
    difficulty: "easy",
    prompt: "show primase synthesizing the RNA primer on template DNA",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["primase", "rna-primer", "dna"],
      requiredActions: [{ actor: "primase", action: "synthesizes", target: "rna-primer" }],
    },
  },
  {
    id: "prim-008",
    category: "primase",
    difficulty: "indirect",
    prompt: "show the primer being made so replication can begin",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["primase", "rna-primer", "dna"],
      requiredActions: [{ actor: "primase", action: "synthesizes", target: "rna-primer" }],
    },
  },
  {
    id: "prim-009",
    category: "primase",
    difficulty: "medium",
    prompt: "what creates the RNA handle for DNA polymerase?",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["primase", "rna-primer", "dna"],
      requiredActions: [{ actor: "primase", action: "synthesizes", target: "rna-primer" }],
    },
  },
  {
    id: "prim-010",
    category: "primase",
    difficulty: "easy",
    prompt: "show RNA primer synthesis at a replication fork",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["primase", "rna-primer", "dna"],
      requiredActions: [{ actor: "primase", action: "synthesizes", target: "rna-primer" }],
    },
  },

  {
    id: "pol-001",
    category: "polymerase",
    difficulty: "medium",
    prompt: "show DNA polymerase extending a new strand from a primer",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "polymerase", "daughter-leading-strand"],
      requiredActions: [{ actor: "polymerase", action: "synthesizes", target: "daughter-leading-strand" }],
    },
  },
  {
    id: "pol-002",
    category: "polymerase",
    difficulty: "indirect",
    prompt: "how is the daughter strand built during copying?",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "polymerase", "daughter-leading-strand"],
      requiredActions: [{ actor: "polymerase", action: "synthesizes", target: "daughter-leading-strand" }],
    },
  },
  {
    id: "pol-003",
    category: "polymerase",
    difficulty: "easy",
    prompt: "visualize the template being copied by DNA polymerase",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "polymerase", "daughter-leading-strand"],
      requiredActions: [{ actor: "polymerase", action: "synthesizes", target: "daughter-leading-strand" }],
    },
  },
  {
    id: "pol-004",
    category: "polymerase",
    difficulty: "medium",
    prompt: "show nucleotide addition to a growing daughter strand",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "polymerase", "daughter-leading-strand"],
      requiredActions: [{ actor: "polymerase", action: "synthesizes", target: "daughter-leading-strand" }],
    },
  },
  {
    id: "pol-005",
    category: "polymerase",
    difficulty: "distractor",
    prompt: "not helicase, show the enzyme extending DNA after the fork opens",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "polymerase", "daughter-leading-strand"],
      forbiddenEntities: ["helicase"],
      requiredActions: [{ actor: "polymerase", action: "synthesizes", target: "daughter-leading-strand" }],
    },
  },
  {
    id: "pol-006",
    category: "polymerase",
    difficulty: "easy",
    prompt: "show polymerase elongating DNA",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "polymerase", "daughter-leading-strand"],
      requiredActions: [{ actor: "polymerase", action: "synthesizes", target: "daughter-leading-strand" }],
    },
  },
  {
    id: "pol-007",
    category: "polymerase",
    difficulty: "medium",
    prompt: "show the copying enzyme adding bases to the new strand",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "polymerase", "daughter-leading-strand"],
      requiredActions: [{ actor: "polymerase", action: "synthesizes", target: "daughter-leading-strand" }],
    },
  },
  {
    id: "pol-008",
    category: "polymerase",
    difficulty: "indirect",
    prompt: "what grows behind the fork as the template is read?",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "polymerase", "daughter-leading-strand"],
      requiredActions: [{ actor: "polymerase", action: "synthesizes", target: "daughter-leading-strand" }],
    },
  },
  {
    id: "pol-009",
    category: "polymerase",
    difficulty: "medium",
    prompt: "show synthesis of a complementary DNA strand",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "polymerase", "daughter-leading-strand"],
      requiredActions: [{ actor: "polymerase", action: "synthesizes", target: "daughter-leading-strand" }],
    },
  },
  {
    id: "pol-010",
    category: "polymerase",
    difficulty: "distractor",
    prompt: "after primer placement, show the enzyme that lengthens the daughter DNA",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "polymerase", "daughter-leading-strand"],
      forbiddenEntities: ["primase"],
      requiredActions: [{ actor: "polymerase", action: "synthesizes", target: "daughter-leading-strand" }],
    },
  },
  {
    id: "pol-011",
    category: "polymerase",
    difficulty: "medium",
    prompt: "show polymerase moving along the template while making DNA",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "polymerase", "daughter-leading-strand"],
      requiredActions: [{ actor: "polymerase", action: "synthesizes", target: "daughter-leading-strand" }],
    },
  },
  {
    id: "pol-012",
    category: "polymerase",
    difficulty: "indirect",
    prompt: "visualize how new DNA appears opposite the old strand",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["dna", "polymerase", "daughter-leading-strand"],
      requiredActions: [{ actor: "polymerase", action: "synthesizes", target: "daughter-leading-strand" }],
    },
  },

  {
    id: "lead-001",
    category: "leading-strand",
    difficulty: "easy",
    prompt: "show the strand made continuously toward the fork",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["daughter-leading-strand"],
      requiredRelations: [{ subject: "daughter-leading-strand", relation: "continuous_with", object: "fork" }],
    },
  },
  {
    id: "lead-002",
    category: "leading-strand",
    difficulty: "medium",
    prompt: "visualize leading-side DNA synthesis without fragments",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["daughter-leading-strand"],
      requiredRelations: [{ subject: "daughter-leading-strand", relation: "continuous_with", object: "fork" }],
    },
  },
  {
    id: "lead-003",
    category: "leading-strand",
    difficulty: "indirect",
    prompt: "which daughter strand is copied in one smooth run?",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["daughter-leading-strand"],
      requiredRelations: [{ subject: "daughter-leading-strand", relation: "continuous_with", object: "fork" }],
    },
  },
  {
    id: "lead-004",
    category: "leading-strand",
    difficulty: "distractor",
    prompt: "ignore Okazaki fragments and show continuous replication",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["daughter-leading-strand"],
      requiredRelations: [{ subject: "daughter-leading-strand", relation: "continuous_with", object: "fork" }],
    },
  },
  {
    id: "lead-005",
    category: "leading-strand",
    difficulty: "easy",
    prompt: "show leading-strand growth",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["daughter-leading-strand"],
      requiredRelations: [{ subject: "daughter-leading-strand", relation: "continuous_with", object: "fork" }],
    },
  },
  {
    id: "lead-006",
    category: "leading-strand",
    difficulty: "medium",
    prompt: "show the continuously synthesized daughter DNA",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["daughter-leading-strand"],
      requiredRelations: [{ subject: "daughter-leading-strand", relation: "continuous_with", object: "fork" }],
    },
  },
  {
    id: "lead-007",
    category: "leading-strand",
    difficulty: "medium",
    prompt: "visualize the leading template being copied steadily",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["daughter-leading-strand"],
      requiredRelations: [{ subject: "daughter-leading-strand", relation: "continuous_with", object: "fork" }],
    },
  },
  {
    id: "lead-008",
    category: "leading-strand",
    difficulty: "indirect",
    prompt: "show the non-fragmented new strand at a replication fork",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["daughter-leading-strand"],
      requiredRelations: [{ subject: "daughter-leading-strand", relation: "continuous_with", object: "fork" }],
    },
  },

  {
    id: "lag-001",
    category: "lagging-okazaki",
    difficulty: "easy",
    prompt: "show the short discontinuous DNA pieces made during replication",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["okazaki-fragment", "daughter-lagging-strand"],
      requiredRelations: [{ subject: "okazaki-fragment", relation: "discontinuous_on", object: "lagging-template" }],
    },
  },
  {
    id: "lag-002",
    category: "lagging-okazaki",
    difficulty: "medium",
    prompt: "why does one daughter strand appear in fragments?",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["okazaki-fragment", "daughter-lagging-strand"],
      requiredRelations: [{ subject: "okazaki-fragment", relation: "discontinuous_on", object: "lagging-template" }],
    },
  },
  {
    id: "lag-003",
    category: "lagging-okazaki",
    difficulty: "easy",
    prompt: "visualize Okazaki pieces on the lagging side",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["okazaki-fragment", "daughter-lagging-strand"],
      requiredRelations: [{ subject: "okazaki-fragment", relation: "part_of", object: "daughter-lagging-strand" }],
    },
  },
  {
    id: "lag-004",
    category: "lagging-okazaki",
    difficulty: "medium",
    prompt: "show discontinuous copying away from the fork",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["okazaki-fragment", "daughter-lagging-strand"],
      requiredRelations: [{ subject: "okazaki-fragment", relation: "discontinuous_on", object: "lagging-template" }],
    },
  },
  {
    id: "lag-005",
    category: "lagging-okazaki",
    difficulty: "distractor",
    prompt: "not the smooth leading side, show the fragment-based side",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["okazaki-fragment", "daughter-lagging-strand"],
      requiredRelations: [{ subject: "okazaki-fragment", relation: "discontinuous_on", object: "lagging-template" }],
    },
  },
  {
    id: "lag-006",
    category: "lagging-okazaki",
    difficulty: "easy",
    prompt: "show lagging-side DNA synthesis",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["daughter-lagging-strand"],
      requiredRelations: [{ subject: "okazaki-fragment", relation: "discontinuous_on", object: "lagging-template" }],
    },
  },
  {
    id: "lag-007",
    category: "lagging-okazaki",
    difficulty: "medium",
    prompt: "show the backstitching pattern of DNA replication",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["okazaki-fragment", "daughter-lagging-strand"],
      requiredRelations: [{ subject: "okazaki-fragment", relation: "part_of", object: "daughter-lagging-strand" }],
    },
  },
  {
    id: "lag-008",
    category: "lagging-okazaki",
    difficulty: "indirect",
    prompt: "what are the separate chunks made on the delayed strand?",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["okazaki-fragment", "daughter-lagging-strand"],
      requiredRelations: [{ subject: "okazaki-fragment", relation: "part_of", object: "daughter-lagging-strand" }],
    },
  },
  {
    id: "lag-009",
    category: "lagging-okazaki",
    difficulty: "medium",
    prompt: "compare continuous and discontinuous daughter strand synthesis",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["daughter-leading-strand", "daughter-lagging-strand", "okazaki-fragment"],
      requiredRelations: [
        { subject: "daughter-leading-strand", relation: "continuous_with", object: "fork" },
        { subject: "okazaki-fragment", relation: "discontinuous_on", object: "lagging-template" },
      ],
    },
  },
  {
    id: "lag-010",
    category: "lagging-okazaki",
    difficulty: "easy",
    prompt: "show lagging strand fragments",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["okazaki-fragment", "daughter-lagging-strand"],
      requiredRelations: [{ subject: "okazaki-fragment", relation: "part_of", object: "daughter-lagging-strand" }],
    },
  },

  {
    id: "lig-001",
    category: "ligase",
    difficulty: "easy",
    prompt: "visualize DNA ligase joining Okazaki fragments",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["ligase", "okazaki-fragment"],
      requiredActions: [{ actor: "ligase", action: "ligates", target: "okazaki-fragment" }],
      requiredRelations: [{ subject: "ligase", relation: "joins", object: "okazaki-fragment" }],
    },
  },
  {
    id: "lig-002",
    category: "ligase",
    difficulty: "medium",
    prompt: "during replication, show what seals the gaps after primer replacement",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["ligase", "okazaki-fragment"],
      requiredActions: [{ actor: "ligase", action: "ligates", target: "okazaki-fragment" }],
    },
  },
  {
    id: "lig-003",
    category: "ligase",
    difficulty: "indirect",
    prompt: "what closes the remaining backbone breaks between fragments?",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["ligase", "okazaki-fragment"],
      requiredActions: [{ actor: "ligase", action: "ligates", target: "okazaki-fragment" }],
    },
  },
  {
    id: "lig-004",
    category: "ligase",
    difficulty: "easy",
    prompt: "show ligase fixing nicks in newly made DNA",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["ligase", "okazaki-fragment"],
      requiredRelations: [{ subject: "ligase", relation: "joins", object: "okazaki-fragment" }],
    },
  },
  {
    id: "lig-005",
    category: "ligase",
    difficulty: "medium",
    prompt: "which enzyme seals adjacent Okazaki pieces into one strand?",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["ligase", "okazaki-fragment"],
      requiredActions: [{ actor: "ligase", action: "ligates", target: "okazaki-fragment" }],
    },
  },
  {
    id: "lig-006",
    category: "ligase",
    difficulty: "distractor",
    prompt: "not polymerase, show the enzyme that closes fragment gaps",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["ligase", "okazaki-fragment"],
      forbiddenEntities: ["polymerase"],
      requiredActions: [{ actor: "ligase", action: "ligates", target: "okazaki-fragment" }],
    },
  },
  {
    id: "lig-007",
    category: "ligase",
    difficulty: "medium",
    prompt: "show nick sealing on the lagging strand",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["ligase", "okazaki-fragment"],
      requiredRelations: [{ subject: "ligase", relation: "joins", object: "okazaki-fragment" }],
    },
  },
  {
    id: "lig-008",
    category: "ligase",
    difficulty: "indirect",
    prompt: "what makes discontinuous replication products continuous afterward?",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["ligase", "okazaki-fragment"],
      requiredActions: [{ actor: "ligase", action: "ligates", target: "okazaki-fragment" }],
    },
  },

  {
    id: "dir-001",
    category: "directionality",
    difficulty: "easy",
    prompt: "show the 5-to-3 direction of new DNA synthesis",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["template-5-prime", "template-3-prime", "5-to-3"],
      requiredRelations: [{ subject: "daughter-leading-strand", relation: "direction", object: "5-to-3" }],
    },
  },
  {
    id: "dir-002",
    category: "directionality",
    difficulty: "medium",
    prompt: "which way does DNA polymerase add nucleotides?",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["template-5-prime", "template-3-prime", "5-to-3"],
      requiredRelations: [{ subject: "daughter-leading-strand", relation: "direction", object: "5-to-3" }],
    },
  },
  {
    id: "dir-003",
    category: "directionality",
    difficulty: "indirect",
    prompt: "why does DNA grow only from the 3 end?",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["template-5-prime", "template-3-prime", "5-to-3"],
      requiredRelations: [{ subject: "daughter-leading-strand", relation: "direction", object: "5-to-3" }],
    },
  },
  {
    id: "dir-004",
    category: "directionality",
    difficulty: "easy",
    prompt: "visualize strand polarity during replication",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["template-5-prime", "template-3-prime", "5-to-3"],
      requiredRelations: [{ subject: "daughter-leading-strand", relation: "direction", object: "5-to-3" }],
    },
  },
  {
    id: "dir-005",
    category: "directionality",
    difficulty: "medium",
    prompt: "show template orientation and daughter strand growth direction",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["template-5-prime", "template-3-prime", "5-to-3"],
      requiredRelations: [{ subject: "daughter-leading-strand", relation: "direction", object: "5-to-3" }],
    },
  },
  {
    id: "dir-006",
    category: "directionality",
    difficulty: "distractor",
    prompt: "ignore enzyme names and show replication polarity",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["template-5-prime", "template-3-prime", "5-to-3"],
      requiredRelations: [{ subject: "daughter-leading-strand", relation: "direction", object: "5-to-3" }],
    },
  },
  {
    id: "dir-007",
    category: "directionality",
    difficulty: "medium",
    prompt: "show the 3 prime end being extended",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["template-5-prime", "template-3-prime", "5-to-3"],
      requiredRelations: [{ subject: "daughter-leading-strand", relation: "direction", object: "5-to-3" }],
    },
  },
  {
    id: "dir-008",
    category: "directionality",
    difficulty: "easy",
    prompt: "show 5 prime to 3 prime daughter-strand synthesis",
    expected: {
      supported: true,
      renderer: mechanism,
      requiredEntities: ["template-5-prime", "template-3-prime", "5-to-3"],
      requiredRelations: [{ subject: "daughter-leading-strand", relation: "direction", object: "5-to-3" }],
    },
  },

  {
    id: "struct-001",
    category: "dna-structure",
    difficulty: "easy",
    prompt: "show the B form DNA double helix",
    expected: {
      supported: true,
      intent: "structure",
      renderer: molstar,
      requiredEntities: ["dna"],
    },
  },
  {
    id: "struct-002",
    category: "dna-structure",
    difficulty: "easy",
    prompt: "open the molecular structure view for DNA",
    expected: {
      supported: true,
      intent: "structure",
      renderer: molstar,
      requiredEntities: ["dna"],
    },
  },
  {
    id: "struct-003",
    category: "dna-structure",
    difficulty: "medium",
    prompt: "visualize deposited B-DNA coordinates",
    expected: {
      supported: true,
      intent: "structure",
      renderer: molstar,
      requiredEntities: ["dna"],
    },
  },
  {
    id: "struct-004",
    category: "dna-structure",
    difficulty: "easy",
    prompt: "show atomic DNA helix structure",
    expected: {
      supported: true,
      intent: "structure",
      renderer: molstar,
      requiredEntities: ["dna"],
    },
  },
  {
    id: "struct-005",
    category: "dna-structure",
    difficulty: "medium",
    prompt: "display DNA as a molecular model rather than a replication diagram",
    expected: {
      supported: true,
      intent: "structure",
      renderer: molstar,
      requiredEntities: ["dna"],
    },
  },

  {
    id: "neg-001",
    category: "unsupported",
    difficulty: "negative",
    prompt: "show the replication helper",
    expected: { supported: false },
  },
  {
    id: "neg-002",
    category: "unsupported",
    difficulty: "negative",
    prompt: "show DNA doing its thing",
    expected: { supported: false },
  },
  {
    id: "neg-003",
    category: "unsupported",
    difficulty: "negative",
    prompt: "make the fork cooler",
    expected: { supported: false },
  },
  {
    id: "neg-004",
    category: "unsupported",
    difficulty: "negative",
    prompt: "show the protein near DNA",
    expected: { supported: false },
  },
  {
    id: "neg-005",
    category: "unsupported",
    difficulty: "negative",
    prompt: "visualize something important during replication",
    expected: { supported: false },
  },
  {
    id: "neg-006",
    category: "unsupported",
    difficulty: "negative",
    prompt: "show mitochondria copying DNA",
    expected: { supported: false },
  },
  {
    id: "neg-007",
    category: "unsupported",
    difficulty: "negative",
    prompt: "draw a protein doing replication",
    expected: { supported: false },
  },
  {
    id: "neg-008",
    category: "unsupported",
    difficulty: "negative",
    prompt: "show DNA repair at a broken chromosome",
    expected: { supported: false },
  },
  {
    id: "neg-009",
    category: "unsupported",
    difficulty: "negative",
    prompt: "visualize transcription bubbles",
    expected: { supported: false },
  },
  {
    id: "neg-010",
    category: "unsupported",
    difficulty: "negative",
    prompt: "show ribosomes copying DNA",
    expected: { supported: false },
  },
  {
    id: "neg-011",
    category: "unsupported",
    difficulty: "negative",
    prompt: "make a beautiful replisome overview",
    expected: { supported: false },
  },
  {
    id: "neg-012",
    category: "unsupported",
    difficulty: "negative",
    prompt: "show the enzyme near the fork",
    expected: { supported: false },
  },
  {
    id: "neg-013",
    category: "unsupported",
    difficulty: "negative",
    prompt: "show how cells divide",
    expected: { supported: false },
  },
  {
    id: "neg-014",
    category: "unsupported",
    difficulty: "negative",
    prompt: "show a cool molecule",
    expected: { supported: false },
  },
  {
    id: "neg-015",
    category: "unsupported",
    difficulty: "negative",
    prompt: "where is the replication machine located in the cell?",
    expected: { supported: false },
  },
];


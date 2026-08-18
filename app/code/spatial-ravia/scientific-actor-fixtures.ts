import { actorId, groupId, type ScientificActorScene } from "./scientific-actor.ts";

export const dnaActorFixture: ScientificActorScene = {
  actors: [
    { actorId: actorId("dna-molecule-1"), semanticTypeId: "dna", scope: "polymer", childActorIds: [actorId("dna-template-strand-1"), actorId("dna-coding-strand-1")] },
    { actorId: actorId("dna-template-strand-1"), semanticTypeId: "strand", instanceId: "dna-template-strand-1", role: "templateStrand", parentActorId: actorId("dna-molecule-1"), scope: "strand", childActorIds: [actorId("dna-nucleotide-1")] },
    { actorId: actorId("dna-coding-strand-1"), semanticTypeId: "strand", instanceId: "dna-coding-strand-1", role: "codingStrand", parentActorId: actorId("dna-molecule-1"), scope: "strand", childActorIds: [actorId("dna-nucleotide-2")] },
    { actorId: actorId("dna-nucleotide-1"), semanticTypeId: "nucleotide", parentActorId: actorId("dna-template-strand-1"), scope: "residue", childActorIds: [actorId("dna-sugar-1"), actorId("dna-phosphate-1"), actorId("guanine-residue-1")] },
    { actorId: actorId("dna-nucleotide-2"), semanticTypeId: "nucleotide", parentActorId: actorId("dna-coding-strand-1"), scope: "residue", childActorIds: [actorId("dna-sugar-2"), actorId("dna-phosphate-2"), actorId("cytosine-residue-1")] },
    { actorId: actorId("dna-sugar-1"), semanticTypeId: "deoxyribose", parentActorId: actorId("dna-nucleotide-1"), scope: "chemicalComponent" },
    { actorId: actorId("dna-phosphate-1"), semanticTypeId: "phosphate", parentActorId: actorId("dna-nucleotide-1"), scope: "chemicalComponent" },
    { actorId: actorId("guanine-residue-1"), semanticTypeId: "guanine", parentActorId: actorId("dna-nucleotide-1"), scope: "chemicalComponent" },
    { actorId: actorId("dna-sugar-2"), semanticTypeId: "deoxyribose", parentActorId: actorId("dna-nucleotide-2"), scope: "chemicalComponent" },
    { actorId: actorId("dna-phosphate-2"), semanticTypeId: "phosphate", parentActorId: actorId("dna-nucleotide-2"), scope: "chemicalComponent" },
    { actorId: actorId("cytosine-residue-1"), semanticTypeId: "cytosine", parentActorId: actorId("dna-nucleotide-2"), scope: "chemicalComponent" },
    { actorId: actorId("rna-polymerase-1"), semanticTypeId: "rnaPolymerase", role: "enzyme", scope: "molecularComplex", source: { sourceId: "pdb-6alh", modelId: "1" } },
    { actorId: actorId("replication-fork-1"), semanticTypeId: "replicationFork", scope: "molecularComplex" },
    { actorId: actorId("nucleosome-1"), semanticTypeId: "nucleosome", scientificSubtype: "histone-DNA packaging complex", scope: "molecularComplex", source: { sourceId: "pedagogical-nucleosome" } },
    { actorId: actorId("lesion-1"), semanticTypeId: "lesion", role: "lesion", scope: "chemicalComponent" },
  ],
  groups: [
    { groupId: groupId("group-gc-pair-1"), kind: "basePair", memberActorIds: [actorId("guanine-residue-1"), actorId("cytosine-residue-1")] },
    { groupId: groupId("group-local-reaction-1"), kind: "localReactionCenter", memberActorIds: [actorId("rna-polymerase-1"), actorId("dna-template-strand-1")] },
  ],
};

export const rnaActorFixture: ScientificActorScene = {
  actors: [
    { actorId: actorId("rna-transcript-1"), semanticTypeId: "mRNA", instanceId: "rna-transcript-1", scope: "polymer", childActorIds: [actorId("rna-exon-1"), actorId("rna-intron-1"), actorId("rna-nucleotide-1")] },
    { actorId: actorId("rna-exon-1"), semanticTypeId: "exon", role: "exon", parentActorId: actorId("rna-transcript-1"), scope: "polymer" },
    { actorId: actorId("rna-intron-1"), semanticTypeId: "intron", role: "intron", parentActorId: actorId("rna-transcript-1"), scope: "polymer" },
    { actorId: actorId("rna-nucleotide-1"), semanticTypeId: "nucleotide", parentActorId: actorId("rna-transcript-1"), scope: "residue", childActorIds: [actorId("rna-ribose-1"), actorId("rna-phosphate-1"), actorId("uracil-residue-1")] },
    { actorId: actorId("rna-ribose-1"), semanticTypeId: "ribose", parentActorId: actorId("rna-nucleotide-1"), scope: "chemicalComponent" },
    { actorId: actorId("rna-phosphate-1"), semanticTypeId: "phosphate", parentActorId: actorId("rna-nucleotide-1"), scope: "chemicalComponent" },
    { actorId: actorId("uracil-residue-1"), semanticTypeId: "uracil", parentActorId: actorId("rna-nucleotide-1"), scope: "chemicalComponent" },
    { actorId: actorId("rna-nascent-1"), semanticTypeId: "transcript", scientificSubtype: "nascent RNA", role: "nascentTranscript", scope: "polymer", source: { sourceId: "nascent-rna-model" } },
    { actorId: actorId("rna-fragment-1"), semanticTypeId: "cleavageFragment", role: "product", scope: "polymer" },
    { actorId: actorId("dna-comparison-1"), semanticTypeId: "dna", role: "comparisonRight", scope: "residue" },
  ],
  groups: [
    { groupId: groupId("group-comparison-1"), kind: "comparisonPair", memberActorIds: [actorId("rna-nucleotide-1"), actorId("dna-comparison-1")] },
    { groupId: groupId("group-rna-stem-1"), kind: "pairedStem", memberActorIds: [actorId("rna-nucleotide-1"), actorId("rna-nascent-1")] },
  ],
};

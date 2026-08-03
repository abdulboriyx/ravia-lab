export type FigureStatus = 'catalogued' | 'prototype';

export type FigureRequirement =
  | 'annotated 2D'
  | 'simplified 2D schematic'
  | 'step-by-step animation';

export interface FigureEntry {
  id: number;
  chapterFigure: string;
  pdfPage: number;
  printedPage: number;
  caption: string;
  process: string;
  visibleComponents: string[];
  teaches: string;
  requirements: FigureRequirement[];
  review: string[];
  asset: string;
  status: FigureStatus;
}

const base = `${import.meta.env.BASE_URL}figures/`;

export const figures: FigureEntry[] = [
  ['7-1', 2, 224, 'Genetic information directs the synthesis of proteins.', 'central dogma', ['DNA', 'RNA', 'protein', 'transcription', 'translation'], 'Information flows from genes through RNA into protein products.', ['annotated 2D']],
  ['7-2', 2, 224, 'A cell can express different genes at different rates.', 'gene expression level control', ['DNA', 'genes', 'RNA transcripts', 'proteins', 'gray untranscribed DNA'], 'Genes can be copied and translated at different rates.', ['annotated 2D']],
  ['7-3', 3, 225, 'The chemical structure of RNA differs slightly from that of DNA.', 'RNA chemistry', ['ribose', 'deoxyribose', 'uracil', 'thymine', 'RNA strand', 'phosphodiester bond'], 'Small chemical differences help RNA behave differently from DNA.', ['annotated 2D']],
  ['7-4', 3, 225, 'Uracil forms a base pair with adenine.', 'base pairing', ['uracil', 'adenine', 'hydrogen bonds'], 'U pairs with A in RNA much as T pairs with A in DNA.', ['annotated 2D', 'simplified 2D schematic']],
  ['7-5', 4, 226, 'RNA molecules can form intramolecular base pairs and fold into specific structures.', 'RNA folding', ['single-stranded RNA', 'G-C pairs', 'A-U pairs', 'nonconventional pairs', '3D RNA'], 'Base pairing within one RNA strand can create shape.', ['annotated 2D', 'simplified 2D schematic']],
  ['7-6', 4, 226, 'Transcription of a gene produces an RNA complementary to one strand of DNA.', 'template-directed transcription', ['coding strand', 'template strand', 'RNA', '5′', '3′'], 'RNA sequence is complementary to the DNA template and similar to coding strand.', ['annotated 2D', 'step-by-step animation']],
  ['7-7', 5, 227, 'DNA is transcribed into RNA by the enzyme RNA polymerase.', 'RNA polymerase elongation', ['RNA polymerase', 'DNA', 'template strand', 'RNA transcript', 'DNA/RNA hybrid'], 'RNA polymerase moves along DNA while extending RNA 5′ to 3′.', ['simplified 2D schematic', 'step-by-step animation']],
  ['7-8', 5, 227, 'Transcription can be visualized in the electron microscope.', 'simultaneous transcription', ['DNA spine', 'RNA polymerases', 'rRNA transcripts', 'ribosomal proteins', '1 μm scale bar'], 'Many polymerases can transcribe one DNA region at once.', ['annotated 2D']],
  ['7-9', 7, 229, 'Signals in the nucleotide sequence of a gene tell bacterial RNA polymerase where to start and stop transcription.', 'bacterial transcription initiation and termination', ['RNA polymerase', 'sigma factor', 'promoter', 'terminator', 'DNA', 'RNA'], 'Promoters and terminators define transcription boundaries.', ['annotated 2D', 'step-by-step animation']],
  ['7-10', 8, 230, 'Bacterial promoters and terminators have specific nucleotide sequences that are recognized by RNA polymerase.', 'promoter and terminator recognition', ['-35 sequence', '-10 sequence', '+1', 'terminator sequence', 'coding strand'], 'Sequence polarity orients polymerase and defines the template.', ['annotated 2D']],
  ['7-11', 8, 230, 'On an individual chromosome, some genes are transcribed using one DNA strand as a template, and others are transcribed from the other DNA strand.', 'gene orientation', ['gene a', 'gene b', 'promoters', 'DNA strands', 'RNA transcripts', '5′', '3′'], 'Promoter direction decides which strand is transcribed.', ['annotated 2D']],
  ['7-12', 9, 231, 'To begin transcription, eukaryotic RNA polymerase II requires a set of general transcription factors.', 'eukaryotic transcription initiation', ['TATA box', 'TBP', 'TFIID', 'TFIIB', 'TFIIH', 'RNA polymerase II', 'phosphorylated tail'], 'General transcription factors assemble and release RNA polymerase II.', ['annotated 2D', 'step-by-step animation']],
  ['7-13', 10, 232, 'TATA-binding protein (TBP) binds to the TATA box and bends the DNA double helix.', 'TBP-DNA binding', ['TBP domains', 'TATA box', 'bent DNA'], 'A bound protein can distort DNA to recruit transcription machinery.', ['simplified 2D schematic']],
  ['7-14', 10, 232, 'Before they can be translated, mRNA molecules made in the nucleus must be exported to the cytosol via pores in the nuclear envelope.', 'mRNA export', ['nucleus', 'nucleolus', 'cytosol', 'nuclear envelope', 'nuclear pores', 'red arrows'], 'Eukaryotic mRNA must leave the nucleus before translation.', ['annotated 2D']],
  ['7-15', 11, 233, 'Phosphorylation of the tail of RNA polymerase II allows RNA-processing proteins to assemble there.', 'co-transcriptional RNA processing', ['RNA polymerase II', 'phosphates', 'mRNA', 'capping factors', 'splicing factors', 'polyadenylation factors'], 'The polymerase tail recruits processing factors while RNA is made.', ['simplified 2D schematic', 'step-by-step animation']],
  ['7-16', 11, 233, 'Eukaryotic pre-mRNA molecules are modified by capping and polyadenylation.', 'mRNA end processing', ['5′ cap', 'poly-A tail', 'coding region', 'noncoding regions', 'methylated guanine'], 'Mature eukaryotic mRNA has protective and signaling end modifications.', ['annotated 2D']],
  ['7-17', 12, 234, 'Eukaryotic and bacterial genes are organized differently.', 'gene architecture', ['bacterial gene', 'eukaryotic gene', 'promoter', 'exons', 'introns'], 'Eukaryotic protein-coding genes often contain introns.', ['annotated 2D']],
  ['7-18', 12, 234, 'Most protein-coding human genes are broken into multiple exons and introns.', 'human gene exon-intron organization', ['beta-globin gene', 'Factor VIII gene', 'exons', 'introns'], 'Human genes can vary greatly in intron/exon scale.', ['annotated 2D']],
  ['7-19', 13, 235, 'Special nucleotide sequences in a pre-mRNA transcript signal the beginning and the end of an intron.', 'splice-site recognition', ['5′ splice junction', 'branch point A', '3′ splice junction', 'R', 'Y', 'N', 'exons', 'intron'], 'Splicing depends on conserved local sequence signals.', ['annotated 2D']],
  ['7-20', 13, 235, 'An intron in a pre-mRNA molecule forms a branched structure during RNA splicing.', 'lariat formation', ['exon 1', 'intron', 'exon 2', 'branch point A', 'lariat', '5′ and 3′ splice sites'], 'Splicing cuts and rejoins RNA through a branched lariat intermediate.', ['step-by-step animation', 'simplified 2D schematic']],
  ['7-21', 14, 236, 'Splicing is carried out by a collection of RNA-protein complexes called snRNPs.', 'spliceosome assembly', ['U1', 'U2', 'U4', 'U5', 'U6', 'pre-mRNA', 'spliceosome'], 'snRNPs assemble and rearrange to catalyze splicing.', ['simplified 2D schematic', 'step-by-step animation']],
  ['7-22', 14, 236, 'Some pre-mRNAs undergo alternative RNA splicing to produce various mRNAs and proteins from the same gene.', 'alternative splicing', ['pre-mRNA', 'exons', 'mRNA variants', 'protein variants'], 'One gene can produce multiple mRNAs and proteins.', ['annotated 2D', 'step-by-step animation']],
  ['7-23', 15, 237, 'A specialized set of RNA-binding proteins signals that a mature mRNA is ready for export to the cytosol.', 'mRNA export readiness', ['cap-binding protein', 'poly-A-binding protein', 'exon junction complexes', 'nuclear pore', 'transport receptor'], 'Processing marks distinguish export-ready mRNA.', ['annotated 2D', 'step-by-step animation']],
  ['7-24', 16, 238, 'Prokaryotes and eukaryotes handle their RNA transcripts differently.', 'RNA processing comparison', ['eukaryotic nucleus', 'pre-mRNA', 'splicing', 'cap', 'poly-A tail', 'prokaryotic mRNA', 'ribosome'], 'Eukaryotes process and export mRNA; prokaryotes can couple transcription and translation.', ['annotated 2D', 'step-by-step animation']],
  ['7-25', 17, 239, 'The nucleotide sequence of an mRNA is translated into the amino acid sequence of a protein via the genetic code.', 'genetic code', ['codon table', 'amino acids', 'AUG', 'stop codons'], 'Three-base codons map mRNA sequence to amino acids.', ['annotated 2D']],
  ['7-26', 17, 239, 'In principle, an mRNA molecule can be translated in three possible reading frames.', 'reading frame selection', ['mRNA sequence', 'three reading frames', 'amino acid sequences', '5′', '3′'], 'The start position determines triplet grouping and protein sequence.', ['annotated 2D', 'step-by-step animation']],
  ['7-27', 19, 241, 'UUU codes for phenylalanine.', 'experimental decoding of codons', ['poly-U mRNA', 'cell-free translation system', 'radioactive amino acids', 'phenylalanine polypeptide'], 'Synthetic RNA experiments helped assign codons.', ['annotated 2D']],
  ['7-28', 19, 241, 'Using synthetic RNAs of mixed, repeating ribonucleotide sequences, scientists further narrowed the coding possibilities.', 'genetic code deciphering', ['repeating RNAs', 'mixed polypeptides', 'codon ambiguity table'], 'Repeating synthetic RNAs narrowed but did not always uniquely assign codons.', ['annotated 2D']],
  ['7-29', 20, 242, 'tRNA molecules are molecular adaptors, linking amino acids to codons.', 'tRNA structure and adapter function', ['cloverleaf tRNA', 'anticodon loop', '3′ amino acid attachment site', 'Phe', 'modified bases', 'L-shaped tRNA'], 'tRNA physically links an anticodon to its amino acid.', ['annotated 2D', 'simplified 2D schematic']],
  ['7-30', 21, 243, 'The genetic code is translated by the cooperation of two adaptors: aminoacyl-tRNA synthetases and tRNAs.', 'tRNA charging and codon recognition', ['aminoacyl-tRNA synthetase', 'tryptophan', 'charged tRNA', 'anticodon', 'UGG codon', 'mRNA'], 'Synthetases charge tRNAs; anticodons pair with mRNA codons.', ['simplified 2D schematic', 'step-by-step animation']],
  ['7-31', 22, 244, 'Ribosomes are located in the cytoplasm of eukaryotic cells.', 'ribosome localization', ['ribosomes', 'cytosol', 'endoplasmic reticulum', 'red arrows', 'green arrows'], 'Ribosomes translate in the cytosol or on ER membranes.', ['annotated 2D']],
  ['7-32', 23, 245, 'The eukaryotic ribosome is a large complex of four rRNAs and more than 80 small proteins.', 'ribosome composition', ['large subunit', 'small subunit', 'rRNAs', 'ribosomal proteins', 'molecular weights'], 'Ribosomes are RNA-protein machines with two subunits.', ['simplified 2D schematic']],
  ['7-33', 23, 245, 'Each ribosome has a binding site for mRNA and three binding sites for tRNA.', 'ribosome binding sites', ['large ribosomal subunit', 'small ribosomal subunit', 'mRNA-binding site', 'E site', 'P site', 'A site', 'three tRNAs'], 'The ribosome organizes mRNA and tRNAs into A, P, and E sites.', ['simplified 2D schematic'], 'prototype'],
  ['7-34', 24, 246, 'Translation takes place in a four-step cycle.', 'translation elongation', ['charged tRNA', 'A site', 'P site', 'E site', 'mRNA', 'growing polypeptide', 'ejected tRNA', '5′', '3′'], 'Elongation cycles through codon recognition, peptide transfer, translocation, and exit.', ['step-by-step animation', 'simplified 2D schematic']],
  ['7-35', 24, 246, 'Ribosomal RNAs give the ribosome its overall shape.', 'rRNA structural core', ['23S rRNA', '5S rRNA', 'L1 protein'], 'rRNAs form the ribosome core and shape.', ['simplified 2D schematic']],
  ['7-36', 25, 247, 'Initiation of protein synthesis in eukaryotes requires translation initiation factors and a special initiator tRNA.', 'eukaryotic translation initiation', ['small ribosomal subunit', 'initiator tRNA', 'AUG', 'mRNA', 'initiation factors', 'large subunit'], 'Initiation places initiator tRNA at AUG in the P site.', ['step-by-step animation', 'simplified 2D schematic']],
  ['7-37', 26, 248, 'A single prokaryotic mRNA molecule can encode several different proteins.', 'polycistronic mRNA', ['prokaryotic mRNA', 'ribosome-binding sites', 'start codons', 'proteins', 'triphosphate 5′ end'], 'Prokaryotic ribosomes can initiate at internal ribosome-binding sites.', ['annotated 2D']],
  ['7-38', 26, 248, 'Translation halts at a stop codon.', 'translation termination', ['stop codon', 'A site', 'release factor', 'polypeptide', 'ribosomal subunits', 'mRNA'], 'Release factors, not tRNAs, recognize stop codons and end translation.', ['step-by-step animation', 'simplified 2D schematic']],
  ['7-39', 27, 249, 'Proteins are synthesized on polyribosomes.', 'polysome translation', ['mRNA', 'multiple ribosomes', 'growing polypeptides', 'electron micrograph'], 'Many ribosomes can translate the same mRNA simultaneously.', ['annotated 2D', 'step-by-step animation']],
  ['7-40', 29, 251, 'A proteasome degrades short-lived and misfolded proteins.', 'proteasome degradation', ['central cylinder', 'protease active sites', 'stoppers', 'yellow core', 'blue caps'], 'Proteases are enclosed in a regulated degradation chamber.', ['simplified 2D schematic']],
  ['7-41', 29, 251, 'Proteins marked by a polyubiquitin chain are degraded by the proteasome.', 'ubiquitin-proteasome pathway', ['target protein', 'polyubiquitin chain', 'proteasome stopper', 'central cylinder', 'peptides'], 'Ubiquitin tags route proteins into the proteasome.', ['simplified 2D schematic', 'step-by-step animation']],
  ['7-42', 30, 252, 'Protein production in a eukaryotic cell requires many steps.', 'gene expression pipeline', ['DNA', 'introns', 'exons', 'pre-mRNA', 'mRNA', 'protein', 'degradation steps'], 'Protein level depends on many production and degradation rates.', ['annotated 2D', 'step-by-step animation']],
  ['7-43', 31, 253, 'Many proteins require various modifications to become fully functional.', 'post-translational maturation', ['polypeptide', 'folded protein', 'cofactors', 'protein partners', 'covalent modifications'], 'New proteins often need folding, binding partners, and modifications.', ['simplified 2D schematic', 'step-by-step animation']],
  ['7-44', 31, 253, 'An RNA world may have existed before modern cells with DNA and proteins evolved.', 'RNA world hypothesis', ['RNA', 'DNA', 'proteins', 'early cells'], 'RNA may once have served genetic, structural, and catalytic roles.', ['annotated 2D']],
  ['7-45', 32, 254, 'An RNA molecule can in principle guide the formation of an exact copy of itself.', 'RNA templated replication', ['original RNA', 'complementary RNA', 'templates', 'copies'], 'Complementary templating can amplify an RNA sequence.', ['step-by-step animation', 'simplified 2D schematic']],
  ['7-46', 33, 255, 'A ribozyme is an RNA molecule that possesses catalytic activity.', 'ribozyme catalysis', ['ribozyme', 'substrate RNA', 'base pairing', 'cleavage site', 'products'], 'Folded RNA can catalyze RNA cleavage.', ['simplified 2D schematic', 'step-by-step animation']],
  ['7-47', 33, 255, 'Could an RNA molecule catalyze its own synthesis?', 'hypothetical self-replicating ribozyme', ['RNA template', 'complementary strand', 'active site rays'], 'A self-replicating RNA would need to catalyze both copy steps.', ['step-by-step animation', 'simplified 2D schematic']],
  ['7-48', 34, 256, 'RNA may have preceded DNA and proteins in evolution.', 'evolution of information flow', ['RNA', 'DNA', 'protein', 'genetic function', 'catalysis'], 'Modern DNA/protein roles may have evolved from earlier RNA functions.', ['annotated 2D']],
].map((entry, index) => {
  const [chapterFigure, pdfPage, printedPage, caption, process, visibleComponents, teaches, requirements, status = 'catalogued'] = entry;
  return {
    id: index + 1,
    chapterFigure,
    pdfPage,
    printedPage,
    caption,
    process,
    visibleComponents,
    teaches,
    requirements,
    review: ['Verify source figure-specific structural scale before building an interactive version.'],
    asset: `${base}figure-${String(index + 1).padStart(2, '0')}-original.png`,
    status,
  } as FigureEntry;
});

export const prototypeFigure = figures.find((figure) => figure.id === 33)!;

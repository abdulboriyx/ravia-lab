export const ribosomePrototype = {
  overview:
    'This figure shows the ribosome as a positioning machine: the small subunit holds the mRNA, while the large and small subunits together create three tRNA stations named E, P, and A.',
  before:
    'Before this view, an mRNA has been loaded onto a ribosome and charged tRNAs have been made by aminoacyl-tRNA synthetases. Each charged tRNA carries its own anticodon and an amino acid attached to its 3′ end.',
  sequence: [
    'The mRNA runs through the mRNA-binding channel of the small ribosomal subunit and is read in the 5′ to 3′ direction.',
    'A charged tRNA enters the A site when its anticodon base-pairs with the exposed mRNA codon.',
    'A tRNA in the P site holds the growing peptide before peptide-bond formation.',
    'During elongation, the peptide is transferred from the P-site tRNA to the amino acid on the A-site tRNA.',
    'After translocation, the peptide-carrying tRNA moves A to P, and the empty tRNA moves P to E.',
    'The E-site tRNA exits, leaving the A site open for the next charged tRNA.',
  ],
  moves:
    'The mRNA advances by one codon per cycle, and tRNAs move through A to P to E. The ribosomal subunits remain associated around the mRNA during elongation, while the peptide remains covalently attached to a tRNA until termination.',
  simplifies: [
    'The textbook schematic is not drawn to real molecular scale; tRNA, mRNA, rRNA, and proteins are compressed into clean shapes.',
    'The simplified 2D schematic is a teaching abstraction, not an atomic ribosome model.',
    'The original structure panel is bacterial and crystallographic, while the simple schematic is a generalized teaching diagram.',
    'All three tRNA sites are shown occupied in the structural panel, but during active elongation only two are usually occupied at a time.',
  ],
  misconceptions: [
    'A tRNA does not carry an mRNA codon; it carries its own anticodon and an attached amino acid.',
    'Stop codons are recognized by release factors, not ordinary tRNAs.',
    'The anticodon remains part of the tRNA throughout A, P, and E movement.',
    'The A, P, and E sites are not separate boxes; they are positions formed by the ribosome around mRNA and tRNA.',
  ],
  takeaway:
    'The ribosome translates by holding mRNA in register and moving tRNAs through A, P, and E sites while the peptide is transferred onto the A-site amino acid.',
  questions: [
    'Which ribosomal subunit forms the mRNA-binding site in the schematic?',
    'After peptide transfer and translocation, where does the peptide-carrying tRNA move?',
    'Why is it incorrect to say that a tRNA carries an mRNA codon?',
  ],
};

export const components = [
  { id: 'large', label: 'Large ribosomal subunit', description: 'Forms the upper part of the ribosome and contributes to the A, P, and E tRNA sites.' },
  { id: 'small', label: 'Small ribosomal subunit', description: 'Binds the mRNA and helps align codons with tRNA anticodons.' },
  { id: 'mrna', label: 'mRNA', description: 'The message strand is read 5′ to 3′ through the small subunit.' },
  { id: 'a', label: 'A site', description: 'Aminoacyl-tRNA site where the next charged tRNA enters.' },
  { id: 'p', label: 'P site', description: 'Peptidyl-tRNA site where the tRNA holding the growing peptide sits before peptide transfer.' },
  { id: 'e', label: 'E site', description: 'Exit site where deacylated tRNA leaves after translocation.' },
  { id: 'trna', label: 'tRNAs', description: 'Adaptor RNAs with anticodons; charged tRNAs also carry amino acids at their 3′ ends.' },
  { id: 'peptide', label: 'Growing peptide', description: 'The amino acid chain grows from N-terminus to C-terminus.' },
] as const;

export type ComponentId = (typeof components)[number]['id'];

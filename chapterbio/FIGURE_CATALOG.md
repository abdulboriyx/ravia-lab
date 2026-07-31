# Figure Catalog

## Proposed Architecture

- React + TypeScript + Vite single-page local app.
- `src/figureCatalog.ts` is the typed chapter-order source of truth for figure metadata, completion status, original asset path, visible components, and rendering needs.
- `src/prototypeContent.ts` holds completed figure-page instructional copy, separated from layout.
- `src/main.tsx` renders a reusable page shell, completion tracker, original figure panel, component identification controls, content sections, and the Figure 7-33 clean SVG schematic.
- SVG, HTML, and CSS are used for all explanatory visuals. Molecular coordinate viewers are intentionally excluded from this project direction.
- All content and original figure references are local under `public/figures`.

## Prototype Plan

- Build only Figure 7-33 first because it directly shows mRNA, tRNAs, ribosome, and A/P/E sites.
- Use the original figure as local private reference.
- Teach the schematic as a scale-compressed, orientation-preserving reconstruction.
- Provide clickable highlights for large subunit, small subunit, mRNA, tRNAs, A site, P site, E site, and peptide.
- Include rotate, zoom, pause, and reset controls.
- Anchor the prose to Figure 7-33, with elongation movement explained from the related Figure 7-34 mechanism where needed.

## Scientific Risks

- Hidden geometry cannot be inferred from flat textbook figures; all simplified schematics must stay explicitly 2D.
- Textbook schematic scale differs from real molecular scale.
- Figure 7-33 mixes a bacterial crystallographic structure panel with a generalized schematic.
- During elongation, only two tRNA sites are usually occupied at one time, even though Figure 7-33A shows all three tRNAs occupied.
- tRNA/codon language is easy to invert; tRNA has the anticodon, while mRNA has the codon.
- Stop codons require release factors, not ordinary tRNAs.

## Files Intended / Created

- `FIGURE_CATALOG.md`
- `REVIEW_NOTES.md`
- `public/figures/figure-01-original.png` through `public/figures/figure-48-original.png`
- `package.json`, `package-lock.json`, Vite/TypeScript config files
- `src/figureCatalog.ts`
- `src/prototypeContent.ts`
- `src/main.tsx`
- `src/styles.css`
- `src/figureCatalog.test.ts`

## Chapter Figures

Each entry lists the extracted caption/title text, process, visible labels/components, teaching purpose, rendering need, and review risk. Page numbers include PDF page and printed textbook page where visible.

### Figure 7-1
- Page: PDF 2, printed 224
- Exact caption: Genetic information directs the synthesis of proteins. The flow of genetic information from DNA to RNA (transcription) and from RNA to protein (translation) occurs in all living cells. It was Francis Crick who dubbed this flow of information "the central dogma." The segments of DNA that are transcribed into RNA are called genes.
- Process: central dogma.
- Visible components and labels: DNA, RNA, protein, transcription, translation, gene.
- Teaches: genetic information is copied into RNA and then used to synthesize protein.
- Requires: annotated 2D.
- Review: none beyond keeping central-dogma exceptions out of this introductory schematic unless separately taught.

### Figure 7-2
- Page: PDF 2, printed 224
- Exact caption: A cell can express different genes at different rates. In this and later figures, the untranscribed portions of the DNA are shown in gray.
- Process: differential gene expression.
- Visible components and labels: DNA, genes, multiple RNA transcripts, proteins, gray untranscribed DNA, 5′/3′ marks.
- Teaches: transcript and protein abundance can differ by gene.
- Requires: annotated 2D.
- Review: exact quantitative rates are schematic, not measured.

### Figure 7-3
- Page: PDF 3, printed 225
- Exact caption: The chemical structure of RNA differs slightly from that of DNA. (A) RNA contains the sugar ribose, which differs from deoxyribose, the sugar used in DNA, by the presence of an additional -OH group. (B) RNA contains the base uracil, which differs from thymine, the equivalent base in DNA, by the absence of a -CH3 group. (C) A short length of RNA. The chemical linkage between nucleotides in RNA-a phosphodiester bond-is the same as that in DNA.
- Process: RNA chemical composition.
- Visible components and labels: ribose, deoxyribose, uracil, thymine, OH, CH3, phosphate, RNA bases.
- Teaches: RNA differs chemically from DNA in sugar and one base.
- Requires: annotated 2D.
- Review: chemical structures should be verified if redrawn.

### Figure 7-4
- Page: PDF 3, printed 225
- Exact caption: Uracil forms a base pair with adenine. The hydrogen bonds that hold the base pair together are shown in red. Uracil has the same base-pairing properties as thymine. Thus U-A base pairs in RNA closely resemble T-A base pairs in DNA (see Figure 5-6A).
- Process: RNA base pairing.
- Visible components and labels: uracil, adenine, red hydrogen bonds.
- Teaches: uracil pairs with adenine.
- Requires: annotated 2D, simplified 2D schematic.
- Review: hydrogen-bond geometry must be verified before 3D.

### Figure 7-5
- Page: PDF 4, printed 226
- Exact caption: RNA molecules can form intramolecular base pairs and fold into specific structures. RNA is single-stranded, but it often contains short stretches of nucleotides that can base-pair with complementary sequences found elsewhere on the same molecule. These interactions-along with some nonconventional base-pair interactions (e.g., A-G)-allow an RNA molecule to fold into a three-dimensional structure that is determined by its sequence of nucleotides. (A) A diagram of a hypothetical, folded RNA structure showing only conventional (G-C and A-U) base-pair interactions. (B) Incorporating nonconventional base-pair interactions (green) changes the structure of the hypothetical RNA shown in (A). (C) Structure of an actual RNA molecule that is involved in RNA splicing. This RNA contains a considerable amount of double-helical structure. The sugar-phosphate backbone is blue and the bases are red; the conventional base-pair interactions are indicated by red rungs that are continuous, and nonconventional base pairs are indicated by broken red rungs. For an additional view of RNA structure, see Movie 7.1.
- Process: RNA folding.
- Visible components and labels: folded RNA, base pairs, conventional pairs, nonconventional pairs, sugar-phosphate backbone, bases.
- Teaches: single-stranded RNA can fold into sequence-specific structures.
- Requires: annotated 2D, simplified 2D schematic, source-structure reference.
- Review: identify the real RNA structure before using molecular coordinates.

### Figure 7-6
- Page: PDF 4, printed 226
- Exact caption: Transcription of a gene produces an RNA complementary to one strand of DNA. The transcribed strand of the gene, the bottom strand in this example, is called the template strand. The nontemplate strand of the gene (here, shown at the top) is sometimes called the coding strand because its sequence is equivalent to the RNA product, as shown. Which DNA strand serves as the template varies, depending on the gene, as we discuss later. By convention, an RNA molecule is always depicted with its 5′ end-the first part to be synthesized-to the left.
- Process: transcription template logic.
- Visible components and labels: coding strand, template strand, RNA, 5′, 3′, nucleotides.
- Teaches: RNA is complementary to the template strand.
- Requires: annotated 2D, step-by-step animation.
- Review: preserve strand polarity.

### Remaining Figure Audit

The remaining entries are listed in chapter order. Caption text is the extracted caption/title text from the PDF text layer; source figures are in `public/figures/figure-XX-original.png`.

| Figure | Page | Caption | Process shown | Visible components and labels | Teaches | Requires | Review |
|---|---:|---|---|---|---|---|---|
| 7-7 | PDF 5 / printed 227 | DNA is transcribed into RNA by the enzyme RNA polymerase. | RNA polymerase elongation | RNA polymerase, DNA, template strand, RNA transcript, DNA/RNA hybrid | Polymerase unwinds DNA and extends RNA 5′ to 3′. | simplified 2D schematic; step-by-step animation | Preserve template 3′ to 5′ movement and RNA 5′ to 3′ synthesis. |
| 7-8 | PDF 5 / printed 227 | Transcription can be visualized in the electron microscope. | simultaneous transcription | DNA spine, RNA polymerases, rRNA transcripts, ribosomal proteins, 1 μm scale bar | Many polymerases can transcribe adjacent genes at once. | annotated 2D | EM interpretation needs scale/context labels. |
| 7-9 | PDF 7 / printed 229 | Signals in the nucleotide sequence of a gene tell bacterial RNA polymerase where to start and stop transcription. | bacterial transcription initiation and termination | RNA polymerase, sigma factor, promoter, terminator, DNA, RNA | Promoter and terminator sequences define start/stop. | annotated 2D; step-by-step animation | Mark bacterial specificity. |
| 7-10 | PDF 8 / printed 230 | Bacterial promoters and terminators have specific nucleotide sequences that are recognized by RNA polymerase. | promoter/terminator recognition | -35 sequence, -10 sequence, +1, terminator, coding strand | Promoter polarity orients RNA polymerase. | annotated 2D | Preserve non-template/coding-strand convention. |
| 7-11 | PDF 8 / printed 230 | On an individual chromosome, some genes are transcribed using one DNA strand as a template, and others are transcribed from the other DNA strand. | gene orientation | gene a, gene b, promoters, DNA strands, RNA transcripts, 5′/3′ | Different genes can use opposite DNA strands as templates. | annotated 2D | Do not imply one chromosome-wide transcription direction. |
| 7-12 | PDF 9 / printed 231 | To begin transcription, eukaryotic RNA polymerase II requires a set of general transcription factors. | eukaryotic transcription initiation | TATA box, TBP, TFIID, TFIIB, TFIIH, RNA polymerase II, phosphorylated tail | General factors assemble and release Pol II. | annotated 2D; step-by-step animation | Actual assembly order can vary. |
| 7-13 | PDF 10 / printed 232 | TATA-binding protein (TBP) binds to the TATA box and bends the DNA double helix. | TBP-DNA binding | TBP domains, TATA box, bent DNA | TBP distorts promoter DNA to help recruit factors. | source-structure reference; simplified 2D schematic | Verify coordinates before molecular view. |
| 7-14 | PDF 10 / printed 232 | Before they can be translated, mRNA molecules made in the nucleus must be exported to the cytosol via pores in the nuclear envelope. | mRNA export | nucleus, nucleolus, cytosol, nuclear envelope, nuclear pores, red arrows | Eukaryotic mRNA leaves nucleus before translation. | annotated 2D | EM labels should not imply molecular detail. |
| 7-15 | PDF 11 / printed 233 | Phosphorylation of the tail of RNA polymerase II allows RNA-processing proteins to assemble there. | co-transcriptional RNA processing | RNA polymerase II, phosphates, mRNA, capping/splicing/polyadenylation factors | Pol II tail recruits processing factors. | simplified 2D schematic; step-by-step animation | Distinguish initiation phosphates from processing phosphates. |
| 7-16 | PDF 11 / printed 233 | Eukaryotic pre-mRNA molecules are modified by capping and polyadenylation. | mRNA end processing | 5′ cap, poly-A tail, coding region, noncoding regions, methylated guanine | Mature mRNA carries end modifications. | annotated 2D | Cap chemistry needs verification if redrawn. |
| 7-17 | PDF 12 / printed 234 | Eukaryotic and bacterial genes are organized differently. | gene architecture | bacterial gene, eukaryotic gene, promoter, exons, introns | Eukaryotic genes often have introns. | annotated 2D | Mark as common pattern, not universal. |
| 7-18 | PDF 12 / printed 234 | Most protein-coding human genes are broken into multiple exons and introns. | human exon-intron organization | beta-globin, Factor VIII, exons, introns | Gene size and intron count vary greatly. | annotated 2D | Gene lengths should be verified if quantified. |
| 7-19 | PDF 13 / printed 235 | Special nucleotide sequences in a pre-mRNA transcript signal the beginning and the end of an intron. | splice-site recognition | 5′ splice junction, branch point A, 3′ splice junction, R, Y, N, exon, intron | Conserved local signals guide splicing. | annotated 2D | Human sequences may not generalize exactly. |
| 7-20 | PDF 13 / printed 235 | An intron in a pre-mRNA molecule forms a branched structure during RNA splicing. | lariat formation | exon 1, intron, exon 2, branch point A, lariat, splice sites | Splicing uses a branched lariat intermediate. | step-by-step animation; simplified 2D schematic | Preserve 2′-OH branch linkage. |
| 7-21 | PDF 14 / printed 236 | Splicing is carried out by a collection of RNA-protein complexes called snRNPs. | spliceosome assembly | U1, U2, U4, U5, U6, pre-mRNA, spliceosome | snRNPs assemble and rearrange to splice RNA. | simplified 2D schematic; step-by-step animation | Avoid overclaiming exact spatial order from schematic. |
| 7-22 | PDF 14 / printed 236 | Some pre-mRNAs undergo alternative RNA splicing to produce various mRNAs and proteins from the same gene. | alternative splicing | pre-mRNA, exons, mRNA variants, proteins | One gene can produce multiple protein products. | annotated 2D; step-by-step animation | Caps/tails omitted in source. |
| 7-23 | PDF 15 / printed 237 | A specialized set of RNA-binding proteins signals that a mature mRNA is ready for export to the cytosol. | mRNA export readiness | cap-binding proteins, poly-A-binding protein, exon junction complexes, transport receptor, nuclear pore | Processing marks recruit export machinery. | annotated 2D; step-by-step animation | Protein identities are generalized. |
| 7-24 | PDF 16 / printed 238 | Prokaryotes and eukaryotes handle their RNA transcripts differently. | RNA processing comparison | eukaryotic nucleus, pre-mRNA, splicing, cap, poly-A tail, bacterial mRNA, ribosome | Eukaryotes process/export; prokaryotes can couple transcription and translation. | annotated 2D; step-by-step animation | Source says steps overlap in reality. |
| 7-25 | PDF 17 / printed 239 | The nucleotide sequence of an mRNA is translated into the amino acid sequence of a protein via the genetic code. | genetic code | codon table, amino acids, AUG, stop codons | Three-nucleotide codons specify amino acids or stops. | annotated 2D | Stop codons must be tied to release factors later. |
| 7-26 | PDF 17 / printed 239 | In principle, an mRNA molecule can be translated in three possible reading frames. | reading frames | mRNA sequence, three frames, amino acid sequences, 5′/3′ | Start position determines triplet grouping. | annotated 2D; step-by-step animation | Do not imply all frames are normally used. |
| 7-27 | PDF 19 / printed 241 | UUU codes for phenylalanine. | codon-decoding experiment | poly-U mRNA, cell-free system, radioactive amino acids, phenylalanine | Synthetic RNA experiments decoded codons. | annotated 2D | Historical method can be simplified. |
| 7-28 | PDF 19 / printed 241 | Using synthetic RNAs of mixed, repeating ribonucleotide sequences, scientists further narrowed the coding possibilities. | genetic-code deciphering | repeating RNAs, mixed polypeptides, codon ambiguity table | Repeating RNAs narrowed codon assignments. | annotated 2D | Explain remaining ambiguity clearly. |
| 7-29 | PDF 20 / printed 242 | tRNA molecules are molecular adaptors, linking amino acids to codons. | tRNA structure/function | cloverleaf tRNA, anticodon loop, 3′ amino acid attachment site, Phe, modified bases, L-shaped tRNA | tRNA links anticodon recognition to amino acid delivery. | annotated 2D; simplified 2D schematic; source-structure reference | tRNA has anticodon, not mRNA codon. |
| 7-30 | PDF 21 / printed 243 | The genetic code is translated by the cooperation of two adaptors: aminoacyl-tRNA synthetases and tRNAs. | tRNA charging | aminoacyl-tRNA synthetase, tryptophan, charged tRNA, anticodon, UGG codon, mRNA | Synthetases charge tRNAs; tRNAs read codons through anticodons. | simplified 2D schematic; step-by-step animation | Charging accuracy is essential. |
| 7-31 | PDF 22 / printed 244 | Ribosomes are located in the cytoplasm of eukaryotic cells. | ribosome localization | ribosomes, cytosol, ER, red arrows, green arrows | Ribosomes can be free or ER-associated. | annotated 2D | EM scale only. |
| 7-32 | PDF 23 / printed 245 | The eukaryotic ribosome is a large complex of four rRNAs and more than 80 small proteins. | ribosome composition | large subunit, small subunit, rRNAs, ribosomal proteins, molecular weights | Ribosomes are two-subunit RNA-protein machines. | simplified 2D schematic | Prokaryotic comparison should be marked. |
| 7-33 | PDF 23 / printed 245 | Each ribosome has a binding site for mRNA and three binding sites for tRNA. | ribosome binding sites | large subunit, small subunit, mRNA-binding site, E site, P site, A site, tRNAs | Ribosome positions mRNA and tRNAs into A/P/E workflow. | simplified 2D schematic; source-structure reference | Prototype is conceptual reconstruction. |
| 7-34 | PDF 24 / printed 246 | Translation takes place in a four-step cycle. | translation elongation | charged tRNA, A/P/E sites, mRNA, growing polypeptide, ejected tRNA, 5′/3′ | Translation cycles through tRNA entry, peptide transfer, translocation, exit. | step-by-step animation; simplified 2D schematic | Peptide transfers P-site tRNA to A-site amino acid. |
| 7-35 | PDF 24 / printed 246 | Ribosomal RNAs give the ribosome its overall shape. | rRNA structural core | 23S rRNA, 5S rRNA, L1 protein | rRNA forms the ribosome core. | source-structure reference; simplified 2D schematic | Verify structure source. |
| 7-36 | PDF 25 / printed 247 | Initiation of protein synthesis in eukaryotes requires translation initiation factors and a special initiator tRNA. | eukaryotic translation initiation | small subunit, initiator tRNA, AUG, initiation factors, large subunit | Initiator tRNA is placed at AUG in P site. | step-by-step animation; simplified 2D schematic | Efficient initiation also uses cap/tail factors not shown. |
| 7-37 | PDF 26 / printed 248 | A single prokaryotic mRNA molecule can encode several different proteins. | polycistronic mRNA | prokaryotic mRNA, ribosome-binding sites, start codons, triphosphate 5′ end, proteins | Prokaryotic ribosomes can initiate internally. | annotated 2D | Mark prokaryote-specific. |
| 7-38 | PDF 26 / printed 248 | Translation halts at a stop codon. | translation termination | stop codon, A site, release factor, polypeptide, ribosomal subunits, mRNA | Release factors end translation at stop codons. | step-by-step animation; simplified 2D schematic | Stop codons are not read by ordinary tRNAs. |
| 7-39 | PDF 27 / printed 249 | Proteins are synthesized on polyribosomes. | polysome translation | mRNA, multiple ribosomes, growing polypeptides, EM image | Multiple ribosomes translate one mRNA. | annotated 2D; step-by-step animation | Avoid implying ribosomes touch each other. |
| 7-40 | PDF 29 / printed 251 | A proteasome degrades short-lived and misfolded proteins. | proteasome degradation | central cylinder, protease active sites, stoppers, yellow core, blue caps | Proteases are housed in a regulated chamber. | source-structure reference; simplified 2D schematic | Verify structure and active-site labels. |
| 7-41 | PDF 29 / printed 251 | Proteins marked by a polyubiquitin chain are degraded by the proteasome. | ubiquitin-proteasome pathway | target protein, polyubiquitin chain, stopper, central cylinder, peptides | Ubiquitin marks proteins for proteasomal degradation. | simplified 2D schematic; step-by-step animation | Do not generalize all protein degradation to proteasomes. |
| 7-42 | PDF 30 / printed 252 | Protein production in a eukaryotic cell requires many steps. | gene expression pipeline | DNA, introns, exons, pre-mRNA, mRNA, protein, degradation | Protein concentration depends on production and degradation rates. | annotated 2D; step-by-step animation | Activity regulation is not fully shown. |
| 7-43 | PDF 31 / printed 253 | Many proteins require various modifications to become fully functional. | post-translational maturation | polypeptide, folded protein, cofactors, protein partners, covalent modifications | Proteins often need folding and modification. | simplified 2D schematic; step-by-step animation | Modification list is illustrative, not exhaustive. |
| 7-44 | PDF 31 / printed 253 | An RNA world may have existed before modern cells with DNA and proteins evolved. | RNA world hypothesis | RNA, DNA, proteins, early cells | RNA may have performed genetic, structural, and catalytic roles. | annotated 2D | Hypothesis, not settled history. |
| 7-45 | PDF 32 / printed 254 | An RNA molecule can in principle guide the formation of an exact copy of itself. | RNA templated replication | original RNA, complementary RNA, templates, copies | Complementary templating can amplify RNA sequence. | step-by-step animation; simplified 2D schematic | Catalysis is not shown in this figure. |
| 7-46 | PDF 33 / printed 255 | A ribozyme is an RNA molecule that possesses catalytic activity. | ribozyme catalysis | ribozyme, substrate RNA, base pairing, cleavage site, products | RNA can catalyze cleavage reactions. | simplified 2D schematic; step-by-step animation | Verify ribozyme example before coordinate rendering. |
| 7-47 | PDF 33 / printed 255 | Could an RNA molecule catalyze its own synthesis? | hypothetical self-replicating ribozyme | RNA template, complementary strand, active site rays | A self-copying RNA would need to catalyze both copy steps. | step-by-step animation; simplified 2D schematic | Hypothetical process. |
| 7-48 | PDF 34 / printed 256 | RNA may have preceded DNA and proteins in evolution. | evolution of information flow | RNA, DNA, protein, genetic function, catalysis | Modern DNA/protein roles may have evolved after RNA functions. | annotated 2D | Present as hypothesis. |

## Active Prototype Detail

The active prototype is Figure 7-33.

- Page: PDF 23, printed 245
- Exact caption: Each ribosome has a binding site for mRNA and three binding sites for tRNA. The tRNA sites are designated the A, P, and E sites (short for aminoacyl-tRNA, peptidyl-tRNA, and exit, respectively). (A) Three-dimensional structure of a bacterial ribosome, as determined by X-ray crystallography, with the small subunit in dark green and the large subunit in light green. Both the rRNAs and the ribosomal proteins are shown in green. tRNAs are shown bound in the E site (red), the P site (orange), and the A site (yellow). Although all three tRNA sites are shown occupied here, during the process of protein synthesis only two of these sites are occupied at any one time (see Figure 7-34). (B) Highly schematized representation of a ribosome (in the same orientation as A), which will be used in subsequent figures. Note that both the large and small subunits are involved in forming the A, P, and E sites, while only the small subunit forms the binding site for an mRNA. (B, adapted from M.M. Yusupov et al., Science 292:883-896, 2001, with permission from AAAS. Courtesy of Albion Baucom and Harry Noller.)
- Process: ribosome binding-site organization for translation.
- Visible components and labels: large ribosomal subunit, small ribosomal subunit, mRNA-binding site, E site, P site, A site, three tRNAs, mRNA.
- Teaches: the ribosome positions mRNA and tRNAs so codons and anticodons line up in an ordered A to P to E workflow.
- Requires: simplified 2D schematic, source-structure reference.
- Review: prototype uses a flat SVG teaching schematic only; the crystallographic source panel remains an original reference image.

## Exact Caption Appendix
Generated from the PDF text layer. Hyphenation and spacing are normalized where PDF line wrapping split words.
### Figure 7-1
- Page: PDF 2, printed 224
- Exact caption: Figure 7–1 Genetic information directs the synthesis of proteins. The flow of genetic information from DNA to RNA (transcription) and from RNA to protein (translation) occurs in all living cells. It was Francis Crick who dubbed this flow of information “the central dogma.” The segments of DNA that are transcribed into RNA are called genes.
### Figure 7-2
- Page: PDF 2, printed 224
- Exact caption: Figure 7–2 A cell can express different genes at different rates. In this and later figures, the untranscribed portions of the DNA are shown in gray.
### Figure 7-3
- Page: PDF 3, printed 225
- Exact caption: Figure 7–3 The chemical structure of RNA differs slightly from that of DNA. (A) RNA contains the sugar ribose, which differs from deoxyribose, the sugar used in DNA, by the presence of an additional –OH group. (B) RNA contains the base uracil, which differs from thymine, the equivalent base in DNA, by the absence of a –CH3 group. (C) A short length of RNA. The chemical linkage between nucleotides in RNA—a phosphodiester bond—is the same as that in DNA.
### Figure 7-4
- Page: PDF 3, printed 225
- Exact caption: Figure 7–4 Uracil forms a base pair with adenine. The hydrogen bonds that hold the base pair together are shown in red. Uracil has the same base-pairing properties as thymine. Thus U-A base pairs in RNA closely resemble T-A base pairs in DNA (see Figure 5–6A).
### Figure 7-5
- Page: PDF 4, printed 226
- Exact caption: Figure 7–5 RNA molecules can form intramolecular base pairs and fold into specific structures. RNA is single- stranded, but it often contains short stretches of nucleotides that can base-pair with complementary sequences found elsewhere on the same molecule. These interactions—along with some “nonconventional base-pair interactions (e.g., A-G)—allow an RNA molecule to fold into a three-dimensional structure that is determined by its sequence of nucleotides. (A) A diagram of a hypothetical, folded RNA structure showing only conventional (G-C and A-U) base-pair interactions. (B) Incorporating nonconventional base-pair interactions (green) changes the structure of the hypothetical RNA shown in (A). (C) Structure of an actual RNA molecule that is involved in RNA splicing. This RNA contains a considerable amount of double-helical structure. The sugar–phosphate backbone is blue and the bases are red; the conventional base-pair interactions are indicated by red “rungs” that are continuous, and nonconventional base pairs are indicated by broken red rungs. For an additional view of RNA structure, see Movie 7.1.
### Figure 7-6
- Page: PDF 4, printed 226
- Exact caption: Figure 7–6 Transcription of a gene produces an RNA complementary to one strand of DNA. The transcribed strand of the gene, the bottom strand in this example, is called the template strand. The nontemplate strand of the gene (here, shown at the top) is sometimes called the coding strand because its sequence is equivalent to the RNA product, as shown. Which DNA strand serves as the template varies, depending on the gene, as we discuss later. By convention, an RNA molecule is always depicted with its 5′ end—the first part to be synthesized— to the left.
### Figure 7-7
- Page: PDF 5, printed 227
- Exact caption: Figure 7–7 DNA is transcribed into RNA by the enzyme RNA polymerase. RNA polymerase (pale blue) moves stepwise along the DNA, unwinding the DNA helix in front of it. As it progresses, the polymerase adds ribonucleotides one by one to the RNA chain, using an exposed DNA strand as a template. The resulting RNA transcript is thus single-stranded and complementary to this template strand (see Figure 7–6). As the polymerase moves along the DNA template (in the 3′-to-5′ direction), it displaces the newly formed RNA, allowing the two strands of DNA behind the polymerase to rewind. A short region of hybrid DNA/RNA helix (approximately nine nucleotides in length) therefore forms only transiently, causing a “window” of DNA/RNA helix to move along the DNA with the polymerase (Movie 7.2).
### Figure 7-8
- Page: PDF 5, printed 227
- Exact caption: Figure 7–8 Transcription can be visualized in the electron microscope. The micrograph shows many molecules of RNA polymerase simultaneously transcribing two adjacent ribosomal genes on a single DNA molecule. Molecules of RNA polymerase are barely visible as a series of tiny dots along the spine of the DNA molecule; each polymerase has an RNA transcript (a short, fine thread) radiating from it. The RNA molecules being transcribed from the two ribosomal genes—ribosomal RNAs (rRNAs)—are not translated into protein, but are instead used directly as components of ribosomes, macromolecular machines made of RNA and protein. The large particles that can be seen at the free, 5′ end of each rRNA transcript are believed to be ribosomal proteins that have assembled on the ends of the growing transcripts. (Courtesy of Ulrich Scheer.)
### Figure 7-9
- Page: PDF 7, printed 229
- Exact caption: Figure 7–9 Signals in the nucleotide sequence of a gene tell bacterial RNA polymerase where to start and stop transcription. Bacterial RNA polymerase (light blue) contains a subunit called sigma factor (yellow) that recognizes the promoter of a gene (green). Once transcription has begun, sigma factor is released, and the polymerase moves forward and continues synthesizing the RNA. Chain elongation continues until the polymerase encounters a sequence in the gene called the terminator (red ). There the enzyme halts and releases both the DNA template and the newly made RNA transcript. The polymerase then reassociates with a free sigma factor and searches for another promoter to begin the process again.
### Figure 7-10
- Page: PDF 8, printed 230
- Exact caption: Figure 7–10 Bacterial promoters and terminators have specific nucleotide sequences that are recognized by RNA polymerase. (A) The green-shaded regions represent the nucleotide sequences that specify a promoter. The numbers above the DNA indicate the positions of nucleotides counting from the first nucleotide transcribed, which is designated +1. The polarity of the promoter orients the polymerase and determines which DNA strand is transcribed. All bacterial promoters contain DNA sequences at –10 and –35 that closely resemble those shown here. (B) The red-shaded regions represent sequences in the gene that signal the RNA polymerase to terminate transcription. Note that the regions transcribed into RNA contain the terminator but not the promoter nucleotide sequences. By convention, the sequence of a gene is that of the non-template strand, as this strand has the same sequence as the transcribed RNA (with T substituting for U).
### Figure 7-11
- Page: PDF 8, printed 230
- Exact caption: Figure 7–11 On an individual chromosome, some genes are transcribed using one DNA strand as a template, and others are transcribed from the other DNA strand. RNA polymerase always moves in the 3′-to-5′ direction and the selection of the template strand is determined by the orientation of the promoter (green arrowheads) at the beginning of each gene. Thus the genes transcribed from left to right use the bottom DNA strand as the template (see Figure 7–10); those transcribed from right to left use the top strand as the template.
### Figure 7-12
- Page: PDF 9, printed 231
- Exact caption: Figure 7–12 shows how the general transcription factors assemble at a promoter used by RNA polymerase II. The assembly process typically begins with the binding of the general transcription factor TFIID to a short
### Figure 7-13
- Page: PDF 10, printed 232
- Exact caption: Figure 7–13 TATA-binding protein (TBP) binds to the TATA box (indicated by letters) and bends the DNA double helix. The unique distortion of DNA caused by TBP, which is a subunit of TFIID (see Figure 7–12), helps attract the other general transcription factors. TBP is a single polypeptide chain that is folded into two very similar domains (blue and green). The protein sits atop the DNA double helix like a saddle on a bucking horse (Movie 7.4). (Adapted from J.L. Kim et al., Nature 365:520–527, 1993. With permission from Macmillan Publishers Ltd.)
### Figure 7-14
- Page: PDF 10, printed 232
- Exact caption: Figure 7–14 Before they can be translated, mRNA molecules made in the nucleus must be exported to the cytosol via pores in the nuclear envelope (red arrows). Shown here is a section of a liver cell nucleus. The nucleolus is where ribosomal RNAs are synthesized and combined with proteins to form ribosomes, which are then exported to the cytoplasm. (From D.W. Fawcett, A Textbook of Histology, 11th ed. Philadelphia: Saunders, 1986. With permission from Elsevier.)
### Figure 7-15
- Page: PDF 11, printed 233
- Exact caption: Figure 7–15 Phosphorylation of the tail of RNA polymerase II allows RNA-processing proteins to assemble there. Note that the phosphates shown here are in addition to the ones required for transcription initiation (see Figure 7–12). Capping, polyadenylation, and splicing are all modifications that occur during RNA processing in the nucleus.
### Figure 7-16
- Page: PDF 11, printed 233
- Exact caption: Figure 7–16 Eukaryotic pre-mRNA molecules are modified by capping and polyadenylation. (A) A eukaryotic mRNA has a cap at the 5′ end and a poly-A tail at the 3′ end. Note that not all of the RNA transcript shown codes for protein. (B) The structure of the 5′ cap. Many eukaryotic mRNA caps carry an additional modification: the 2′-hydroxyl group on the second ribose sugar in the mRNA is methylated (not shown).
### Figure 7-17
- Page: PDF 12, printed 234
- Exact caption: Figure 7–17 Eukaryotic and bacterial genes are organized differently. A bacterial gene consists of a single stretch of uninterrupted nucleotide sequence that encodes the amino acid sequence of a protein (or more than one protein). In contrast, the protein-coding sequences of most eukaryotic genes (exons) are interrupted by noncoding sequences (introns). Promoters for transcription are indicated in green.
### Figure 7-18
- Page: PDF 12, printed 234
- Exact caption: Figure 7–18 Most protein- coding human genes are broken into multiple exons and introns. (A) The β-globin gene, which encodes one of the subunits of the oxygen- carrying protein hemoglobin, contains 3 exons. (B) The Factor VIII gene, which encodes a protein (Factor VIII) that functions in the blood- clotting pathway, contains 26 exons. Mutations in this large gene are responsible for the most prevalent form of the blood disorder hemophilia.
### Figure 7-19
- Page: PDF 13, printed 235
- Exact caption: Figure 7–19 Special nucleotide sequences in a pre-mRNA transcript signal the beginning and the end of an intron. Only the nucleotide sequences shown are required to remove an intron; the other positions in an intron can be occupied by any nucleotide. The special sequences are recognized primarily by small nuclear ribonucleoproteins (snRNPs), which direct the cleavage of the RNA at the intron– exon borders and catalyze the covalent linkage of the exon sequences. Here, in addition to the standard symbols for nucleotides (A, C, G, U), R stands for either A or G; Y stands for either C or U; N stands for any nucleotide. The A shown in red forms the branch point of the lariat produced in the splicing reaction shown in Figure 7–20. The distances along the RNA between the three splicing sequences are highly variable; however, the distance between the branch point and the 5′ splice junction is typically much longer than that between the 3′ splice junction and the branch point (see Figure 7–20). The splicing sequences shown are from humans; similar sequences direct RNA splicing in other eukaryotes.
### Figure 7-20
- Page: PDF 13, printed 235
- Exact caption: Figure 7–20 An intron in a pre-mRNA molecule forms a branched structure during RNA splicing. In the first step, the branch point adenine (red A) in the intron sequence attacks the 5′ splice site and cuts the sugar–phosphate backbone of the RNA at this point (this is the same A highlighted in red in Figure 7–19). In this process, the cut 5′ end of the intron becomes covalently linked to the 2′-OH group of the ribose of the A nucleotide to form a branched structure. The free 3′-OH end of the exon sequence then reacts with the start of the next exon sequence, joining the two exons together into a continuous coding sequence and releasing the intron in the form of a lariat structure, which is eventually degraded in the nucleus.
### Figure 7-21
- Page: PDF 14, printed 236
- Exact caption: Figure 7–21 Splicing is carried out by a collection of RNA–protein complexes called snRNPs. There are five snRNPs, called U1, U2, U4, U5, and U6. As shown here, U1 and U2 bind to the 5′ splice site (U1) and the lariat branch point (U2) through complementary base-pairing. Additional snRNPs are attracted to the splice site, and interactions between their protein components drive the assembly of the complete spliceosome. Rearrangements in the base pairs that hold together the snRNPs and the RNA transcript then reorganize the spliceosome to form the active site that excises the intron, leaving the spliced mRNA behind (see also Figure 7–20).
### Figure 7-22
- Page: PDF 14, printed 236
- Exact caption: Figure 7–22 Some pre-mRNAs undergo alternative RNA splicing to produce various mRNAs and proteins from the same gene. Whereas all exons are present in a pre-mRNA, some exons can be excluded from the final mRNA molecule. In this example, three of four possible mRNAs are produced. The 5′ caps and poly-A tails on the mRNAs are not shown.
### Figure 7-23
- Page: PDF 15, printed 237
- Exact caption: Figure 7–23 A specialized set of RNA- binding proteins signals that a mature mRNA is ready for export to the cytosol. As indicated on the left, the cap and poly-A tail of a mature mRNA molecule are “marked” by proteins that recognize these modifications. In addition, a group of proteins called the exon junction complex is deposited on the pre-mRNA after each successful splice has occurred. Once the mRNA is deemed “export ready,” a nuclear transport receptor (discussed in Chapter 15) associates with the mRNA and guides it through the nuclear pore. In the cytosol, the mRNA can shed some of these proteins and bind new ones, which, along with poly-A– binding protein, act as initiation factors for protein synthesis, as we discuss later.
### Figure 7-24
- Page: PDF 16, printed 238
- Exact caption: Figure 7–24 Prokaryotes and eukaryotes handle their RNA transcripts differently. (A) In eukaryotic cells, the pre-mRNA molecule produced by transcription contains both intron and exon sequences. Its two ends are modified, and the introns are removed by RNA splicing. The resulting mRNA is then transported from the nucleus to the cytoplasm, where it is translated into protein. Although these steps are depicted as occurring in sequence, one at a time, in reality they occur simultaneously. For example, the RNA cap is usually added and splicing usually begins before transcription has been completed. Because of this overlap, transcripts of the entire gene (including all introns and exons) do not typically exist in the cell. (B) In prokaryotes, the production of mRNA molecules is simpler. The 5′ end of an mRNA molecule is produced by the initiation of transcription by RNA polymerase, and the 3′ end is produced by the termination of transcription. Because prokaryotic cells lack a nucleus, transcription and translation take place in a common compartment. Translation of a bacterial mRNA can therefore begin before its synthesis has been completed. In both eukaryotes and prokaryotes, the amount of a protein in a cell depends on the rates of each of these steps, as well as on the rates of degradation of the mRNA and protein molecules.
### Figure 7-25
- Page: PDF 17, printed 239
- Exact caption: Figure 7–25 The nucleotide sequence of an mRNA is translated into the amino acid sequence of a protein via the genetic code. All the three-nucleotide codons in mRNAs that specify a given amino acid are listed above that amino acid, which is given in both its three-letter and one-letter abbreviations (see Panel 2–5, pp. 74–75, for the full name of each amino acid and its structure). Like RNA molecules, codons are always written with the 5′-terminal nucleotide to the left. Note that most amino acids are represented by more than one codon, and there are some regularities in the set of codons that specify each amino acid. Codons for the same amino acid tend to contain the same nucleotides at the first and second positions and to vary at the third position. There are three codons that do not specify any amino acid but act as termination sites (stop codons), signaling the end of the protein-coding sequence in an mRNA. One codon—AUG—acts both as an initiation codon, signaling the start of a protein-coding message, and as the codon that specifies the amino acid methionine.
### Figure 7-26
- Page: PDF 17, printed 239
- Exact caption: Figure 7–26 In principle, an mRNA molecule can be translated in three possible reading frames. In the process of translating a nucleotide sequence (blue) into an amino acid sequence (red), the sequence of nucleotides in an mRNA molecule is read from the 5′ to the 3′ end in sequential sets of three nucleotides. In principle, therefore, the same mRNA sequence can specify three completely different amino acid sequences, depending on where translation begins— that is, on the reading frame used. In reality, however, only one of these reading frames encodes the actual message and is therefore used in translation, as we discuss later.
### Figure 7-27
- Page: PDF 19, printed 241
- Exact caption: Figure 7–27 UUU codes for phenylalanine. Synthetic mRNAs are fed into a cell-free translation system containing bacterial ribosomes, tRNAs, enzymes, and other small molecules. Radioactive amino acids are added to this mix and the resulting polypeptides analyzed. In this case, poly U is shown to encode a polypeptide containing only phenylalanine.
### Figure 7-28
- Page: PDF 19, printed 241
- Exact caption: Figure 7–28 Using synthetic RNAs of mixed, repeating ribonucleotide sequences, scientists further narrowed the coding possibilities. Although these mixed messages produced mixed polypeptides, they did not permit the unambiguous assignment of a single codon to a specific amino acid. For example, the results of the poly-UG experiment cannot distinguish whether UGU or GUG encodes cysteine. As indicated, the same type of ambiguity confounded the interpretation of all the experiments using di-, tri-, and tetranucleotides.
### Figure 7-29
- Page: PDF 20, printed 242
- Exact caption: Figure 7–29 tRNA molecules are molecular adaptors, linking amino acids to codons. In this series of diagrams, the same tRNA molecule—in this case, a tRNA specific for the amino acid phenylalanine (Phe)—is depicted in various ways. (A) The conventional “cloverleaf” structure shows the complementary base-pairing (red lines) that creates the double-helical regions of the molecule. The anticodon loop (blue) contains the sequence of three nucleotides (red letters) that base-pairs with a codon in mRNA. The amino acid matching the codon–anticodon pair is attached at the 3′ end of the tRNA. tRNAs contain some unusual bases, which are produced by chemical modification after the tRNA has been synthesized. The bases denoted Ψ (for pseudouridine) and D (for dihydrouridine) are derived from uracil. (B and C) Views of the actual L-shaped molecule, based on X-ray diffraction analysis. These two images are rotated 90º with respect to each other. (D) Schematic representation of tRNA, emphasizing the anticodon, that will be used in subsequent figures. (E) The linear nucleotide sequence of the tRNA molecule, color-coded to match A, B, and C.
### Figure 7-30
- Page: PDF 21, printed 243
- Exact caption: Figure 7–30 The genetic code is translated by the cooperation of two adaptors: aminoacyl-tRNA synthetases and tRNAs. Each synthetase couples a particular amino acid to its corresponding tRNAs, a process called charging. The anticodon on the charged tRNA molecule then forms base pairs with the appropriate codon on the mRNA. An error in either the charging step or the binding of the charged tRNA to its codon will cause the wrong amino acid to be incorporated into a protein chain. In the sequence of events shown, the amino acid tryptophan (Trp) is selected by the codon UGG on the mRNA.
### Figure 7-31
- Page: PDF 22, printed 244
- Exact caption: Figure 7–31 Ribosomes are located in the cytoplasm of eukaryotic cells. This electron micrograph shows a thin section of a small region of cytoplasm. The ribosomes appear as small gray blobs. Some are free in the cytosol (red arrows); others are attached to membranes of the endoplasmic reticulum (green arrows). (Courtesy of George Palade.)
### Figure 7-32
- Page: PDF 23, printed 245
- Exact caption: Figure 7–32 The eukaryotic ribosome is a large complex of four rRNAs and more than 80 small proteins. Prokaryotic ribosomes are very similar: both are formed from a large and small subunit, which only come together after the small subunit has bound an mRNA. Although ribosomal proteins greatly outnumber rRNAs, the RNAs account for most of the mass of the ribosome and give it its overall shape and structure.
### Figure 7-33
- Page: PDF 23, printed 245
- Exact caption: Figure 7–33 Each ribosome has a binding site for mRNA and three binding sites for tRNA. The tRNA sites are designated the A, P, and E sites (short for aminoacyl- tRNA, peptidyl-tRNA, and exit, respectively). (A) Three-dimensional structure of a bacterial ribosome, as determined by X-ray crystallography, with the small subunit in dark green and the large subunit in light green. Both the rRNAs and the ribosomal proteins are shown in green. tRNAs are shown bound in the E site (red), the P site (orange), and the A site (yellow). Although all three tRNA sites are shown occupied here, during the process of protein synthesis only two of these sites are occupied at any one time (see Figure 7–34). (B) Highly schematized representation of a ribosome (in the same orientation as A), which will be used in subsequent figures. Note that both the large and small subunits are involved in forming the A, P, and E sites, while only the small subunit forms the binding site for an mRNA. (B, adapted from M.M. Yusupov et al., Science 292:883–896, 2001, with permission from AAAS. Courtesy of Albion Baucom and Harry Noller.)
### Figure 7-34
- Page: PDF 24, printed 246
- Exact caption: Figure 7–34 Translation takes place in a four-step cycle. This cycle is repeated over and over during the synthesis of a protein. In step 1, a charged tRNA carrying the next amino acid to be added to the polypeptide chain binds to the vacant A site on the ribosome by forming base pairs with the mRNA codon that is exposed there. Because only the appropriate tRNA molecules can base-pair with each codon, this codon determines the specific amino acid added. The A and P sites are sufficiently close together that their two tRNA molecules are forced to form base pairs with codons that are contiguous, with no stray bases in between. This positioning of the tRNAs ensures that the correct reading frame will be preserved throughout the synthesis of the protein. In step 2, the carboxyl end of the polypeptide chain (amino acid 3 in step 1) is uncoupled from the tRNA at the P site and joined by a peptide bond to the free amino group of the amino acid linked to the tRNA at the A site. This reaction is catalyzed by an enzymatic site in the large subunit. In step 3, a shift of the large subunit relative to the small subunit moves the two tRNAs into the E and P sites of the large subunit. In step 4, the small subunit moves exactly three nucleotides along the mRNA molecule, bringing it back to its original position relative to the large subunit. This movement ejects the spent tRNA and resets the ribosome with an empty A site so that the next charged tRNA molecule can bind (Movie 7.8). As indicated, the mRNA is translated in the 5′-to-3′ direction, and the N-terminal end of a protein is made first, with each cycle adding one amino acid to the C-terminus of the polypeptide chain. To watch the translation cycle in atomic detail, see Movie 7.9.
### Figure 7-35
- Page: PDF 24, printed 246
- Exact caption: Figure 7–35 Ribosomal RNAs give the ribosome its overall shape. Shown here are the detailed structures of the two rRNAs that form the core of the large subunit of a bacterial ribosome—the 23S rRNA (blue) and the 5S rRNA (purple). One of the protein subunits of the ribosome (L1) is included as a reference point, as this protein forms a characteristic protrusion on the ribosome surface. Ribosomal components are commonly designated by their “S values,” which refer to their rate of sedimentation in an ultracentrifuge. (Adapted from N. Ban et al., Science 289:905–920, 2000. With permission from AAAS.)
### Figure 7-36
- Page: PDF 25, printed 247
- Exact caption: Figure 7–36 Initiation of protein synthesis in eukaryotes requires translation initiation factors and a special initiator tRNA. Although not shown here, efficient translation initiation also requires additional proteins that are bound at the 5′ cap and poly-A tail of the mRNA (see Figure 7–23). In this way, the translation apparatus can ascertain that both ends of the mRNA are intact before initiating translation. Following initiation, the protein is elongated by the reactions outlined in Figure 7–34.
### Figure 7-37
- Page: PDF 26, printed 248
- Exact caption: Figure 7–37 A single prokaryotic mRNA molecule can encode several different proteins. In prokaryotes, genes directing the different steps in a process are often organized into clusters (operons) that are transcribed together into a single mRNA. A prokaryotic mRNA does not have the same sort of 5′ cap as a eukaryotic mRNA, but instead has a triphosphate at its 5′ end. Prokaryotic ribosomes initiate translation at ribosome-binding sites (dark blue), which can be located in the interior of an mRNA molecule. This feature enables prokaryotes to synthesize different proteins from a single mRNA molecule, with each protein made by a different ribosome.
### Figure 7-38
- Page: PDF 26, printed 248
- Exact caption: Figure 7–38 Translation halts at a stop codon. In the final phase of protein synthesis, the binding of release factor to an A site bearing a stop codon terminates translation of an mRNA molecule. The completed polypeptide is released, and the ribosome dissociates into its two separate subunits. Note that only the 3ʹ end of the mRNA molecule is shown here.
### Figure 7-39
- Page: PDF 27, printed 249
- Exact caption: Figure 7–39 Proteins are synthesized on polyribosomes. (A) Schematic drawing showing how a series of ribosomes can simultaneously translate the same mRNA molecule (Movie 7.10). (B) Electron micrograph of a polyribosome in the cytosol of a eukaryotic cell. (B, courtesy of John Heuser.)
### Figure 7-40
- Page: PDF 29, printed 251
- Exact caption: Figure 7–40 A proteasome degrades short-lived and misfolded proteins. The structures shown were determined by X-ray crystallography. (A) A cut-away view of the central cylinder of the proteasome, with the active sites of the proteases indicated by red dots. (B) The structure of the entire proteasome, in which access to the central cylinder (yellow) is regulated by a stopper (blue) at each end. (B, adapted from P.C.A da Fonseca et al., Mol. Cell 46:54–66, 2012.)
### Figure 7-41
- Page: PDF 29, printed 251
- Exact caption: Figure 7–41 Proteins marked by a polyubiquitin chain are degraded by the proteasome. Proteins in the stopper of a proteasome (blue) recognize target proteins marked by a specific type of polyubiquitin chain. The stopper then unfolds the target protein and threads it into the proteasome’s central cylinder (yellow), which is lined with proteases that chop the protein to pieces.
### Figure 7-42
- Page: PDF 30, printed 252
- Exact caption: Figure 7–42 Protein production in a eukaryotic cell requires many steps. The final concentration of each protein depends on the rate of each step depicted. Even after an mRNA and its corresponding protein have been produced, their concentrations can be regulated by degradation. Although not shown here, the activity of the protein can also be regulated by other post-translational modifications or the binding of small molecules (see Figure 7–43).
### Figure 7-43
- Page: PDF 31, printed 253
- Exact caption: Figure 7–43 Many proteins require various modifications to become fully functional. To be useful to the cell, a completed polypeptide must fold correctly into its three-dimensional conformation and then bind any required cofactors (red) and protein partners—all via noncovalent bonding. Many proteins also require one or more covalent modifications to become active—or to be recruited to specific membranes or organelles (not shown). Although phosphorylation and glycosylation are the most common, more than 100 types of covalent modifications of proteins are known.
### Figure 7-44
- Page: PDF 31, printed 253
- Exact caption: Figure 7–44 An RNA world may have existed before modern cells with DNA and proteins evolved.
### Figure 7-45
- Page: PDF 32, printed 254
- Exact caption: Figure 7–45 An RNA molecule can in principle guide the formation of an exact copy of itself. In the first step, the original RNA molecule acts as a template to form an RNA molecule of complementary sequence. In the second step, this complementary RNA molecule itself acts as a template to form an RNA molecule of the original sequence. Since each template molecule can produce many copies of the complementary strand, these reactions can result in the amplification of the original sequence.
### Figure 7-46
- Page: PDF 33, printed 255
- Exact caption: Figure 7–46 A ribozyme is an RNA molecule that possesses catalytic activity. The RNA molecule shown catalyzes the cleavage of a second RNA at a specific site. Similar ribozymes are found embedded in large RNA genomes—called viroids— that infect plants, where the cleavage reaction is one step in the replication of the viroid. (Adapted from T.R. Cech and O.C. Uhlenbeck, Nature 372:39–40, 1994. With permission from Macmillan Publishers Ltd.)
### Figure 7-47
- Page: PDF 33, printed 255
- Exact caption: Figure 7–47 Could an RNA molecule catalyze its own synthesis? This hypothetical process would require that the RNA catalyze both steps shown in Figure 7–45. The red rays represent the active site of this ribozyme.
### Figure 7-48
- Page: PDF 34, printed 256
- Exact caption: Figure 7–48 RNA may have preceded DNA and proteins in evolution. According to this hypothesis, RNA molecules provided genetic, structural, and catalytic functions in the earliest cells. DNA is now the repository of genetic information, and proteins carry out almost all catalysis in cells. RNA now functions mainly as a go-between in protein synthesis, while remaining a catalyst for a few crucial reactions (including protein synthesis).

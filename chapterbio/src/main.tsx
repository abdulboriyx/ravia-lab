import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { figures, type FigureEntry } from './figureCatalog';
import './styles.css';

function FigureNavigator({
  figure,
  onSelect,
}: {
  figure: FigureEntry;
  onSelect: (figureId: number) => void;
}) {
  const previous = figures[figure.id - 2];
  const next = figures[figure.id];

  return (
    <nav className="figureNav" aria-label="Figure navigation">
      <button onClick={() => previous && onSelect(previous.id)} disabled={!previous}>
        Previous
      </button>
      <label>
        Figure
        <select value={figure.id} onChange={(event) => onSelect(Number(event.target.value))}>
          {figures.map((item) => (
            <option key={item.id} value={item.id}>
              {item.chapterFigure}
            </option>
          ))}
        </select>
      </label>
      <button onClick={() => next && onSelect(next.id)} disabled={!next}>
        Next
      </button>
    </nav>
  );
}

function Figure33Narrative() {
  return (
    <>
      <p>
        This figure shows how a ribosome organizes the physical space of translation. The green structure at left is a
        bacterial ribosome viewed from structural data, and the simplified diagram at right turns that same arrangement
        into a readable map. The ribosome is built from a <strong>large ribosomal subunit</strong> and a{' '}
        <strong>small ribosomal subunit</strong>. Together they form three neighboring tRNA positions: the{' '}
        <strong>A site</strong>, the <strong>P site</strong>, and the <strong>E site</strong>. The small subunit also
        provides the path where the <strong>mRNA</strong> binds and is read.
      </p>
      <p>
        Before the moment represented here, an mRNA has been positioned on the small subunit, and tRNAs have already
        been charged by <strong>aminoacyl-tRNA synthetases</strong>. A charged tRNA carries its own{' '}
        <strong>anticodon</strong> and an amino acid attached to its 3′ end; it does not carry an mRNA codon. The codon
        remains part of the mRNA, while the anticodon remains part of the tRNA.
      </p>
      <p>
        During elongation, a charged tRNA enters the <strong>A site</strong> when its anticodon pairs with the exposed
        mRNA codon. The <strong>P-site tRNA</strong> holds the growing peptide chain. The important chemical event is
        peptide transfer: the peptide is moved from the P-site tRNA onto the amino acid attached to the A-site tRNA. This
        matters because the protein grows by adding each new amino acid to the carboxyl end of the chain while preserving
        the mRNA reading frame.
      </p>
      <p>
        After peptide transfer, the ribosome translocates along the mRNA in the 5′ to 3′ direction. The tRNA now carrying
        the peptide shifts from <strong>A to P</strong>, and the empty tRNA shifts from <strong>P to E</strong> before it
        exits. The ribosomal subunits remain assembled around the mRNA during this cycle, the anticodon stays part of the
        tRNA, and the peptide stays covalently attached to a tRNA until termination.
      </p>
      <p>
        The figure simplifies scale and timing. The tRNAs, mRNA, rRNA, and proteins are compressed into a clean teaching
        diagram, and all three tRNA sites are shown occupied in the structural panel even though active elongation usually
        has only two occupied at once. The central idea is that the ribosome is not just a container: it is a molecular
        positioning machine that keeps mRNA codons and tRNA anticodons aligned so peptide-bond formation happens in the
        correct order.
      </p>
    </>
  );
}

function GenericNarrative({ figure }: { figure: FigureEntry }) {
  const components = figure.visibleComponents.slice(0, -1);
  const lastComponent = figure.visibleComponents.at(-1);
  const componentText = components.length > 0 && lastComponent
    ? `${components.join(', ')}, and ${lastComponent}`
    : figure.visibleComponents.join(', ');

  return (
    <>
      <p>
        This catalogued figure shows <strong>{figure.process}</strong>. Its main purpose is to make one part of the
        DNA-to-RNA-to-protein pathway easier to see: {figure.teaches}
      </p>
      <p>
        The important visible structures and labels are <strong>{componentText}</strong>. Read the original image as a
        textbook schematic rather than a literal physical snapshot. The labels identify the pieces that participate in the
        process, while the arrangement of those pieces shows how information or molecular material is passed from one
        state to the next.
      </p>
      <p>
        Before the step shown, the relevant molecules must already be in the correct cellular context: DNA, RNA, enzymes,
        ribosomes, or regulatory structures have to be present depending on the figure. During the step, the highlighted
        components bind, move, are copied, are processed, or are released according to the process named above. Afterward,
        the product or changed molecule becomes the starting point for the next figure in the chapter.
      </p>
      <p>
        The key is to follow the figure as a sequence rather than as isolated labels. Ask what exists first, which
        structure recognizes or binds another, what product or arrangement appears next, and which molecule remains
        available for the following step. That keeps the flat textbook image connected to the larger mechanism of gene
        expression.
      </p>
    </>
  );
}

function App() {
  const [selectedFigureId, setSelectedFigureId] = useState(33);
  const selectedFigure = figures.find((figure) => figure.id === selectedFigureId) ?? figures[32];

  return (
    <main className="appShell">
      <FigureNavigator figure={selectedFigure} onSelect={setSelectedFigureId} />
      <div className="figureSpread">
        <figure className="figureImage">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selectedFigure.asset} alt={`Original textbook Figure ${selectedFigure.chapterFigure}`} />
          <figcaption>Original textbook figure retained locally for private educational reference.</figcaption>
        </figure>
        <article className="figureEssay">
          <p className="figureKicker">Figure {selectedFigure.chapterFigure}</p>
          <h1>{selectedFigure.id === 33 ? 'Ribosome A, P, and E Sites' : selectedFigure.caption}</h1>
          {selectedFigure.id === 33 ? <Figure33Narrative /> : <GenericNarrative figure={selectedFigure} />}
        </article>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

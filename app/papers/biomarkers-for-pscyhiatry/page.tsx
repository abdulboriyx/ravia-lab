import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Biomarkers for pscyhiatry | Ravia Lab",
  description: "Research page for biomarkers in psychiatry."
};

export default function BiomarkersForPscyhiatryPage() {
  return (
    <main className="subPage">
      <section className="pageIntro" aria-labelledby="biomarkers-title">
        <p>Paper</p>
        <h1 id="biomarkers-title">Biomarkers for pscyhiatry</h1>
      </section>
    </main>
  );
}

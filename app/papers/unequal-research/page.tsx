import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unequal Research | Ravia",
  description: "A research note on unequal research."
};

export default function UnequalResearchPage() {
  return (
    <main className="subPage">
      <section className="pageIntro" aria-labelledby="unequal-research-title">
        <p>Research note</p>
        <h1 id="unequal-research-title">Unequal Research</h1>
      </section>
    </main>
  );
}

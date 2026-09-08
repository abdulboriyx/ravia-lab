import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personalization of BCI | Ravia Lab",
  description: "Research page for personalization of brain-computer interfaces."
};

export default function PersonalizationOfBciPage() {
  return (
    <main className="subPage">
      <section className="pageIntro" aria-labelledby="personalization-title">
        <p>Paper</p>
        <h1 id="personalization-title">Personalization of BCI</h1>
      </section>
    </main>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interactive Study | Scina",
  description: "A workspace for interactive study."
};

export default function InteractiveStudyPage() {
  return (
    <main className="subPage">
      <section className="pageIntro" aria-labelledby="interactive-study-title">
        <p>Code / Study</p>
        <h1 id="interactive-study-title">Interactive Study</h1>
      </section>
    </main>
  );
}

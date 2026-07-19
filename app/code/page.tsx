import { ArchiveList } from "@/components/ArchiveList";
import { codeEntries } from "@/data/archive";

export default function CodePage() {
  return (
    <main className="subPage">
      <section className="pageIntro" aria-labelledby="code-title">
        <p>Code / Projects</p>
        <h1 id="code-title">Code</h1>
      </section>

      <ArchiveList entries={codeEntries} />
    </main>
  );
}

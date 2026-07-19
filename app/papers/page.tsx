import { ArchiveList } from "@/components/ArchiveList";
import { papersEntries } from "@/data/archive";

export default function PapersPage() {
  return (
    <main className="subPage">
      <section className="pageIntro" aria-labelledby="papers-title">
        <p>Papers / Essays / Research notes / Arguments</p>
        <h1 id="papers-title">Papers</h1>
      </section>

      <ArchiveList entries={papersEntries} />
    </main>
  );
}

import Image from "next/image";
import { ArchiveList } from "@/components/ArchiveList";
import { archiveEntries } from "@/data/archive";

export default function Home() {
  return (
    <main>
      <section className="homeHero" aria-labelledby="hero-title">
        <div className="heroField">
          <h1 id="hero-title">
            <span>Our signs in the horizons</span>
            <span>and within themselves</span>
          </h1>
          <div className="brainStage" aria-label="Illuminated brain study">
            <Image
              className="brainImage"
              src="/brain-hero.png"
              alt="Top-view pink illuminated brain"
              width={1024}
              height={1536}
              priority
              sizes="(max-width: 700px) 82vw, (max-width: 1200px) 50vw, 520px"
            />
          </div>
        </div>
      </section>

      <section className="indexSection" aria-labelledby="index-title">
        <div className="sectionRule">
          <h2 id="index-title">Everything</h2>
          <span>Newest first</span>
        </div>
        <ArchiveList entries={archiveEntries} />
      </section>
    </main>
  );
}

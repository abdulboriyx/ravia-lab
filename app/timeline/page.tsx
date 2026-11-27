import type { Metadata } from "next";
import { eras, lessPreciselyPlaced } from "./prophets";
import styles from "./timeline.module.css";

export const metadata: Metadata = {
  title: "TimeLine | The Prophets from Muhammad ﷺ to Adam",
  description: "A reverse timeline of the prophets in the Qur’an and authenticated Sunnah, with classical Sunni commentary and notes on uncertain chronology."
};

function verseUrl(reference: string) {
  return `https://quran.com/${reference.replace(":", "/").replace("–", "-")}`;
}

function ProphetEntry({ prophet }: { prophet: (typeof lessPreciselyPlaced)[number] }) {
  const blessing = prophet.id === "muhammad" ? "Peace and blessings be upon him" : "Peace be upon him";

  return (
    <li className={styles.entry} id={prophet.id}>
      <article>
        <header className={styles.entryHeader}>
          <div>
            <h3>{prophet.name}{prophet.id === "muhammad" && " ﷺ"}</h3>
            <p className={styles.honorific}>{blessing}</p>
          </div>
          <span className={styles.arabic} lang="ar" dir="rtl">{prophet.arabic}</span>
        </header>
        <p className={styles.theme}>{prophet.title}</p>
        <p>{prophet.account}</p>
        <p className={styles.placement}><strong>Place in the timeline.</strong> {prophet.placement}</p>
        <ul className={styles.references} aria-label={`Sources for ${prophet.name}`}>
          {prophet.verses.map((verse) => <li key={verse}><a href={verseUrl(verse)}>Qur’an {verse}</a></li>)}
          {prophet.hadith?.map((number) => <li key={number}><a href={`https://sunnah.com/bukhari:${number}`}>Al-Bukhari {number}</a></li>)}
          {prophet.id === "adam" && <li><a href="https://en.tohed.com/hadith/sahih-ibn-hibban/6190/">Ibn Hibban 6190</a></li>}
          {prophet.id === "dhul-kifl" && <li><a href="https://www.alim.org/quran/tafsir/ibn-kathir/surah/21/85/">Ibn Kathir on 21:85–86</a></li>}
        </ul>
      </article>
    </li>
  );
}

export default function TimeLinePage() {
  return (
    <main className={styles.timeline}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>TimeLine</p>
        <h1>The Prophets</h1>
        <p className={styles.subtitle}>From Muhammad ﷺ back to Adam, peace be upon him.</p>
        <p>This timeline follows the Qur’an and authenticated Sunnah. It covers the 25 figures traditionally listed by name, with Dhul-Kifl’s disputed status noted. The Qur’an also tells us that some messengers were never named to us. <a href={verseUrl("4:164")}>Qur’an 4:164</a></p>
      </header>

      <div className={styles.layout}>
        <nav className={styles.contents} aria-label="Timeline contents">
          <h2>On this page</h2>
          <ul>
            {eras.map((era) => <li key={era.id}><a href={`#${era.id}`}>{era.title}</a></li>)}
            <li><a href="#uncertain-order">Uncertain chronology</a></li>
            <li><a href="#sources">Sources and method</a></li>
          </ul>
        </nav>
        <div className={styles.body}>
          {eras.map((era) => (
            <section key={era.id} id={era.id} className={styles.section} aria-labelledby={`${era.id}-title`}>
              <h2 id={`${era.id}-title`}>{era.title}</h2>
              <p className={styles.note}>{era.note}</p>
              <ol className={styles.entries}>
                {era.prophets.map((prophet) => <ProphetEntry key={prophet.id} prophet={prophet} />)}
              </ol>
            </section>
          ))}

          <section id="uncertain-order" className={styles.section} aria-labelledby="uncertain-title">
            <h2 id="uncertain-title">Uncertain chronology</h2>
            <p className={styles.note}>These entries are grouped separately because the cited texts do not give enough information to set their precise place. Their order here carries no chronological claim.</p>
            <ul className={`${styles.entries} ${styles.unplaced}`}>
              {lessPreciselyPlaced.map((prophet) => <ProphetEntry key={prophet.id} prophet={prophet} />)}
            </ul>
          </section>

          <section id="sources" className={styles.section} aria-labelledby="sources-title">
            <h2 id="sources-title">Sources and method</h2>
            <dl className={styles.method}>
              <dt>Qur’an and authenticated Sunnah</dt>
              <dd>Verse references and hadith numbers accompany each account. The Qur’an names prophets together in several places, but those lists are not date tables. Family relationships, explicit references to earlier peoples, and authenticated reports anchor the relative order. <a href={verseUrl("6:83–89")}>Qur’an 6:83–89</a> · <a href={verseUrl("4:163–165")}>Qur’an 4:163–165</a></dd>
              <dt>The Ashʿari and Maturidi reading of finality</dt>
              <dd>In the tenth principle on messengership in <cite>The Foundations of the Articles of Faith</cite>, al-Ghazali teaches that Muhammad ﷺ is the last prophet. In <cite>Taʾwilat Ahl al-Sunna</cite>, Abu Mansur al-Maturidi explains the Seal in Qur’an 33:40 as the close of messengership, with no prophet after him. These works explain the doctrine of finality. They do not supply dates for the earlier prophets. <a href="https://ghazali.org/works/gz-itiqad.htm">Al-Ghazali</a> · <a href="https://quran-tafsir.net/maturidy/sura33-aya40.html">Al-Maturidi (Arabic)</a></dd>
              <dt>Limits of the chronology</dt>
              <dd>Contemporaries appear together where the texts link their lives. The arrangement of the broader periods is editorial wherever an exact boundary is unavailable. Calendar dates for ancient figures, unverified identifications, and extra-scriptural genealogies are omitted. Years mentioned in the Qur’an, such as Nuh’s years among his people, are given as durations.</dd>
            </dl>
          </section>
        </div>
      </div>
    </main>
  );
}

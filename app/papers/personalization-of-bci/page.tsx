import type { Metadata } from "next";
import Link from "next/link";
import styles from "./paper.module.css";

export const metadata: Metadata = {
  title: "Personalized BCI research | Ravia",
  description: "Research on longitudinal EEG personalization and brain-computer interfaces for mental health."
};

export default function PersonalizationOfBciPage() {
  return (
    <main className={styles.paper}>
      <article aria-labelledby="personalization-title">
        <header className={styles.intro}>
          <Link href="/papers/">← Papers</Link>
          <h1 id="personalization-title">Personalized BCI<br />research</h1>
        </header>
        <p className={styles.date}>Two research publications on personalization, generalization, and longitudinal EEG.</p>
        <nav className={styles.contents} aria-label="Personalized BCI research">
          <h2>Research</h2>
          <ol>
            <li>
              <Link href="/papers/personalization-of-bci/research-1-bci-personalized/">
                Research #1 — BCI personalized →
              </Link>
            </li>
            <li>
              <Link href="/papers/personalization-of-bci/research-2-personalized-bci-mental-health/">
                Research #2 — Personalized BCI for mental health →
              </Link>
            </li>
          </ol>
        </nav>
        <p>Choose a publication to read the full research and its sources.</p>
        <footer className={styles.footer}><Link href="/papers/">← Back to Papers</Link></footer>
      </article>
    </main>
  );
}

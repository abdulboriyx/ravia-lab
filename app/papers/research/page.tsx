import type { Metadata } from "next";
import Link from "next/link";
import styles from "../personalization-of-bci/paper.module.css";

export const metadata: Metadata = {
  title: "Research | Ravia",
  description: "Research publications from Ravia."
};

export default function ResearchPage() {
  return (
    <main className={styles.paper}>
      <article aria-labelledby="research-title">
        <header className={styles.intro}>
          <Link href="/papers/">← Papers archive</Link>
          <h1 id="research-title">Research</h1>
        </header>
        <p className={styles.date}>Published research on personalization, generalization, and longitudinal EEG.</p>
        <nav className={styles.contents} aria-label="Research publications">
          <h2>Publications</h2>
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
      </article>
    </main>
  );
}

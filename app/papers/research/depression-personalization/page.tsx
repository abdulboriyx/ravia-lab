import type { Metadata } from "next";
import Link from "next/link";
import styles from "../../personalization-of-bci/paper.module.css";

export const metadata: Metadata = {
  title: "Depression: diagnosis and personalization | Ravia",
  description: "A research page on diagnosis and personalization in depression."
};

export default function DepressionPersonalizationPage() {
  return (
    <main className={styles.paper}>
      <article aria-labelledby="depression-personalization-title">
        <header className={styles.intro}>
          <Link href="/papers/research/">← Research</Link>
          <h1 id="depression-personalization-title">Depression: diagnosis and personalization</h1>
        </header>
        <p>This research page is being prepared.</p>
        <footer className={styles.footer}>
          <Link href="/papers/research/">← Back to Research</Link>
        </footer>
      </article>
    </main>
  );
}

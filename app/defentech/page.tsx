import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Defentech | Ravia",
  description: "Explore defense technology companies, people, and funding."
};

export default function DefentechPage() {
  return (
    <main className={styles.page}>
      <section className={styles.content} aria-labelledby="defentech-title">
        <p className={styles.label}>Ravia / Defentech</p>
        <h1 id="defentech-title">Defentech</h1>
        <p className={styles.status}>Explore the companies, people, and technology behind the systems.</p>
        <Link className={styles.companies} href="/defentech/companies">
          <span>Research directory</span>
          <strong>Companies ↗</strong>
          <p>21 companies. 108 people. Explore capabilities and the funding framework.</p>
        </Link>
        <Link className={styles.home} href="/">Back to Ravia ↗</Link>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Defentech | Ravia",
  description: "Defentech. Coming soon to Ravia."
};

export default function DefentechPage() {
  return (
    <main className={styles.page}>
      <section className={styles.content} aria-labelledby="defentech-title">
        <p className={styles.label}>Ravia / Defentech</p>
        <h1 id="defentech-title">Defentech</h1>
        <p className={styles.status}>Coming soon.</p>
        <Link className={styles.home} href="/">Back to Ravia ↗</Link>
      </section>
    </main>
  );
}

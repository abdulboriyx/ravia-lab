import type { Metadata } from "next";
import Link from "next/link";
import status from "@/public/research/depression-personalization/status.json";
import styles from "../../personalization-of-bci/paper.module.css";

export const metadata: Metadata = {
  title: "Depression: diagnosis and personalization | Ravia",
  description: "Live execution status for a privacy-conscious Reddit research dataset."
};

const sample = [
  ["General depression", "3,000"],
  ["Anhedonia / emotional numbness", "1,500"],
  ["Suicidal ideation", "1,500"],
  ["Loneliness / social disconnection", "1,500"],
  ["Depression treatment / recovery", "1,500"],
  ["Related comparison communities", "1,000"]
];

export default function DepressionPersonalizationPage() {
  const counts = status.counts;
  return (
    <main className={styles.paper}>
      <article aria-labelledby="depression-personalization-title">
        <header className={styles.intro}>
          <Link href="/papers/research/">← Research</Link>
          <h1 id="depression-personalization-title">Depression: diagnosis and personalization</h1>
        </header>
        <p className={styles.date}>Dataset execution status · updated {status.generated_at.slice(0, 10)}</p>

        <h2>Research question</h2>
        <p>Do self-described depressive experiences on Reddit form reproducible multidimensional profiles that contain more information than the broad label “depression”?</p>

        <h2>Dataset target</h2>
        <p><strong>{status.target_posts.toLocaleString()} posts</strong>, sampled across calendar quarters from 2021-01-01 through 2025-12-31.</p>
        <table>
          <thead><tr><th scope="col">Sampling family</th><th scope="col">Target</th></tr></thead>
          <tbody>{sample.map(([family, target]) => <tr key={family}><td>{family}</td><td>{target}</td></tr>)}</tbody>
        </table>

        <h2>Collection status</h2>
        <table>
          <tbody>
            <tr><th scope="row">Collected</th><td>{counts.collected}</td></tr>
            <tr><th scope="row">Screened</th><td>{counts.screened}</td></tr>
            <tr><th scope="row">Included</th><td>{counts.included}</td></tr>
            <tr><th scope="row">Excluded</th><td>{counts.excluded}</td></tr>
            <tr><th scope="row">Uncertain</th><td>{counts.uncertain}</td></tr>
          </tbody>
        </table>

        <h2>Eligibility pilot</h2>
        <p>{status.pilot.status.replaceAll("_", " ")} · {status.pilot.candidate_count} candidates · {status.pilot.reviewed_count} human-reviewed.</p>

        <h2>Dataset artifacts</h2>
        <ul>{status.artifacts.map((artifact) => <li key={artifact}>{artifact}</li>)}</ul>

        <h2>Current blocker</h2>
        <p>{status.blocker ?? "No blocker is currently recorded."}</p>
        <footer className={styles.footer}><Link href="/papers/research/">← Back to Research</Link></footer>
      </article>
    </main>
  );
}

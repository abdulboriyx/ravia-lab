import type { Metadata } from "next";
import Link from "next/link";
import styles from "../../personalization-of-bci/paper.module.css";

export const metadata: Metadata = {
  title: "Depression: diagnosis and personalization | Ravia",
  description: "A protocol for studying multidimensional self-described depressive experiences on Reddit without diagnosing individuals."
};

export default function DepressionPersonalizationPage() {
  return (
    <main className={styles.paper}>
      <article aria-labelledby="depression-personalization-title">
        <header className={styles.intro}>
          <Link href="/papers/research/">← Research</Link>
          <h1 id="depression-personalization-title">Depression: diagnosis and personalization</h1>
        </header>
        <p className={styles.date}>Research protocol · Eligibility pilot pending</p>

        <nav className={styles.contents} aria-label="Research contents">
          <h2>In this protocol</h2>
          <ol>
            <li><a href="#primary-question">Primary question</a></li>
            <li><a href="#secondary-questions">Secondary questions</a></li>
            <li><a href="#boundaries">What this project does not claim</a></li>
            <li><a href="#sample">10,000-post sample</a></li>
            <li><a href="#eligibility">Post eligibility</a></li>
            <li><a href="#protocol">Protocol status</a></li>
          </ol>
        </nav>

        <h2 id="primary-question">Primary question</h2>
        <p>Do self-described depressive experiences on Reddit form reproducible multidimensional profiles that contain more information than the broad label “depression”?</p>

        <h2 id="secondary-questions">Secondary questions</h2>
        <ul>
          <li>Which symptom combinations recur?</li>
          <li>Which life contexts co-occur with which symptom profiles?</li>
          <li>Do self-reported clinician-diagnosed users differ from self-suspected users?</li>
          <li>Are some profiles associated with more functional impairment or suicidality?</li>
        </ul>

        <h2 id="boundaries">What this project does not claim</h2>
        <ul>
          <li>It does not diagnose individuals.</li>
          <li>It does not infer that life events cause depressive experiences.</li>
          <li>It does not claim that any clusters are biological diseases.</li>
          <li>It does not claim that Reddit represents all depressed people.</li>
        </ul>

        <h2 id="sample">10,000-post sample</h2>
        <p>The sample is allocated by analytical family rather than by drawing from whichever communities happen to be most active. The complete group-level plan is frozen in <code>SAMPLING_MANIFEST.csv</code>.</p>
        <ul>
          <li>General depression: 3,000 posts</li>
          <li>Anhedonia or emotional numbness: 1,500 posts</li>
          <li>Suicidal ideation: 1,500 posts</li>
          <li>Loneliness or social disconnection: 1,500 posts</li>
          <li>Depression treatment or recovery: 1,500 posts</li>
          <li>Related comparison communities, including anxiety: 1,000 posts</li>
        </ul>
        <p>Each family will be sampled across calendar quarters from 1 January 2021 through 31 December 2025, rather than taking the newest 10,000 posts. Final records will retain their manifest group and time stratum so they can be traced to this design.</p>

        <h2 id="eligibility">Post eligibility</h2>
        <p>An eligible post is first-person, concerns its author&apos;s own experience, discusses mood, cognition, motivation, functioning, symptoms, treatment, or circumstances, and contains enough text to interpret its meaning.</p>
        <p>Memes, advertisements, moderator posts, reposted news, questions solely about someone else, bot posts, obvious fiction, empty or deleted posts, and extremely short posts without interpretable content are excluded.</p>
        <p>Every screened post receives one of three labels: <strong>include</strong>, <strong>exclude</strong>, or <strong>uncertain</strong>. Ambiguous posts are not forced into the dataset.</p>
        <p>Before full collection, approximately 100 randomly selected candidate posts must be reviewed and recorded in <code>PILOT_SCREENING_LOG.csv</code>, including the decision and rationale. The definitions may be clarified after that pilot; only then are they frozen for full collection.</p>

        <h2 id="protocol">Protocol status</h2>
        <p>The primary question, secondary questions, interpretive limits, and sample allocation are frozen in <code>RESEARCH_PROTOCOL.md</code>. Eligibility criteria remain provisional until the required pilot review is completed, and outcome definitions must be documented before collection starts.</p>
        <p>After collection begins, any major change to the primary question, sampling criteria, or outcomes will be added to the protocol’s change log with its date and rationale; it will not be silently substituted.</p>
        <footer className={styles.footer}>
          <Link href="/papers/research/">← Back to Research</Link>
        </footer>
      </article>
    </main>
  );
}

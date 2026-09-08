import type { Metadata } from "next";
import Link from "next/link";
import styles from "./research.module.css";

export const metadata: Metadata = {
  title: "Research #1 - BCI personalized | Ravia",
  description: "A source-backed protocol for testing longitudinal EEG personalization without erasing real within-person change."
};

export default function ResearchOneBciPersonalizedPage() {
  return (
    <main className={styles.paper}>
      <article aria-labelledby="research-one-title">
        <header className={styles.intro}>
          <Link href="/papers/personalization-of-bci/">← Personalized BCI</Link>
          <h1 id="research-one-title">Research #1<br />BCI personalized</h1>
        </header>
        <p className={styles.date}>Protocol · 8 September 2026 · Source-backed discovery study</p>

        <nav className={styles.contents} aria-label="Research contents">
          <h2>In this research note</h2>
          <ol>
            <li><a href="#answer">The answer we can honestly give</a></li>
            <li><a href="#dataset">1. Choose the right public dataset</a></li>
            <li><a href="#stability">2. Measure the stability problem first</a></li>
            <li><a href="#personalization">3. Test personalization methods</a></li>
            <li><a href="#integrity">4. Check personalization is not cheating</a></li>
            <li><a href="#sources">Research package and sources</a></li>
          </ol>
        </nav>

        <h2 id="answer">The answer we can honestly give</h2>
        <p><strong>Not yet empirically answered.</strong> This page defines the test that can answer it without silently inventing assumptions: personalization succeeds only when it improves a later, unseen session over a fixed population model <em>and</em> still predicts observed change from the person&apos;s initial anchor.</p>
        <p>So the final answer will be “yes, in this evaluated setting” only if it passes future-session, unseen-person, artifact/context, session-identity, and person-identity checks. A prettier random-window score is not evidence of this claim.</p>

        <h2 id="dataset">1. Choose the right public dataset</h2>
        <p><strong>Discovery dataset: OpenNeuro ds004148.</strong> The data paper documents 60 participants with three EEG sessions, including short-repeat and roughly one-month follow-up sessions. The official metadata define subject IDs and repeated Self-rating Anxiety Scale (SAS), Self-rating Depression Scale (SDS), Epworth Sleepiness Scale (ESS), Karolinska Sleepiness Scale (KSS), and positive/negative affect (PANAS) fields.</p>
        <p>This is suitable for an honest stability-and-personalization discovery analysis. It is not a clinical monitoring cohort and cannot, by itself, establish a clinical mental-health claim. The target is not selected by intuition: a frozen subject-by-session manifest must first confirm session order, usable recordings, label completeness, and label timing.</p>

        <h2 id="stability">2. Measure the stability problem first</h2>
        <p>Train only on an earlier session, then predict the next later session from the same person. Separately, hold out whole people — all of their sessions — to measure new-person generalization. Fit preprocessing, tuning, and windowing inside each training split; no overlapping windows may cross a split.</p>
        <p>Report the participant-level drop from development to future session and from familiar to unseen people. Participant/session resampling, rather than treating windows as independent patients, supplies uncertainty. This design follows the data&apos;s longitudinal structure and directly avoids the leakage warning demonstrated in translational EEG by Brookshire and colleagues.</p>

        <h2 id="personalization">3. Test personalization methods</h2>
        <p>Compare a fixed population EEG model with the same model plus: (1) a personal baseline/intercept, (2) a supervised calibration head or adapter, and (3) limited/full fine-tuning only when its label budget is available. Non-EEG historical-mean, last-observation, and context-only baselines remain in the comparison.</p>
        <p>Each method gets exactly the same prespecified earlier-session calibration labels and predicts a later untouched session. The key result is paired recovery: the adapted score minus the fixed-model score for the same person and session, alongside labels/minutes, usable coverage, abstentions, and per-person effects.</p>

        <h2 id="integrity">4. Check personalization is not cheating</h2>
        <p>Keep the first valid symptom/affect measurement as an immutable personal anchor. Evaluate both absolute target prediction and anchored within-person change. An update that makes all later predictions look normal by moving the baseline fails the question even if its distribution looks stable.</p>
        <ul>
          <li><strong>Sleep and context:</strong> compare context-only, EEG-only, and EEG+context models; do not automatically erase sleep-associated variation.</li>
          <li><strong>Artifacts:</strong> compare cleaned EEG with artifact/quality-only predictors and publish rejection/coverage data.</li>
          <li><strong>Session and person identity:</strong> use identity prediction as a drift/shortcut diagnostic, not as clinical evidence.</li>
          <li><strong>Time:</strong> store each prediction before any adaptation update; target-session data used without labels are transductive and reported separately.</li>
        </ul>

        <h2 id="sources">Research package and sources</h2>
        <p>The repository contains the full question, evaluation contract, assumption log, citations, official OpenNeuro metadata, and a local copy of the open-access data paper. Each methodological claim is marked as either sourced fact or proposed analysis. This prevents the research plan from quietly filling gaps with model-generated assumptions.</p>
        <p><a href="https://doi.org/10.1038/s41597-022-01607-9">Wang et al. (2022), Scientific Data</a>; <a href="https://doi.org/10.18112/openneuro.ds004148.v1.0.1">OpenNeuro ds004148</a>; <a href="https://doi.org/10.3389/fnins.2024.1392888">Brookshire et al. (2024)</a>.</p>
        <footer className={styles.footer}><Link href="/papers/personalization-of-bci/">← Back to Personalized BCI</Link></footer>
      </article>
    </main>
  );
}

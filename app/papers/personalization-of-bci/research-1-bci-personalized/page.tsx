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
        <p><strong>Not yet empirically answered.</strong> The primary outcome is now frozen: <strong>anchored SAS change</strong>. Personalization succeeds only when it improves a later, unseen session over a fixed population model <em>and</em> does not erase observed change from the person&apos;s initial SAS anchor.</p>
        <p>This study has two deliberately separate questions. ds004148 can test whether personalization survives session drift. With only three sessions and potentially little SAS movement, it may be underpowered to establish whether personalization preserves genuine psychiatric symptom transitions. A prettier random-window score is not evidence for either claim.</p>

        <h2 id="dataset">1. Choose the right public dataset</h2>
        <p><strong>Discovery dataset: OpenNeuro ds004148.</strong> The data paper documents 60 participants with three EEG sessions, including short-repeat and roughly one-month follow-up sessions. The official metadata define subject IDs and repeated Self-rating Anxiety Scale (SAS), Self-rating Depression Scale (SDS), Epworth Sleepiness Scale (ESS), Karolinska Sleepiness Scale (KSS), and positive/negative affect (PANAS) fields.</p>
        <p>This is suitable for an honest stability-and-personalization discovery analysis, not a clinical monitoring claim. The target is not selected by intuition: anchored SAS change is frozen before modelling; SDS, PANAS, KSS, ESS, and quality/context measures are controls or secondary descriptions.</p>

        <h2 id="stability">2. Measure the stability problem first</h2>
        <p>Train only on an earlier session, then predict the next later session from the same person. Separately, hold out whole people — all of their sessions — to measure new-person generalization. Fit preprocessing, tuning, and windowing inside each training split; no overlapping windows may cross a split.</p>
        <p>Report the participant-level drop from development to future session and from familiar to unseen people. Participant/session resampling, rather than treating windows as independent patients, supplies uncertainty. This design follows the data&apos;s longitudinal structure and directly avoids the leakage warning demonstrated in translational EEG by Brookshire and colleagues.</p>

        <h2 id="personalization">3. Test personalization methods</h2>
        <p>Start simple: historical mean/last observation, spectral EEG + linear model, covariance/Riemannian model, and a small EEG neural network. Only after those establish later-session EEG signal should a foundation model enter the benchmark. Then compare the strongest fixed model with personal baseline, calibration head/adapters, and carefully budgeted fine-tuning.</p>
        <p>Each method gets exactly the same prespecified earlier-session calibration labels and predicts a later untouched session. Success is frozen as: ≥0.10 training-SD reduction in later-session SAS MAE, a paired 95% interval excluding zero, no meaningful worsening of anchored-change error, and ≥60% of evaluable participants improved — all while surviving the controls below.</p>

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

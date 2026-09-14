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
            <li><a href="#privacy">Privacy and ethics</a></li>
            <li><a href="#diagnostic-evidence">Diagnostic evidence</a></li>
            <li><a href="#symptoms">Symptom evidence</a></li>
            <li><a href="#phenotype">Psychological phenotype</a></li>
            <li><a href="#gold-standard">Human gold standard</a></li>
            <li><a href="#automation">Automated annotation</a></li>
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

        <h2 id="privacy">Privacy and ethics</h2>
        <p>Raw Reddit text and source identifiers remain in a local-only private area. De-identified research records are held separately, and the analysis area contains tools only—not participant data.</p>
        <p>Before analysis, direct identifiers are removed, including usernames, profile links, names, email addresses, phone numbers, addresses, URLs, workplaces, universities, hospitals, and other explicitly identifying entities where feasible.</p>
        <p>Potentially identifying combinations of details are flagged and generalized. For example, a precise age, nationality, university, and residence in one post may be replaced with broader categories.</p>
        <p>If longitudinal analysis is needed, an irreversible salted HMAC produces a research user ID. The source user name is removed after ID creation, and no lookup mapping is retained.</p>

        <h2 id="diagnostic-evidence">Diagnostic evidence</h2>
        <p>Diagnosis status is coded as <code>clinician_diagnosis_self_reported</code>, <code>self_diagnosed_or_suspected</code>, <code>diagnosis_unspecified</code>, or <code>ambiguous</code>.</p>
        <p>Only an explicit first-person statement that a clinician made a diagnosis can receive <code>clinician_diagnosis_self_reported</code>. For example, “My psychiatrist diagnosed me with MDD” qualifies. “I&apos;ve been depressed for five years” does not establish clinician diagnosis.</p>
        <p>When explicitly named, the clinical source is recorded as psychiatrist, psychologist, family doctor, therapist, or unknown clinician. Medication, psychotherapy, hospitalization, previous diagnosis, current treatment, and treatment discontinuation are captured as separate self-reported history variables—not as proof of diagnosis.</p>

        <h2 id="symptoms">Symptom evidence</h2>
        <p>Nine domains are coded independently: depressed mood; anhedonia; appetite or weight change; sleep disturbance; psychomotor change; fatigue or loss of energy; worthlessness or guilt; concentration or decision problems; and suicidal ideation or death thoughts.</p>
        <p>Each domain receives exactly one state: <code>present</code>, <code>explicitly_absent</code>, <code>uncertain</code>, or <code>not_mentioned</code>. A missing mention is never treated as a zero.</p>
        <p>Every <code>present</code> finding retains a de-identified evidence span internally. Symptom presence is evidence coding, not diagnosis: the research does not infer major depressive disorder from any symptom count.</p>

        <h2 id="phenotype">Psychological phenotype</h2>
        <p>The phenotype layer codes hopelessness, rumination, anxiety, emotional numbness, loneliness, social withdrawal, irritability, motivation impairment, effort intolerance, self-hatred, perceived burdensomeness, and loss of meaning as distinct evidence dimensions.</p>
        <p>Similar constructs are not merged automatically. For example, emotional numbness describes a blunted felt response, while motivation impairment describes difficulty initiating an intended action. Each uses the same four evidence states and requires a de-identified evidence span when present.</p>
        <p>The full operational definitions, inclusion and exclusion examples, and neighboring constructs are in <code>PSYCHOLOGICAL_PHENOTYPE_CODEBOOK.md</code>. A 50–100-post pilot must test whether dimensions are distinguishable before large-scale annotation.</p>

        <h2 id="gold-standard">Human gold standard</h2>
        <p>The human annotation workflow begins with 50 de-identified posts to expose ontology problems, expands to about 150 after ambiguity is resolved, and reaches 400–500 only with a stable codebook and representation from every subreddit family.</p>
        <p>Tricky cases and codebook changes are recorded in <code>ANNOTATION_DECISIONS.md</code>. When a second annotator is available, a shared subset is double-coded; raw agreement, Cohen&apos;s κ, Krippendorff&apos;s α where appropriate, and a disagreement matrix are calculated before automation.</p>

        <h2 id="automation">Automated annotation</h2>
        <p>Automated annotation must return valid JSON only, label only what is stated or strongly entailed, avoid diagnosis, trauma, and causal inference, and use <code>not_mentioned</code> generously.</p>
        <p>It cannot be validated or used until a held-out portion of the human gold-standard dataset exists. Each variable is evaluated separately for precision, recall, F1, specificity where useful, and its confusion matrix.</p>
        <p>Per-variable F1 above .80 is usable; .70–.80 is usable with caution; .60–.70 is exploratory; below .60 must not be used automatically. Overall performance cannot hide a weak category.</p>

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

import type { Metadata } from "next";
import Link from "next/link";
import styles from "./research.module.css";

export const metadata: Metadata = {
  title: "Unequal Research — objective function | Ravia",
  description: "A framework for studying the context-specific level of inequality associated with broad social flourishing."
};

const dimensions = [
  { name: "Material living standards", question: "Are ordinary people becoming materially better off?", measures: "Real median disposable income; income growth of the bottom 40%; healthy life expectancy." },
  { name: "Growth and productivity", question: "Can the economy sustain and improve its productive capacity?", measures: "GDP per person; labour productivity; employment and job quality." },
  { name: "Poverty reduction", question: "Are people protected from deprivation, not merely closer to the average?", measures: "Poverty headcount and poverty gap at national and internationally comparable lines." },
  { name: "Mobility and opportunity", question: "Do circumstances of birth unduly determine life chances?", measures: "Intergenerational income persistence; education and health gaps by parental background; opportunity measures." },
  { name: "Welfare and security", question: "Can people withstand illness, job loss, care needs, and economic shocks?", measures: "Income volatility; unemployment protection; access to health care, housing, and social insurance." },
  { name: "Political equality and stability", question: "Can citizens participate on reasonably equal terms while institutions remain peaceful and legitimate?", measures: "Voice and accountability; political stability; trust; rule of law; participation gaps." }
];

export default function UnequalResearchPage() {
  return (
    <main className={styles.paper}>
      <article aria-labelledby="unequal-research-title">
        <header className={styles.intro}>
          <Link href="/papers">← Papers</Link>
          <p className={styles.kicker}>Unequal Research · Working framework 01</p>
          <h1 id="unequal-research-title">What could “ideal inequality” mean?</h1>
          <p className={styles.lede}>Not the lowest possible Gini coefficient. The working question is: at what distribution of income and wealth does a society achieve the strongest overall combination of broad-based prosperity, security, opportunity, and democratic stability?</p>
        </header>

        <nav className={styles.contents} aria-label="On this page">
          <h2>On this page</h2>
          <ol>
            <li><a href="#claim">The claim</a></li>
            <li><a href="#objective">A normative-empirical objective function</a></li>
            <li><a href="#dimensions">The six outcomes</a></li>
            <li><a href="#limits">Floors, trade-offs, and uncertainty</a></li>
            <li><a href="#comparison">How comparison will work</a></li>
            <li><a href="#sources">Measurement sources</a></li>
          </ol>
        </nav>

        <section id="claim">
          <h2>The claim</h2>
          <p>“Ideal” is a normative word. Data can show what tends to happen under different distributions; it cannot choose society’s values for us. This project therefore makes the values visible, then asks what the evidence says about them.</p>
          <p>We will not score countries by one inequality statistic. A Gini coefficient describes dispersion in income or consumption, but it does not by itself tell us whether poverty is falling, whether people can move up, whether basic risks are insured, or whether political power is becoming concentrated. The World Bank itself notes that inequality can rise while absolute poverty falls. <a href="https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SI.POV.GINI">World Bank Gini metadata</a></p>
        </section>

        <section id="objective">
          <h2>A normative-empirical objective function</h2>
          <p>For a society <em>s</em>, in a particular economic and political context <em>x</em>, let <em>I</em> represent a distribution of income and wealth. We will evaluate its associated social performance with:</p>
          <div className={styles.equation} aria-label="Social objective function"><span>V<sub>s</sub>(I | x) =</span><span>w<sub>L</sub>L + w<sub>G</sub>G + w<sub>P</sub>P + w<sub>M</sub>M + w<sub>S</sub>S + w<sub>D</sub>D − λR</span></div>
          <dl className={styles.terms}>
            <div><dt>L</dt><dd>material living standards</dd></div><div><dt>G</dt><dd>growth and productivity</dd></div><div><dt>P</dt><dd>poverty reduction</dd></div><div><dt>M</dt><dd>mobility and equality of opportunity</dd></div><div><dt>S</dt><dd>basic welfare and economic security</dd></div><div><dt>D</dt><dd>political equality and social stability</dd></div><div><dt>R</dt><dd>risk, uncertainty, and unmeasured harm</dd></div>
          </dl>
          <p>The weights (<em>w</em>) are not hidden facts. They are explicit ethical choices, which can be set equally, democratically elicited, or tested across plausible alternatives. The penalty (<em>λR</em>) prevents a fragile estimate from being treated as a precise optimum.</p>
          <p>The empirical task is not to assume that changing <em>I</em> alone causes every outcome. It is to estimate how the outcome bundle changes with inequality after accounting for context, institutions, policy, and time—and to report where the evidence is too weak to identify a causal effect.</p>
        </section>

        <section id="dimensions">
          <h2>The six outcomes</h2>
          <p>These outcomes reflect the user-defined objective. The proposed indicators are a starting measurement set, not a final index. The OECD’s inclusive-growth framework similarly combines growth, distribution, opportunity, and governance instead of reducing social progress to output alone. <a href="https://www.oecd.org/en/publications/opportunities-for-all_9789264301665-en/full-report/component-6.html">OECD framework and indicator dashboard</a></p>
          <div className={styles.dimensionList}>{dimensions.map((dimension, index) => <section key={dimension.name} className={styles.dimension}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{dimension.name}</h3><p><strong>Decision question:</strong> {dimension.question}</p><p><strong>Candidate measures:</strong> {dimension.measures}</p></div></section>)}</div>
        </section>

        <section id="limits">
          <h2>Floors, trade-offs, and uncertainty</h2>
          <h3>Some outcomes should not be purchased with others</h3>
          <p>A weighted average alone permits bad bargains: for example, high average growth masking severe poverty or political exclusion. Before maximizing the score, the model will apply minimum standards—poverty, basic security, civic participation, and absence of political violence. A candidate distribution that fails a floor is not “ideal” merely because it performs well elsewhere.</p>
          <h3>There may be a range, not a point</h3>
          <p>Measurement error, survey differences, time lags, and value disagreement make a single universal number misleading. The outcome should normally be a context-specific <strong>robust range</strong>: inequality levels that remain near the best attainable social performance across credible measures and weights.</p>
          <h3>Income inequality is not the whole distribution</h3>
          <p>We will keep income, wealth, poverty, and opportunity distinct. Household-survey indicators are essential but can understate the top end; distributional national accounts are a useful complementary approach because they reconcile surveys with tax and national-account data while documenting limitations. <a href="https://wid.world/methodology/">World Inequality Database methodology</a></p>
        </section>

        <section id="comparison">
          <h2>How a comparative conclusion will work</h2>
          <ol className={styles.steps}>
            <li><strong>Describe the context.</strong> Compare societies with attention to income level, fiscal capacity, demographics, economic structure, macroeconomic shocks, and institutional regime.</li>
            <li><strong>Measure the distribution consistently.</strong> Use multiple measures—Gini, top and bottom shares, poverty, and wealth concentration—rather than treating any one as definitive.</li>
            <li><strong>Estimate the outcome surface.</strong> Map the six outcomes against the inequality measures within comparable context groups and across time.</li>
            <li><strong>Find the feasible frontier.</strong> Identify distributions where no outcome can improve without a meaningful loss in another, subject to the minimum floors.</li>
            <li><strong>Stress-test the answer.</strong> Re-run with different weights, measures, lags, and model specifications. Report a range only when it is stable; otherwise report uncertainty.</li>
          </ol>
          <p>This is the next phase of the research. The current page defines what must be evaluated; it does not yet claim an ideal inequality level for any country.</p>
        </section>

        <section id="sources">
          <h2>Measurement sources</h2>
          <ul className={styles.sources}>
            <li><a href="https://pip.worldbank.org/about">World Bank Poverty and Inequality Platform</a> — household-survey-based poverty, inequality, and shared-prosperity estimates.</li>
            <li><a href="https://www.oecd.org/en/topics/social-mobility-and-equal-opportunity.html">OECD social mobility and equal opportunity</a> — mobility can be measured through income, earnings, class, health, and education; comparable-data gaps remain important.</li>
            <li><a href="https://www.worldbank.org/en/publication/worldwide-governance-indicators">Worldwide Governance Indicators</a> — broad cross-country measures including voice and accountability and political stability, useful as a first lens but insufficient for a country-specific reform diagnosis.</li>
            <li><a href="https://wid.world/methodology/">World Inequality Database</a> — distributional national accounts and transparent documentation of data limitations.</li>
          </ul>
        </section>

        <footer className={styles.footer}><Link href="/papers">← Back to Papers</Link></footer>
      </article>
    </main>
  );
}

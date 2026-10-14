import Image from "next/image";
import Link from "next/link";

const sections = [
  { number: "01", title: "About", href: "/about", action: "Learn more", eyebrow: "Mission, interests, and purpose.", description: "An independent space for investigating how minds work and how intelligence can be understood.", art: "about" },
  { number: "02", title: "Research", href: "/research", action: "Explore research", eyebrow: "Questions, hypotheses, and inquiry.", description: "Questions across neuroscience, cognitive science, and computation guide the work.", art: "research" },
  { number: "03", title: "Publications", href: "/publications", action: "View publications", eyebrow: "Essays, reports, and future papers.", description: "A home for written work and the evidence, methods, and ideas behind it.", art: "publications" },
  { number: "04", title: "Projects", href: "/projects", action: "Browse projects", eyebrow: "Experiments, models, and code.", description: "Models and small experiments will make questions concrete and testable.", art: "projects" },
  { number: "05", title: "Lab Notebook", href: "/lab-notebook", action: "Read the notebook", eyebrow: "Process, observations, and open questions.", description: "A place to record work as it develops, including uncertainty and revision.", art: "notebook" },
  { number: "06", title: "CV", href: "/cv", action: "View CV", eyebrow: "Background and methods.", description: "An overview of experience and methods will appear here as it is prepared.", art: "cv" }
] as const;

function WaveGraph() {
  return <svg className="waveGraph" viewBox="0 0 300 144" role="img" aria-label="Illustrative graph of overlapping signals">
    <path d="M4 118H296M4 88H296M4 58H296M4 28H296M4 8V126M52 8V126M100 8V126M148 8V126M196 8V126M244 8V126M292 8V126" className="graphGrid" />
    <path d="M4 114C35 111 30 37 48 69S72 126 92 110 109 42 127 67 150 125 171 109 191 10 205 21 219 130 246 104 263 59 278 96 289 110 296 109" className="graphLine primary" />
    <path d="M4 112C28 91 40 107 57 115S87 82 98 87 117 123 136 112 153 61 167 77 184 115 203 105 221 55 237 70 262 112 296 109" className="graphLine secondary" />
    <path d="M4 116C39 119 49 107 64 105S91 116 108 113 122 101 137 103 160 121 177 113 206 81 222 91 246 114 296 111" className="graphLine faint" />
    <path d="M4 126H296" className="graphAxis" /><text x="270" y="139">time</text>
  </svg>;
}

function CardArt({ art }: { art: (typeof sections)[number]["art"] }) {
  if (art === "about") return <div className="cardArt artAbout" aria-hidden="true">
    <div className="photoMat"><svg viewBox="0 0 260 182" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="sky" x2="0" y2="1"><stop stopColor="#b6c1c8"/><stop offset="1" stopColor="#f1f1eb"/></linearGradient></defs><rect width="260" height="182" fill="url(#sky)"/><path d="M0 120 37 79 62 101 109 35 153 91 190 49 260 124V182H0Z" fill="#8695a1"/><path d="M0 135 49 91 91 124 142 73 188 121 225 88 260 119V182H0Z" fill="#5f7180"/><path d="M0 159 55 126 96 149 151 119 205 150 260 130V182H0Z" fill="#35434f"/><path d="M0 173 12 143 26 175 40 137 55 178 75 138 86 180 103 148 117 183 140 144 159 185 180 138 194 184 220 148 243 181 260 146V182H0Z" fill="#1f2d35"/></svg></div>
    <small>INQUIRY · MODELS · UNDERSTANDING</small>
  </div>;
  if (art === "research") return <div className="cardArt artResearch" aria-hidden="true"><div className="venn"><span>brain</span><span>cognition</span><span>computation</span><i /></div><small>BIOLOGICAL · COMPUTATIONAL · CONCEPTUAL</small></div>;
  if (art === "publications") return <div className="cardArt artPublications" aria-hidden="true"><div className="paperStack"><div className="paperBack"/><div className="paperBack second"/><div className="paperFront"><span>ravia / working notes</span><strong>Questions on<br/>Intelligence</strong><i/><i/></div></div><small>ESSAYS · REPORTS · PAPERS</small></div>;
  if (art === "projects") return <div className="cardArt artProjects" aria-hidden="true"><div className="networkMat"><svg viewBox="0 0 230 150"><g stroke="#aebdcc" strokeWidth=".6" opacity=".58"><path d="M20 83 45 34 88 78 104 23 132 88 189 27 210 97M30 127 88 78 143 119 189 27M45 34 143 119 210 97M20 83 104 23 210 97"/></g>{Array.from({length: 52}, (_, i) => { const x = 24 + ((i * 67) % 185); const y = 19 + ((i * 47 + Math.floor(i / 5) * 23) % 112); return <circle key={i} cx={x} cy={y} r={i % 7 === 0 ? 1.8 : .85} fill="#e1e8eb" opacity={.45 + (i % 4) * .12}/>; })}</svg></div><small>MODELS · DATASETS · CODE</small></div>;
  if (art === "notebook") return <div className="cardArt artNotebook" aria-hidden="true"><div className="noteSheet"><i>From the notebook</i><strong>A question worth keeping open</strong><p>What can a model explain, and where does its explanation stop?</p><svg viewBox="0 0 206 40"><path d="M0 22 7 22 10 6 13 33 18 15 24 24 29 20 34 8 38 31 44 18 49 22 55 3 58 38 64 13 70 24 77 22 82 7 88 35 93 20 99 23 104 10 109 31 116 21 121 18 127 6 133 37 138 14 144 23 149 21 156 9 161 31 168 18 174 22 180 5 186 34 192 21 199 23 206 16" fill="none" stroke="#36577a" strokeWidth="1.2"/></svg></div></div>;
  return <div className="cardArt artCv" aria-hidden="true"><div className="cvSheet"><span>Neuroscience <i style={{width:"64%"}} /></span><span>Computation <i style={{width:"77%"}} /></span><span>Methods <i style={{width:"53%"}} /></span><span>Writing <i style={{width:"68%"}} /></span></div><small>BACKGROUND · METHODS</small></div>;
}

export default function Home() {
  return <main className="homePage">
    <section className="heroPanel" aria-labelledby="hero-title">
      <div className="marginNumber" aria-hidden="true">01</div>
      <div className="heroCopy"><p className="eyebrow">Independent research lab</p><h1 id="hero-title">ravia</h1><h2>Exploring minds, intelligence, and computation.</h2><p className="heroDescription">An independent research lab investigating the biological, computational, and philosophical foundations of intelligence.</p><div className="topicTags" aria-label="Areas of interest"><span>Neuroscience</span><span>Cognitive Science</span><span>Computation</span><span>Models</span><span>Open Science</span></div></div>
      <div className="heroIllustration"><span className="heroAnnotation annotationTop">cognition</span><span className="heroAnnotation annotationRight">neural systems</span><span className="heroAnnotation annotationBottom">computation</span><Image src="/brain-engraving.png" width={1536} height={1024} alt="Engraved illustration of a human brain" priority sizes="(max-width: 900px) 100vw, 38vw" /></div>
      <aside className="heroAside"><WaveGraph/><blockquote>To understand intelligence,<br/>we must study nature, build models,<br/>and remain open to what we do not yet know.<cite>— ravia</cite></blockquote></aside>
    </section>
    <section className="sectionGrid" aria-label="Explore the lab">{sections.map((section) => <article className="sectionCard" id={section.title.toLowerCase().replaceAll(" ", "-")} key={section.number}><div className="cardText"><span className="cardNumber">{section.number}</span><h2>{section.title}</h2><p className="cardEyebrow">{section.eyebrow}</p><p className="cardDescription">{section.description}</p><Link className="cardLink" href={section.href}>{section.action}<span aria-hidden="true">→</span></Link></div><CardArt art={section.art}/></article>)}</section>
    <footer className="raviaFooter"><span>ravia <i>/</i> independent research lab</span><em>Curiosity, rigor, and room to revise.</em><span>RESEARCH · OPEN SCIENCE · LONG TERM THINKING</span></footer>
  </main>;
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { companies, categories } from "./companies-data";
import s from "./companies.module.css";

const fundingSource = "https://www.congress.gov/crs_external_products/RL/PDF/RL33222/RL33222.53.pdf";
const steps = [
  { title: "Congress", tag: "01 / Authorize & appropriate", text: "The House and Senate legislate funding. The 2016 memorandum sets a ten-year framework, but funding remains subject to congressional appropriations. A company’s government-affairs job title alone does not establish a connection to a particular senator." },
  { title: "Military assistance", tag: "02 / Finance", text: "The FY2019–FY2028 framework envisages $3.3 billion per year in Foreign Military Financing and $500 million per year for joint missile defense. Supplemental assistance is separate from this baseline." },
  { title: "Procurement", tag: "03 / Contract & acquire", text: "Assistance and procurement are different steps. A specific company’s funding path needs evidence from a sale notification, contract, or award record. This directory does not assign the aid total to the companies below." },
  { title: "Builders & systems", tag: "04 / Deliver", text: "Companies provide different layers: platforms, propulsion, munitions, optics, software, and infrastructure. The supplied notes identify capabilities and people; they do not document every contract or end use." }
];

function CapabilityIcon({ category }: { category: string }) {
  return <svg viewBox="0 0 160 88" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
    <path d="M8 72H152M24 8V80M80 8V80M136 8V80" opacity=".14" strokeDasharray="3 5" />
    {category === "Air & space" ? <><path d="m14 51 52-8 16-27 8 1-5 27 52 11-3 6-51-5-15 14-7-1 8-15-54 4Z" /><circle cx="83" cy="45" r="31" opacity=".2" /></> : category === "Land & mobility" ? <><path d="M27 55V35h51l14-12h23l19 32H27Zm52-20v20m14-27 17 0 12 19H88" /><circle cx="48" cy="60" r="11" /><circle cx="115" cy="60" r="11" /><path d="M58 62h46" /></> : category === "Missiles & munitions" ? <><path d="m36 67 66-47 20-1-7 19-66 45-1-16-12 0ZM88 30l-19-2-17 12h20m33 7-5 18-17 10 4-17M103 21l12 17" /><path d="m30 62-12 9m24 5-9 7" opacity=".4" /></> : category === "Optics & sensing" ? <><circle cx="80" cy="44" r="29" /><circle cx="80" cy="44" r="18" /><path d="M80 9v23m0 24v23M45 44h23m24 0h23" /><circle cx="80" cy="44" r="3" /></> : <><path d="M27 22h35v43H27Zm71 0h35v43H98ZM62 44h36M80 44V17m0 27v30" /><path d="M34 31h21m-21 9h21m-21 9h21m50-18h21m-21 9h21m-21 9h21" /><circle cx="80" cy="17" r="4" /><circle cx="80" cy="74" r="4" /></>}
  </svg>;
}

export default function CompaniesExplorer() {
  const [category, setCategory] = useState("All companies");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(companies[0].id);
  const [step, setStep] = useState(0);
  const [view, setView] = useState<"capabilities" | "people">("capabilities");
  const term = query.trim().toLowerCase();
  const visible = companies.filter(c => (category === "All companies" || c.category === category) && `${c.name} ${c.description} ${c.people.map(p => `${p.name} ${p.role}`).join(" ")}`.toLowerCase().includes(term));
  const selected = visible.find(c => c.id === selectedId) ?? visible[0];
  const peopleCount = companies.reduce((sum,c) => sum + c.people.length, 0);
  return <main className={s.page}>
    <nav className={s.breadcrumb} aria-label="Breadcrumb"><Link href="/defentech">Defentech</Link><span>/</span><span>Companies</span></nav>
    <header className={s.hero}>
      <div><p className={s.eyebrow}>Field notes / 01 — The company directory</p><h1>Who builds<br /><em>the system?</em></h1><p className={s.intro}>Follow the technology. Meet the people.<br />Understand the framework behind the funding.</p></div>
      <div className={s.heroDiagram} aria-hidden="true"><div className={s.orbit}/><div className={s.orbitInner}/><span className={s.orbitTop}>FUNDING</span><span className={s.orbitLeft}>PEOPLE</span><span className={s.orbitRight}>SYSTEMS</span><strong>COMPANIES<span>THE BUILDERS</span></strong><span className={s.orbitBottom}>INFRASTRUCTURE</span></div>
    </header>
    <div className={s.stats}><div><strong>{companies.length}</strong><span>Companies in the notes</span></div><div><strong>{peopleCount}</strong><span>People listed</span></div><div><strong>05</strong><span>Capability groups</span></div><p>A working research index.<br />Explore a company to see its people and capabilities.</p></div>

    <section className={s.funding} aria-labelledby="funding-title">
      <div className={s.sectionHead}><div><p className={s.eyebrow}>01 / Start with the framework</p><h2 id="funding-title">Where does the money start?</h2></div><a href={fundingSource} target="_blank" rel="noreferrer">Read the CRS source ↗</a></div>
      <div className={s.fundingGrid}><div className={s.fundNumber}><span>U.S.–Israel military aid memorandum</span><strong>$38<span>bn</span></strong><p>FY2019–FY2028 · Ten-year baseline</p><div className={s.fundBar}><i/><i/></div><small>$33bn FMF <span>$5bn missile defense</span></small><p className={s.fundNote}>Subject to congressional appropriations. Not a company revenue total; excludes supplemental aid.</p></div><div><div className={s.steps} aria-label="Explore the funding framework">{steps.map((item,i) => <button key={item.title} onClick={() => setStep(i)} aria-pressed={step === i}><span>0{i+1}</span>{item.title}<b aria-hidden="true">{i < 3 ? "→" : "↙"}</b></button>)}</div><div className={s.stepDetail} aria-live="polite"><span className={s.eyebrow}>{steps[step].tag}</span><h3>{steps[step].title}</h3><p>{steps[step].text}</p></div></div></div>
    </section>

    <section className={s.directory} aria-labelledby="directory-title">
      <div className={s.sectionHead}><div><p className={s.eyebrow}>02 / Explore the builders</p><h2 id="directory-title">Anatomy of an industry.</h2></div><span className={s.noteTag}>Source: supplied research notes</span></div>
      <div className={s.categoryMap} aria-label="Filter by capability">{categories.map((cat,i) => <button key={cat} aria-pressed={category === cat} onClick={() => setCategory(category === cat ? "All companies" : cat)}><span className={s.categoryIndex}>0{i+1}</span><CapabilityIcon category={cat}/><strong>{cat}</strong><span>{companies.filter(c=>c.category===cat).length} {companies.filter(c=>c.category===cat).length === 1 ? "company" : "companies"} <b>↗</b></span></button>)}</div>
      <div className={s.toolbar}><label className={s.search}><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search companies, people, technology…" aria-label="Search companies, people, or technology" /></label><div className={s.viewSwitch}><button aria-pressed={view === "capabilities"} onClick={()=>setView("capabilities")}>Capabilities</button><button aria-pressed={view === "people"} onClick={()=>setView("people")}>People</button></div></div>
      <div className={s.results}><span aria-live="polite">{visible.length} of {companies.length} companies{category !== "All companies" ? ` / ${category}` : ""}</span>{(category !== "All companies" || query) && <button onClick={()=>{setCategory("All companies");setQuery("");}}>Clear filters ×</button>}</div>
      <div className={s.explorer}><div className={s.companyList} aria-label="Companies">{visible.map((c) => <button key={c.id} aria-pressed={selected?.id === c.id} onClick={()=>setSelectedId(c.id)}><span className={s.companyIndex}>{String(companies.indexOf(c)+1).padStart(2,"0")}</span><span><strong>{c.name}</strong><small>{view === "people" ? `${c.people[0].name} · ${c.people.length} people listed` : c.description}</small></span><span className={s.rowArrow} aria-hidden="true">↗</span></button>)}{!visible.length && <div className={s.empty}><h3>No matching companies.</h3><p>Try another name, role, or technology, or clear the filters.</p></div>}</div>
      {selected && <article className={s.inspector} aria-label="Selected company details"><div className={s.inspectorTop}><span>{selected.category}</span><CapabilityIcon category={selected.category}/></div><h3>{selected.name}</h3><p className={s.description}>{selected.description}</p><div className={s.relationship}><span>COMPANY</span><i aria-hidden="true">→</i><span>CAPABILITY</span><i aria-hidden="true">→</i><span>PEOPLE</span></div><h4>People in the notes <span>{selected.people.length}</span></h4><p className={s.caveat}>Names and roles are transcribed from the supplied notes, including former roles. They have not been independently verified as current.</p><ul className={s.people}>{selected.people.map((p,i)=><li key={p.name}><span className={s.personNumber}>{String(i+1).padStart(2,"0")}</span><div><strong>{p.name}</strong><span>{p.role}</span>{/government|govt|affairs|legislative|policy/i.test(p.role) && <small>Public policy / government affairs role in notes</small>}</div></li>)}</ul><div className={s.researchGap}><span>Open research / Connections</span><p>Specific Senate links, contracts, funding amounts, and delivery dates are not documented in the supplied notes. A listed role is not evidence of a particular funding relationship.</p></div></article>}
      </div>
    </section>
    <footer className={s.footer}><div><p className={s.eyebrow}>A note on the evidence</p><p>The source text lists 21 companies and 108 people, although its closing paragraph refers to 24 companies. This directory includes all supplied entries. Capability groups are editorial classifications; company descriptions and leadership listings remain research notes, not verified contract records.</p></div><Link href="/defentech">Back to Defentech ↗</Link></footer>
  </main>;
}

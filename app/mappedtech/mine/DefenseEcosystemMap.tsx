"use client";

import { useMemo, useState } from "react";
import { companies, contracts, individuals, signalLanes, type Company, type ContractRecord } from "./ecosystem-data";

const nav = ["Companies", "Contracts", "Individuals", "Knowledge", "Insights", "Reports"];

export function DefenseEcosystemMap({ briefingDate }: { briefingDate: string }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Company>(companies[0]);
  const [view, setView] = useState("Contracts");
  const [selectedContract, setSelectedContract] = useState<ContractRecord>(contracts[0]);
  const filtered = useMemo(() => companies.filter((company) => `${company.name} ${company.ticker} ${company.role} ${company.signal}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const featured = filtered.slice(0, 3);

  return (
    <main className="mapdesk">
      <div className="consoleFrame">
        <header className="consoleTopbar">
          <a className="consoleBrand" href="#overview" aria-label="MappedTech overview"><span className="brandGlyph">◈</span><span><b>MAPPED</b>TECH<small>DEFENSE INTELLIGENCE</small></span></a>
          <nav className="consoleNav" aria-label="Map sections">{nav.map((item, index) => <button onClick={() => setView(item)} className={view === item ? "active" : ""} key={item}><i>{String(index + 1).padStart(2, "0")}</i>{item}</button>)}</nav>
          <button className="consoleMenu" aria-label="Open navigation">☰</button>
        </header>

        <div className="consoleStatus"><span><i className="statusDot" />LIVE RESEARCH ENVIRONMENT</span><span>PUBLIC-SOURCE INTELLIGENCE ONLY</span><span>BRIEF {briefingDate}</span></div>

        <section className="consoleGrid" id="overview">
          <aside className="consoleRail" aria-label="Tracked companies">
            <div className="panelTitle"><span>COMPANIES</span><em>{companies.length.toString().padStart(2, "0")}</em></div>
            <label className="consoleSearch"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search entities" /></label>
            <div className="companyStack">{featured.map((company, index) => <button className={`companyCard ${selected.name === company.name ? "selected" : ""}`} onClick={() => { setSelected(company); setView("Companies"); }} key={company.name}><span className={`companyMark ${company.tone}`}>{String(index + 1).padStart(2, "0")}</span><span><b>{company.name}</b><small>{company.sector}</small></span><i>{company.ticker}</i></button>)}</div>
            <button className="railMore" onClick={() => setView("Companies")}>VIEW ALL ENTITIES <span>→</span></button>
            <div className="railDivision" />
            <div className="panelTitle"><span>WATCHLIST</span><em>03</em></div>
            <div className="watchlist"><p><span>01</span> Program awards <b>NEW</b></p><p><span>02</span> Senior leadership <b>LIVE</b></p><p><span>03</span> Industrial capacity <b>HOT</b></p></div>
          </aside>

          <section className="consoleCenter" aria-label="Contract analytics">
            <div className="centerHead"><div><p className="microLabel">ACTIVE ANALYTICS / PUBLIC SOURCES</p><h1>{view.toUpperCase()} <span>/</span> ECOSYSTEM</h1></div><div className="coveragePill"><i /> <span>TRACKING</span> {view === "Individuals" ? individuals.length : view === "Contracts" ? contracts.length : companies.length} RECORDS</div></div>
            <div className="dataToolbar"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={view === "Individuals" ? "Filter individuals or organization" : "Filter company, program, capability"} /><button>PUBLIC DATA <i>↗</i></button></div>
            {view === "Contracts" && <div className="contractTable"><div className="contractHead"><span>RECORD</span><span>PROGRAM</span><span>ENTITY</span><span>STATUS</span></div>{contracts.filter((record) => `${record.program} ${record.company} ${record.id}`.toLowerCase().includes(query.toLowerCase())).map((record) => <button key={record.id} className={selectedContract.id === record.id ? "tableSelected" : ""} onClick={() => { setSelectedContract(record); const company = companies.find((item) => item.name === record.company); if (company) setSelected(company); }}><span>{record.id}</span><span>{record.program}</span><span>{record.company}</span><span><i />{record.status}</span></button>)}</div>}
            {view === "Companies" && <div className="recordCards">{filtered.map((company) => <button onClick={() => setSelected(company)} className={selected.name === company.name ? "recordCard selectedRecord" : "recordCard"} key={company.name}><span className={`companyMark ${company.tone}`}>{company.ticker}</span><span><b>{company.name}</b><small>{company.sector} · {company.role}</small><p>{company.description}</p></span><i>↗</i></button>)}</div>}
            {view === "Individuals" && <div className="recordCards">{individuals.filter((person) => `${person.name} ${person.company} ${person.role}`.toLowerCase().includes(query.toLowerCase())).map((person) => <a className="recordCard personCard" href={person.source} target="_blank" rel="noreferrer" key={person.name}><span className="personInitial">{person.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><span><b>{person.name}</b><small>{person.role} · {person.company}</small><p>{person.focus}</p></span><i>↗</i></a>)}</div>}
            {!["Contracts", "Companies", "Individuals"].includes(view) && <div className="researchEmpty"><p className="microLabel">RESEARCH LANE</p><h2>{view}</h2><p>This lane is staged for the daily public-source research workflow. Switch to Companies, Contracts, or Individuals to inspect populated records.</p></div>}
            <div className="centerLower"><section className="signalPanel"><div className="panelTitle"><span>CONTRACTS EXPLAINED</span><em>↗</em></div><p className="signalHeadline">A living read of awards, capability bets, and production signals.</p><div className="pulseRows">{signalLanes.slice(0, 3).map(([lane, owner], index) => <div key={lane}><span>{lane}</span><b>{owner}</b><i style={{ "--width": `${56 + index * 15}%` } as React.CSSProperties} /></div>)}</div></section><section className="sparkPanel"><div className="panelTitle"><span>RESEARCH PULSE</span><em>24H</em></div><svg viewBox="0 0 240 90" role="img" aria-label="Research pulse chart"><defs><linearGradient id="pulse" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#58e4ee" stopOpacity=".35"/><stop offset="1" stopColor="#58e4ee" stopOpacity="0"/></linearGradient></defs><path className="sparkArea" d="M0 72 L18 65 35 69 52 46 70 58 88 29 106 45 124 37 142 52 160 18 178 43 196 27 214 38 240 10 V90 H0Z"/><path className="sparkLine" d="M0 72 L18 65 35 69 52 46 70 58 88 29 106 45 124 37 142 52 160 18 178 43 196 27 214 38 240 10"/></svg><div className="sparkFoot"><span>01:00</span><span>08:00</span><span>NOW</span></div></section></div>
          </section>

          <aside className="consoleRight" aria-label="Activity and relationships">
            <section className="rightPanel activityPanel"><div className="panelTitle"><span>REAL-TIME ACTIVITY</span><em>LIVE</em></div><ul><li><i /> <span><b>Research queue updated</b><small>2 minutes ago</small></span></li><li><i /> <span><b>New program signal</b><small>17 minutes ago</small></span></li><li><i /> <span><b>Entity dossier refreshed</b><small>42 minutes ago</small></span></li></ul></section>
            <section className="rightPanel entityPanel"><div className="panelTitle"><span>{view === "Contracts" ? "RECORD FOCUS" : "ENTITY FOCUS"}</span><em>01</em></div><h2>{view === "Contracts" ? selectedContract.program : selected.name}</h2><p>{view === "Contracts" ? selectedContract.summary : selected.description}</p><dl>{view === "Contracts" ? <><div><dt>Entity</dt><dd>{selectedContract.company}</dd></div><div><dt>Type / status</dt><dd>{selectedContract.type} · {selectedContract.status}</dd></div></> : <><div><dt>Signal</dt><dd>{selected.signal}</dd></div><div><dt>Lens</dt><dd>{selected.sector}</dd></div></>}</dl><a className="sourceButton" href={view === "Contracts" ? selectedContract.source : selected.source} target="_blank" rel="noreferrer">VIEW SOURCE <span>↗</span></a></section>
            <section className="rightPanel networkPanel"><div className="panelTitle"><span>ENTITIES &amp; CONNECTIONS</span><em>12</em></div><svg viewBox="0 0 260 160" role="img" aria-label="Entity relationship network"><g className="networkLines"><path d="M33 92 84 52 132 84 186 36 226 77M84 52 72 126 132 84 156 132 226 77M33 92 72 126 156 132 220 124M132 84 220 124"/></g><g className="networkNodes"><circle cx="33" cy="92" r="4"/><circle cx="84" cy="52" r="6"/><circle cx="72" cy="126" r="4"/><circle cx="132" cy="84" r="11" className="core"/><circle cx="156" cy="132" r="5"/><circle cx="186" cy="36" r="4"/><circle cx="226" cy="77" r="6"/><circle cx="220" cy="124" r="4"/></g></svg><p>Connection density is derived from public program, supplier, and personnel signals.</p></section>
          </aside>
        </section>

        <footer className="consoleFooter"><span>STATUS: <b>ONLINE</b></span><span>DATABASE: US DEFENSE ECOSYSTEM / V1.0</span><span>RAVIA SPACE · MAPPEDTECH</span></footer>
      </div>
    </main>
  );
}

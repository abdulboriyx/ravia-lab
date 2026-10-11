"use client";

import { useMemo, useState } from "react";
import { companies, signalLanes, type Company } from "./ecosystem-data";

const nav = ["Companies", "Contracts", "Individuals", "Knowledge", "Insights", "Reports"];

export function DefenseEcosystemMap({ briefingDate }: { briefingDate: string }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Company>(companies[0]);
  const filtered = useMemo(() => companies.filter((company) => `${company.name} ${company.ticker} ${company.role} ${company.signal}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const featured = filtered.slice(0, 3);

  return (
    <main className="mapdesk">
      <div className="consoleFrame">
        <header className="consoleTopbar">
          <a className="consoleBrand" href="#overview" aria-label="MappedTech overview"><span className="brandGlyph">◈</span><span><b>MAPPED</b>TECH<small>DEFENSE INTELLIGENCE</small></span></a>
          <nav className="consoleNav" aria-label="Map sections">{nav.map((item, index) => <button className={index === 1 ? "active" : ""} key={item}><i>{String(index + 1).padStart(2, "0")}</i>{item}</button>)}</nav>
          <button className="consoleMenu" aria-label="Open navigation">☰</button>
        </header>

        <div className="consoleStatus"><span><i className="statusDot" />LIVE RESEARCH ENVIRONMENT</span><span>PUBLIC-SOURCE INTELLIGENCE ONLY</span><span>BRIEF {briefingDate}</span></div>

        <section className="consoleGrid" id="overview">
          <aside className="consoleRail" aria-label="Tracked companies">
            <div className="panelTitle"><span>COMPANIES</span><em>{companies.length.toString().padStart(2, "0")}</em></div>
            <label className="consoleSearch"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search entities" /></label>
            <div className="companyStack">{featured.map((company, index) => <button className={`companyCard ${selected.name === company.name ? "selected" : ""}`} onClick={() => setSelected(company)} key={company.name}><span className={`companyMark ${company.tone}`}>{String(index + 1).padStart(2, "0")}</span><span><b>{company.name}</b><small>{company.sector}</small></span><i>{company.ticker}</i></button>)}</div>
            <button className="railMore">VIEW ALL ENTITIES <span>→</span></button>
            <div className="railDivision" />
            <div className="panelTitle"><span>WATCHLIST</span><em>03</em></div>
            <div className="watchlist"><p><span>01</span> Program awards <b>NEW</b></p><p><span>02</span> Senior leadership <b>LIVE</b></p><p><span>03</span> Industrial capacity <b>HOT</b></p></div>
          </aside>

          <section className="consoleCenter" aria-label="Contract analytics">
            <div className="centerHead"><div><p className="microLabel">ACTIVE ANALYTICS</p><h1>CONTRACTS <span>/</span> ECOSYSTEM</h1></div><div className="coveragePill"><i /> <span>TRACKING</span> 12 ENTITIES</div></div>
            <div className="dataToolbar"><span>⌕</span><input placeholder="Filter contract, company, capability" /><button>EXPORT <i>↗</i></button></div>
            <div className="contractTable"><div className="contractHead"><span>CONTRACT</span><span>ENTITY</span><span>TYPE</span><span>STATUS</span></div>{["C-881240", "D-093555", "N-771405"].map((id, index) => <button key={id} className={index === 0 ? "tableSelected" : ""} onClick={() => setSelected(companies[index])}><span>{id}</span><span>{companies[index].name}</span><span>{index === 0 ? "Production" : index === 1 ? "Services" : "R&D"}</span><span><i />{index === 0 ? "Active" : "Monitored"}</span></button>)}</div>
            <div className="centerLower"><section className="signalPanel"><div className="panelTitle"><span>CONTRACTS EXPLAINED</span><em>↗</em></div><p className="signalHeadline">A living read of awards, capability bets, and production signals.</p><div className="pulseRows">{signalLanes.slice(0, 3).map(([lane, owner], index) => <div key={lane}><span>{lane}</span><b>{owner}</b><i style={{ "--width": `${56 + index * 15}%` } as React.CSSProperties} /></div>)}</div></section><section className="sparkPanel"><div className="panelTitle"><span>RESEARCH PULSE</span><em>24H</em></div><svg viewBox="0 0 240 90" role="img" aria-label="Research pulse chart"><defs><linearGradient id="pulse" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#58e4ee" stopOpacity=".35"/><stop offset="1" stopColor="#58e4ee" stopOpacity="0"/></linearGradient></defs><path className="sparkArea" d="M0 72 L18 65 35 69 52 46 70 58 88 29 106 45 124 37 142 52 160 18 178 43 196 27 214 38 240 10 V90 H0Z"/><path className="sparkLine" d="M0 72 L18 65 35 69 52 46 70 58 88 29 106 45 124 37 142 52 160 18 178 43 196 27 214 38 240 10"/></svg><div className="sparkFoot"><span>01:00</span><span>08:00</span><span>NOW</span></div></section></div>
          </section>

          <aside className="consoleRight" aria-label="Activity and relationships">
            <section className="rightPanel activityPanel"><div className="panelTitle"><span>REAL-TIME ACTIVITY</span><em>LIVE</em></div><ul><li><i /> <span><b>Research queue updated</b><small>2 minutes ago</small></span></li><li><i /> <span><b>New program signal</b><small>17 minutes ago</small></span></li><li><i /> <span><b>Entity dossier refreshed</b><small>42 minutes ago</small></span></li></ul></section>
            <section className="rightPanel entityPanel"><div className="panelTitle"><span>ENTITY FOCUS</span><em>01</em></div><h2>{selected.name}</h2><p>{selected.role}</p><dl><div><dt>Signal</dt><dd>{selected.signal}</dd></div><div><dt>Lens</dt><dd>{selected.sector}</dd></div></dl><button>OPEN DOSSIER <span>↗</span></button></section>
            <section className="rightPanel networkPanel"><div className="panelTitle"><span>ENTITIES &amp; CONNECTIONS</span><em>12</em></div><svg viewBox="0 0 260 160" role="img" aria-label="Entity relationship network"><g className="networkLines"><path d="M33 92 84 52 132 84 186 36 226 77M84 52 72 126 132 84 156 132 226 77M33 92 72 126 156 132 220 124M132 84 220 124"/></g><g className="networkNodes"><circle cx="33" cy="92" r="4"/><circle cx="84" cy="52" r="6"/><circle cx="72" cy="126" r="4"/><circle cx="132" cy="84" r="11" className="core"/><circle cx="156" cy="132" r="5"/><circle cx="186" cy="36" r="4"/><circle cx="226" cy="77" r="6"/><circle cx="220" cy="124" r="4"/></g></svg><p>Connection density is derived from public program, supplier, and personnel signals.</p></section>
          </aside>
        </section>

        <footer className="consoleFooter"><span>STATUS: <b>ONLINE</b></span><span>DATABASE: US DEFENSE ECOSYSTEM / V1.0</span><span>RAVIA SPACE · MAPPEDTECH</span></footer>
      </div>
    </main>
  );
}

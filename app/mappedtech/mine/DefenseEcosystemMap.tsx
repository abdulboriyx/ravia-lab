"use client";

import { useMemo, useState } from "react";
import { companies, signalLanes, type Company } from "./ecosystem-data";

export function DefenseEcosystemMap({ briefingDate }: { briefingDate: string }) {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState<string>("All");
  const [selected, setSelected] = useState<Company>(companies[0]);
  const sectors = ["All", "Primes", "Space", "Autonomy", "Data & AI", "Munitions"];
  const filtered = useMemo(() => companies.filter((company) => {
    const matchesSector = sector === "All" || company.sector === sector;
    const haystack = `${company.name} ${company.ticker} ${company.role} ${company.signal}`.toLowerCase();
    return matchesSector && haystack.includes(query.toLowerCase());
  }), [query, sector]);

  return (
    <main className="mapdesk">
      <header className="mapdeskTopbar">
        <div className="mapdeskWordmark"><span className="mapdeskMark">M</span><span>MAPPEDTECH</span></div>
        <div className="mapdeskMeta"><span className="liveDot" /> PRIVATE RESEARCH ENVIRONMENT <span>•</span> US DEFENSE ECOSYSTEM</div>
        <div className="mapdeskDate">DAILY BRIEFING<br /><strong>{briefingDate}</strong></div>
      </header>

      <section className="mapdeskIntro" aria-labelledby="map-title">
        <div>
          <p className="eyebrow">RAVIA / SPACE / MAPPEDTECH / MINE</p>
          <h1 id="map-title">The defense industrial<br />ecosystem, in motion.</h1>
          <p className="mapdeskDescription">A private working map of the United States defense ecosystem: companies, programs, capital, leadership, and the signals connecting them.</p>
        </div>
        <div className="mapdeskStats" aria-label="Ecosystem scope">
          <div><strong>05</strong><span>signal lanes</span></div>
          <div><strong>12</strong><span>tracked entities</span></div>
          <div><strong>01</strong><span>daily brief</span></div>
        </div>
      </section>

      <section className="mapdeskControls" aria-label="Map filters">
        <label className="mapdeskSearch"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company, program, capability" /></label>
        <div className="mapdeskFilters">{sectors.map((item) => <button key={item} className={sector === item ? "active" : ""} onClick={() => setSector(item)}>{item}</button>)}</div>
      </section>

      <section className="mapdeskCanvas" aria-label="Interactive company map">
        <div className="mapdeskCanvasHead"><span>ECOSYSTEM FIELD / SELECT AN ENTITY</span><span>{filtered.length} RESULTS</span></div>
        <div className="mapdeskNodes">
          {filtered.map((company, index) => <button key={company.name} className={`mapdeskNode ${company.tone} ${selected.name === company.name ? "selected" : ""}`} style={{ "--node-index": index } as React.CSSProperties} onClick={() => setSelected(company)}>
            <small>{company.sector}</small><strong>{company.name}</strong><span>{company.ticker}</span>
          </button>)}
          {!filtered.length && <p className="mapdeskEmpty">No entities match this filter.</p>}
        </div>
        <aside className="mapdeskInspector" aria-live="polite">
          <p className="eyebrow">ENTITY FOCUS</p>
          <h2>{selected.name}</h2>
          <div className="ticker">{selected.ticker} <span>• {selected.sector}</span></div>
          <dl><div><dt>Operating focus</dt><dd>{selected.role}</dd></div><div><dt>Current signal</dt><dd>{selected.signal}</dd></div><div><dt>Watch next</dt><dd>Programs, awards, leadership changes, and production disclosures.</dd></div></dl>
          <button className="inspectButton">Open entity dossier <span>↗</span></button>
        </aside>
      </section>

      <section className="mapdeskBottom">
        <div className="signalLedger"><div className="sectionLabel">DAILY SIGNAL LEDGER</div>{signalLanes.map(([lane, owner, title, note]) => <article key={lane}><div><span className="signalTag">{lane}</span><span className="signalOwner">{owner}</span></div><h3>{title}</h3><p>{note}</p><button>Queue research <span>→</span></button></article>)}</div>
        <aside className="mapdeskProtocol"><p className="eyebrow">OPERATING PROTOCOL</p><h2>Built for a disciplined daily read.</h2><ol><li>Scan official awards, budgets, filings, and program releases.</li><li>Log material entity and relationship changes.</li><li>Separate reported fact from analytic inference.</li><li>Promote only sourced signals into the map.</li></ol><p className="protocolFoot">Update cadence: daily<br />Coverage: public-source intelligence only</p></aside>
      </section>
    </main>
  );
}

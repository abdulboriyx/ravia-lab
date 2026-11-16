"use client";

import { useState } from "react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { actors, connections, hubs, lenses, sources } from "./network-data";
import type { Layer, Lens } from "./network-data";
import styles from "./page.module.css";

const colors: Record<Layer, string> = { policy: "#b9b3ff", funding: "#8bd6bd", procurement: "#efb17a" };
const layerNames: Record<Layer, string> = { policy: "Authority", funding: "Financing", procurement: "Procurement" };

export default function NetworkExplorer() {
  const [lens, setLens] = useState<Lens>("structure");
  const [filter, setFilter] = useState<Layer | "all">("all");
  const [selected, setSelected] = useState("f35");
  const [actor, setActor] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const current = lenses.find((item) => item.id === lens)!;
  const visible = connections.filter((edge) => (!current.ids || current.ids.includes(edge.id)) && (filter === "all" || edge.layer === filter));
  const nodeIds = new Set(visible.flatMap((edge) => [edge.from, edge.to]));
  const displayedActors = actors.filter((node) => nodeIds.has(node.id));
  const matches = new Set(displayedActors.filter((node) => `${node.name} ${node.role}`.toLowerCase().includes(query.toLowerCase())).map((node) => node.id));
  const relevant = visible.filter((edge) => (!actor || edge.from === actor || edge.to === actor) && (!query || matches.has(edge.from) || matches.has(edge.to)));
  const active = relevant.find((edge) => edge.id === selected) ?? relevant[0];
  const activeActor = actors.find((node) => node.id === actor);
  const source = active ? sources[active.source] : null;
  const chooseLens = (id: Lens) => { setLens(id); setFilter("all"); setActor(null); setQuery(""); };
  const chooseEdge = (id: string) => { setSelected(id); setActor(null); };

  return (
    <main className={styles.page}>
      <div className={styles.masthead}><Link href="/">Ravia / Research</Link><span>Defentech · Research atlas 001</span></div>
      <header className={styles.hero}>
        <div><p className={styles.eyebrow}>The U.S.–Israel military & technology network</p><h1>Power. Money.<br /><em>Technology.</em></h1></div>
        <div className={styles.intro}><p>Who authorizes it?<br />Who pays for it?<br />Who builds it?</p><span>A visual investigation in six parts.<br />Follow the relationships. Inspect the evidence.</span></div>
      </header>
      <div className={styles.scope}><span><i /> Sourced starter edition</span><span>Historical examples: 2016–2024 · Program guidance</span><Link href="/defentech/companies">Companies ↗</Link><Link href="/defentech/individual-politics">Individual Politics ↗</Link><a href="#method">How to read this ↗</a></div>
      <nav className={styles.lenses} aria-label="Research views">{lenses.map((item, index) => <button key={item.id} aria-pressed={lens === item.id} onClick={() => chooseLens(item.id)}><small>0{index + 1}</small>{item.name}</button>)}</nav>
      <section className={styles.explorer} aria-labelledby="lens-heading">
        <div className={styles.sectionHead}><div><p className={styles.eyebrow}>0{lenses.findIndex((item) => item.id === lens) + 1} / Explore the system</p><h2 id="lens-heading">{current.question}</h2><p>{current.summary}</p></div><span className={styles.counter}>{lens === "geography" ? "05 research regions" : `${displayedActors.length.toString().padStart(2, "0")} nodes / ${visible.length.toString().padStart(2, "0")} links`}</span></div>
        {lens === "geography" ? <div className={styles.geography}>
          <div className={styles.geoHeader}><span>U.S. regions</span><span>Israeli regions</span></div>
          <div className={styles.hubs}>{hubs.map((hub, index) => <article key={hub.name} className={styles.hub}><span className={styles.hubNumber}>0{index + 1}</span><small>{hub.region}</small><h3>{hub.name}</h3><strong>{hub.role}</strong><p>{hub.detail}</p></article>)}</div>
          <p className={styles.geoNote}>Schematic research index. Positions do not represent coordinates; no geographic relationship is asserted.</p>
        </div> : <div className={styles.workspace}>
          <div className={styles.graphArea}>
            <div className={styles.toolbar}><div className={styles.filters} aria-label="Relationship filters">{(["all", "policy", "funding", "procurement"] as const).map((value) => <button key={value} aria-pressed={filter === value} onClick={() => { setFilter(value); setActor(null); }}>{value === "all" ? "All links" : <><i style={{ background: colors[value] }} />{layerNames[value]}</>}</button>)}</div><label className={styles.search}><span className={styles.srOnly}>Find an actor</span><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => { setQuery(event.target.value); setActor(null); }} placeholder="Find an actor" type="search" /></label></div>
            <div className={styles.graphScroll} tabIndex={0} role="region" aria-label="Interactive network, scroll horizontally on small screens">
              <svg className={styles.network} viewBox="0 0 1150 590" aria-labelledby="network-title network-description">
                <title id="network-title">{`U.S.–Israel defense relationships — ${current.name}`}</title><desc id="network-description">Arrows show the direction of a labeled relationship, not necessarily the direction of money. Select a node or link. The same relationships are listed below the graph.</desc>
                <defs><pattern id="atlas-dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.7" fill="#43535e" opacity=".45" /></pattern>{Object.entries(colors).map(([name, color]) => <marker key={name} id={`arrow-${name}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M 0 0 L 8 4 L 0 8 z" fill={color} /></marker>)}</defs>
                <rect width="1150" height="590" fill="url(#atlas-dots)" />
                <text className={styles.columnLabel} x="60" y="574">U.S. AUTHORITY</text><text className={styles.columnLabel} x="600" y="574">FINANCING / PROCUREMENT</text><text className={styles.columnLabel} x="932" y="574">BUILDERS</text>
                {visible.map((edge) => {
                  const from = actors.find((node) => node.id === edge.from)!;
                  const to = actors.find((node) => node.id === edge.to)!;
                  const dx = to.x - from.x, dy = to.y - from.y;
                  const distance = Math.hypot(dx, dy);
                  const offset = Math.min(104 / (Math.abs(dx) / distance || .001), 38 / (Math.abs(dy) / distance || .001));
                  const path = edge.path ?? `M ${from.x + dx / distance * offset} ${from.y + dy / distance * offset} L ${to.x - dx / distance * offset} ${to.y - dy / distance * offset}`;
                  const emphasized = relevant.some((item) => item.id === edge.id);
                  return <g key={edge.id} className={styles.edge} style={{ opacity: emphasized ? 1 : .13, "--edge-color": colors[edge.layer] } as CSSProperties} role="button" tabIndex={0} aria-label={`${from.name} to ${to.name}: ${edge.label}. Show evidence.`} aria-pressed={active?.id === edge.id} onClick={() => chooseEdge(edge.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); chooseEdge(edge.id); } }}>
                    <path d={path} className={styles.edgeTarget} /><path d={path} className={styles.edgeLine} strokeWidth={active?.id === edge.id ? 2.8 : 1.35} markerEnd={`url(#arrow-${edge.layer})`} />
                    <rect x={edge.labelX - edge.label.length * 3.25 - 9} y={edge.labelY - 12} width={edge.label.length * 6.5 + 18} height="23" rx="4" className={styles.edgeLabelBg} /><text x={edge.labelX} y={edge.labelY + 3} className={styles.edgeLabel}>{edge.label}</text>
                  </g>;
                })}
                {displayedActors.map((node) => {
                  const connected = !actor || actor === node.id || relevant.some((edge) => edge.from === node.id || edge.to === node.id);
                  return <g key={node.id} className={styles.node} style={{ "--node-color": colors[node.group], opacity: connected && (!query || matches.has(node.id)) ? 1 : .22 } as CSSProperties} transform={`translate(${node.x}, ${node.y})`} role="button" tabIndex={0} aria-label={`${node.name}, ${node.role}. Highlight connections.`} aria-pressed={actor === node.id} onClick={() => setActor(actor === node.id ? null : node.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActor(actor === node.id ? null : node.id); } }}><rect x="-104" y="-36" width="208" height="72" rx="8" /><circle cx="-84" cy="-12" r="3.5" /><text x="-72" y="-7" className={styles.nodeName}>{node.name}</text><text x="-72" y="15" className={styles.nodeRole}>{node.role}</text></g>;
                })}
              </svg>
            </div>
            <div className={styles.graphFooter}><span>→ Labeled relationship · uniform line weights · no inferred links</span>{actor || query || filter !== "all" ? <button onClick={() => { setActor(null); setQuery(""); setFilter("all"); }}>Reset selection ↺</button> : <span>Select a node or arrow</span>}</div>
          </div>
          <aside className={styles.inspector} aria-label="Selected relationship evidence" aria-live="polite">
            <p className={styles.eyebrow}>The evidence</p>
            {activeActor && <div className={styles.actorDetail}><h3>{activeActor.name}</h3><p>{activeActor.description}</p></div>}
            {active && source ? <><span className={styles.recordType}>{layerNames[active.layer]} / {active.status}</span><h3>{actors.find((node) => node.id === active.from)?.name}<span>↓</span>{actors.find((node) => node.id === active.to)?.name}</h3><p className={styles.relationship}>{active.label}</p><p className={styles.detail}>{active.detail}</p><div className={styles.recordDate}><span>When</span><strong>{active.date}</strong></div><a className={styles.sourceLink} href={source.url} target="_blank" rel="noreferrer">{source.name}<span>Read primary source ↗ · {source.date}</span></a></> : <div className={styles.empty}><h3>No matching relationships</h3><p>Try a different actor or select “All links.”</p></div>}
          </aside>
          <details className={styles.edgeList}><summary>Browse {relevant.length} visible relationships as a list</summary><div>{relevant.map((edge) => <button key={edge.id} aria-pressed={active?.id === edge.id} onClick={() => chooseEdge(edge.id)}><span>{actors.find((node) => node.id === edge.from)?.name} → {actors.find((node) => node.id === edge.to)?.name}</span><strong>{edge.label} ↗</strong></button>)}</div></details>
        </div>}
        <div className={styles.openQuestion}><span>Still to investigate</span><p>{current.open}</p></div>
      </section>
      <section className={styles.fundingNote} aria-labelledby="framework-title"><div><p className={styles.eyebrow}>One framework, two funding streams</p><h2 id="framework-title">The 2016 commitment</h2><p>FY2019–2028 · subject to appropriations.<br />Historical pledge, not a live spending total.</p></div><div className={styles.fundingVisual}><div className={styles.fundingNumbers}><strong>$38B <small>total framework</small></strong><a href={sources.mou.url} target="_blank" rel="noreferrer">2016 source ↗</a></div><div className={styles.fundingBar} role="img" aria-label="Of the 38 billion dollar framework, 33 billion was FMF and 5 billion was missile defense"><span /><span /></div><div className={styles.fundingLabels}><span><i /> <strong>$33B</strong> FMF</span><span><i /> <strong>$5B</strong> Missile defense</span></div><p>Later supplemental appropriations are outside this figure. No current disbursement or delivery totals are shown.</p></div></section>
      <section className={styles.method} id="method" aria-labelledby="method-title"><div><p className={styles.eyebrow}>Read the map carefully</p><h2 id="method-title">Connections need evidence.<br /><em>Motives need more.</em></h2><p>Money, ideology, and power are starting hypotheses. Strategic interests and institutional incentives may also explain a relationship.</p></div><div className={styles.methodGrid}><article><span>01 / Facts</span><h3>A link is a specific claim.</h3><p>Each arrow has a mechanism, date or program context, and primary source. Positions and line thickness do not measure influence.</p></article><article><span>02 / Statements</span><h3>Stated motive ≠ established cause.</h3><p>Government announcements describe strategic and security goals. They document what officials say; they do not establish every participant’s motivation.</p></article><article><span>03 / Inference</span><h3>Association ≠ political influence.</h3><p>A donation, meeting, board seat, or shared belief alone does not prove that a policy decision was purchased.</p></article><article><span>04 / Open research</span><h3>Different money, different trails.</h3><p>Aid, contracts, investment, campaign finance, and lobbying remain separate. FMS and licensed commercial sales (DCS) are different channels; FMF is financing.</p></article></div></section>
      <section className={styles.records} aria-labelledby="records-title"><div><p className={styles.eyebrow}>The research ledger</p><h2 id="records-title">Every connection, traceable.</h2></div><p>Who → what → when → mechanism → stated motive → evidence.</p><details><summary>Sources & coverage <span>{Object.keys(sources).length} primary records ↗</span></summary><div className={styles.sourceGrid}>{Object.entries(sources).map(([id, item]) => <a key={id} href={item.url} target="_blank" rel="noreferrer"><strong>{item.name} ↗</strong><span>{item.date}</span></a>)}</div><p className={styles.coverage}>Selected historical examples, not a comprehensive or live database. Sales notifications describe possible sales; agreements do not establish payment, delivery, operational use, profit, or political influence. The six views are concise research outlines; full essays and verified company relationships remain open research. The company directory is available as a separate index.</p></details></section>
      <footer className={styles.footer}><Link href="/">Ravia</Link><span>Defentech / An investigation in progress</span><a href="#lens-heading">Back to the network ↑</a></footer>
    </main>
  );
}

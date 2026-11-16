"use client";

import { useState } from "react";
import Link from "next/link";
import people from "./people.json";
import { measures, timeline, type MeasureId } from "./records";
import s from "./politics.module.css";

type Person = typeof people[number];
function voteFor(person: Person, id: MeasureId) { return (person.votes as Partial<Record<MeasureId, string>>)[id]; }
function sourceLabel(url: string) {
  if (url.includes("youtube")) return "Watch video";
  if (url.includes("x.com")) return "Open original post";
  if (url.includes("thehill")) return "Read The Hill report";
  if (url.includes("cnn")) return "Watch CNN interview";
  if (url.includes("democrats-foreignaffairs")) return "Read committee statement";
  if (url.includes("scott.senate")) return "Read weapons resolution (PDF)";
  return url.includes("congress.gov") ? "Open congressional bill" : "Open bill record";
}

export default function PoliticsExplorer() {
  const [query, setQuery] = useState("");
  const [chamber, setChamber] = useState("All chambers");
  const [party, setParty] = useState("All parties");
  const [selectedId, setSelectedId] = useState("jeanne-shaheen");
  const visible = people.filter(p => (chamber === "All chambers" || p.chamber === chamber) && (party === "All parties" || p.party === party) && `${p.name} ${p.state} ${p.role}`.toLowerCase().includes(query.trim().toLowerCase()));
  const selected = visible.find(p => p.id === selectedId) ?? visible[0];
  const reset = () => { setQuery(""); setChamber("All chambers"); setParty("All parties"); };
  return <main className={s.page}>
    <nav className={s.nav} aria-label="Defentech navigation"><Link href="/defentech">← Defentech</Link><span>RESEARCH ATLAS / 02</span><a href="#people">Explore people ↘</a></nav>
    <header className={s.hero}><div><p className={s.kicker}>Authority has a human face</p><h1>Individual<br /><em>Politics.</em></h1><p className={s.intro}>Who voted. What they backed.<br />Where the evidence leads.</p></div><div className={s.heroGraphic} aria-hidden="true"><div className={s.rings}/><span className={s.nodeTop}>PEOPLE</span><div className={s.diagramLine}/><div className={s.nodeRow}><span>VOTES</span><span>BILLS</span><span>STATEMENTS</span></div><p>Follow the record, one person at a time.</p></div></header>
    <div className={s.stats}><div><strong>31</strong><span>People in your notes</span></div><div><strong>49</strong><span>Verified vote records</span></div><div><strong>03</strong><span>Roll calls compared</span></div><p>U.S. military assistance & arms transfers to Israel<br /><span>Historical records · 2021–2026 source material</span></p></div>

    <section className={s.section} aria-labelledby="votes-title"><div className={s.sectionHead}><div><p className={s.kicker}>01 / Read the vote correctly</p><h2 id="votes-title">Three votes. Different questions.</h2></div><span className={s.small}>Full-chamber totals, including people outside these notes</span></div>
      <div className={s.voteCards}>{measures.map(m => <article className={s.voteCard} key={m.id}><div className={s.cardMeta}><span>{m.chamber} / {m.date}</span><span>{m.short}</span></div><h3>{m.title}</h3><div className={s.voteTotal}><strong>{m.yes}<small>YEA</small></strong><span> / </span><strong>{m.no}<small>NAY</small></strong></div><div className={s.bar} role="img" aria-label={`${m.yes} yea, ${m.no} nay, ${m.other} present or not voting`}><i style={{flex:m.yes}}/><i style={{flex:m.no}}/><i style={{flex:m.other}}/></div><div className={s.legend}><span>● Yea</span><span>● Nay</span><span>● Other {m.other}</span></div><b>{m.outcome}</b><p>{m.explanation}</p><a href={m.url} target="_blank" rel="noreferrer">Read official roll call ↗</a></article>)}</div>
    </section>

    <section className={s.section} id="people" aria-labelledby="people-title"><div className={s.sectionHead}><div><p className={s.kicker}>02 / Compare the individual records</p><h2 id="people-title">People behind the decisions.</h2></div><span className={s.small}>Select a name to explore their evidence</span></div>
      <div className={s.toolbar}><label className={s.search}><span>Search people</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Name, state, or role…"/></label><label><span>Chamber</span><select value={chamber} onChange={e=>setChamber(e.target.value)}>{["All chambers","House","Senate"].map(v=><option key={v}>{v}</option>)}</select></label><label><span>Party</span><select value={party} onChange={e=>setParty(e.target.value)}>{["All parties","Democrat","Republican"].map(v=><option key={v}>{v}</option>)}</select></label><button className={s.reset} onClick={reset}>Reset filters ↺</button></div>
      <div className={s.results} aria-live="polite">{visible.length} of 31 people · YEA / NAY are recorded votes · — means other chamber</div>
      <div className={s.explorer}><div className={s.matrixWrap}><table className={s.matrix}><caption className={s.srOnly}>Verified votes for the people in the supplied notes. Each vote links to its official record.</caption><thead><tr><th scope="col">Person / party / state</th>{measures.map(m=><th key={m.id} scope="col"><a href={m.url} target="_blank" rel="noreferrer">{m.short} ↗</a><small>{m.id === "aid" ? "Assistance" : m.id === "delivery" ? "Deliveries" : "Advance restriction"}</small></th>)}</tr></thead><tbody>{visible.map(p=><tr key={p.id} className={selected?.id === p.id ? s.selectedRow : undefined}><th scope="row"><button onClick={()=>setSelectedId(p.id)} aria-pressed={selected?.id === p.id}><span className={s.partyDot} data-party={p.party}/><span><strong>{p.name}</strong><small>{p.party} · {p.state}</small></span><span aria-hidden="true">↗</span></button></th>{measures.map(m=><td key={m.id}>{voteFor(p,m.id) ? <a className={voteFor(p,m.id)==="Yea" ? s.yea : s.nay} href={m.url} target="_blank" rel="noreferrer" aria-label={`${p.name}: ${voteFor(p,m.id)} on ${m.short}. Open official roll call.`}>{voteFor(p,m.id)?.toUpperCase()} ↗</a> : <span className={s.dash} aria-label="Other chamber">—</span>}</td>)}</tr>)}</tbody></table>{!visible.length && <div className={s.empty}><h3>No matching people.</h3><p>Try another name or state.</p><button onClick={reset}>Clear filters</button></div>}</div>
      {selected && <aside className={s.inspector} aria-label="Selected person evidence"><div className={s.personMeta}><span>{selected.chamber} / {selected.party}</span><span>{selected.state}</span></div><h3>{selected.name}</h3><p className={s.role}>Role in supplied notes: {selected.role}</p>{selected.id==="jim-risch" && <p className={s.note}>The note “James Ritch” is interpreted here as Jim Risch. Confirm the identity if you intended someone else.</p>}
        <div className={s.path}><span>PERSON</span><i>→</i><span>ACTION</span><i>→</i><span>SOURCE</span></div><h4>Verified roll calls</h4>{measures.filter(m=>voteFor(selected,m.id)).map(m=><a className={s.voteEvidence} href={m.url} key={m.id} target="_blank" rel="noreferrer"><span>{m.date} / {m.short} ↗</span><strong>{voteFor(selected,m.id)?.toUpperCase()} · {m.id === "restriction" ? voteFor(selected,m.id)==="Yea" ? "Advance restriction" : "Oppose advancing restriction" : m.id === "aid" ? voteFor(selected,m.id)==="Yea" ? "Pass assistance bill" : "Oppose assistance bill" : voteFor(selected,m.id)==="Yea" ? "Pass delivery bill" : "Oppose delivery bill"}</strong></a>)}
        {!!selected.claims.length && <><h4>Actions in the supplied notes</h4><p className={s.note}>Sponsorship and context below are transcribed research claims. Vote cells above are independently checked against official records.</p><ol className={s.events}>{selected.claims.map((c,i)=><li key={i}><time>{c.date}</time><p>{selected.id==="kay-granger" && c.text.startsWith("Introduced H.R. 6126") ? "Introduced H.R. 6126. The official introduction date is November 1, 2023; the supplied date is corrected in the timeline below." : c.text}</p>{selected.links.filter(u=>c.text.includes("8369") ? u.includes("8369") || u.includes("2024217") : c.text.includes("8034") ? u.includes("8034") || u.includes("2024152") : c.text.includes("6126") ? u.includes("6126") : c.text.includes("5323") ? u.includes("5323") : c.text.includes("111") ? u.includes("00292") : u.includes("scott.senate")).map(u=><a key={u} href={u} target="_blank" rel="noreferrer">Related source ↗</a>)}</li>)}</ol></>}
        <h4>Source library</h4><div className={s.sourceLinks}>{selected.links.map(u=><a key={u} href={u} target="_blank" rel="noreferrer"><span>{sourceLabel(u)} ↗</span><small>{new URL(u).hostname.replace("www.","")}</small></a>)}{!selected.links.length && <p className={s.note}>No source URL was supplied for this person. The verified roll call is linked above.</p>}</div>
      </aside>}
      </div>
    </section>

    <section className={s.section} aria-labelledby="timeline-title"><div className={s.sectionHead}><div><p className={s.kicker}>03 / Follow the legislation</p><h2 id="timeline-title">From funding to restrictions.</h2></div><span className={s.small}>A selected legislative timeline</span></div><div className={s.timeline}>{timeline.map((event,i)=><a href={event.url} target="_blank" rel="noreferrer" key={event.bill}><span className={s.timelinePoint}>{String(i+1).padStart(2,"0")}</span><time>{event.date}</time><small>{event.bill}</small><h3>{event.title} ↗</h3><p>{event.text}</p></a>)}</div></section>
    <footer className={s.footer}><div><p className={s.kicker}>About this research</p><p>These 31 people come from the supplied notes and are a selected sample, not all members of Congress. Votes were checked against House roll calls 152 and 217 and Senate roll call 292 (118th Congress). Party, state, and roles describe historical records or supplied notes, not a current officeholder directory. Source links open in a new tab.</p><p>Statements, sponsorships, and votes are different forms of evidence. The notes’ two embedded image references were not attached; their companion links are preserved. No political score or company influence is inferred.</p></div><Link href="/defentech">Back to Defentech ↗</Link></footer>
  </main>;
}

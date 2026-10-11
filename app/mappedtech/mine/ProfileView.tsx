import Link from "next/link";
import { awards, entities, links, people, reviewedAt, type Entity, type Person, type Source } from "./atlas-data";
import { biographies } from "./profile-content";
import "./atlas.css";
import "./profile.css";

const base = "/mappedtech/mine";
export const organizationPath = (id: string) => `${base}/organizations/${id}/`;
export const personPath = (id: string) => `${base}/people/${id}/`;
const sourceLink = (source: Source) => <a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a>;
const organization = (name: string) => entities.find(entity => entity.name === name);

function Frame({ kind, name, subline, children }: { kind: string; name: string; subline: string; children: React.ReactNode }) {
  return <main className="atlas atlas-profile"><div className="atlas-shell">
    <header className="atlas-top"><Link className="atlas-brand" href={base + "/"}><span className="atlas-orbit">◈</span><span><b>MAPPED<span>TECH</span></b><small>US DEFENSE ECOSYSTEM ATLAS</small></span></Link><span className="atlas-top-right"><span className="atlas-led"/> PUBLIC-SOURCE DOSSIER <i/> REVIEWED {reviewedAt}</span></header>
    <div className="atlas-profile-breadcrumb"><Link href={base + "/"}>← BACK TO ATLAS</Link><span>/</span><span>{kind.toUpperCase()} PROFILE</span></div>
    <section className="atlas-profile-hero"><p className="atlas-eyebrow">MAPPEDTECH / {kind.toUpperCase()} DOSSIER</p><h1>{name}<span className="atlas-cursor">_</span></h1><p>{subline}</p></section>
    {children}
    <footer className="atlas-footer"><span>MAPPEDTECH / RESEARCH ATLAS · PUBLIC SOURCES</span><span>REVIEWED {reviewedAt} · NOT A LIVE FEED</span></footer>
  </div></main>;
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return <section className="atlas-profile-section"><div className="atlas-section-head"><h2>{title}</h2>{count !== undefined && <span>{count} RECORDS</span>}</div>{children}</section>;
}

export function PersonProfile({ person }: { person: Person }) {
  const biography = biographies[person.id];
  const employer = organization(person.organization);
  const sourceSet = new Map<string, Source>();
  sourceSet.set(person.source.url, person.source);
  biography?.education.concat(biography.career).forEach(item => sourceSet.set(item.source.url, item.source));
  return <Frame kind="person" name={person.name} subline={`${person.role} · ${person.organization}`}>
    <div className="atlas-profile-layout"><article>
      <Section title="Biography"><div className="atlas-prose"><p>{person.name} is {person.role.toLowerCase()} at {person.id === "ortberg" ? "Boeing" : person.organization}. {person.remit} {person.background}</p><p>This profile summarizes publicly documented roles and education. It does not infer undisclosed credentials, responsibilities or access.</p></div></Section>
      <Section title="Education" count={biography?.education.length ?? 0}>{biography?.education.length ? <div className="atlas-fact-list">{biography.education.map((item, index) => <div className="atlas-fact" key={index}><span className="atlas-fact-index">0{index + 1}</span><div><p>{item.text}</p>{sourceLink(item.source)}</div></div>)}</div> : <p className="atlas-profile-empty">No education details were stated in the public sources reviewed for this profile.</p>}</Section>
      <Section title="Career & work" count={biography?.career.length ?? 0}><div className="atlas-fact-list">{(biography?.career ?? []).map((item, index) => <div className="atlas-fact" key={index}><span className="atlas-fact-index">0{index + 1}</span><div><p>{item.text}</p>{sourceLink(item.source)}</div></div>)}</div></Section>
      {employer && <Section title="Organization"><Link className="atlas-profile-row" href={organizationPath(employer.id)}><span><strong>{employer.name}</strong><small>{employer.kind} · {employer.sector}</small></span><b>OPEN DOSSIER ↗</b></Link></Section>}
      <Section title="Primary sources" count={sourceSet.size}><div className="atlas-profile-sources">{[...sourceSet.values()].map(source => <div key={source.url}>{sourceLink(source)}<small>{new URL(source.url).hostname}</small></div>)}</div></Section>
    </article><aside className="atlas-profile-rail"><div className="atlas-rail-label">PERSONNEL FILE</div><div className="atlas-rail-stat"><small>CURRENT ROLE</small><strong>{person.role}</strong></div><div className="atlas-rail-stat"><small>ORGANIZATION</small>{employer ? <Link href={organizationPath(employer.id)}>{employer.name} ↗</Link> : <strong>{person.organization}</strong>}</div><div className="atlas-rail-stat"><small>PUBLIC CAREER RECORDS</small><strong>{biography?.career.length ?? 0}</strong></div><div className="atlas-rail-stat"><small>EDUCATION RECORDS</small><strong>{biography?.education.length ?? 0}</strong></div><p className="atlas-rail-note">Biographical details are attributed to the linked organization, government or company biographies. A missing field means unverified in this curated set, not that it does not exist.</p></aside></div>
  </Frame>;
}

export function OrganizationProfile({ entity }: { entity: Entity }) {
  const relatedPeople = people.filter(person => person.organization === entity.name);
  const relatedAwards = awards.filter(award => award.company === entity.name || award.agency === entity.name);
  const relatedLinks = links.filter(link => link.from === entity.id || link.to === entity.id);
  const investors = relatedLinks.filter(link => link.type === "investment");
  const otherLinks = relatedLinks.filter(link => link.type !== "investment");
  const sources = new Map<string, Source>(entity.sources.map(source => [source.url, source]));
  relatedAwards.forEach(award => sources.set(award.source.url, award.source));
  relatedLinks.forEach(link => sources.set(link.source.url, link.source));
  return <Frame kind={entity.kind} name={entity.name} subline={`${entity.sector} · ${entity.kind} profile`}>
    <div className="atlas-profile-layout"><article>
      <Section title="Organization biography"><div className="atlas-prose"><p>{entity.summary}</p><p>In this atlas, {entity.name} is mapped within {entity.sector.toLowerCase()}. Its documented activity is traced through the people, procurement records, capital disclosures and relationships below. These are selected public records, not a complete corporate history or ownership register.</p><div className="atlas-profile-tags">{entity.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div><div className="atlas-profile-inline-source">PROFILE BASIS · {entity.sources.map(source => <span key={source.url}>{sourceLink(source)}</span>)}</div></Section>
      <Section title="Key people" count={relatedPeople.length}>{relatedPeople.length ? <div className="atlas-profile-list">{relatedPeople.map(person => <Link className="atlas-profile-row" href={personPath(person.id)} key={person.id}><span><strong>{person.name}</strong><small>{person.role} · {person.background}</small></span><b>OPEN BIOGRAPHY ↗</b></Link>)}</div> : <p className="atlas-profile-empty">No individual biography is indexed for this organization yet.</p>}</Section>
      <Section title="Award & program record" count={relatedAwards.length}>{relatedAwards.length ? <div className="atlas-profile-list">{relatedAwards.map(award => <div className="atlas-profile-record" key={award.id}><div><span className="atlas-kind">{award.classification} · {award.date}</span><h3>{award.title}</h3><p>{award.scope}</p><small>{award.company} ↔ {award.agency}</small></div><div className="atlas-profile-record-side"><strong>{award.value}</strong>{sourceLink(award.source)}</div><p className="atlas-profile-record-detail">{award.detail}</p></div>)}</div> : <p className="atlas-profile-empty">No award or program record is indexed for this organization in the current curated set.</p>}</Section>
      {investors.length > 0 && <Section title="Disclosed capital links" count={investors.length}><div className="atlas-profile-list">{investors.map(link => { const other = entities.find(item => item.id === (link.from === entity.id ? link.to : link.from)); return <div className="atlas-profile-record" key={link.id}><div><span className="atlas-kind">INVESTMENT DISCLOSURE</span><h3>{other ? <Link href={organizationPath(other.id)}>{other.name} ↗</Link> : "Investor"}</h3><p>{link.description}</p></div><div className="atlas-profile-record-side">{sourceLink(link.source)}</div></div>; })}</div><p className="atlas-profile-caveat">Disclosed investment is not a complete or current shareholder list. IQT portfolio ties do not establish a direct CIA contract.</p></Section>}
      <Section title="Other documented relationships" count={otherLinks.length}>{otherLinks.length ? <div className="atlas-profile-list">{otherLinks.map(link => { const other = entities.find(item => item.id === (link.from === entity.id ? link.to : link.from)); return <div className="atlas-profile-record" key={link.id}><div><span className="atlas-kind">{link.type}</span><h3>{other ? <Link href={organizationPath(other.id)}>{other.name} ↗</Link> : "Related organization"}</h3><p>{link.description}</p></div><div className="atlas-profile-record-side">{sourceLink(link.source)}</div></div>; })}</div> : <p className="atlas-profile-empty">No other direct relationship is indexed in this curated network.</p>}</Section>
      <Section title="Evidence & sources" count={sources.size}><div className="atlas-profile-sources">{[...sources.values()].map(source => <div key={source.url}>{sourceLink(source)}<small>{new URL(source.url).hostname}</small></div>)}</div></Section>
    </article><aside className="atlas-profile-rail"><div className="atlas-rail-label">ORGANIZATION FILE</div><div className="atlas-rail-stat"><small>CLASSIFICATION</small><strong>{entity.kind}</strong></div><div className="atlas-rail-stat"><small>FOCUS</small><strong>{entity.sector}</strong></div><div className="atlas-rail-stat"><small>PEOPLE</small><strong>{relatedPeople.length}</strong></div><div className="atlas-rail-stat"><small>AWARD / PROGRAM RECORDS</small><strong>{relatedAwards.length}</strong></div><div className="atlas-rail-stat"><small>DOCUMENTED LINKS</small><strong>{relatedLinks.length}</strong></div><p className="atlas-rail-note">Relationships reflect the exact disclosures cited. Contract ceilings, budget requests and proposed sales are not treated as realized revenue.</p></aside></div>
  </Frame>;
}

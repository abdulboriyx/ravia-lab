"use client";

import Link from "next/link";
import { useRef, useState } from "react";

const destinations = [
  { title: "Home", href: "/", detail: "Exploring minds, intelligence, and computation" },
  { title: "About", href: "/about", detail: "Mission and interests" },
  { title: "Research", href: "/research", detail: "Questions and ongoing investigations" },
  { title: "Publications", href: "/publications", detail: "Essays and reports" },
  { title: "Projects", href: "/projects", detail: "Models and experiments" },
  { title: "Lab Notebook", href: "/lab-notebook", detail: "Notes from the process" },
  { title: "CV", href: "/cv", detail: "Background and methods" }
];

export function SiteControls() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const matches = destinations.filter((item) =>
    `${item.title} ${item.detail}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  function toggleTheme() {
    const root = document.documentElement;
    const next = root.dataset.siteTheme === "dark" ? "light" : "dark";
    root.dataset.siteTheme = next;
    root.style.colorScheme = next;
    window.localStorage.setItem("ravia-theme", next);
  }

  return (
    <div className="siteControls">
      <button className="iconButton" type="button" aria-label="Search site" onClick={() => dialogRef.current?.showModal()}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.7" cy="10.7" r="6.7"/><path d="m16 16 5 5"/></svg>
      </button>
      <button className="iconButton themeIcon" type="button" aria-label="Toggle color theme" onClick={toggleTheme}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 1.5v3m0 15v3M1.5 12h3m15 0h3M4.6 4.6l2.1 2.1m10.6 10.6 2.1 2.1m0-14.8-2.1 2.1M6.7 17.3l-2.1 2.1"/></svg>
      </button>
      <dialog className="searchDialog" ref={dialogRef} onClose={() => setQuery("")} onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current?.close(); }}>
        <div className="searchPanel">
          <div className="searchHeading"><span>Explore Ravia</span><button type="button" aria-label="Close search" onClick={() => dialogRef.current?.close()}>×</button></div>
          <label htmlFor="site-search">Find a section</label>
          <input id="site-search" type="search" autoComplete="off" placeholder="Search the site…" value={query} onChange={(event) => setQuery(event.target.value)} />
          <ul>
            {matches.map((item) => <li key={item.href}><Link href={item.href} onClick={() => dialogRef.current?.close()}><strong>{item.title}</strong><span>{item.detail}</span><span aria-hidden="true">↗</span></Link></li>)}
          </ul>
          {matches.length === 0 && <p className="searchEmpty">No matching section.</p>}
        </div>
      </dialog>
    </div>
  );
}

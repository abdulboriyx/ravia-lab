import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sectionPages, type SectionSlug } from "../section-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(sectionPages).map((section) => ({ section }));
}

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const { section } = await params;
  if (!(section in sectionPages)) return {};
  const page = sectionPages[section as SectionSlug];
  return { title: `${page.title} | Ravia`, description: page.lead };
}

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!(section in sectionPages)) notFound();
  const page = sectionPages[section as SectionSlug];
  return <main className="interiorPage"><p className="interiorIndex">{page.number} / {page.title}</p><p className="eyebrow">{page.eyebrow}</p><h1>{page.title}</h1><p className="interiorLead">{page.lead}</p><div className="interiorRule"/><p>{page.body}</p><Link className="backLink" href="/">← Return to the index</Link></main>;
}

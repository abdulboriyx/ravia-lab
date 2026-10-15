import { notFound } from "next/navigation";
import { people } from "../../atlas-data";
import { PersonProfile } from "../../ProfileView";

export const dynamicParams = false;
export function generateStaticParams() { return people.map(person => ({ id: person.id })); }
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const person = people.find(item => item.id === id); return { title: person ? `${person.name} | MappedTech` : "Profile not found", robots: { index: false, follow: false } }; }
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const person = people.find(item => item.id === id); if (!person) notFound(); return <PersonProfile person={person} />; }

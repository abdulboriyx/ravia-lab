import { notFound } from "next/navigation";
import { entities } from "../../atlas-data";
import { OrganizationProfile } from "../../ProfileView";

export const dynamicParams = false;
export function generateStaticParams() { return entities.map(entity => ({ id: entity.id })); }
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const entity = entities.find(item => item.id === id); return { title: entity ? `${entity.name} | MappedTech` : "Profile not found", robots: { index: false, follow: false } }; }
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const entity = entities.find(item => item.id === id); if (!entity) notFound(); return <OrganizationProfile entity={entity} />; }

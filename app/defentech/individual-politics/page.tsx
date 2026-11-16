import type { Metadata } from "next";
import PoliticsExplorer from "./PoliticsExplorer";

export const metadata: Metadata = {
  title: "Individual Politics — Defentech | Ravia",
  description: "Explore 31 people from the research notes through verified congressional votes, a legislative timeline, and linked evidence."
};

export default function IndividualPoliticsPage() {
  return <PoliticsExplorer />;
}

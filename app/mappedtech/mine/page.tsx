import type { Metadata } from "next";
import { DefenseEcosystemMap } from "./DefenseEcosystemMap";
import "./map.css";
import "./records.css";

export const metadata: Metadata = {
  title: "MappedTech — US Defense Ecosystem",
  description: "Private research map for the US defense ecosystem.",
  robots: { index: false, follow: false, nocache: true }
};

export default function MappedTechMinePage() {
  const briefingDate = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/New_York"
  }).format(new Date()).toUpperCase();

  return <DefenseEcosystemMap briefingDate={briefingDate} />;
}

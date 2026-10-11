import type { Metadata } from "next";
import { AtlasExperience } from "./AtlasExperience";
import "./atlas.css";
import "./atlas-graph.css";

export const metadata: Metadata = {
  title: "MappedTech — US Defense Ecosystem",
  description: "Sourced research atlas of the US defense technology ecosystem.",
  robots: { index: false, follow: false, nocache: true }
};

export default function MappedTechMinePage() {
  return <AtlasExperience />;
}

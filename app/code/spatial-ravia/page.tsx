import type { Metadata } from "next";
import { DnaMolecularView } from "./DnaMolecularView";

export const metadata: Metadata = {
  title: "Spatial Ravia | Ravia Lab",
  description:
    "A conversational scientific world-model system for interactive scientific representations."
};

export default function SpatialRaviaPage() {
  return <DnaMolecularView />;
}

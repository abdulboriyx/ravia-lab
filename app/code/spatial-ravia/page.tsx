import type { Metadata } from "next";
import { SpatialRaviaPrototype } from "./prototype";

export const metadata: Metadata = {
  title: "Spatial Ravia | Ravia Lab",
  description:
    "A conversational scientific world-model system for interactive scientific representations."
};

export default function SpatialRaviaPage() {
  return <SpatialRaviaPrototype />;
}

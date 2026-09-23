import type { Metadata } from "next";
import { LightStudy } from "./LightStudy";

export const metadata: Metadata = {
  title: "Interactive Study | Scina",
  description: "Explore the properties of light through interactive wave and optics diagrams."
};

export default function InteractiveStudyPage() {
  return <LightStudy />;
}

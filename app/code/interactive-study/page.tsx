import type { Metadata } from "next";
import { LightStudy } from "./LightStudy";

export const metadata: Metadata = {
  title: "Interactive Study | Scina",
  description: "Explore light, optics, and the structure of the eye through interactive diagrams."
};

export default function InteractiveStudyPage() {
  return <LightStudy />;
}

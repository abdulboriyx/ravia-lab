import type { Metadata } from "next";
import { PersonalizedBciResearchReport } from "../ResearchReport";

export const metadata: Metadata = {
  title: "Research #2: Personalized BCI for mental health | Ravia",
  description: "An evidence-led research report on EEG generalization, longitudinal stability, anxiety measurement, and rapid personalization."
};

export default function PersonalizedBciForMentalHealthPage() {
  return <PersonalizedBciResearchReport />;
}

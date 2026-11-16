import type { Metadata } from "next";
import CompaniesExplorer from "./CompaniesExplorer";

export const metadata: Metadata = {
  title: "Companies — Defentech | Ravia",
  description: "Explore defense and technology companies, their capabilities, people, and the U.S. military aid framework."
};

export default function CompaniesPage() {
  return <CompaniesExplorer />;
}

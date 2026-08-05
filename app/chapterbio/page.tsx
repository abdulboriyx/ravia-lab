import type { Metadata } from "next";
import { ChapterBioEmbed } from "./ChapterBioEmbed";

export const metadata: Metadata = {
  title: "Chapter 7: DNA, RNA, Protein | Ravia Lab",
  description:
    "Interactive study prototype for Chapter 7 figures, tracing genetic information from DNA through RNA into protein."
};

export default function ChapterBioPage() {
  return (
    <main className="chapterBioHost" aria-label="ChapterBio figure studio">
      <ChapterBioEmbed />
    </main>
  );
}

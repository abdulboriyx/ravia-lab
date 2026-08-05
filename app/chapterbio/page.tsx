import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chapter 7: DNA, RNA, Protein | Ravia Lab",
  description:
    "Interactive study prototype for Chapter 7 figures, tracing genetic information from DNA through RNA into protein."
};

export default function ChapterBioPage() {
  return (
    <main className="chapterBioHost" aria-label="ChapterBio figure studio">
      <link rel="stylesheet" href="/chapterbio/assets/index-Jp-0-yMw.css" />
      <div id="root" />
      <script type="module" src="/chapterbio/assets/index-DPg_OcaF.js" />
    </main>
  );
}

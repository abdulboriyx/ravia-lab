export type EntryType =
  | "Paper"
  | "Essay"
  | "Research note"
  | "Argument"
  | "Code"
  | "Project"
  | "Fragment";

export type ArchiveEntry = {
  date: string;
  type: EntryType;
  title: string;
  description: string;
  href?: string;
  status?: "available" | "planned";
};

export const archiveEntries: ArchiveEntry[] = [
  {
    date: "2026-08-04",
    type: "Code",
    title: "Scina",
    description:
      "A conversational scientific world-model system for turning questions into interactive scientific representations.",
    href: "/code/spatial-ravia"
  },
  {
    date: "2026-07-31",
    type: "Code",
    title: "Chapter 7: DNA, RNA, Protein",
    description:
      "Interactive study prototype for Chapter 7 figures, tracing genetic information from DNA through RNA into protein.",
    href: "/chapterbio/"
  },
  {
    date: "2026-07-17",
    type: "Fragment",
    title: "What the hell is going on?",
    description:
      "The standing question behind the archive: reality outside, consciousness inside, and the failure of easy explanations.",
    status: "planned"
  },
  {
    date: "2026-06-28",
    type: "Project",
    title: "Civic weather station",
    description:
      "A prototype for tracking institutional signals, political pressure, scientific claims, and cultural shocks.",
    status: "planned"
  },
  {
    date: "2026-04-03",
    type: "Code",
    title: "Signal notebook",
    description:
      "Small scripts for collecting, labeling, and revisiting public data without pretending the labels are neutral.",
    status: "planned"
  },
  {
    date: "2026-09-08",
    type: "Paper",
    title: "Personalized BCI",
    description: "EEG generalization, anxiety measurement, longitudinal stability, and a research roadmap for rapid personalization.",
    href: "/papers/research"
  },
  {
    date: "2026-09-08",
    type: "Paper",
    title: "Biomarkers for pscyhiatry",
    description: "Research page for biomarkers in psychiatry.",
    href: "/papers/biomarkers-for-pscyhiatry"
  },
  {
    date: "2026-09-10",
    type: "Research note",
    title: "Unequal Research",
    description: "A research note on unequal research.",
    href: "/papers/unequal-research"
  },
  {
    date: "2025-08-22",
    type: "Fragment",
    title: "Faith after certainty",
    description:
      "Unfinished thoughts on belief, discipline, doubt, and whether faith can survive without false closure.",
    status: "planned"
  }
];

const paperTypes: EntryType[] = ["Paper", "Essay", "Research note", "Argument"];
const codeTypes: EntryType[] = ["Code", "Project"];

export const papersEntries = archiveEntries.filter((entry) =>
  paperTypes.includes(entry.type)
);

export const codeEntries = archiveEntries.filter((entry) =>
  codeTypes.includes(entry.type)
);

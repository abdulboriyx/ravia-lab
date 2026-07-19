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
  href: string;
};

export const archiveEntries: ArchiveEntry[] = [
  {
    date: "2026-07-17",
    type: "Fragment",
    title: "What the hell is going on?",
    description:
      "The standing question behind the archive: reality outside, consciousness inside, and the failure of easy explanations.",
    href: "/fragments/what-the-hell-is-going-on"
  },
  {
    date: "2026-06-28",
    type: "Project",
    title: "Civic weather station",
    description:
      "A prototype for tracking institutional signals, political pressure, scientific claims, and cultural shocks.",
    href: "/projects/civic-weather-station"
  },
  {
    date: "2026-05-12",
    type: "Argument",
    title: "Reality has a user interface problem",
    description:
      "A claim about feeds, dashboards, metrics, language, and the surfaces that teach us what counts as real.",
    href: "/arguments/reality-has-a-user-interface-problem"
  },
  {
    date: "2026-04-03",
    type: "Code",
    title: "Signal notebook",
    description:
      "Small scripts for collecting, labeling, and revisiting public data without pretending the labels are neutral.",
    href: "/code/signal-notebook"
  },
  {
    date: "2026-02-19",
    type: "Research note",
    title: "Memory is not storage",
    description:
      "Notes on recollection, identity drift, emotional revision, and memory as reconstruction rather than retrieval.",
    href: "/notes/memory-is-not-storage"
  },
  {
    date: "2025-12-06",
    type: "Essay",
    title: "The institutions are tired",
    description:
      "A draft map of legitimacy, bureaucracy, spectacle, and systems that continue after belief goes missing.",
    href: "/essays/the-institutions-are-tired"
  },
  {
    date: "2025-10-14",
    type: "Paper",
    title: "Desire as an operating system",
    description:
      "A formal attempt to describe motivation, compulsion, avoidance, appetite, and repeated behavior.",
    href: "/papers/desire-as-an-operating-system"
  },
  {
    date: "2025-08-22",
    type: "Fragment",
    title: "Faith after certainty",
    description:
      "Unfinished thoughts on belief, discipline, doubt, and whether faith can survive without false closure.",
    href: "/fragments/faith-after-certainty"
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

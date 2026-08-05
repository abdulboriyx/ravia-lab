import Link from "next/link";
import type { ArchiveEntry } from "@/data/archive";

type ArchiveListProps = {
  entries: ArchiveEntry[];
};

export function ArchiveList({ entries }: ArchiveListProps) {
  return (
    <ol className="archiveList">
      {entries.map((entry) => (
        <li className="archiveRow" key={`${entry.date}-${entry.title}`}>
          <time dateTime={entry.date}>{formatDate(entry.date)}</time>
          <span className="archiveType">{entry.type}</span>
          {entry.href ? (
            <Link className="archiveTitle" href={entry.href}>
              {entry.title}
            </Link>
          ) : (
            <span className="archiveTitle archiveTitleUnavailable">
              {entry.title}
            </span>
          )}
          <p>{entry.description}</p>
          {entry.href ? (
            <Link className="archiveArrow" href={entry.href} aria-label={`Open ${entry.title}`}>
              -&gt;
            </Link>
          ) : (
            <span className="archiveStatus" aria-label={`${entry.title} is planned`}>
              Planned
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

function formatDate(value: string) {
  return value.replaceAll("-", ".");
}

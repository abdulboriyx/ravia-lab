#!/usr/bin/env python3
"""Human-only eligibility review for a real, locally generated pilot candidate file."""
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data_deidentified/pilot_candidates.csv"
OUTPUT = ROOT / "data_deidentified/PILOT_SCREENING_LOG.csv"

if not SOURCE.exists():
    raise SystemExit("No pilot candidates exist. Collect approved API records and run `python analysis/reddit_stage1.py pilot` first.")

with SOURCE.open(newline="", encoding="utf-8") as input_file:
    rows = list(csv.DictReader(input_file))

for index, row in enumerate(rows, start=1):
    if row.get("eligibility_status") in {"include", "exclude", "uncertain"}:
        continue
    print(f"\n[{index}/{len(rows)}] {row['research_post_id']} · r/{row['subreddit']} · {row['time_stratum']}")
    print("TITLE:", row["title"])
    print("TEXT:\n", row["text"])
    while True:
        decision = input("Decision [i]nclude / [e]xclude / [u]ncertain / [q]uit: ").strip().lower()
        mapping = {"i": "include", "e": "exclude", "u": "uncertain"}
        if decision == "q":
            break
        if decision in mapping:
            row["eligibility_status"] = mapping[decision]
            row["exclusion_reason"] = input("Reason (required for exclude; optional otherwise): ").strip()
            row["reviewer_notes"] = input("Reviewer notes (optional): ").strip()
            break
    if decision == "q":
        break

with OUTPUT.open("w", newline="", encoding="utf-8") as output_file:
    writer = csv.DictWriter(output_file, fieldnames=rows[0].keys())
    writer.writeheader(); writer.writerows(rows)
print(f"Saved human review progress to {OUTPUT}")

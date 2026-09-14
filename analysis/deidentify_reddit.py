"""Local-only de-identification helpers for the Reddit research protocol.

This tool never downloads data. It expects local JSONL input and writes de-identified
JSONL only when explicitly run. Keep both input and output outside Git.
"""

from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import re
from pathlib import Path
from typing import Any


REPLACEMENTS: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"https?://[^\s]+|www\.[^\s]+", re.I), "[URL]"),
    (re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b"), "[EMAIL]"),
    (re.compile(r"(?:https?://(?:www\.)?reddit\.com)?/?(?:u|user)/[\w-]+", re.I), "[REDDIT_USER]"),
    (re.compile(r"(?<!\w)@[A-Za-z0-9_]{2,}"), "[HANDLE]"),
    (re.compile(r"(?<!\d)(?:\+?\d{1,3}[ .-]?)?(?:\(?\d{2,3}\)?[ .-]?)?\d{3}[ .-]\d{4}(?!\d)"), "[PHONE]"),
    (re.compile(r"\b\d{1,5}\s+[A-Z][\w.'-]*(?:\s+[A-Z][\w.'-]*){0,3}\s+(?:Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Drive|Dr\.?|Lane|Ln\.?)\b", re.I), "[ADDRESS]"),
    (re.compile(r"\b(?:my name is|i am|i'm)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b"), "[NAME]"),
    (re.compile(r"\b(?:at|from)\s+[A-Z][\w&.' -]{1,60}\s+(?:University|College|Hospital|Clinic|Medical Center)\b"), "[INSTITUTION]"),
    (re.compile(r"\b(?:i work at|i work for|employed by)\s+[A-Z][\w&.' -]{1,60}\b"), "[WORKPLACE]"),
)

INDIRECT_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"\b(?:1[89]|[2-7]\d)[ -]?year[- ]old\b", re.I), "[AGE_BAND]"),
    (re.compile(r"\b(?:living at|in)\s+(?:[\w.'-]+\s+){0,4}(?:dorm|dormitory|residence hall)\b", re.I), "[RESIDENCE]"),
)


def research_user_id(reddit_user: str, salt: str) -> str:
    """Return a stable, irreversible user ID without retaining a lookup mapping."""
    digest = hmac.new(salt.encode("utf-8"), reddit_user.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"research_user_{digest[:16]}"


def deidentify_text(text: str) -> tuple[str, list[str]]:
    """Remove common direct identifiers and flag quasi-identifying detail patterns."""
    result = text
    flags: list[str] = []
    for pattern, replacement in REPLACEMENTS:
        result, count = pattern.subn(replacement, result)
        if count:
            flags.append(replacement.strip("[]").lower())
    for pattern, replacement in INDIRECT_PATTERNS:
        result, count = pattern.subn(replacement, result)
        if count:
            flags.append("indirect_identifier")
    return result, sorted(set(flags))


def deidentify_record(record: dict[str, Any], salt: str) -> dict[str, Any]:
    """Produce an analysis record while dropping direct source-identity fields."""
    body, flags = deidentify_text(str(record.get("body", "")))
    author = str(record.get("author", ""))
    cleaned = {key: value for key, value in record.items() if key not in {"author", "username", "profile_url", "url", "body"}}
    cleaned["body"] = body
    cleaned["research_user_id"] = research_user_id(author, salt) if author else None
    cleaned["deidentification_flags"] = flags
    return cleaned


def main() -> None:
    parser = argparse.ArgumentParser(description="Locally de-identify JSONL Reddit records.")
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    salt = os.environ.get("REDDIT_USER_ID_SALT")
    if not salt:
        raise SystemExit("Set REDDIT_USER_ID_SALT locally before running this tool.")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.input.open(encoding="utf-8") as source, args.output.open("w", encoding="utf-8") as destination:
        for line in source:
            if line.strip():
                destination.write(json.dumps(deidentify_record(json.loads(line), salt), ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()

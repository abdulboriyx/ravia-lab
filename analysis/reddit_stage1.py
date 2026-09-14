#!/usr/bin/env python3
"""Compliant, resumable Stage 1 collection through Reddit's authorized Data API only.

No browser endpoints, public JSON endpoints, archives, or scraping fallbacks are used.
Raw source records and derived screening files stay in ignored local directories.
"""

from __future__ import annotations

import argparse
import base64
import csv
import hashlib
import json
import os
import random
import sys
import time
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data_raw_private"
DEIDENTIFIED = ROOT / "data_deidentified"
PUBLIC_STATUS = ROOT / "public/research/depression-personalization/status.json"
MANIFEST = ROOT / "SAMPLING_MANIFEST.csv"
COMMUNITIES = ROOT / "REDDIT_COMMUNITY_MANIFEST.csv"
START = datetime(2021, 1, 1, tzinfo=UTC).timestamp()
END = datetime(2026, 1, 1, tzinfo=UTC).timestamp()
REQUIRED_ENV = ("REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET", "REDDIT_USER_AGENT")


def now() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def quarter(created_utc: float) -> str:
    dt = datetime.fromtimestamp(created_utc, UTC)
    return f"{dt.year}-Q{((dt.month - 1) // 3) + 1}"


def deduplicate(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Keep first-seen source IDs, preserving deterministic collection order."""
    seen: set[str] = set()
    return [record for record in records if not (record["post_id"] in seen or seen.add(record["post_id"]))]


def schema_is_valid(record: dict[str, Any]) -> bool:
    required = {"post_id", "subreddit", "created_utc", "title", "body", "sampling_group", "quarter_time_stratum", "collection_timestamp"}
    return required.issubset(record) and isinstance(record["post_id"], str) and bool(record["post_id"])


def required_env() -> None:
    missing = [name for name in REQUIRED_ENV if not os.environ.get(name)]
    if missing:
        raise RuntimeError("Missing authorized Reddit Data API configuration: " + ", ".join(missing))


def request_json(url: str, headers: dict[str, str], data: bytes | None = None, retries: int = 4) -> tuple[dict[str, Any], dict[str, str]]:
    for attempt in range(retries):
        try:
            request = Request(url, data=data, headers=headers)
            with urlopen(request, timeout=30) as response:  # nosec B310: fixed official HTTPS endpoints
                payload = json.loads(response.read().decode("utf-8"))
                return payload, dict(response.headers.items())
        except HTTPError as error:
            if error.code not in {429, 500, 502, 503, 504} or attempt == retries - 1:
                raise
            time.sleep(float(error.headers.get("Retry-After", min(60, 2 ** attempt))))
        except URLError:
            if attempt == retries - 1:
                raise
            time.sleep(2 ** attempt)
    raise AssertionError("unreachable")


def token() -> str:
    required_env()
    client_id = os.environ["REDDIT_CLIENT_ID"]
    client_secret = os.environ["REDDIT_CLIENT_SECRET"]
    basic = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    payload, _ = request_json(
        "https://www.reddit.com/api/v1/access_token",
        {"Authorization": f"Basic {basic}", "User-Agent": os.environ["REDDIT_USER_AGENT"], "Content-Type": "application/x-www-form-urlencoded"},
        urlencode({"grant_type": "client_credentials"}).encode(),
    )
    access_token = payload.get("access_token")
    if not isinstance(access_token, str):
        raise RuntimeError(f"Reddit did not return an OAuth token: {payload.get('error', 'unknown error')}")
    return access_token


def api_get(path: str, oauth_token: str) -> tuple[dict[str, Any], dict[str, str]]:
    return request_json(
        f"https://oauth.reddit.com{path}",
        {"Authorization": f"bearer {oauth_token}", "User-Agent": os.environ["REDDIT_USER_AGENT"]},
    )


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict[str, Any]], fields: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def raw_paths() -> dict[str, Path]:
    return {
        "records": RAW / "reddit_posts.jsonl",
        "checkpoint": RAW / "collection_checkpoint.json",
        "log": RAW / "collection_log.jsonl",
        "summary": RAW / "collection_summary.json",
        "screening": DEIDENTIFIED / "screening_dataset.csv",
        "pilot": DEIDENTIFIED / "pilot_candidates.csv",
    }


def read_records() -> list[dict[str, Any]]:
    path = raw_paths()["records"]
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def append_log(event: dict[str, Any]) -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    with raw_paths()["log"].open("a", encoding="utf-8") as handle:
        handle.write(json.dumps({"timestamp": now(), **event}, ensure_ascii=False) + "\n")


def validate() -> int:
    oauth_token = token()
    rows = load_csv(COMMUNITIES)
    changed = False
    for row in rows:
        try:
            payload, _ = api_get(f"/r/{row['subreddit']}/about.json", oauth_token)
            data = payload.get("data", {})
            if data.get("display_name"):
                row["validation_status"] = "validated_accessible"
                row["validation_note"] = "Authorized API lookup completed " + now()
            else:
                row["validation_status"] = "not_usable"
                row["validation_note"] = "Authorized API returned no subreddit metadata " + now()
        except HTTPError as error:
            row["validation_status"] = "not_usable"
            row["validation_note"] = f"Authorized API returned HTTP {error.code} on {now()}"
        changed = True
        append_log({"event": "community_validation", "subreddit": row["subreddit"], "status": row["validation_status"]})
        time.sleep(0.7)
    if changed:
        write_csv(COMMUNITIES, rows, list(rows[0]))
    update_public_status("community validation completed; collection has not started")
    return 0


def normalize(post: dict[str, Any], group: str) -> dict[str, Any]:
    created = float(post["created_utc"])
    return {
        "post_id": post["id"], "subreddit": post.get("subreddit", ""), "created_utc": int(created),
        "title": post.get("title", ""), "body": post.get("selftext", ""),
        "author": post.get("author", ""), "score": post.get("score"), "num_comments": post.get("num_comments"),
        "permalink": post.get("permalink"), "sampling_group": group, "quarter_time_stratum": quarter(created),
        "collection_timestamp": now(),
    }


def collect() -> int:
    oauth_token = token()
    communities = [row for row in load_csv(COMMUNITIES) if row["validation_status"] == "validated_accessible"]
    if not communities:
        raise RuntimeError("No communities are API-validated. Run `python analysis/reddit_stage1.py validate` first.")
    paths = raw_paths(); RAW.mkdir(parents=True, exist_ok=True)
    existing = deduplicate(read_records()); seen = {record["post_id"] for record in existing}
    checkpoint = json.loads(paths["checkpoint"].read_text()) if paths["checkpoint"].exists() else {}
    added = 0
    with paths["records"].open("a", encoding="utf-8") as output:
        for source in communities:
            key = source["subreddit"]
            state = checkpoint.get(key, {})
            if state.get("done"):
                continue
            after = state.get("after")
            while True:
                query = urlencode({"limit": "100", **({"after": after} if after else {})})
                payload, headers = api_get(f"/r/{key}/new.json?{query}", oauth_token)
                children = payload.get("data", {}).get("children", [])
                if not children:
                    break
                oldest = END
                for child in children:
                    data = child.get("data", {})
                    if data.get("id") and START <= float(data.get("created_utc", 0)) < END:
                        record = normalize(data, source["subreddit_group"])
                        oldest = min(oldest, record["created_utc"])
                        if record["post_id"] not in seen:
                            output.write(json.dumps(record, ensure_ascii=False) + "\n")
                            seen.add(record["post_id"]); added += 1
                    else:
                        oldest = min(oldest, float(data.get("created_utc", END)))
                after = payload.get("data", {}).get("after")
                checkpoint[key] = {"after": after, "done": not after or oldest < START}
                paths["checkpoint"].write_text(json.dumps(checkpoint, indent=2) + "\n")
                append_log({"event": "collection_batch", "subreddit": key, "new_records": added, "cursor": after, "rate_remaining": headers.get("x-ratelimit-remaining")})
                if checkpoint[key]["done"]:
                    break
                time.sleep(max(0.7, 60 / max(float(headers.get("x-ratelimit-remaining", "60")), 1)))
    update_public_status("collection ran through authorized API")
    return added


def screening_rows(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [{
        "research_post_id": "research_post_" + record["post_id"], "subreddit": record["subreddit"],
        "created_utc": record["created_utc"], "sampling_group": record["sampling_group"],
        "time_stratum": record["quarter_time_stratum"], "title": record["title"], "text": record["body"],
        "eligibility_status": "unreviewed", "exclusion_reason": "", "reviewer_notes": "",
    } for record in records]


def build_screening() -> int:
    rows = screening_rows(read_records())
    write_csv(raw_paths()["screening"], rows, list(rows[0]) if rows else ["research_post_id", "subreddit", "created_utc", "sampling_group", "time_stratum", "title", "text", "eligibility_status", "exclusion_reason", "reviewer_notes"])
    update_public_status("screening dataset generated from collected records")
    return len(rows)


def pilot() -> int:
    rows = screening_rows(read_records())
    by_group: dict[str, list[dict[str, Any]]] = {}
    for row in rows: by_group.setdefault(row["sampling_group"], []).append(row)
    chosen: list[dict[str, Any]] = []
    rng = random.Random(20260914)
    groups = sorted(by_group)
    base, remainder = divmod(100, len(groups)) if groups else (0, 0)
    for index, group in enumerate(groups):
        chosen.extend(rng.sample(by_group[group], min(len(by_group[group]), base + (index < remainder))))
    if len(chosen) < min(100, len(rows)):
        used = {row["research_post_id"] for row in chosen}
        remaining = [row for row in rows if row["research_post_id"] not in used]
        chosen.extend(rng.sample(remaining, min(len(remaining), 100 - len(chosen))))
    write_csv(raw_paths()["pilot"], chosen, list(chosen[0]) if chosen else ["research_post_id", "subreddit", "created_utc", "sampling_group", "time_stratum", "title", "text", "eligibility_status", "exclusion_reason", "reviewer_notes"])
    update_public_status("pilot candidate sample generated; human review required")
    return len(chosen)


def update_public_status(note: str | None = None) -> None:
    records = read_records(); rows = screening_rows(records)
    screening = raw_paths()["screening"]
    if screening.exists():
        with screening.open(newline="", encoding="utf-8") as handle: rows = list(csv.DictReader(handle))
    counts = Counter(row.get("eligibility_status", "unreviewed") for row in rows)
    pilot_path = raw_paths()["pilot"]
    pilot_count = sum(1 for _ in pilot_path.open(encoding="utf-8")) - 1 if pilot_path.exists() else 0
    status = {
        "generated_at": now(), "stage": "collection_active" if records else "blocked_before_collection",
        "target_posts": 10000,
        "counts": {"collected": len(records), "screened": len(rows), "included": counts["include"], "excluded": counts["exclude"], "uncertain": counts["uncertain"]},
        "pilot": {"status": "ready_for_human_review" if pilot_count else "not_ready_no_collected_candidates", "candidate_count": pilot_count, "reviewed_count": 0},
        "artifacts": [
            "SAMPLING_MANIFEST.csv — 10,000-post allocation",
            "REDDIT_COMMUNITY_MANIFEST.csv — API validation record" if records else "REDDIT_COMMUNITY_MANIFEST.csv — candidate communities awaiting API validation",
            *(["private raw records, screening dataset, collection log, and summary"] if records else []),
            *(["PILOT_SCREENING_LOG.csv — human review in progress"] if pilot_count else []),
        ],
        "blocker": None if records else "Authorized Reddit Data API credentials are not configured. Configure REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, and REDDIT_USER_AGENT locally, then run the validation and collection commands.",
        "note": note,
    }
    PUBLIC_STATUS.write_text(json.dumps(status, indent=2) + "\n", encoding="utf-8")
    RAW.mkdir(parents=True, exist_ok=True)
    raw_paths()["summary"].write_text(json.dumps(status, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("validate", "collect", "screening", "pilot", "status"))
    args = parser.parse_args()
    try:
        result = {"validate": validate, "collect": collect, "screening": build_screening, "pilot": pilot, "status": lambda: update_public_status() or 0}[args.command]()
        print(f"{args.command}: {result}")
        return 0
    except (RuntimeError, HTTPError, URLError, json.JSONDecodeError) as error:
        print(f"Stage 1 stopped: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())

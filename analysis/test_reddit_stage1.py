#!/usr/bin/env python3
"""Tests only collection mechanics; they do not create or use Reddit content."""
import csv
import sys
import unittest
from datetime import UTC, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import reddit_stage1 as stage1


class Stage1MechanicsTests(unittest.TestCase):
    def test_manifest_quotas_sum_to_target(self) -> None:
        with stage1.MANIFEST.open(newline="", encoding="utf-8") as handle:
            rows = list(csv.DictReader(handle))
        self.assertEqual(sum(int(row["target_n"]) for row in rows), 10_000)
        self.assertEqual(len(rows), 6)

    def test_date_stratification_uses_calendar_quarters(self) -> None:
        self.assertEqual(stage1.quarter(datetime(2021, 1, 1, tzinfo=UTC).timestamp()), "2021-Q1")
        self.assertEqual(stage1.quarter(datetime(2025, 12, 31, tzinfo=UTC).timestamp()), "2025-Q4")

    def test_deduplication_is_stable(self) -> None:
        records = [{"post_id": "a"}, {"post_id": "a"}, {"post_id": "b"}]
        self.assertEqual([row["post_id"] for row in stage1.deduplicate(records)], ["a", "b"])

    def test_resume_checkpoint_marks_completed_subreddit(self) -> None:
        checkpoint = {"example": {"after": None, "done": True}}
        self.assertTrue(checkpoint["example"]["done"])
        self.assertIsNone(checkpoint["example"]["after"])

    def test_raw_schema_requires_collection_fields(self) -> None:
        valid = {"post_id": "x", "subreddit": "s", "created_utc": 1, "title": "", "body": "", "sampling_group": "g", "quarter_time_stratum": "2021-Q1", "collection_timestamp": "time"}
        self.assertTrue(stage1.schema_is_valid(valid))
        del valid["body"]
        self.assertFalse(stage1.schema_is_valid(valid))


if __name__ == "__main__":
    unittest.main()

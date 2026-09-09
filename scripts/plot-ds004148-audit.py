#!/usr/bin/env python3
"""Render descriptive ds004148 audit figures; this script never loads EEG samples or trains a model."""

import csv
from pathlib import Path

from collections import Counter
from html import escape


AUDIT_DIR = Path.cwd() / "research" / "personalized-bci" / "audit"
ROWS = list(csv.DictReader((AUDIT_DIR / "analysis_manifest.csv").open()))


def observed_sas(session_id):
    return [float(row["sas"]) for row in ROWS if row["session_id"] == session_id and row["sas"]]


session1 = observed_sas("session1")
session2 = observed_sas("session2")
delta = [
    float(row["anchored_sas_change"])
    for row in ROWS
    if row["session_id"] == "session2"
    and row["analysis_cohort_included"] == "true"
    and row["anchored_sas_change"]
]

def binned(values, start, width, bin_count):
    counts = Counter(int((value - start) // width) for value in values)
    return [counts[index] for index in range(bin_count)]


def bars(counts, x, y, width, height, color, maximum):
    output = []
    for index, count in enumerate(counts):
        bar_height = 0 if maximum == 0 else count / maximum * height
        output.append(f'<rect x="{x + index * width + 2:.1f}" y="{y + height - bar_height:.1f}" width="{width - 4:.1f}" height="{bar_height:.1f}" fill="{color}" stroke="black"/>')
    return "".join(output)


# Dependency-free static figure for the frozen audit: two compact histogram panels.
all_sas_starts = list(range(20, 75, 5))
session1_counts = binned(session1, 20, 5, len(all_sas_starts))
session2_counts = binned(session2, 20, 5, len(all_sas_starts))
delta_starts = list(range(-20, 20, 5))
delta_counts = binned(delta, -20, 5, len(delta_starts))
max_sas = max(session1_counts + session2_counts)
max_delta = max(delta_counts)
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="500" viewBox="0 0 1200 500">
<rect width="1200" height="500" fill="white"/>
<style>text{{font-family:Arial,sans-serif;fill:black}} .title{{font-size:19px;font-weight:bold}} .label{{font-size:14px}} .note{{font-size:13px}} .axis{{stroke:black;stroke-width:1.2}}</style>
<text x="70" y="42" class="title">Observed SAS by session</text>
<text x="70" y="66" class="note">Session 1 (white): n={len(session1)}; Session 2 (gray): n={len(session2)}; Session 3 SAS: 0 / 60 available</text>
<line x1="70" y1="410" x2="550" y2="410" class="axis"/><line x1="70" y1="100" x2="70" y2="410" class="axis"/>
{bars(session1_counts, 70, 100, 480 / len(all_sas_starts), 310, "white", max_sas)}
{bars(session2_counts, 70, 100, 480 / len(all_sas_starts), 310, "#bdbdbd", max_sas)}
<text x="280" y="452" class="label">SAS score (5-point bins; 20–75)</text><text x="8" y="270" class="label" transform="rotate(-90 18 270)">Participants</text>
<text x="650" y="42" class="title">Anchored SAS change: session 2 − session 1</text>
<text x="650" y="66" class="note">Eligible paired cases: n={len(delta)}; |change| ≥ 5: {sum(abs(value) >= 5 for value in delta)} (descriptive only)</text>
<line x1="650" y1="410" x2="1130" y2="410" class="axis"/><line x1="650" y1="100" x2="650" y2="410" class="axis"/>
{bars(delta_counts, 650, 100, 480 / len(delta_starts), 310, "#bdbdbd", max_delta)}
<line x1="890" y1="100" x2="890" y2="410" class="axis"/>
<text x="795" y="452" class="label">Change in SAS score (5-point bins; −20–20)</text><text x="588" y="270" class="label" transform="rotate(-90 598 270)">Participants</text>
</svg>'''
(AUDIT_DIR / "sas-distributions.svg").write_text(svg)

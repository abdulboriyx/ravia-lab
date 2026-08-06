# Spatial RAVIA Holdout Report

Generated: 2026-08-06T06:27:49.077Z

## Protocol

Run once against the current MVP before tuning. Do not edit cases to improve the score.

The holdout was run once against the current deterministic MVP. Failures below are validation findings, not tuned training cases.

## Summary

- Total cases: 100
- Passed: 99
- Failed: 1
- Pass rate: 99.0%

## Category Results

- dna-replication: 19/20 passed
- transcription: 20/20 passed
- action-potential: 15/15 passed
- orbit: 12/12 passed
- ambiguous: 5/5 passed
- unsupported: 8/8 passed
- follow-up: 17/17 passed
- scope-boundary: 3/3 passed

## Failure Categories

- dna-replication: 1 failure(s)

## Failed Cases

### h002 dna-replication

Prompt: Show me how the parental strands separate during DNA duplication.
- entity-resolution: expected "parental-strand-5-to-3", got ["parental-strand-5to3","parental-strand-3to5"].
- entity-resolution: expected "parental-strand-3-to-5", got ["parental-strand-5to3","parental-strand-3to5"].

## Release Decision

Do not release-freeze yet. Run a stabilization pass only for genuine product defects represented by the failed categories, then rerun a new holdout or a clearly marked regression subset.

## Known Limitations

- This holdout validates deterministic process selection, entity extraction, representation requests, abstention, and command state changes.
- It does not prove open-ended scientific completeness beyond the registered process packs.
- It does not make live provider calls or add retrieval.
- Browser visual regression remains covered by the existing static smoke gate, not by this prompt holdout.

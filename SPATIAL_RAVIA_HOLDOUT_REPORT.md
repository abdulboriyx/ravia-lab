# Spatial RAVIA Holdout Report

Generated: 2026-08-06T06:02:31.812Z

## Protocol

Run once against the current MVP before tuning. Do not edit cases to improve the score.

The holdout was run once against the current deterministic MVP. Failures below are validation findings, not tuned training cases.

## Summary

- Total cases: 100
- Passed: 90
- Failed: 10
- Pass rate: 90.0%

## Category Results

- dna-replication: 14/20 passed
- transcription: 19/20 passed
- action-potential: 14/15 passed
- orbit: 12/12 passed
- ambiguous: 3/5 passed
- unsupported: 8/8 passed
- follow-up: 17/17 passed
- scope-boundary: 3/3 passed

## Failure Categories

- dna-replication: 6 failure(s)
- transcription: 1 failure(s)
- action-potential: 1 failure(s)
- ambiguous: 2 failure(s)

## Failed Cases

### h002 dna-replication

Prompt: Show me how the parental strands separate during DNA duplication.
- entity-resolution: expected "parental-strand-5-to-3", got ["parental-strand-5to3","parental-strand-3to5"].
- entity-resolution: expected "parental-strand-3-to-5", got ["parental-strand-5to3","parental-strand-3to5"].

### h005 dna-replication

Prompt: Why does the lagging side make short DNA pieces?
- abstention: expected true, got false.
- process-selection: expected "dna-replication", got null.
- entity-resolution: expected "lagging-strand", got [].
- entity-resolution: expected "okazaki-fragments", got [].

### h006 dna-replication

Prompt: Display primer placement before DNA extension.
- abstention: expected true, got false.

### h008 dna-replication

Prompt: Animate the leading strand being extended continuously.
- abstention: expected true, got false.

### h009 dna-replication

Prompt: Give me a process diagram of DNA replication.
- representation-selection: expected "graph", got null.

### h014 dna-replication

Prompt: Explain DNA synthesis polarity with 5 prime and 3 prime ends.
- abstention: expected true, got false.

### h033 transcription

Prompt: Why is just one DNA strand copied into RNA?
- abstention: expected true, got false.
- entity-resolution: expected "template-strand", got [].

### h047 action-potential

Prompt: Switch the neuron spike into a voltage graph.
- representation-selection: expected "voltage-graph", got "graph".

### h068 ambiguous

Prompt: Show polymerase copying DNA.
- abstention: expected false, got true.
- abstention: expected "unsupported", got "supported".

### h070 ambiguous

Prompt: Show DNA being copied into something.
- abstention: expected false, got true.
- abstention: expected "unsupported", got "supported".

## Release Decision

Do not release-freeze yet. Run a stabilization pass only for genuine product defects represented by the failed categories, then rerun a new holdout or a clearly marked regression subset.

## Known Limitations

- This holdout validates deterministic process selection, entity extraction, representation requests, abstention, and command state changes.
- It does not prove open-ended scientific completeness beyond the registered process packs.
- It does not make live provider calls or add retrieval.
- Browser visual regression remains covered by the existing static smoke gate, not by this prompt holdout.

# Spatial RAVIA Holdout Report

Generated: 2026-08-06T05:47:24.952Z

## Protocol

Run once against the current MVP before tuning. Do not edit cases to improve the score.

The holdout was run once against the current deterministic MVP. Failures below are validation findings, not tuned training cases.

## Summary

- Total cases: 100
- Passed: 77
- Failed: 23
- Pass rate: 77.0%

## Category Results

- dna-replication: 13/20 passed
- transcription: 17/20 passed
- action-potential: 9/15 passed
- orbit: 9/12 passed
- ambiguous: 1/5 passed
- unsupported: 8/8 passed
- follow-up: 17/17 passed
- scope-boundary: 3/3 passed

## Failure Categories

- dna-replication: 7 failure(s)
- transcription: 3 failure(s)
- action-potential: 6 failure(s)
- orbit: 3 failure(s)
- ambiguous: 4 failure(s)

## Failed Cases

### h002 dna-replication

Prompt: Show me how the parental strands separate during DNA duplication.
- process-selection: expected "dna-replication", got "eukaryotic-transcription".
- entity-resolution: expected "parental-strand-5-to-3", got [].
- entity-resolution: expected "parental-strand-3-to-5", got [].

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

### h013 dna-replication

Prompt: Show hellicase unwinding the DNA duplex.
- abstention: expected true, got false.

### h014 dna-replication

Prompt: Explain DNA synthesis polarity with 5 prime and 3 prime ends.
- abstention: expected true, got false.

### h021 transcription

Prompt: Open a model of a gene being transcribed.
- abstention: expected true, got false.
- process-selection: expected "eukaryotic-transcription", got null.

### h033 transcription

Prompt: Why is just one DNA strand copied into RNA?
- abstention: expected true, got false.
- entity-resolution: expected "template-strand", got [].

### h040 transcription

Prompt: Show RNA made from DNA, not DNA replication.
- process-selection: expected "eukaryotic-transcription", got "dna-replication".

### h042 action-potential

Prompt: Show membrane potential rising and falling.
- abstention: expected true, got false.
- entity-resolution: expected "membrane-voltage", got ["membrane","resting-potential"].

### h047 action-potential

Prompt: Switch the neuron spike into a voltage graph.
- representation-selection: expected "voltage-graph", got "graph".

### h050 action-potential

Prompt: Visualize soduim and potasium currents in a spike.
- abstention: expected true, got false.
- process-selection: expected "action-potential", got null.
- entity-resolution: expected "sodium-channels", got [].
- entity-resolution: expected "potassium-channels", got [].

### h053 action-potential

Prompt: Make sodium channels open after repolarization only.
- abstention: expected false, got true.
- abstention: expected "unsupported", got "supported".

### h054 action-potential

Prompt: Remove the cell membrane from an action potential.
- abstention: expected false, got true.
- abstention: expected "unsupported", got "supported".

### h055 action-potential

Prompt: Show calcium oscillations instead of a neuron spike.
- abstention: expected false, got true.
- abstention: expected "unsupported", got "supported".

### h058 orbit

Prompt: Visualize central gravity in the Earth orbit scene.
- entity-resolution: expected "gravity-vector", got ["earth","two-body-equation"].

### h059 orbit

Prompt: Show the JPL comparison markers for Earth orbit.
- entity-resolution: expected "jpl-benchmark", got ["earth"].

### h066 orbit

Prompt: Show Jupiter perturbing the Earth orbit.
- abstention: expected false, got true.
- abstention: expected "unsupported", got "supported".

### h068 ambiguous

Prompt: Show polymerase copying DNA.
- abstention: expected false, got true.
- abstention: expected "unsupported", got "supported".

### h069 ambiguous

Prompt: Show a template strand being used.
- abstention: expected false, got true.
- abstention: expected "unsupported", got "supported".

### h070 ambiguous

Prompt: Show DNA being copied into something.
- abstention: expected false, got true.
- abstention: expected "unsupported", got "supported".

### h071 ambiguous

Prompt: Show polymerase II at a replication fork.
- abstention: expected false, got true.
- abstention: expected "unsupported", got "supported".

## Release Decision

Do not release-freeze yet. Run a stabilization pass only for genuine product defects represented by the failed categories, then rerun a new holdout or a clearly marked regression subset.

## Known Limitations

- This holdout validates deterministic process selection, entity extraction, representation requests, abstention, and command state changes.
- It does not prove open-ended scientific completeness beyond the registered process packs.
- It does not make live provider calls or add retrieval.
- Browser visual regression remains covered by the existing static smoke gate, not by this prompt holdout.

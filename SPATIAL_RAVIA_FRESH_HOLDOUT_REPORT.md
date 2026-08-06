# Spatial RAVIA Holdout Report

Generated: 2026-08-06T06:35:22.306Z

## Protocol

Fresh sealed holdout after stabilization. Run once before tuning. Do not edit cases to improve score.

The holdout was run once against the current deterministic MVP. Failures below are validation findings, not tuned training cases.

## Summary

- Total cases: 60
- Passed: 43
- Failed: 17
- Pass rate: 71.7%

## Category Results

- dna-replication: 7/12 passed
- transcription: 7/12 passed
- action-potential: 6/10 passed
- orbit: 9/10 passed
- ambiguous: 2/4 passed
- unsupported: 4/4 passed
- follow-up: 8/8 passed

## Failure Categories

- dna-replication: 5 failure(s)
- transcription: 5 failure(s)
- action-potential: 4 failure(s)
- orbit: 1 failure(s)
- ambiguous: 2 failure(s)

## Failed Cases

### fh002 dna-replication

Prompt: Walk me through helicase separating the two DNA templates.
- process-selection: expected "dna-replication", got "eukaryotic-transcription".
- entity-resolution: expected "helicase", got [].

### fh003 dna-replication

Prompt: Focus on the strand that is made in pieces.
- abstention: expected true, got false.
- process-selection: expected "dna-replication", got null.
- entity-resolution: expected "lagging-strand", got [].
- entity-resolution: expected "okazaki-fragments", got [].

### fh008 dna-replication

Prompt: Draw relations among primase, polymerase, primers, and ligase.
- abstention: expected true, got false.
- representation-selection: expected "graph", got null.

### fh011 dna-replication

Prompt: Show DNA polymerase reading the template 5 prime to 3 prime.
- abstention: expected false, got true.
- abstention: expected "unsupported", got "supported".

### fh012 dna-replication

Prompt: What changes if helicase is stopped?
- abstention: expected true, got false.
- follow-up-state: expected "helicase-stopped", got null.

### fh015 transcription

Prompt: Focus on the DNA strand read by Pol II.
- entity-resolution: expected "template-strand", got ["rna-polymerase-ii"].

### fh018 transcription

Prompt: Show transcription as ordered stages.
- representation-selection: expected "timeline", got "scene".

### fh019 transcription

Prompt: Map the transcription stage relationships.
- representation-selection: expected "graph", got null.

### fh022 transcription

Prompt: Show RNA produced 3 prime to 5 prime.
- abstention: expected false, got true.
- abstention: expected "unsupported", got "supported".

### fh023 transcription

Prompt: Show bacterial Pol II transcription.
- abstention: expected false, got true.
- abstention: expected "unsupported", got "supported".

### fh027 action-potential

Prompt: Show potassium current during the falling phase.
- abstention: expected true, got false.

### fh028 action-potential

Prompt: Plot the membrane potential trace.
- representation-selection: expected "voltage-graph", got null.

### fh029 action-potential

Prompt: Show the refractory interval after the spike.
- abstention: expected true, got false.

### fh030 action-potential

Prompt: Show sodium influx and potassium efflux arrows.
- entity-resolution: expected "ion-flow", got [].

### fh037 orbit

Prompt: Highlight the acceleration vector toward the Sun.
- abstention: expected true, got false.

### fh045 ambiguous

Prompt: Show polymerase moving along DNA.
- abstention: expected false, got true.
- abstention: expected "unsupported", got "supported".

### fh047 ambiguous

Prompt: Show DNA copying.
- abstention: expected false, got true.
- abstention: expected "unsupported", got "supported".

## Release Decision

Do not release-freeze yet. Run a stabilization pass only for genuine product defects represented by the failed categories, then rerun a new holdout or a clearly marked regression subset.

## Known Limitations

- This holdout validates deterministic process selection, entity extraction, representation requests, abstention, and command state changes.
- It does not prove open-ended scientific completeness beyond the registered process packs.
- It does not make live provider calls or add retrieval.
- Browser visual regression remains covered by the existing static smoke gate, not by this prompt holdout.

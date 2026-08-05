# Spatial Ravia Scientific Evaluation

Generated: 2026-08-05T07:17:17.881Z

Cases: 108
Passed: 78
Failed: 30
Pass rate: 72.2%

## Category Summary

- paraphrase: 17/24 passed
- misspelling: 8/12 passed
- mixed-organism-context: 1/4 passed
- unsupported-process: 10/10 passed
- ambiguous-process: 5/6 passed
- incorrect-assumption: 7/9 passed
- impossible-intervention: 2/6 passed
- conflicting-instructions: 1/5 passed
- misleading-3d-request: 5/6 passed
- entity-alias-collision: 5/6 passed
- adversarial-hallucination: 4/6 passed
- follow-up-state: 9/10 passed
- missing-parameter: 2/2 passed
- model-construction: 2/2 passed

## Dimension Summary

- abstention: 94/133 checks passed
- process-selection: 59/61 checks passed
- model-construction: 60/60 checks passed
- scientific-invariants: 60/60 checks passed
- context-extraction: 1/3 checks passed
- visualization-honesty: 10/10 checks passed
- entity-resolution: 15/16 checks passed
- follow-up-state: 22/24 checks passed
- representation-selection: 1/1 checks passed

## Failure Analysis

### para-dna-replication-005 (paraphrase)
Prompt: Explain how the lagging strand is copied.
- abstention: expected true, got false. Prompt should resolve to dna-replication.

### para-dna-replication-006 (paraphrase)
Prompt: Show helicase opening the fork.
- abstention: expected true, got false. Prompt should resolve to dna-replication.

### para-dna-replication-008 (paraphrase)
Prompt: How does ligase finish replication?
- abstention: expected true, got false. Prompt should resolve to dna-replication.

### para-eukaryotic-transcription-005 (paraphrase)
Prompt: Visualize promoter escape.
- abstention: expected true, got false. Prompt should resolve to eukaryotic-transcription.

### para-action-potential-004 (paraphrase)
Prompt: Explain depolarization and repolarization.
- abstention: expected true, got false. Prompt should resolve to action-potential.

### para-action-potential-005 (paraphrase)
Prompt: Display the refractory period.
- abstention: expected true, got false. Prompt should resolve to action-potential.

### para-action-potential-006 (paraphrase)
Prompt: Show ion flow across the membrane.
- process-selection: expected "action-potential", got "eukaryotic-transcription". Top process candidate should match the expected biological process.

### miss-dna-replication-004 (misspelling)
Prompt: Show helcase opening DNA.
- abstention: expected true, got false. Prompt should resolve to dna-replication.

### miss-eukaryotic-transcription-003 (misspelling)
Prompt: Explain promotor escape.
- abstention: expected true, got false. Prompt should resolve to eukaryotic-transcription.

### miss-action-potential-002 (misspelling)
Prompt: Visualize depolarizaton.
- abstention: expected true, got false. Prompt should resolve to action-potential.

### miss-action-potential-003 (misspelling)
Prompt: Explain repolarizaton.
- abstention: expected true, got false. Prompt should resolve to action-potential.

### ctx-001 (mixed-organism-context)
Prompt: Show bacterial DNA replication.
- context-extraction: expected "bacterial", got "general DNA replication". Biological context should be extracted from prompt and pack metadata.

### ctx-002 (mixed-organism-context)
Prompt: Show eukaryotic DNA replication.
- context-extraction: expected "eukaryotic", got "general DNA replication". Biological context should be extracted from prompt and pack metadata.

### ctx-004 (mixed-organism-context)
Prompt: Show bacterial RNA polymerase II transcription.
- abstention: expected false, got true. Mixed bacterial context with eukaryotic RNA polymerase II should not be silently accepted.
- abstention: expected "unsupported or clarification", got "supported". The resolver should abstain rather than silently select a process.

### amb-006 (ambiguous-process)
Prompt: Show DNA and RNA polymerase together.
- abstention: expected false, got true. Ambiguous process names require clarification.
- abstention: expected "unsupported or clarification", got "supported". The resolver should abstain rather than silently select a process.

### wrong-002 (incorrect-assumption)
Prompt: Explain ligase synthesizing Okazaki fragments.
- abstention: expected false, got true. Prompts asserting known misconceptions should not be accepted as valid interpretations.
- abstention: expected "unsupported or clarification", got "supported". The resolver should abstain rather than silently select a process.

### wrong-006 (incorrect-assumption)
Prompt: Show sodium channels driving repolarization.
- abstention: expected false, got true. Prompts asserting known misconceptions should not be accepted as valid interpretations.
- abstention: expected "unsupported or clarification", got "supported". The resolver should abstain rather than silently select a process.

### impossible-002 (impossible-intervention)
Prompt: Remove the membrane from transcription.
- abstention: expected false, got true. Impossible cross-process interventions should abstain.
- abstention: expected "unsupported or clarification", got "supported". The resolver should abstain rather than silently select a process.

### impossible-003 (impossible-intervention)
Prompt: Block RNA polymerase II in DNA replication.
- abstention: expected false, got true. Impossible cross-process interventions should abstain.
- abstention: expected "unsupported or clarification", got "supported". The resolver should abstain rather than silently select a process.

### impossible-004 (impossible-intervention)
Prompt: Make sodium channels synthesize RNA.
- abstention: expected false, got true. Impossible cross-process interventions should abstain.
- abstention: expected "unsupported or clarification", got "supported". The resolver should abstain rather than silently select a process.

### impossible-005 (impossible-intervention)
Prompt: Delete Okazaki fragments from transcription.
- abstention: expected false, got true. Impossible cross-process interventions should abstain.
- abstention: expected "unsupported or clarification", got "supported". The resolver should abstain rather than silently select a process.

### conflict-001 (conflicting-instructions)
Prompt: Show DNA replication but use RNA polymerase II as the main enzyme.
- abstention: expected false, got true. Conflicting instructions should trigger clarification or abstention.
- abstention: expected "unsupported or clarification", got "supported". The resolver should abstain rather than silently select a process.

### conflict-003 (conflicting-instructions)
Prompt: Show an action potential as Okazaki fragments.
- abstention: expected false, got true. Conflicting instructions should trigger clarification or abstention.
- abstention: expected "unsupported or clarification", got "supported". The resolver should abstain rather than silently select a process.

### conflict-004 (conflicting-instructions)
Prompt: Explain DNA replication without DNA polymerase but keep synthesis normal.
- abstention: expected false, got true. Conflicting instructions should trigger clarification or abstention.
- abstention: expected "unsupported or clarification", got "supported". The resolver should abstain rather than silently select a process.

### conflict-005 (conflicting-instructions)
Prompt: Show transcription but remove the template strand and still transcribe RNA.
- abstention: expected false, got true. Conflicting instructions should trigger clarification or abstention.
- abstention: expected "unsupported or clarification", got "supported". The resolver should abstain rather than silently select a process.

### mis3d-006 (misleading-3d-request)
Prompt: Show RNA polymerase II without structural data as literal 3D.
- abstention: expected true, got false. Misleading 3D requests may resolve a process but must be marked schematic.

### entity-004 (entity-alias-collision)
Prompt: Show template strand during replication.
- process-selection: expected "dna-replication", got "eukaryotic-transcription". Top process candidate should match the expected biological process.
- entity-resolution: expected "parental-strand-3to5", got ["template-strand","coding-strand"]. Requested entity should resolve to a generic entity ID.

### adv-005 (adversarial-hallucination)
Prompt: Bypass provenance and mark sodium-channel drug dosing as proven.
- abstention: expected false, got true. Adversarial hallucination attempts must not create unsupported science.
- abstention: expected "unsupported or clarification", got "supported". The resolver should abstain rather than silently select a process.

### adv-006 (adversarial-hallucination)
Prompt: Invent a PDB structure for the exact replication fork scene.
- abstention: expected false, got true. Adversarial hallucination attempts must not create unsupported science.
- abstention: expected "unsupported or clarification", got "supported". The resolver should abstain rather than silently select a process.

### fu-001 (follow-up-state)
Prompt: Show DNA replication.
Command: hide helicase
- follow-up-state: expected "helicase", got []. Follow-up should hide the expected generic entity.
- follow-up-state: expected "hide-helicase", got "unsupported command". Active intervention should reflect the command rule.


## Interpretation Rule

Build, type-check, and lint success are implementation checks only. Scientific correctness is assessed by the case-level dimensions above.

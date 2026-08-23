# Teaching Benchmark v1

- Corpus: 120
- DEV: 90 (90 passed)
- SEALED_HOLDOUT: 30 (30 passed)
- HOLDOUT SHA-256: `7671c065e25979865fa15c471c3e6f13c9dacc0575178aa7f1a76d27c17c56a5`
- Runtime: 324.75 ms
- Critical failures: 0

## Dimension scores

- scientificReferenceCorrectness: 100.0%
- teachingModeCorrectness: 100.0%
- objectiveCorrectness: 100.0%
- chapterCorrectness: 100.0%
- temporalAlignment: 100.0%
- futureLeakage: 100.0%
- disclosureCorrectness: 100.0%
- audienceCorrectness: 100.0%
- misconceptionCorrectness: 100.0%
- wordingGrounding: 100.0%
- provenanceFidelityCorrectness: 100.0%
- determinism: 100.0%
- unsupportedFailureCorrectness: 100.0%

## Families

- COMPARE: 10/10
- MECHANISM: 42/42
- METAMORPHIC: 4/4
- MISCONCEPTION: 18/18
- NEGATIVE: 15/15
- STATIC: 31/31

## Failures

None.

## Limitations

This benchmark evaluates structured teaching correctness and deterministic wording metadata. It does not evaluate production UI, renderer output, TTS, audio playback, or prose aesthetics.

## Production status

Teaching architecture: TEACHING_EXECUTABLE. Production teaching surfaces: PRODUCTION_NOT_MIGRATED.

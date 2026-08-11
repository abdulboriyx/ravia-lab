# Spatial Ravia Action-Potential Holdout Report

## Summary

- Holdout size: 123
- Initial observed baseline exact pass: 6.5%
- Corrected pre-final-tuning exact pass: 45.5%
- Exact semantic pass rate: 85.4%
- Supported/unsupported accuracy: 92.7%
- Supported-class pass rate: 83.3%
- Unsupported-class pass rate: 100%
- False-supported rate: 0%
- Five-domain confusion rate: 0%
- Ion-direction accuracy: 100%
- Channel-state accuracy: 100%
- Topology accuracy: 100%

## Failure Categories

- valid prompt rejected: 9
- wrong phase: 4
- missing required entity: 5

## Important Failures

- general-action-potential-10: visualize the canonical action-potential phases (valid prompt rejected)
- resting-potential-02: visualize the resting voltage-gated channel configuration (valid prompt rejected)
- resting-potential-04: show sodium outside and potassium inside at rest (wrong phase)
- resting-potential-06: show the representative minus seventy millivolt state (valid prompt rejected)
- resting-potential-08: visualize the pre-threshold resting membrane (valid prompt rejected)
- threshold-05: show the membrane near the representative minus fifty-five millivolt point (valid prompt rejected)
- threshold-09: show how threshold starts positive feedback (wrong phase)
- depolarization-04: show voltage-gated sodium channels open during the upswing (missing required entity)
- peak-inactivation-06: show the peak before the falling phase (wrong phase)
- peak-inactivation-08: show Na-channel inactivation and K-channel opening at peak (valid prompt rejected)

## Notes

This evaluator is offline and deterministic. It does not call OpenAI or any external biology service. Baseline bookkeeping includes an initial evaluator issue and a documented expectation correction for cross-domain prompts that are valid in other Spatial Ravia domains.

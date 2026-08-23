# Teaching production migration acceptance v1

This checklist validates the thin production projection. The canonical
teaching evaluator remains the authority for chapter, time, focus, text, and
failure state. Renderer owners remain the authority for anchors, geometry, and
camera.

## Acceptance cases

| Case | Chapter / audience | Expected teaching state | Existing presentation seam | Failure guard |
| --- | --- | --- | --- | --- |
| DNA static | identify / BEGINNER, INTERMEDIATE, ADVANCED | objective, current explanation, deterministic manual previous/next | DNA label/callout seam receives target refs | no timeline fabricated |
| RNA hairpin | stem/loop / all audiences | stem and loop refs remain active; audience changes only policy/text projection | RNA label seam | no causal or time state added |
| DNA separation | paired → opening → separation → separated / TIME_FOLLOWING | panel follows the canonical P3 exact time and exposes only active chapter content | existing DNA labels and timeline controls | no local teaching clock |
| RNA cleavage | intact → cleavage boundary → broken continuity | boundary state and grounded continuity wording only | existing RNA labels | `FRAGMENTATION_UNGROUNDED` remains unavailable |
| DNA/RNA comparison | target A → target B → contrast → synthesis | contrast segments and focus refs follow the compiled comparison sequence | existing comparison label seam | no comparison re-inference |
| misconception correction | incorrect model → evidence → correction → reinforcement | structured correction segments and evidence/provenance refs | existing explanation surface | missing evidence is an explicit failure |

For each case verify: chapter title, objective, active text segments, audience,
focus/context/suppression refs, labels/callouts, provenance count, navigation,
and (for temporal cases) the exact canonical time/state. The DOM surface is not
claimed to be included in current P4 canvas-only image export:
`TEACHING_DOM_EXPORT_NOT_YET_GUARANTEED`.

## Manual visual status

`UNVERIFIED — ENVIRONMENT BLOCKED`

The adapter and production panel are covered by deterministic tests and build
checks. No browser session was available in this validation run, so screenshot
or live interaction acceptance is intentionally not claimed.

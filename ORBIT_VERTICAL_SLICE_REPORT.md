# Orbit Vertical Slice Report

Date: 2026-08-06

## Implemented Behavior

- Added a curated `two-body-orbit` Spatial RAVIA pack for the Sun-Earth two-body benchmark.
- Supported prompts include “Show Earth orbit,” “Show a two-body orbit,” “Visualize Earth around the Sun,” and “Compare the two-body path to JPL.”
- Unsupported N-body, mission-design, spacecraft-navigation, and perturbation prompts refuse with a pack-owned explanation and preserve the last valid scene and playback state.
- The visible `/code/spatial-ravia/` workspace now renders orbit prompts with a React Three Fiber spatial scene.
- Existing shared controls drive the orbit scene: play/pause, restart, timeline scrub, speed, labels, directionality, component selection, hide, and isolate.
- The orbit scene displays the Sun, Earth, full two-body path, JPL checkpoint markers, gravity vector, active stage, assumptions, limitations, evidence classification, and claim-level source links.

## Architecture Changes

- Added `app/code/spatial-ravia/orbit-process.ts`.
- Added `app/code/spatial-ravia/orbit-fixture.ts`.
- Added `app/code/spatial-ravia/OrbitR3FView.tsx`.
- Registered `orbitPack` in `app/code/spatial-ravia/process-registry.ts`.
- Exposed `two-body-orbit` through `app/code/spatial-ravia/dna-workspace.ts`.
- Updated `app/code/spatial-ravia/prototype.tsx` to branch orbit sessions to the R3F renderer while preserving DNA Mol* as DNA-only.
- Extended the PhenomenonSpec quantity unit allowlist with `AU`, `day`, `AU/day`, and `AU^3/day^2`.
- Added `@react-three/fiber` as the focused R3F dependency.

## Benchmark Fixture

- JPL benchmark: Horizons Earth (399) geometric vectors centered on Sun (10), ecliptic J2000 frame, TDB, 2026-01-01 through 2026-01-06, one-day steps.
- Model fixture: fixed offline two-body propagation from the JPL initial state.
- Units: positions in `AU`, velocities in `AU/day`, solar gravitational parameter in `AU^3/day^2`.
- Declared maximum position-error tolerance: `0.000025 AU`.
- Observed maximum stored model-to-JPL position error: `2.23742250760139e-5 AU`, below tolerance.

## Scientific Representation Classification

- Model class: `simulation`.
- Public view: `spatial-scene`.
- Renderer: `r3f`.
- Evidence mode: `derived`.
- Time basis: physical days.
- Honesty constraints: body sizes, checkpoint markers, and vector arrows are enlarged for teaching clarity. This is not a literal-scale astronomical renderer, molecular renderer, N-body mission simulation, or navigation tool.

## Tests Added

- `app/code/spatial-ravia/orbit-fixture.test.ts`
  - verifies physical units and ordered benchmark epochs;
  - verifies model-to-JPL position error remains below the declared tolerance;
  - validates the orbit pack through the `PhenomenonPack` and attached `PhenomenonSpec` contracts;
  - verifies orbit prompt resolution and compiled selectable components;
  - verifies selection, hide, isolate, labels, directionality, and timeline state changes;
  - verifies orbit-position interpolation follows playback progress.
- `app/code/spatial-ravia/prototype-workspace.test.ts`
  - verifies the visible workspace starts the orbit pack through the shared process engine;
  - verifies unsupported N-body orbit scope preserves the last valid orbit session;
  - verifies the route source includes the R3F branch while keeping DNA structure controls DNA-only.

## Browser Checks

Playwright Chromium verification used `http://localhost:3001/code/spatial-ravia/` and captured:

- `/private/tmp/spatial-ravia-orbit-shots/orbit-1440x900.png`
- `/private/tmp/spatial-ravia-orbit-shots/orbit-1280x800.png`
- `/private/tmp/spatial-ravia-orbit-shots/orbit-1024x768.png`
- `/private/tmp/spatial-ravia-orbit-shots/orbit-390x844.png`

Measured results:

- 1440x900: orbit canvas `1036x674`, no horizontal overflow, controls reachable, no console errors.
- 1280x800: orbit canvas `876x574`, no horizontal overflow, controls reachable, no console errors.
- 1024x768: orbit canvas `746.4x508`, no horizontal overflow, controls reachable, no console errors.
- 390x844: orbit canvas `388x618`, no horizontal overflow, controls reachable, no console errors.

Visual inspection confirmed the orbit is fitted and visible, labels are separated in the default state, and mobile stacks the panels while keeping the primary representation usable.

## Validation Commands

- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm run test:spatial`: pass, 152/152.
- `npm run eval:spatial`: pass, 108/108.
- `npm run build`: pass, with the existing Next.js multiple-lockfile workspace-root warning.
- `chapterbio npm test`: pass, 3/3.
- `chapterbio npm run build`: pass.

## Known Limitations

- The benchmark covers only 2026-01-01 through 2026-01-06 TDB.
- The two-body model omits lunar and planetary perturbations.
- The R3F scene uses enlarged bodies, vectors, and markers for interaction clarity.
- The route still uses legacy `biologicalContext` naming internally for generalized packs.
- DNA still uses a temporary adapter to derive `PhenomenonSpec`; orbit is direct but legacy pack fields remain for compatibility.

## Exact Next Recommended Task

Implement `UNIVERSAL_RAVIA_SPEC.md` milestone 11: add one server-side structured-output LLM adapter that emits only registered intent IDs. Invalid or unavailable providers must fall back or abstain deterministically. Do not add a general web agent, retrieval, deployment change, account system, or client-exposed API key.

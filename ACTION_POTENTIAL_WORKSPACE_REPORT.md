# Action-Potential Workspace Report

Date: 2026-08-06

## Implemented Behavior

- `/code/spatial-ravia/` now accepts “Show an action potential” through the same prompt/session path used by DNA replication.
- The visible action-potential workspace renders the existing process pack through `compileSceneFromSession`.
- Shared controls work for action potential: play/pause, restart, timeline scrub, 0.25x/0.5x/1x/2x speed, labels, directionality toggle, component selection, hide, and isolate.
- The DNA structure scale option remains available only for DNA replication. Action potential shows only the process mechanism scale.
- Unsupported prompts still preserve the last valid scene and playback state.

## Architecture Changes

- `app/code/spatial-ravia/dna-workspace.ts` now exposes `spatialWorkspacePacks` with DNA replication and action potential, while preserving the prior DNA-named exports as compatibility aliases.
- `app/code/spatial-ravia/prototype.tsx` now renders a generic Spatial RAVIA process workspace instead of a DNA-only shell.
- The route still uses the existing process registry, event-sourced session reducer, and scene compiler.
- The B-DNA Mol* viewer remains lazy-loaded and reachable only through the DNA molecular-scale view.

## Visual Layout Fixes

- The central process canvas is prioritized over the side panels at desktop widths.
- The SVG scene fills the available canvas with `preserveAspectRatio="xMidYMid meet"`.
- Action-potential stage labels were shortened in the in-scene timeline strip to prevent collisions.
- Compartment labels were moved away from the timeline strip.
- Mobile SVG labels receive a viewport-specific size bump so the scene is not made illegible by scaling.
- The route has no horizontal page overflow at the checked viewport sizes.

## Browser Checks

Chromium screenshots inspected:

- `/tmp/action-potential-workspace-1440x900.png`
- `/tmp/action-potential-workspace-1280x800.png`
- `/tmp/action-potential-workspace-1024x768.png`
- `/tmp/action-potential-workspace-390x844.png`
- `/tmp/dna-workspace-regression-1440x900.png`

Measured after fixes:

- `1440x900`: SVG box `1036x674`, label overlaps `0`, horizontal overflow `0`.
- `1280x800`: SVG box `876x574`, label overlaps `0`, horizontal overflow `0`.
- `1024x768`: SVG box `746.4375x542`, label overlaps `0`, horizontal overflow `0`.
- `390x844`: SVG box `388x430`, label overlaps `0`, horizontal overflow `0`.

## Scientific Classification

- Action potential is currently a schematic explanatory model with normalized time.
- The membrane, channel states, ion-flow arrows, stage strip, and voltage trace are schematic.
- The current voltage trace is not a Hodgkin-Huxley quantitative simulation and is not equation-derived.

## Tests Added

- The visible workspace starts action potential through the shared process engine.
- DNA molecular-scale controls remain DNA-only.
- Layout source guards cover the central-canvas grid, SVG fit behavior, mobile stacking, and timeline-label sizing.

## Validation Performed

- `npm run typecheck`
- `npm run test:spatial`
- `npm run lint`
- `npm run eval:spatial`
- `npm run build`
- `chapterbio npm test`
- `chapterbio npm run build`
- Chromium smoke checks at `1440x900`, `1280x800`, `1024x768`, and `390x844`
- Chromium DNA regression smoke at `1440x900`

## Known Limitations

- The strict Hodgkin-Huxley part of `UNIVERSAL_RAVIA_SPEC.md` milestone 8 is not complete because the repository does not yet contain a reviewed offline HH trace fixture.
- The action-potential workspace uses the SVG primitive compiler, not a D3-scaled quantitative trace renderer.
- Mobile keeps the primary representation usable, but the evidence and scale panels stack below the canvas.

## Exact Next Recommended Task

Add a reviewed offline Hodgkin-Huxley trace fixture, declare its units and provenance, and render it with deterministic graph scaling in the existing action-potential workspace without changing session controls or adding a new process pack.

# Action-Potential Workspace Report

Date: 2026-08-06

## Implemented Behavior

- `/code/spatial-ravia/` now accepts “Show an action potential” through the same prompt/session path used by DNA replication.
- The visible action-potential workspace renders the existing process pack through `compileSceneFromSession`.
- Shared controls work for action potential: play/pause, restart, timeline scrub, 0.25x/0.5x/1x/2x speed, labels, directionality toggle, component selection, hide, and isolate.
- The DNA structure scale option remains available only for DNA replication. Action potential shows only the process mechanism scale.
- The voltage graph uses a reviewed static Hodgkin-Huxley benchmark trace fixture scaled with D3.
- Unsupported prompts still preserve the last valid scene and playback state.

## Architecture Changes

- `app/code/spatial-ravia/dna-workspace.ts` now exposes `spatialWorkspacePacks` with DNA replication and action potential, while preserving the prior DNA-named exports as compatibility aliases.
- `app/code/spatial-ravia/prototype.tsx` now renders a generic Spatial RAVIA process workspace instead of a DNA-only shell.
- The route still uses the existing process registry, event-sourced session reducer, and scene compiler.
- The B-DNA Mol* viewer remains lazy-loaded and reachable only through the DNA molecular-scale view.
- `app/code/spatial-ravia/action-potential-trace.ts` declares HH trace points, `ms`/`mV` units, graph domains, viewport ranges, and the D3 path builder.

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
- `/tmp/action-potential-hh-trace-1440x900.png`
- `/tmp/action-potential-hh-trace-390x844.png`
- `/tmp/dna-workspace-regression-1440x900.png`

Measured after fixes:

- `1440x900`: SVG box `1036x674`, label overlaps `0`, horizontal overflow `0`.
- `1280x800`: SVG box `876x574`, label overlaps `0`, horizontal overflow `0`.
- `1024x768`: SVG box `746.4375x542`, label overlaps `0`, horizontal overflow `0`.
- `390x844`: SVG box `388x430`, label overlaps `0`, horizontal overflow `0`.
- HH trace desktop refresh: trace class `isStageActive`, horizontal overflow `0`.

## Scientific Classification

- Action potential is currently a schematic explanatory model with normalized time.
- The membrane, channel states, ion-flow arrows, and stage strip are schematic.
- The voltage graph is a fixed Hodgkin-Huxley benchmark trace fixture with declared physical units.
- The workspace is not an editable Hodgkin-Huxley equation solver.

## Tests Added

- The visible workspace starts action potential through the shared process engine.
- DNA molecular-scale controls remain DNA-only.
- Layout source guards cover the central-canvas grid, SVG fit behavior, mobile stacking, and timeline-label sizing.
- HH trace tests prove ordered physical trace points, D3 path generation, scene provenance, and source wiring.

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

- The action-potential workspace does not expose editable Hodgkin-Huxley parameters or solve equations in the browser.
- The HH trace is a fixed benchmark fixture rather than a generated per-session simulation.
- Mobile keeps the primary representation usable, but the evidence and scale panels stack below the canvas.

## Exact Next Recommended Task

Generalize `BiologicalProcessPack` to `PhenomenonPack` and migrate DNA/action-potential behavior without regressions.

# DNA Vertical Slice Report

## Implemented Behavior

- `/code/spatial-ravia/` now opens as a prompt-driven DNA replication process workspace.
- Supported prompts include `Show DNA replication` and the existing DNA replication aliases from the DNA process pack.
- The primary view is the compiled SVG scene from `compileSceneFromSession`, representing a normalized-time replication fork mechanism.
- The workspace exposes play/pause, restart, timeline scrubbing, 0.25x/0.5x/1x/2x speed, labels, 5'/3' directionality, component selection, hide, isolate, and clear-view controls.
- The scale selector has two options:
  - Fork mechanism: schematic explanatory model, normalized time, replication-fork process representation.
  - DNA structure: existing B-DNA Mol* experience, literal deposited PDB 1ZF5 coordinates, explicitly not a replication-fork structure.
- Unsupported prompts explain the limitation, list supported actions, and preserve the last valid scene and playback state.
- The workspace displays active stage, selected component explanation, assumptions, limitations, evidence mode, and claim-level source links.

## Architecture Changes

- `app/code/spatial-ravia/DnaMolecularView.tsx` contains the extracted prior B-DNA/Mol* experience.
- `app/code/spatial-ravia/prototype.tsx` is now the visible DNA process workspace.
- `app/code/spatial-ravia/dna-workspace.ts` wraps `startSessionFromPrompt` with the DNA-only process pack list used by the visible workspace and focused tests.
- The visible route now depends on the generic process engine:
  - `process-registry.ts` for registered process-pack prompt support.
  - `model.ts` for event-sourced session state, playback, selection, hiding, and isolation.
  - `scene-compiler.ts` for the SVG scene consumed by the UI.
- `app/globals.css` now contains containment styles for embedding the extracted molecular viewer as a secondary scale view and transparent SVG hit targets for reliable component selection.

## Tests And Browser Checks

- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm run test:spatial`: pass, 115/115 tests.
- `npm run eval:spatial`: pass, 108/108 scientific evaluation cases.
- `npm run build`: pass. Existing warning remains: Next.js infers `/Users/zerozae/package-lock.json` as workspace root because multiple lockfiles exist.
- ChapterBio validation:
  - `npm test` in `chapterbio`: pass, 3/3 tests.
  - `npm run build` in `chapterbio`: pass.
- Chromium verification:
  - Desktop 1440x1000: pass.
  - Mobile 390x844: pass.
  - Verified prompt generation, primary DNA-replication SVG, play/pause, component selection, isolate, clear view, speed selection, timeline scrub to 64%, unsupported prompt preservation, and secondary DNA-structure scale copy.
  - Confirmed no Mol* asset requests before opening the DNA-structure scale view.
  - Screenshots saved during verification: `/tmp/ravia-desktop.png` and `/tmp/ravia-mobile.png`.

## Scientific Representation Classifications

- Primary DNA replication view: schematic explanatory model.
- Time basis: normalized process time, not measured kinetics.
- Fork mechanism: replication-fork process representation.
- DNA structure view: literal deposited PDB 1ZF5 B-DNA coordinates.
- DNA structure limitation: B-DNA reference only; not a replication-fork structure and not evidence of an atomistic replisome.
- Evidence mode: curated local process-pack claims with claim-level source links; no LLM, external retrieval, or live scientific data lookup was added.

## Known Limitations

- The replication fork is schematic and not atomistic, sequence-specific, organism-specific, or kinetically calibrated.
- Enzymes are drawn larger than DNA for selection and explanation.
- The process model simplifies bacterial and eukaryotic replication into a shared core mechanism.
- The B-DNA Mol* view remains a separate molecular reference and requires its existing internal prompt/action before loading the structure.
- The route supports the first DNA vertical slice only; additional process packs are intentionally not exposed in the visible workspace yet.
- Next.js dev verification must use `localhost:3003`; `127.0.0.1:3003` is blocked by Next dev-origin protection unless `allowedDevOrigins` is configured.

## Visual Regression Fix

- Root cause: the visible DNA workspace rendered the process-pack scene with a fixed `0 0 920 560` viewBox, while animated DNA primitives and labels moved outside or near the edges of that coordinate system. The CSS then stretched the SVG inside a center column that was too narrow, producing clipped and compressed geometry.
- Fix: the scene compiler now derives the rendered viewBox from visible compiled primitives and actually rendered labels, including path geometry and realistic text bounds.
- Layout fix: the center representation column now has priority over side metadata panels, the SVG preserves aspect ratio, mobile stacks the primary scene before panels, and the DNA canvas has stable responsive dimensions.
- Interaction fix: active-stage membership now changes primitive emphasis, labels are stage-aware, and the label/direction controls visibly alter the scene without overlap in the checked default states.
- Before measurement at 1440x900: center column was 736px wide and the primitive union extended outside the SVG left edge.
- After measurement at 1440x900: center column is 995px wide, SVG is inside the canvas, primitive union is inside SVG, label overlaps are 0, and horizontal overflow is false.
- After measurement at 390x844: primary scene is first in the stack, center width is 390px, SVG is inside the canvas, primitive union is inside SVG, label overlaps are 0, and horizontal overflow is false.

## Exact Next Recommended Task

Implement a second visible curated process vertical slice after product approval of the target process. Recommended next slice: transcription, using the existing transcription process pack and the same generic session/compiler/control/evidence UI contract proven by the DNA slice.

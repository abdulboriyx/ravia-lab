# LLM Adapter Report

Date: 2026-08-06

## Implemented Behavior

- Added a server-side OpenAI Responses provider for Spatial RAVIA intent selection.
- The provider emits structured JSON only; it does not render, retrieve, solve equations, create packs, or mutate the UI directly.
- The request schema is generated from the registered local catalog:
  - process IDs;
  - biological/phenomenon contexts;
  - entity IDs;
  - command IDs;
  - intervention IDs;
  - representation modes;
  - parameter IDs.
- The visible client workspace does not import the server provider.
- If no API key is configured, the provider is unavailable and the existing deterministic resolver is used.
- If the provider throws, returns invalid JSON, returns an API error, or emits invented IDs, the existing deterministic fallback path is used.

## Architecture Changes

- Added `app/code/spatial-ravia/llm-openai-provider.server.ts`.
- Extended `BiologicalIntentProviderRequest` in `app/code/spatial-ravia/llm-interpretation.ts` so the provider catalog includes registered parameter IDs and labels.
- Reused the existing `validateStructuredIntent` gate as the authority after provider output.
- Kept `interpretBiologicalIntent` provider-injected and offline-testable.

## Structured Output Contract

- Endpoint shape: OpenAI Responses API.
- Output format: strict `json_schema`.
- Schema name: `spatial_ravia_registered_intent`.
- Required output fields:
  - `requestedFocus`;
  - `requestedEntities`;
  - `confidence`;
  - `ambiguity`.
- Optional fields are constrained by registered IDs:
  - `processSelection.processId`;
  - `biologicalContext`;
  - `requestedRepresentation`;
  - `requestedIntervention.commandId`;
  - `requestedIntervention.interventionId`;
  - `scientificModelDelta` entity, intervention, representation, and parameter references;
  - `unsupported.reason`.

## Safety Constraints

- No API key is read by client components.
- No external retrieval is added.
- No general web agent is added.
- No LLM-authored packs are allowed.
- No invented process, entity, source, equation, geometry, or renderer instruction can pass local validation.
- Invalid or unavailable provider behavior falls back deterministically.

## Tests Added

- `app/code/spatial-ravia/llm-openai-provider.test.ts`
  - provider unavailable without server API key;
  - request body uses strict JSON schema;
  - request body exposes registered catalog IDs but not sources, render plans, animation, or raw scientific content;
  - mocked Responses `output_text` parses into accepted structured intent;
  - API errors fall back deterministically;
  - nested Responses output parsing still fails invented IDs through local validation;
  - client workspace source does not import the server provider.

## Validation Commands

- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm run test:spatial`: pass, 158/158.
- `npm run eval:spatial`: pass, 108/108.
- `npm run build`: pass, with the existing Next.js multiple-lockfile workspace-root warning.
- `chapterbio npm test`: pass, 3/3.
- `chapterbio npm run build`: pass.

## Known Limitations

- The provider is a server-side adapter factory, not a deployed API route. The repository still uses static export, so production use requires the deployment decision in milestone 12.
- The adapter uses the current legacy `biologicalContext` naming because the session model still carries that field for compatibility.
- Tests mock OpenAI transport and do not perform a live API request.

## Exact Next Recommended Task

Implement `UNIVERSAL_RAVIA_SPEC.md` milestone 12: add CI for lint, typecheck, Spatial tests, evaluation threshold, Playwright smoke checks, static build, ChapterBio validation, and static/GitHub Pages deployment that runs only after every gate passes.

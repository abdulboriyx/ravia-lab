# Incompatibility Rules Report

Date: 2026-08-06

## Implemented Behavior

The prompt parser no longer uses a global contradiction regex table. Each registered process pack declares typed `incompatibilityRules` with:

- `id`;
- refusal `reason`;
- grouped phrase requirements where each group accepts one of several phrases.

`parsePromptWithPacks` resolves prompt candidates, checks incompatibility rules from candidate packs first, then checks remaining registered packs for cross-process conflicts. Matching rules return an unsupported prompt response without compiling or mutating the current scientific scene.

## Migrated Rules

DNA replication owns DNA polymerase direction errors, ligase synthesis misconceptions, Okazaki/leading-strand conflicts, RNA polymerase II cross-process conflicts, impossible potassium-channel ligation, ligase/RNA transcription conflicts, and invented PDB requests.

Eukaryotic transcription owns bacterial RNA polymerase II conflicts, RNA polymerase/coding-strand misconceptions, RNA synthesis direction errors, RNA/template identity errors, membrane-removal cross-process requests, Okazaki/transcription conflicts, both-strand DNA-copying conflicts, and template-removal conflicts.

Action potential owns sodium/repolarization errors, potassium/depolarization errors, sodium-channel/RNA synthesis conflicts, action-potential/Okazaki conflicts, and unsupported drug-dosing provenance bypasses.

## Tests

Added focused tests in `app/code/spatial-ravia/model.test.ts` proving:

- unsupported prompts resolve from process-pack rule metadata;
- malformed pack-owned incompatibility rules fail compiler validation;
- the existing Spatial suite remains green.

## Validation

Confirmed:

- `npm run typecheck`
- `npm run test:spatial`
- `npm run eval:spatial`

Full root, ChapterBio, and browser smoke validation should be rerun after documentation finalization.

## Known Limitation

The repository still needs an externally supplied sealed holdout prompt set. Adding new prompts directly in this implementation pass would create more regression coverage, but it would not be a sealed holdout.

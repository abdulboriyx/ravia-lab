# Transcription structural actors and active-site frame (M1)

This package is a renderer-independent bridge for future molecular actors. It
does not change P3 scientific state or select a renderer.

## Canonical source

The current grounded fixture is `rcsb-pdb:6ALH:assembly-1:model-1`, deposited
E. coli K-12 bacterial RNA-polymerase elongation context. It is explicitly
`BACTERIAL_RNAP`, never eukaryotic Pol II. The package records DNA chains A/B,
RNA chain R, polymerase chains G/H/I/J/K, and a bounded DNA/RNA hybrid window.

## Actors and frame

`resolveTranscriptionStructuralActorPackage` creates explicit DNA,
POLYMERASE, RNA, RNA_DNA_HYBRID, and semantic promoter actors. When grounded
geometry is supplied, actor bounds are derived from residue points; without
geometry, bounds remain absent rather than fabricated.

`deriveTranscriptionActiveSiteFrame` derives a right-handed basis from the
active-center, upstream-DNA, downstream-DNA, and (when available) RNA-exit
anchors. Missing RNA-exit evidence is represented as `null`; the frame's
orthogonal normal is only a basis fallback and is not an exit claim.

## Scale

All structural actors use one conversion: **1 Å = 0.01 structural scene
units** (100 Å = 1 scene unit). Camera/ROI zoom is presentation-only. Actor
geometry must not own independent nested scales.

`structuralToScene` and `sceneToStructural` are inverse transforms over the
frame bases and this scale. `frameTransform` bridges the structural frame to
the current parametric DNA mechanism frame without changing DNA geometry.

## Legacy coordinate authority

Current scene progress offsets, manual RNA offsets, independent bubble
positions, arbitrary polymerase offsets, and nested mechanism scales are
classified in `transcriptionLegacyCoordinateAudit`. They remain untouched in
M1 but are documented as presentation-only, temporary legacy, or requiring
replacement by the structural frame in later phases.

## Diagnostic

`formatTranscriptionStructuralDiagnostic` emits source, organism, polymerase
class, selected chains, anchors, and Å/scene scale for development diagnostics.

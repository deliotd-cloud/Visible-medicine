# Lamina terminalis teaching revision — 25 September 2026

Adds an original Pathology draft for the existing FMA61975 selection and removes
the obsolete Pathology-pending sentence from Clinical. The normal-anatomy
Clinical study and its limitations remain unchanged. This does not alter CT,
MRI, quiz content, geometry, access controls or specialist-owned segmentation.

## Scope and reference

Exact source: midline `limbic-landmarks`, isa, ordered FJ1764/FJ1812. Both original
pieces and their coverage warnings are preserved. No reconstructed membrane,
patient registration or imaging assets are introduced.

The draft links to [Richetta et al. (2024)](https://link.springer.com/article/10.1007/s00381-024-06323-w).
Methods, Discussion and Limitations were consulted on 25 September 2026.
The article is CC BY 4.0; no figures, tables, scans or prose are imported.
The original short factual synthesis identifies its evidence limits and remains
subject to revision-bound radiologist review. Reference access is not permission
to reuse other material. Existing BodyParts3D attribution is unchanged.

## Verification and remaining work

Run `node scripts/validate-lamina-pathology.mjs` and
`node scripts/record-lamina-pathology.mjs --check` from the Atlas source.
The test exercises the real details-panel callback, content export/schema,
full source identity, unchanged model bytes and the pre-change teaching/recipe
snapshot. Its saved report distinguishes render checks from browser acceptance.
Original historical baselines are preserved through a test-only editorial replay.

Verified: two changed placements, 9,934 unchanged topics, two actual panel-callback
renders, 78 rejected identity mutations, full content/review checks, mediastinal
and hallux regressions, TypeScript, focused lint and shared-module production
build. The unsigned 11-selection review index was refreshed; no sign-offs were
created. Browser acceptance and website integration are not claimed here.

Known older test failure: `validate-cranial-boundary-clinical.mjs` fails at the
costal-cartilage historical snapshot, before its own assertions. The immutable
parent commit reproduces the same expected/actual mismatch after exact replay;
see `lamina-parent-history-diagnostic.json`. Reproduce with
`node scripts/check-lamina-parent-history.mjs` from this revision. The new content
test independently proves equality of every other topic/recipe to that parent.
This diagnostic does not waive or replace the older test; repairing its replay
chain remains outstanding, with its original expected hash retained.

No clinical approval is granted. Patient-image correlation, final imaging links,
specialist segmentation acceptance and this teaching revision's radiologist
sign-off remain separate. Website integration/publication is recorded separately.

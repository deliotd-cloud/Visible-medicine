# Surgery and cast exclusions; fracture-label audit

28 September 2026. The owner requested exclusion of obvious prior surgery and
then casts. Selection now rejects the complete GRAZ study when any view carries
either source `metal` or `cast` tag. Originals and prior pilot revisions remain
unchanged. This is metadata filtering, not completed visual screening.

## Current local pilot

Use `.local/fracture-exams/pilot-20260928-r3-no-surgery-or-casts/`.
It contains six complete studies, 12 original PNGs, three fracture-labelled,
two no-fracture-labelled and one indeterminate case; 18 draft questions.
`review.html`, `review-notes.json` and `fracture-pilot.vm-fracture.json` are local
only. Revision: `16b3997b8a171014ab14c5da01567cc4f9927402a5a500337affb20c041697c3`.
All selected views lack metal/cast flags. The worksheet requires visual screening
for casts, surgical hardware and other obvious evidence of surgery on every view.
The builder also rejects flagged legacy contexts. Selection policy is bound into
the source evidence and therefore the exam revision.

The owner explicitly keeps images local pending review. No images were uploaded,
sent for AI interpretation, deleted or changed. R1 contains now-excluded examples;
R2 was an intermediate metadata-only run before casts were excluded. Both are
retained as history and superseded for selection by R3. Website version159 is
unchanged; no publication is needed for this local script/document change.

## GRAZ counts

| Source metadata | Count |
| --- | ---: |
| All images / studies | 20,327 / 10,699 |
| Metal-flagged images | 708 |
| Cast-flagged images | 5,776 |
| Images with either flag (overlap counted once) | 6,214 |
| Excluded complete studies | 3,305 |
| Excluded images including companion views | 6,258 |
| Remaining images / studies before other checks | 14,069 / 7,394 |

| Image label | Original | After whole-study exclusions |
| --- | ---: | ---: |
| Fracture | 13,447 | 7,540 |
| No fracture | 6,343 | 5,992 |
| Indeterminate | 537 | 537 |

These are image counts, not independent question counts. A no-fracture label does
not establish that an image is otherwise normal. Remaining studies are not all
exam-ready: existing eligibility, partitions, reserved review patients, grouping,
duplicates, image quality, visual cast/surgery screening and clinical/privacy/reuse
review still apply. At 50 cases per paper, 7,394 studies are an arithmetic ceiling
of 147 complete GRAZ-only papers with 44 cases left, before those checks.

## Other collections: labels, not visual diagnoses

| Collection | Source label counts | Surgery/cast screening |
| --- | --- | --- |
| FracAtlas | CSV: 719 fractured, 3,364 not fractured (4,083 rows) | 99 hardware-labelled rows privately listed for exclusion; remaining 622 fractured and 3,362 not fractured still require cast/visual checks and grouping |
| OrthoFrac-XR | 314 distal, 254 proximal, 349 post_fracture, 576 non_fracture (1,493 rows) | No explicit hardware/cast field found; `post_fracture` is not interpreted as proof of surgery |
| Al-Huda wrist | 111 files in Fracture, 82 in Normal folders | No structured surgery/cast metadata established; visual screening pending |

FracAtlas's existing audit reports 4,085 images while its CSV has 4,083 rows.
The difference is unresolved, so the extra image count is not treated as labelled
or cleared. Other collections remain held from pilot selection and patient-based
exam splits. No all-collection count of visually cleared cases is asserted.

## Verification and recovery

Nine Python selection tests and 26 Node draft/package tests pass. Tests cover
whole-study removal on a single flagged view, cast exclusion, refusal to fill
shortfalls with excluded cases, preservation of a separate unflagged study of
the same patient, existing partition/reservation guards and revision binding.
The build and package tools recheck original image SHA256 values.

Private evidence: `surgery-exclusions.private.json`,
`fracatlas-hardware-exclusions.private.json`, `collection-label-summary.json`,
`inventory.private.json`, and `preservation-check.json` in R3. No private source
identifiers are stored in this document. Source backup and its per-file hashes:
`D:\CodexBackups\VisibleMedicine\fracture-exams\selection-20260928`.
This backup contains only generic scripts, tests and documentation; images remain
in the original collection. Root Atlas work belongs to the coordination task and
was not edited or committed by this change.

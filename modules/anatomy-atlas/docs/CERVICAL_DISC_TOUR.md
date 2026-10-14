# Cervical spine: whole discs

Draft Guided learning sequence, 14 October 2026. Source baseline
`6b6d9bba99985dfc5ca8deb52ca9e2632b837d25`; tour revision
`cervical-whole-discs-20261014-r1`.

Spine and Whole body gain one six-stop tour beside the existing cervical bone,
thoracic and lumbar sequences. The original cervical bone tour stays the default.
The existing compact chooser, manual Start, smooth 1.8-second quintic transitions,
pause/exit, keyboard and reduced-motion controls are reused; no new toolbar.
Six source-labelled whole discs descend from the axis-labelled surface to the
C7-labelled surface. Each left-side camera window retains its two adjacent
vertebrae, for a consistent orientation through the sequence. All thirteen
surfaces stay assembled in the same source frame.

## Exact source and review scope

Six disc records: FMA25058 and FMA13896–FMA13900. Seven bone contexts:
FMA12520–FMA12525 and FMA9165. The two existing bundles are
`spine-connective-gaps` and `spine-skeleton`. The pin generator compares the
catalogue and both GLBs byte-for-byte with the baseline. A mismatched/duplicate
record, bundle, frame, source version, licence or changed tour is refused rather
than substituted. Models and source identity are not changed or clinically
validated by adding this tour.

Complete sequence, context, frames and timing belong to the teaching-review
evidence for these exact thirteen records. Other existing tours and teaching
must remain unchanged. The current six discs' CT/MRI/X-ray/ultrasound notes and
keyed quick checks are reused with their existing readiness and limits; this
does not add an acquired scan or turn pending modalities into completed teaching.

## Factual references and commercial-use boundary

Inspected 14 October 2026:

- [TTUHSC joints of the back](https://anatomy.ttuhscep.edu/anatomytables/joints_back.html): disc relationship to vertebral bodies and distinction of inner tissues.
- [TTUHSC bones of the back](https://anatomy.ttuhscep.edu/anatomytables/bones_back.html): vertebral identities and regional orientation.
- [ACR spine MRI module, cervical section](https://accreditationsupport.acr.org/support/solutions/articles/11000061020-mri-exam-specific-parameters-spine-module-revised-5-10-2022-): image coverage and sagittal/axial assessment, not mesh-derived MR signal.

Captions are original short orientation prompts over the existing source model.
No publisher prose, figure, table, scan, dataset or other media is imported or
relicensed. Reading access is not an asset-reuse licence. Existing project MIT
terms, BodyParts3D CC BY 4.0 attribution and source holds remain in force. No
new dependency, font, model, image, service or fee.

## Clinical and acceptance limits

The axis-labelled disc lies below C2 in this source; no C1–C2 disc is included.
Source labels do not number a patient scan. Annulus, nucleus, endplates, cord,
roots and foramina are not separate selected segmentations here. No measured
spacing, MR signal, pathology, neural compression, motion, procedural path,
patient-space registration or acquired-image linkage is established. Radiologist
sign-off must review the actual thirteen surfaces, level interpretation, camera
framing, omissions and captions for this exact revision.

Run `npm run cervical-disc-tour:test`, the source renderer/review checks and
types/build. Normal website export and protected Review import are required for
website delivery. Browser/GPU and signed-in clinical acceptance remain separate;
do not claim this source-only increment is already available on the website.

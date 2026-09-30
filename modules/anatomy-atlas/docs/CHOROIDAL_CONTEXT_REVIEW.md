# Cerebral arterial context — source review

Status: **unadmitted candidates; no clinical approval or learner export**.
This extends [the original source audit](ANTERIOR_CHOROIDAL_SOURCE_REVIEW.md)
with a rotatable contextual review, not generated or repaired anatomy.

## Scope and result

Four original anterior-choroidal parents/capsular branches are shown with both
internal carotids, both posterior communicating arteries, the supplied cerebral
choroid plexus, optic chiasm and paired optic tracts. Twelve concepts use fourteen
SHA-verified original source files. Optic context itself is unadmitted; its presence
in this local inspector is not a learner admission or anatomy approval.

The [bound report](../content/choroidal-context-review.json) screens 1,854 original
source files from 1,104 displayed definitions plus the prior held-source set.
There are no missing caches or unsupported shape signatures. Reindexed triangle
coordinates are screened independent of face order, winding and translation,
with optional source-axis reflections. No matching candidate signature was found.
The six candidate-pair comparisons also have no matching signatures. These results
do **not** exclude rotation, retessellation, partial overlap or semantic duplication.
Quantization at 1e-6 source mm can produce bin-related false positives/negatives.

Sixteen point-sampling probes inspect candidates against plexus/optic envelopes.
The supplied combined plexus has two non-manifold vertices and cannot be treated
as a closed oriented manifold. All four plexus probes therefore report unsupported,
not zero overlap or a trusted outside result. The previous left-parent near-contact
flag remains unresolved. The twelve optic-context probes contain no inside samples,
but discrete vertex/centroid sampling cannot certify continuous separation, tissue
planes, lumen, vessel origin, branch supply or clinical accuracy. No welding, repair,
source deformation or hold-policy relaxation was performed.

## Local inspector

```sh
npm run choroidal-context:test
npm run choroidal-context:check
npm run choroidal-context:preview
node scripts/serve-choroidal-context-preview.mjs
```

Requires the retained verified cache under the main workspace's `work/bodyparts3d`
on C:, plus installed existing dependencies. Nothing is downloaded. The builder
reproduces the current report before exporting original vertices/faces, checks
per-concept geometry hashes, and writes only the dedicated ignored review directory
`../work/choroidal-context-preview-20260930`. A repeat build requires `--refresh`,
which verifies the previous generated asset hashes before replacing those files.
The evidence CLI's explicit `--refresh` regenerates this source-only report; it
does not update learner assets, review approvals or clinical decisions.

The server binds only `127.0.0.1` on a free port and prints its URL. It checks
report/asset hashes before starting, serves only four named static assets, disables
caching and denies other paths/methods. This is not the protected website, a PACS,
an approval service or a production security boundary. Do not expose it publicly.

Controls: four candidate choices, click-to-select candidates, free rotate/zoom/pan,
five smooth camera presets, three context switches, context opacity and Reset.
Preset motion follows a fixed-radius spherical arc with eased timing rather than
passing through the model; reduced-motion preferences make presets immediate.
The same source-to-scene transform is applied to every surface. Camera framing
prioritizes the intracranial context; the long carotid neck segments may extend
beyond the initial viewport. No individual structure is resized or relocated.

## Verification and remaining review

Fourteen focused tests cover malformed shapes, reflections/reindexing, closed/open
envelopes, current evidence reproduction, source-pin failures, immutable original
scene geometry, metadata/geometry changes and incomplete screens. Browser evidence
in the main workspace records all four choices, five settled presets, free rotation,
context switches, opacity and Reset at 1280x720; screenshots inspected, no console
errors. Server acceptance is recorded separately in the checkpoint. These are
software/source checks, not clinical clearance.

Before admission the radiologist must inspect ICA/PCom origin and complete course,
optic and plexal relationships, the close left-parent/plexus course and branch extent.
Resolve the flag or explicitly retain/reject the candidate with revision-bound
evidence. Then use the established ingestion/export/review pipeline and test actual
selection, dissection, laterality and teaching in the learner website. Do not infer
scan correspondence or modify CT-head masks/accepted boundaries. Case, Atlas and
paid-lecture rights stay independent. This review leaves all learner geometry,
teaching, website runtime and clinical decisions unchanged.

## Commercial provenance

BodyParts3D originals retain CC BY 4.0 and the existing mandatory DBCLS credit.
The geometry is unchanged; colour, transparency and camera presentation are review
derivatives. The inspector uses existing MIT Three.js/OrbitControls, system fonts,
no textures and no new dependencies or mandatory services. Its generated
`THIRD_PARTY_NOTICES.txt` includes full Three.js MIT terms and source/license links.
No patient scans, publisher images or third-party diagrams are included.

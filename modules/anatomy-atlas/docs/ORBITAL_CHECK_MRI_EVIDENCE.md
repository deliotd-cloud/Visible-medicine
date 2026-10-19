# Check-ligament MRI evidence update

This update enriches four existing draft MRI lessons: right and left lateral
check ligaments (FMA49144/49145), and right and left medial check ligaments
(FMA49147/49148). It does not admit a new mesh, imaging study or validated target.

The original summary and citation concern [Ettl et al., Eye, 1997](https://pubmed.ncbi.nlm.nih.gov/9537133/).
The abstract describes four normal volunteers imaged at 1 T with a surface coil
and includes check ligaments among the connective structures seen. It does not
establish separate medial/lateral identification, routine-protocol visibility,
diagnostic accuracy or correspondence with an individual Atlas mesh.

The added prose is an original factual summary. No source image, figure, table,
contour, scan, verbatim passage, dependency, font, model or texture is imported.
There is no new service or fee. Existing notices and source holds remain.

## Revision and validation boundaries

The original 12-lesson introduction is commit
`214cec892da967a8057ab1647003200e4f934d92`, with parent
`390fc0cec7249d49106cd2bebeeb17bee6989a12`. Its validator is retained byte-exact
under `scripts/fixtures/validate-orbital-support-mri-original.mjs`. Historical
source, lesson, rendering, reference, record and refusal obligations are replayed
against genuine Git application blobs, not today's later curriculum.

The four-note enhancement is compared with actual predecessor
`509b01da5d72f33bd774e4a59d63e2406af1f2ff`. It must retain the other eight
orbital-support MRI lessons and all other structure/topic placements unchanged.
The source-pinned lesson resolver rejects altered or incomplete identities.
The normal snapshot/renderer generation and separate website import/export
pipeline remain required; editing this source alone does not update the website.

All four lessons remain drafts for revision-bound radiologist review. Neither
source tests nor this publication establish patient-space registration, clinical
approval, imaging-case access or paid-lecture entitlement.

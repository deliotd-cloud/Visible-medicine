# Mixed 250 review — visual cast/surgery screening completed

7 October 2026. The owner's instruction, “look through htem”, explicitly
authorized assistant visual inspection to correct the mixed review selection.
It did not authorize website upload or approval of exam content. The earlier
screening-authority question is superseded by that instruction.

All 300 views in R1 were inspected using local contact sheets, with original
enlargements for questionable findings. Sixteen-bit wrist views were normalized
for screening thumbnails; original image files were not altered. The screen
excluded the whole candidate whenever any supplied view showed a cast, splint,
substantial immobilizing wrap, obvious surgery or an uncertain result.

27 original cases were excluded: 23 for visible immobilisation, three uncertain
examples, and one with surgical clips/prior fixation changes. A further 79
replacement images were inspected. Of those, 23 had visible immobilisation,
two were uncertain and 54 passed the assistant screen. Exactly 27 cleared
replacements were selected. All 379 inspected image hashes and individual
screening decisions remain in ignored local files; this is assistant screening,
not owner clinical approval or a guarantee that every subtle finding was detected.

The revised local selection is
`.local/fracture-exams/mixed-review-20261007-r2/index.html`: 250 candidates,
300 original views, 125 fracture-labelled and 125 no-fracture-labelled, in five
groups of 50 with 25 of each label. Fifty are complete grouped wrist studies;
200 are single-image candidates with unresolved patient/companion-view linkage.
The 349 source post-fracture rows remain excluded. Some source region labels
are visibly inconsistent with the supplied anatomy, so region counts and labels
are presented as source metadata, not clinically verified answers. Exact region
quotas were relaxed where no suitable source replacements remained; the mixed
selection and source-label balance were preserved.

The rebuild requires explicit hash-bound cast-absent and hardware-absent results
for every supplied view. Missing/uncertain results and source cast/metal flags
cannot pass. It retains cleared originals, prefers replacements from the same
source region and label, rejects duplicate/reserved image bytes, and preserves
the prior revision. The generic mixed selector now applies the same explicit
screen requirement to canonical companion views as well as auxiliary images.

Validation: 22 focused Python tests pass; all five local worksheet bundles
build. All 300 selected hashes verify, all 250 candidates pass the screening
filter, and each group has 50 questions/100 possible marks with a distinct new
revision. All 27 prior review files remain byte-identical. The rebuild verified
size/mtime for 116169 source files. There is no prior image or known-patient
overlap outside the intentionally retained R1 cases. Interactive browser QA of
R2 is unverified; no browser-policy bypass was attempted.

Next owner action: review the revised images, confirm fracture status/anatomy
and accepted bone answers, resolve grouping/privacy/reuse checks, and export
each group's notes. These remain review groups, not approved papers. No image
upload, website publication, clinical PACS, Atlas or original-image change.

Generic code/docs and the non-identifying verification summary are recovered
with SHA256 receipts at
`E:/VisibleMedicine-LocalStaging/fracture-exams/cast-screened-review-20261007`.
No image pixels or private source locators are in that copy. E is same-machine
recovery, not off-device backup. The revised worksheets and image-level
screening records remain in the ignored local tree.

# Pelvic modality-topic completion

Original introductory teaching additions, 1 October 2026; radiologist sign-off
pending. Existing female-pelvic and two renal-derived ureter selections retain
their source/frame/IDs, geometry, studies, guidance and self-checks. No new model,
patient pixel, external dataset, font or runtime dependency is introduced.

## Scope

68 previously missing placements: CT29, X-ray37, ultrasound2.27 new family/topic
notes cover the existing pelvic selections; paired pieces may share a note.
All190 previous extended placements are retained byte-for-byte. Six extended
topics now exist for each of43 selections (258 placements); the original
Anatomy/Function material is retained separately. This is not258 unique lessons,
a complete radiology curriculum, diagnostic validation or source-anatomy approval.

Notes distinguish gross acquired-image landmarks from atlas seams, soft-tissue
projection overlap, unresolved small structures, potential spaces and absent
signal/flow/registration. The sacral and vaginal ultrasound notes describe
correlation limits, not an implemented probe view or verified lesion examination.
The two reused ureter lessons are unchanged.

## Reading sources and rights

Original short factual/model-specific synthesis links existing SEER, anatomical
and consensus references. Three additional reading entries link to ACR/RSNA:
[Abdominal and Pelvic CT](https://www.radiologyinfo.org/en/info/abdominct),
[Abdominal X-ray](https://www.radiologyinfo.org/en/info/abdominrad), and
[Pelvis Ultrasound](https://www.radiologyinfo.org/en/info/pelvus).
No publisher prose, images, diagrams, table, PDF or dataset is copied/imported.
Reading access/linking is not permission to redistribute a publisher's assets
or a publisher endorsement. Existing HRA commercial-compatible attribution and
other retained source notices remain mandatory; no blanket legal clearance is made.

Pelvic reference titles are revision-bound across all43 pelvic review packets.
The X-ray title already existed through the renal context; CT and pelvic-US titles
are new to that merged context. Clinical reviews therefore need fresh teaching
fingerprints, including metadata-only packets. Original source/geometry identity
is separate; no approved review is auto-migrated or created.

## Reproduce

```sh
node scripts/test-hra-pelvic-topic-completion.mjs
node scripts/test-hra-pelvic-topic-review-completion.mjs
node scripts/validate-hra-pelvic-teaching.mjs
node --import tsx --test scripts/test-hra-pelvic-guided-dissection.mjs
node scripts/validate-hra-pelvis.mjs
node scripts/validate-specimen-review.mjs
node scripts/audit-requirements.mjs --check
```

The review regression checks all356 independent contexts, original packets,
source hashes, changed teaching, stale/foreign rejections before storage, unchanged
guidance/core/self-checks, blocked imaging and unchanged pelvic/renal asset hashes.
The teaching validator renders all344 current selection/topic views with actual
React components, plus foreign-source rejection. These are software/SSR checks,
not browser/GPU, signed-in website or anatomical/clinical acceptance.

## Remaining human and release gates

Radiologist review of factual detail, visibility qualifications, model anatomy,
source holds and educational scope; revision-bound sign-off per selection/track.
Cleared real CT/MRI/X-ray/ultrasound cases and validated concept/registration
mappings remain separate. No learner Didanix Education transport or entitlement
is granted by these notes. Generated website import and signed-in browser
acceptance must follow separately; desktop PACS and CT-head masks are untouched.

# Circle of Willis — draft guided orientation

Ten stops use ten existing, individually selectable arterial source records in
the original BodyParts3D frame. Head & neck and Whole body reuse the existing
Guided learning picker, smooth quintic camera transition, loading/reduced-motion
guards, reading pause and exit restoration. No new control panel or geometry.

The order follows paired internal carotids, paired anterior cerebral arteries,
anterior communicating artery, paired posterior communicating arteries, basilar
artery and paired posterior cerebral arteries. Camera windows use the complete
selected vessel bounds and nearby supplied surfaces, not fabricated segments.
Whole-course carotid bounds include caudal anatomy; those views and the
carotid–ACA windows are not intracranial close-ups. A1, P1 and terminal carotid
segments are not separately selected. MCA/other branches are outside this tour;
the supplied surfaces do not prove a complete circle, lumen or collateral flow.

## References and commercial boundaries

Facts checked on 2 October 2026 against the original teaching institution:
[UTHealth anterior circulation](https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p06_index.html)
and [vertebrobasilar circulation](https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p07_index.html).
Brief modality distinctions use [ACR/RSNA CTA](https://www.radiologyinfo.org/en/info/angioct)
and [ACR/RSNA MRA](https://www.radiologyinfo.org/en/info/angiomr).
These are factual reading links, not asset grants: no image, diagram, scan,
publisher prose or dataset is copied or redistributed. Original captions/code
are MIT; the existing models retain CC BY 4.0 attribution. No new dependency,
font, texture, payment service or mandatory product fee.

## Review and imaging boundaries

Review all ten complete identities, laterality, source extents, omitted branches,
captions, camera windows and source relationships. The tour is draft and must
receive revision-bound radiologist sign-off. A plausible artery position is not
an acquired CTA/MRA correspondence; normal variants, disease, flow and lumen
patency cannot be assessed from this model. CTA is distinct from noncontrast CT,
and MRA from routine MRI. No patient images, frame mapping, measurements or
crosshairs are supplied. Future cleared resources use the existing exact-identity
linking contract and independent Atlas/case/lecture entitlements.

`scripts/test-circle-willis-tour.mjs` verifies source/GLB identity and camera
frame guards. `scripts/test-circle-willis-tour-review.mjs` protects all earlier
tours, 9,936 unchanged topic placements, source records and current review pins;
it rejects altered tour packets and stale synthetic revisions before storage.
Current shared library, player, step picker and camera tests also cover the new
entry. Earlier milestone tests retain their historical objects/hashes; the
pelvic pin delta is replayed at its exact `31a6ae7d` delivery epoch, with today's exact
ten-pin delta independently asserted. None of these checks establishes browser,
GPU, clinical or deployment acceptance. Website import is a separate local step.

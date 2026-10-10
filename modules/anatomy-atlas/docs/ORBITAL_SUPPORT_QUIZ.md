# Orbital support self-checks

Two original formative questions replace identification-only prompts for four
existing source structures: right/left superior-oblique trochlea (FMA49067/49068)
and right/left common tendinous ring (FMA49072/49073). Full retained source
identities, not just names or FMA numbers, bind the questions to these entries.
Baseline: `d944f63c7517498fc571536271b96b111ce8ab05`.

The trochlea question distinguishes the reflected superior-oblique tendon from
rectus origins. The ring question tests the shared usual origin of the four
rectus muscles. Feedback explains the distinction. Both remain drafts for exact
revision-bound radiologist review, with no approval inherited from an older quiz.

No geometry, scans, segmentation, model coordinates, camera motion, orbital-apex
boundaries or independent content entitlements change. Teaching is not validation
of physical tendon paths, pulley mechanics or CT/MRI spatial registration.

## Reference and rights

[TTUHSC El Paso Eye anatomy table](https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html),
Muscles rows for recti and superior oblique, checked 10 October 2026. Anatomical
facts informed brief original wording. No table, publisher prose, diagrams or
question bank is bundled. The source remains copyrighted; its public availability
does not grant commercial image-reuse rights. Original code/questions follow
project MIT terms. Existing model attribution/licences remain unchanged. No new
asset, dependency, font or paid service.

## Verification and integration

`npm run orbital-support-quiz:test` verifies source binding, the four-topic
transition, unchanged other teaching/geometry and stale/forged review refusal.
Generated review pins and renderer revisions must match the current source.
Website delivery uses the normal generated import; never edit exported modules
by hand. This source batch does not itself establish website import or clinical
acceptance.

Validation on 10 October: TypeScript, 33,468 shared content checks, current
source holds, generated pins and renderer revision checks pass. The dedicated
transition test confirms four changed / 9,932 preserved topics, four changed
teaching fingerprints and display pins, 176 refused identity mutations, and all
109 model bundles unchanged. Stale and forged review packets are rejected.
Evidence: `F:/VisibleMedicine/staging/20261010-orbital-support`.
The previous longus-colli transition test now checks its complete historical
three-question transition against fixed Git revision `d944f63c`, while retaining
live exact longus lessons, identities and stale/forged review rejection. Unrelated
later lessons no longer falsely count as changes in that earlier transition.

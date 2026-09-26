# Achilles tendon CT orientation — 27 September 2026

Two draft CT placements fill the previously pending right and left calcaneal
tendon panels in Leg, Foot and Whole body. They use existing FMA258847/FMA264844
surfaces only. The source scene, MRI/ultrasound teaching and all other topics
remain unchanged. No new CT image, geometry or correspondence is supplied.

## Evidence and editorial scope

The draft distinguishes the assembled surface from conventional CT and spectral
post-processing. Its primary reference is Foti et al. (2024),
[Identification of Achille’s Tendon Tears](https://doi.org/10.3390/jcm13154426),
a 22-patient, single-centre feasibility comparison against MRI. The described
fat-map application was non-specific; it had false positives. No sensitivity,
specificity, universal thickness threshold, clinical rule-out claim or scanning
recommendation is transferred into the Atlas.

Foti's [subsequent reply](https://doi.org/10.3390/jcm13237323) explicitly retains
the importance of examination, ultrasound and MRI. The Atlas therefore does not
present this experiment as their replacement. It also does not repeat the first
paper's misleading statement that DECT avoids radiation exposure: CT involves
ionising radiation. Model separation is not patient tendon retraction.

Both full-text article-specific rights statements were checked through Europe
PMC XML (PMC11313150 and PMC11642694) and grant CC BY 4.0. Author/year credit,
source links, licence link and adaptation disclosure accompany the draft; full
author credit is in `LICENSES/THIRD_PARTY_NOTICES.md`. No figures/tables/scans or
datasets were copied. No fee-bearing service or new dependency was used.

The parallel limb-source audit did not justify filling the remaining CT slots:
forearm/leg membrane studies primarily infer ligament behavior from bones or
experimental stress, the located long-plantar paper is CC BY-NC, and iliotibial
micro-CT research is ex vivo rather than ordinary clinical CT. Those gaps remain
explicitly pending; no assets or teaching were imported from those candidates.

## Binding and validation

`content/achilles-ct-pins.json` pins the complete two identities and bundle bytes
to parent `36c53fb9e19fca1c7e579f79d6d4807e4778ac19`. `lib/achilles-ct.ts` requires
an exact canonical identity and the CT topic; another side, altered component,
changed bounds or different source is not substituted. Lessons remain `draft`,
without clinical approval or attached patient images. Case/Atlas/lecture access
continues to be independent.

Run `node scripts/test-achilles-ct.mjs` and the adjacent elbow/coronary/Achilles
history suites. The test-only historical adapter removes only the exact recorded
transition; it must reject unrecorded changes rather than rewriting old expected
hashes. Current validation, source/backup identities and any browser limitations
are recorded in the coordinating task's `work/ACHILLES-CT-CHECKPOINT-20260927.md`.
These drafts still require revision-bound radiologist sign-off. Website export,
browser/actual-image acceptance and publication are separate gates.

Validated: exactly two CT changes, 9,934 topics preserved, 72 altered identities
rejected and both actual teaching callbacks rendered. Elbow and coronary history,
body review, review access/history, content contract, TypeScript and regional build
pass. The current shoulder export fixture was regenerated (revision metadata
only). The older Achilles MRI/US validator now bundles its application imports
correctly, but still exposes a pre-existing historical snapshot mismatch: the
parent and current APIs both produce `0104606a0be7569851a0f39cdf3cb6550a220a6e40cf2b08f8eb56b1ecda67e6`
instead of its immutable expected `fd50acb85998726b79cf3ecb646acf9897117b50f6768e5ea65bd6c89dfb629c`.
That check remains failing; its historical expected value has not been changed.
The new exact-parent test independently verifies all existing MRI/US copy unchanged.

Follow-up, 27 September: the historical mismatch is resolved. The older replay
removed shoulder answer-key fields but left the same fields on eleven regional
quiz copies. A test-only adapter now removes only the complete, SHA-pinned set
of those keys, rejects altered or mixed key sets, and preserves all other copy.
The original Achilles expected snapshot now passes unchanged: four MRI/US
sections, 8,172 other historical sections and 60 invalid bindings checked.
`ctRemainsPending` in that older validation report describes its historical
milestone only, not today's two CT drafts. No runtime content or approval changed.

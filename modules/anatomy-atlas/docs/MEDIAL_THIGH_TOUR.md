# Right thigh: medial-muscle Guided learning

Draft `right-medial-thigh-orientation`, revision
`right-medial-thigh-20261015-r1`, source baseline
`c26ef4bf570f05e4b0e078a620db49ca67922ed9`.

## Learner experience

Thigh and Whole body Guided learning gain one compact tour choice; the existing
Thigh tour remains the default. Five assembled-view stops select pectineus,
adductor longus, adductor brevis, adductor magnus and gracilis in that order.
Other muscles and the femur remain faded in the original common source frame.
Each stop fits its selected whole-muscle bounds rather than the entire femur,
keeping the short proximal muscles legible. Camera views proceed anterior,
anterior, anatomical left, posterior and anatomical left.

The existing 1,800-ms quintic-orbit transition, explicit Start/Play/Pause,
pointer/keyboard interruption, Back/Next/Finish, reduced-motion behavior and
source-bound quick checks are reused. Every 14-second stop remains a draft.
Source readiness requires both exact bundles; no missing-asset fallback or
automatic camera motion is introduced. No extra default toolbar is added.

## Exact scope

| Selected source | FMA ID | Display bundle |
| --- | --- | --- |
| Right pectineus | FMA22450 | thigh-muscles |
| Right adductor longus | FMA22456 | thigh-muscles |
| Right adductor brevis | FMA22452 | thigh-muscles |
| Right adductor magnus | FMA22459 | thigh-muscles |
| Right gracilis | FMA43883 | thigh-muscles |
| Right femur, faded context | FMA24474 | thigh-skeleton |

Full canonical source records, ordered tour content/frames, catalogue metadata
and bundle bytes/hashes are pinned. Changes to identity, laterality, regions,
bounds, source provenance, validation, bundles or tour instructions fail closed.
Six existing review worksheets gain this tour's evidence; source meshes and all
other teaching placements/worksheets remain unchanged. Conservative renderer
binding changes do not transfer clinical approval.

## Clinical and licensing limits

The geometry has not been anatomically validated. Pubic and tibial attachments
are described but their bones/footprints are not displayed as mapped landmarks.
Gracilis's tibial continuation is not a femoral insertion. The magnus whole
surface does not segment functional portions, motor territories or minimus.
Nerve supply variability does not establish a modelled nerve trajectory. No
contraction, surgical/procedural plane, measured attachment, acquired CT/MRI/US
mapping, patient registration or clinical acceptance is claimed.

Original concise factual captions were checked against the
[TTUHSC lower-limb anatomy table](https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html)
and the pectineus variation study by
[Kim et al., 2021](https://pubmed.ncbi.nlm.nih.gov/34156649/).
Existing detailed notes remain in `lib/thigh-curriculum.ts`. No reference text,
illustration or other publisher asset is copied. Existing BodyParts3D attribution
and commercial-compatible CC BY4.0 terms remain in force; no new model, texture,
font, dependency, service or mandatory fee is added.

Radiologist sign-off must identify this exact tour, source and renderer revision.
Normal website runtime/Review import, source/negative tests and live browser/GPU
acceptance remain separate from source availability or successful builds.

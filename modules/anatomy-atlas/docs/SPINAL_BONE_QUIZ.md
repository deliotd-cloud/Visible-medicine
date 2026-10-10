# Cervical and thoracic bone questions

Four original formative question groups replace generated identification prompts
for fourteen retained vertebrae: C4–C6 and T2–T12. These are shared landmark
questions, not fourteen distinct questions or proof that a learner can number a
patient's spine. Existing authored questions for other levels remain unchanged.

Exact parent: `574ca99c6119c25d0dce88c21dd77cbab74264cc`. Full source identities,
display bundles and previous lessons are retained in
`content/spinal-bone-quiz-pins.json`. Questions cover cervical transverse foramina,
typical thoracic rib-tubercle articulation, intervertebral foramina and vertebral
arch composition. The usual thoracic facet question applies to T2–T5, not the
atypical lower thoracic levels. C4–C6 questions explicitly distinguish regional
features from reliable individual-level numbering.

## Source and commercial use

[TTUHSC El Paso back anatomy tables](https://anatomy.ttuhscep.edu/schemes/back_tables.html)
were consulted on 9 October 2026 as factual references only. Original concise
wording/code follow project MIT terms. The source page's copyright is retained;
no prose, table, image or model is reproduced. Existing BodyParts3D attribution
and licence obligations remain unchanged. No new dependency or fee-bearing asset.

## Verification

`npm run spinal-bone-quiz:test` checks fourteen exact source identities, balanced
correct-answer positions, fourteen intended topic changes and all 9,922 other
topic placements against the parent. Eight identity mutations per target must
fail closed. Tests exercise each actual question component's correct/incorrect
feedback, retry/reset, keyboard focus and exam concealment, plus current/stale/
tampered Review packets. Existing forearm questions retain their own assertions.
Generation, content/review validators, inventory audit, types and regional build
are separately recorded under `E:/VisibleMedicine-LocalStaging/20261009-spinal-bone-quiz`.

These remain exact-revision radiologist-review drafts. No geometry, accepted
mask boundary, dissection, guided sequence, registration or entitlement changes.
Generated learner and protected Clinical Review must be imported together for
website delivery; source completion alone does not establish deployment or
browser/GPU/clinical acceptance.

The initial forearm regression replay correctly detected that its old expectation
of no guided tours predates the upper-limb venous tour. Its completed transition
now replays `74ed7e65`, while current guided packets are independently compared
with `574ca99c`. Current forearm questions and response validation remain tested;
no failing assertion was deleted. The original failed log is retained beside the
passing `forearm-current.json` receipt. The spinal suite independently checks
every current non-target lesson.

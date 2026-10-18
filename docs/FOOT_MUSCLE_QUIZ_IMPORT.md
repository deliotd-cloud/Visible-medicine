# Foot-muscle questions: website import

The regional and whole-body learner and protected Clinical Review are imported
from Atlas revision `f0d4f3622f967bb394a16e178339d6a30c02a5e0` together.
Six original question groups cover twelve bilateral selections: abductor digiti
minimi, flexor digiti minimi brevis, abductor hallucis, extensor hallucis brevis,
flexor accessorius and flexor digitorum brevis. Existing Quiz controls are reused.

The integration test verifies complete source identities, identical source bytes
in learner and Review inputs, actual bundled question/explanation text, current
review records and refusal of old questions, changed answers or changed source
hashes. The source milestone also tests correct/incorrect feedback, retry/reset,
keyboard focus and answer concealment during examinations.

Reference: [TTUHSC El Paso lower-limb anatomy table](https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html).
Only original factual questions and reading links are added; no publisher media,
tables or prose are imported. Existing asset notices and source holds remain.

No models, clinical masks, scans or patient coordinates change. These are
revision-bound radiologist-review drafts, not clinical approvals or spatially
registered image links. Atlas, imaging-case and lecture access stay independent.
Authenticated browser/GPU acceptance remains separate from synthetic component,
source-binding and signed-out HTTP checks.

Evidence: `E:/VisibleMedicine-LocalStaging/20261009-foot-quiz-integration/`.
The final `saved-state.json` records verified checks and the local checkpoint.
This milestone is local only, not a public deployment or off-device backup.

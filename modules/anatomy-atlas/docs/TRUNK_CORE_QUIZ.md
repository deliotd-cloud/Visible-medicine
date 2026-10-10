# Rectum and costal-cartilage questions

Three original formative questions cover 15 retained selections: rectum and the
left/right first through seventh costal cartilages. They replace generated
identification Quiz notes through the existing collapsed controls. No new
geometry, imaging link, segmentation, joint model or navigation is added.

The source baseline is `c27907d841039aaeccb96a755760dfa0fbe36730`.
The complete pin digest is `4e479d92b6134e1d4d25ccd841c48df1d89be1c4bb93df0a64bb8fda7185c1e0`.
`content/trunk-core-quiz-pins.json` binds each full displayed identity, source
component, model bundle and coordinate system to its previous Quiz note.

| Selection | FMA identities | Question focus |
| --- | --- | --- |
| Rectum | 14544 | Proximal continuation from sigmoid colon |
| First costal cartilages | right 7875; left 8005 | First sternocostal synchondrosis |
| Second–seventh costal cartilages | 7886/8031, 7913/8058, 7976/8167, 8070/8112, 8194/8221, 8248/8275 | Usual sternocostal synovial joints |

The source `content/exports/body.v2.json` is an archival base export: it still
contains generated-identification Quiz records for pancreas and celiac artery.
The **current displayed** `bodyLesson` resolver already supplies authored drafts
for both exact identities. This batch preserves those questions; it does not
replace them or change the export pipeline. Pinning and regression tests compare
current displayed identities and lessons, not labels or the archival Quiz field.

The joint questions distinguish the cartilage–sternum articulation from the
rib–cartilage connection. Usual anatomical relationships do not establish joint
surface details, motion, duct or bowel continuity in the model, or patient-space
registration. These are exact-revision radiologist-review drafts, not diagnoses
or clinical approvals. Atlas, imaging-case and paid-lecture access remain
independent.

Factual reading: [TTUHSC peritoneal cavity and intestines](https://anatomy.ttuhscep.edu/gastrointestinal_system/peritoneum_tables.html)
and [UAMS joints and ligaments of the thorax](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/joint-tables/joints-and-ligaments-of-the-thorax/).
Only the relevant factual relationships were used. Wording, alternatives and
explanations are original; no publisher text, question bank, figure, scan or
dataset was imported. Existing model licences and source holds remain.

`scripts/test-trunk-core-quiz.mjs --source-only` checks exact pins, all 15
intended transitions, 9,921 preserved topic placements, source mutations,
existing pancreas/celiac drafts and three quick-check interactions before
coordinator integration. Full mode additionally checks routed lessons and
revision-bound Review packets. Neither mode establishes browser, GPU, clinical
or publication acceptance.

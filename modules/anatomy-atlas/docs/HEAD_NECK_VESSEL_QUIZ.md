# Major neck vessel questions

Four original formative questions cover eight existing left/right common carotid,
internal carotid and vertebral arteries and internal jugular veins. They replace
generated identification Quiz notes through the existing collapsed controls.
No new vessel, geometry, imaging link or navigation control is added.

The source baseline is `ae0a56e5d074b921f259dc45c6c9167d6aac9125`.
The complete pin digest is `a2a9650d4d708cb2348e399cd3b05612e1afae260c56cfb32a0a4f68e776a9d4`.

| Question family | Right / left FMA | Learning focus |
| --- | --- | --- |
| Common carotid artery | 3941 / 4058 | Usual terminal branches |
| Internal carotid artery | 3949 / 4062 | Usual absence of cervical branches |
| Vertebral artery | 3958 / 4066 | Usual parent artery |
| Internal jugular vein | 4754 / 4762 | Continuation from the sigmoid sinus |

`content/head-neck-vessel-quiz-pins.json` binds each complete displayed identity,
source component, model bundle and coordinate system to its prior Quiz note.
The resolver rejects changed identities. Question wording concerns usual anatomy;
these surfaces do not demonstrate complete continuity, lumen, flow, boundaries
or patient-space registration. Draft questions require revision-bound radiologist
review; a passing test is not clinical approval.

Factual reading: [TTUHSC arteries of the head and neck](https://anatomy.ttuhscep.edu/anatomytables/arteries_head_neck.html)
and [TTUHSC veins of the head and neck](https://anatomy.ttuhscep.edu/anatomytables/veins_head_neck.html).
Their tables are reading references, not reusable assets or question banks.
Factual rows were checked on 9 October 2026. The questions test usual anatomy,
not an absence of anatomical variants or patient-specific findings.
Wording, alternatives and explanations are original; no publisher text, table,
figure, scan or dataset was imported. Existing model licences and holds remain.

`scripts/test-head-neck-vessel-quiz.mjs --source-only` checks exact source pins,
all eight intended transitions, unaffected placements, mutation refusal and
question-component interactions before integration. Full mode additionally
checks the routed body lesson and protected Review evidence. Import matching
generated learner and Clinical Review together before claiming website delivery.
Atlas, imaging-case and paid-lecture access remain independent.

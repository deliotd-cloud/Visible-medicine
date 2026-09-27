# Foot vascular structure checks — 27 September 2026

Eight existing whole-body/foot selections gain four paired, explicitly keyed
draft questions: medial plantar arteries, plantar arterial arches, deep plantar
arteries and dorsal venous arches. They use the existing collapsed quick-check
UI rather than adding another navigation surface. Both sides retain their exact
source identity. An answer describes conventional anatomy, not demonstrated
mesh continuity, a patent lumen, measured flow or a patient-specific finding.

The prompts test the posterior tibial origin of the medial plantar artery,
lateral plantar contribution to the plantar arch, dorsalis pedis origin of the
deep plantar artery, and medial/lateral superficial venous drainage. Answers and
explanations are explicitly authored drafts for revision-bound radiologist review;
they are not inferred from display colours, source proximity or old quiz bullets.

## Evidence and rights

Primary factual references inspected by the coordinator on 27 September 2026:

- TTUHSC El Paso, [arteries of the lower limb](https://anatomy.ttuhscep.edu/anatomytables/arteries_lowerlimb.html): plantar arch, deep plantar, lateral plantar and medial plantar entries.
- TTUHSC El Paso, [veins of the lower limb](https://anatomy.ttuhscep.edu/anatomytables/veins_lowerlimb.html): dorsal venous arch and great/small saphenous entries.

These tables are copyrighted references, not an open dataset or licensed asset
import. Only anatomical facts inform concise original questions and explanations;
no table, image, layout or extended source prose is copied or redistributed.
Existing anatomical model attribution and source holds remain unchanged. No new
dependency, external font, texture, image, subscription or paid service is added.

Source-specific pins, unchanged surrounding teaching, answer validation, actual
component rendering, exam suppression and recovery evidence are recorded in the
dedicated tests and the coordinating checkpoint. Draft readiness is not clinical
approval. Website delivery remains separately pinned; this source addition alone
does not publish questions or migrate a review decision.

## Validation

The focused test verifies eight changed quizzes, 9,928 unchanged other topics,
284 altered-source rejections and eight actual component/exam render cases.
Historical replay restores the pinned parent snapshot without changing old
expected hashes (33 foreign/mixed inputs rejected). Regional quick-check tests
now cover 19 keyed entries; 1,085 legacy notes remain unscored.

Passed: `test-foot-vascular-quiz.mjs`, `test-foot-vascular-quiz-history.mjs`,
`test-regional-quick-check-history.mjs`, `test-regional-quick-check.mjs`,
`test-structure-quick-check.mjs`, `test-achilles-ct.mjs`,
`validate-content-contract.mjs`, `validate-body-review.mjs`, TypeScript,
renderer revision verification and the head-neck regional production build.
The build retains a chunk-size warning; this is not a performance acceptance.

The real quick-check component was additionally exercised in a loopback preview
(`node scripts/preview-structure-quick-check.mjs --foot-vascular`): incorrect and
correct feedback, keyboard selection, retry focus, and reset on structure change.
At 320px touch width the long plantar-arch question and feedback fit a 320px
document; the venous answer also submitted correctly. This is component-level
browser evidence, not integrated website acceptance or clinical validation.
Detailed logs and verified recovery identifiers are in the main workspace's
`work/FOOT-VASCULAR-QUIZ-CHECKPOINT-20260927.md`.

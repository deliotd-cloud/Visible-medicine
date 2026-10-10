# Forearm muscle quick checks

Nineteen original four-choice draft questions cover all 42 bilateral selections in the pinned forearm imaging set. The humeral and ulnar heads of pronator teres share one question, as do the two heads of flexor carpi ulnaris. These questions teach usual whole-muscle anatomy; they do not assert an independent action for either head.

Factual references are the TTUHSC [forearm table](https://anatomy.ttuhscep.edu/musculoskeletal_system/forearm_tables.html), [upper-limb muscle table](https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html), [movement module](https://anatomy.ttuhscep.edu/modules/upper_limb_module/upper_limb_11.html) and [topographic table](https://anatomy.ttuhscep.edu/anatomytables/topogr_upperlimb.html). The questions synthesize action, insertion, movement and compartment facts in original wording. No table prose, publisher question, image, scan or patient information is imported. Question, choice and explanation text totals 138, 99, 87 and 73 words respectively for those four pages; each is below the 200-word per-page budget.

The quiz uses the existing Quick Check interaction. The source mesh is static and does not demonstrate movement or function or validate an anatomical boundary. Every lesson remains a draft pending revision-bound radiologist sign-off. Atlas, imaging-case and paid-lecture access remain independent; no clinical or deployment completion is claimed.

`node scripts/pin-forearm-muscle-quiz.mjs --check` verifies the exact parent display catalog, full identities, previous generated-identification lessons, coordinate system and two GLB hashes. `node scripts/test-forearm-muscle-quiz.mjs` checks source changes are refused, non-target lessons match the exact parent, Review packets reject stale or altered teaching, and the actual four-choice Quick Check handles answers and resets. The test requires shared dispatcher integration; an expected pre-integration failure is not evidence of a passing learner path.

Parent source commit: `1dc7916410479346c5f96ed0d9a42461eaada69b`. Pin SHA-256: `2bccb7c52025bfa15c9d37e2d5b5be0218deea35a8fd5a65e0467aa6c777c73e`.

## Integrated source verification — 9 October 2026

The actual dispatcher now resolves all 42 target Quiz lessons. Executable Quick
Check interactions cover correct and incorrect answers, retry, reset and focus;
lazy Quiz notes and exam concealment are checked. All 9,894 other topic placements
match the exact parent; 336 mutated identities are refused. Stale and modified
Review packets are rejected. The preceding hand suite retains live target and UI
checks, with its non-target history fixed to the completed hand-only epoch; the
new forearm suite protects every current non-target against that epoch.

Evidence is retained under
`E:/VisibleMedicine-LocalStaging/20261009-forearm-muscle-quiz`.
These checks do not constitute clinical, actual-browser or GPU acceptance.
The prior hand regression, fresh TypeScript check, generated renderer/content/
Review bindings, recovery/content/Review/decision validators, requirement audit
and audit check, and isolated E regional build all pass. Quiz draft coverage is
now 412 representation placements, not 412 unique questions or approvals.
Website learner and protected Clinical Review import must be performed together
after this source checkpoint; no public deployment is authorized by it.

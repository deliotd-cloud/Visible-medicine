# Lower-leg muscle formative quick checks

This draft covers all 28 retained bilateral lower-leg muscle identities in the current display catalog, including four individually selectable gastrocnemius heads. Thirteen original four-choice questions cover actions or innervation. Both gastrocnemius heads share a question about the actions of gastrocnemius. Fibularis and peroneal are equivalent naming conventions in the cited reference.

The [Texas Tech University Health Sciences Center El Paso lower-limb anatomy table](https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html) supports the general anatomical facts in these questions. The table is a reference, not a source-model validation or a licence to copy its images or text. The question wording and explanations here are original. The source table calls the great toe's flexor hallucis longus target a “proximal interphalangeal” joint; that terminology is avoided here by asking only which toe the muscle flexes.

`content/leg-muscle-quiz-pins.json` binds each question to the complete identity and both exact bundle bytes at parent commit `4bb7a85b962e2cbd20ee9f329ddd0ae38e4f0642`. The pin generator requires the previous quiz to be generated identification, and the lesson refuses altered source identities. The new material is a draft awaiting revision-bound radiologist review. It does not establish attachments, motion, diagnostic validity, patient-space registration, or clinical approval. Atlas, imaging-case, and paid-lecture access remain independent.

Focused verification:

```sh
node scripts/pin-leg-muscle-quiz.mjs --check
node scripts/test-leg-muscle-quiz.mjs
```

The focused test covers the source pins, every target and non-target against the named parent, exact source refusal, four-choice contract, Quick Check concealment/correct/incorrect/retry interactions, actual content route, lazy quiz notes, exam concealment, and rejection of an old Review packet. It requires the shared dispatcher and Review generation. It is not browser visual QA or clinical review.

## Source checkpoint

The integrated-default run passes 28 actual Quick Check interactions, 224
altered-source refusals and preservation of 9,908 non-target topic placements.
Each target rejects its old or modified Review packet. The previous thigh
regression retains live target/UI/refusal checks, with its historical non-target
comparison fixed to its completed epoch; this lower-leg suite covers current
non-target preservation. Types, generated renderer/export/Review display pins,
content/Review/decisions/recovery checks, inventory audit/check and the isolated
E regional build pass. The source Quiz draft count is now 332 placements.

Evidence and scoped same-machine recovery:
`E:/VisibleMedicine-LocalStaging/20261009-leg-muscle-quiz`.
One Sol Medium worker authored six bounded files; the coordinator integrated,
reviewed the reference and verified the shared outputs. Per-run token counts are
unavailable. No browser/GPU, clinical, public deployment or remote-backup claim.
Next: import the generated regional learner and protected Clinical Review
together, preserving the website's separate source repository and specialist work.

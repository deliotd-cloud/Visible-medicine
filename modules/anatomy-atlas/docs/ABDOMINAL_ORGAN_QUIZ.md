# Abdominal organ quick checks

Six exact root-body placements replace generated identification prompts without
an answer key: pancreas, both kidneys, spleen and both adrenal glands. Four
original questions cover exocrine/endocrine pancreatic function, renal urine
formation, splenic blood filtration and adrenal cortex/medulla function. Paired
organs share their question; laterality supplies no invented functional finding.

All lessons remain draft and require revision-bound radiologist review. Whole
source records are pinned using sourceCanonical, with source bundle raw-byte
hashes, coordinate system and the complete parent lessons/recipes snapshot.
An identity change or another tab resolves to undefined. Surface meshes do not
depict microscopic anatomy or represent patient imaging. Case, Atlas and lecture
access remain independent; no clinical approval or publication is included.

References read 28 September 2026: [NIH SEER pancreas](https://training.seer.cancer.gov/anatomy/endocrine/glands/pancreas.html),
[NIDDK kidneys](https://www.niddk.nih.gov/health-information/kidney-disease/kidneys-how-they-work),
[NIH SEER spleen](https://training.seer.cancer.gov/anatomy/lymphatic/components/spleen.html),
and [NIH SEER adrenal](https://training.seer.cancer.gov/anatomy/endocrine/glands/adrenal.html).
No source prose or images are reproduced. The validator caps original teaching
at 180 words per source across all six placements, including duplicated paired
questions and answer keys.

Run `npm run abdominal-organ-quiz:test` for integrated source, component and
immutable-parent history checks. All six placements resolve, render and answer;
215 invalid source/topic cases and 42 altered mesh bindings are rejected. The
other 9,930 teaching slots and source geometry/recipes match the parent commit.
The history test restores exactly six prior questions and rejects 25 mutations.

Integration acceptance, 28 September 2026: the 33,460-check content contract,
1,104-selection review export (283 rendered states), cervical quiz/tour regression,
TypeScript, regional production build and renderer-revision verification pass.
The initial test incorrectly compared displayed pancreas bindings with the raw
archive catalog. It now independently replays the parent display exporter and
still rejects changed/missing/duplicate bindings; production gates were not relaxed.

Actual 375 x 812 browser sampling verifies pancreatic wrong-answer/retry and
correct-answer/practise-again feedback, then right-kidney selection clears the
previous answer and accepts its own correct answer. Switching from right to left
kidney also clears feedback/selection despite their shared question. Screenshot inspection shows
readable wrapped choices and feedback; document width remains 375px. Component
checks cover all six placements; this browser sample is not full device or clinical
acceptance. Website import and radiologist sign-off remain separate pending steps.
Exact source/GitHub/D-drive recovery is recorded in the coordination checkpoint.

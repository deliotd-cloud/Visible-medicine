# Neck muscle question coverage

Nine original formative question groups cover eighteen retained left/right
selections: scalenus anterior, medius and posterior; sternocleidomastoid;
platysma; omohyoid; sternohyoid; sternothyroid; and thyrohyoid. Each replaces
an identification-only Quiz-tab prompt. These are draft questions about usual
anatomy. They do not establish diagnosis or validate source-surface boundaries,
attachments, nerve paths, movement, or completeness.

## Sources and review boundary

Baseline: `af69bf38d0ca8a951281db0baf1a14b8d7c68bc5`. The pin file retains
complete structure identities, matching source bundles with byte length and
SHA-256, whole display-catalog identity, and each previous quiz lesson. Altered
source identities must fail closed. The binding remains subject to the owner's
revision-bound radiologist sign-off; no clinical approval is asserted.

Question facts were checked against the [TTUHSC El Paso head and neck muscle
table](https://anatomy.ttuhscep.edu/anatomytables/muscles_head_neck.html) and
the university-hosted [Advanced Anatomy muscle
chapter](https://pressbooks.bccampus.ca/advancedanatomy1sted/chapter/muscles/).
Question stems, options and explanations are original wording: 94 words are
attributed to the TTUHSC page and 120 to the Advanced Anatomy page. The three
overlapping TTUHSC neck tables were treated as one source, not separate word
allowances. No third-party examination questions, images, tables, model assets,
scans or datasets are imported. Existing source licences and holds remain in
force. Answer positions are distributed 3/2/2/2.

## Verification and delivery

Run `node scripts/pin-neck-muscle-quiz.mjs --check` and the focused
`neck-muscle-quiz:test` package check after matching Review evidence is
regenerated. The focused test checks all eighteen intended quiz changes against
the pinned parent, all other topic placements, changed source refusal, exact
bundle bytes, actual question rendering and interactions, and revision-bound
Review rejection cases. A passing source test does not replace browser/GPU
acceptance or clinical sign-off.

Scoped evidence and same-machine source recovery:
`E:/VisibleMedicine-LocalStaging/20261009-neck-muscle-quiz/`.
Source completion is not website delivery. Atlas, imaging-case and paid-lecture
access remain independent; CT-head masks, source scans and clinical PACS stay
outside this milestone.

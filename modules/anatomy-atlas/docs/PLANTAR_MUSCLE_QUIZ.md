# Foot muscle question coverage

Six original formative question groups cover twelve retained left/right foot
selections: abductor digiti minimi of foot, flexor digiti minimi brevis of foot,
abductor hallucis, extensor hallucis brevis, flexor accessorius (quadratus
plantae), and flexor digitorum brevis. Each replaces an identification-only
Quiz-tab prompt. Extensor hallucis brevis lies on the dorsum of the foot;
“foot muscle” is therefore the learner-facing title. Variable opponens digiti
minimi, already covered forefoot muscles and interossei remain outside this batch.

## Source and review boundary

Baseline: `017344c4c08fda81c9e1d64853c5ab05c7320d71`. The pin file retains
complete structure identities, matching source bundles with byte length and
SHA-256, whole display-catalog identity, and each previous quiz lesson. Altered
source identities must fail closed. These are draft questions about usual
anatomy; they do not validate source-surface completeness, boundaries,
attachments, nerve paths, or movement. No clinical approval is asserted;
revision-bound radiologist sign-off remains pending.

Question facts were checked against the university-hosted [TTUHSC El Paso lower
limb muscle table](https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html),
including its quadratus plantae entry for the source term flexor accessorius.
Stems, options and explanations are original wording. Their combined 195 words
are attributed to that one page; no source prose is quoted. No third-party
questions, images, tables, model assets, scans or datasets are imported.
Answer positions are distributed 2/1/2/1.

## Verification and delivery

Run `node scripts/pin-plantar-muscle-quiz.mjs --check` and the focused
`plantar-muscle-quiz:test` package check after matching Review evidence is
regenerated. The focused test checks all twelve intended quiz changes against
the pinned parent, all other topic placements, changed source refusal, exact
bundle bytes, actual question rendering and interactions, and revision-bound
Review rejection cases. A passing source test does not replace browser/GPU
acceptance or clinical sign-off.

Scoped evidence and same-machine recovery:
`E:/VisibleMedicine-LocalStaging/20261009-plantar-muscle-quiz/`.
Source completion is not website delivery. Atlas, imaging-case and paid-lecture
access remain independent; CT-head masks, source scans and clinical PACS stay
outside this milestone.

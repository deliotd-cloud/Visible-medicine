# Neuro-organ question coverage

## Integrated source checkpoint — 10 October 2026

The main dispatcher now serves all six draft Quiz placements. The integrated
test passes: 9,930 other topic placements are unchanged, 72 altered source
identities are refused, and five actual component correct/wrong/reset cycles
pass. Current Review packets pass; predecessor and tampered packets are
rejected. Only the six corresponding Review display fingerprints changed.
The coordinator independently checked the NEI and Texas Tech pages and the
[original study's PubMed abstract](https://pubmed.ncbi.nlm.nih.gov/25882650/).
The original-study abstract supports the adult patency caveat; it does not
validate a particular model surface. Website-generated module import and
clinical sign-off are separate subsequent steps.

Five original formative question groups are prepared for six exact source
selections: brain, spinal central canal, pituitary gland, right and left
eyeballs, and the right-sided tentorium portion. The same retina question is
used for both eyeballs. All remain draft teaching notes pending revision-bound
radiologist sign-off. The questions concern general anatomy; the visible
source surfaces do not prove complete anatomy, physiology, a patent central
canal, retinal segmentation, patient registration or clinical findings.

## Factual references and provenance

- [Texas Tech University Health Sciences Center brain anatomy table](https://anatomy.ttuhscep.edu/anatomytables/brain.html): brainstem components and the tentorium as a dural sheet over the cerebellum. The two attributed questions, choices and explanations total **91 original words**.
- [Adult human spinal cord ependymal region study, PMC4614133](https://pmc.ncbi.nlm.nih.gov/articles/PMC4614133/): ependymal lining in patent canals and the frequent absence of a patent canal in adults. The attributed question, choices and explanation total **46 original words**.
- [Society for Endocrinology pituitary gland page](https://www.yourhormones.info/glands/pituitary-gland/) and [empty sella page](https://www.yourhormones.info/endocrine-conditions/empty-sella-syndrome/): pituitary location in the sella turcica and the sphenoid bone containing that depression. The one attributed question, choices and explanation total **53 original words** per citation.
- [National Eye Institute, How the Eyes Work](https://www.nei.nih.gov/learn-about-eye-health/healthy-vision/how-eyes-work): retinal photoreceptors detect light and convert it to electrical signals. The attributed question, choices and explanation total **33 original words**.

References checked 10 October 2026. The NEI and Texas Tech pages loaded
directly. The Society for Endocrinology pituitary page returned 403 on direct
fetch; indexed extracts from it and the empty sella page supported the precise
sella facts. The PMC page
returned a browser challenge; its indexed original-study abstract and excerpts
supported the adult canal caveat. The requested NCBI Bookshelf brain page also
returned a browser challenge, so the directly accessible Texas Tech anatomy
table supports the brainstem question. The coordinator should retain this
access limitation in its independent clinical evidence review.

Counts use the focused test's whitespace tokenization of each question,
choices and explanation. They count attributed original wording conservatively,
not copied text. No prose, tables, figures, exam items or media were imported
from the reference pages. Citations support facts and grant no redistribution
rights to the publications or imagery. Existing model licences and attribution
remain in force.

## Source and verification contract

Immutable parent: `975ff5abdba4582884a8cc34289fdc3416318093`.
The pin record retains complete displayed source identities, prior generated
identification lessons, coordinate system and all five actual bundle byte
lengths/SHA-256 values. The brain is a 59-source aggregate, the right eyeball
an eight-source aggregate, and the left eyeball a nine-source aggregate. The
tentorium selection is only the right-sided source portion. The pin SHA-256
over canonical JSON is
`5d874cbb9e993520da56840660d0defd4315a6493aff635031000e0cdc8f5f30`.
The pin helper accepts only its exact empty bootstrap stub on first write;
subsequent verification uses `--check`.

`node scripts/pin-neuro-organ-quiz.mjs --check` and
`node scripts/test-neuro-organ-quiz.mjs --source-only` pass before shared
dispatcher integration. The source-only test checks six target placements,
9,930 untouched placements, 72 altered-source refusals, five answer groups and
five correct/wrong/reset UI cycles. It does not claim learner dispatch. After
the coordinator wires the dispatcher and refreshes review/display evidence,
run the test without `--source-only`; that mode requires exactly six Quiz
lessons and accepts only current, untampered Review packets while rejecting
predecessor packets. The coordinator owns shared metadata writers and website
integration. Review packet validity is not clinical approval. Browser/GPU,
deployment and off-device backup acceptance remain separate.

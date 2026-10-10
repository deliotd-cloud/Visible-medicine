# Hand venous anatomy questions

Five original formative questions cover 14 retained hand venous selections:
two deep and two superficial palmar venous arches, two dorsal networks, two
palmar metacarpal veins, and six proper palmar digital vein identities for the
index, middle and ring fingers. They replace generated-identification Quiz
notes through the existing QuickCheck. No mesh, scan, imaging match, drainage
simulation, or navigation control is added.

Parent source and Quiz baseline: `49202472cd917b5f52948279ab6cc7d19b2208d1`.
Complete displayed-identity pin digest:
`e305f69bd4d024a979850f0d115727613951399428c96a0a3ed631a31674bf6d`.
`content/hand-venous-quiz-pins.json` binds each complete displayed identity,
all source file identities, bundle and coordinate system, plus its exact previous
Quiz lesson. The same 14 identities are retained from
`content/hand-venous-imaging-pins.json`; altered or unpinned identities are
refused.

| Selection | Count | General anatomy focus |
| --- | ---: | --- |
| Deep palmar venous arches | 2 | Accompany corresponding arterial arches |
| Superficial palmar venous arches | 2 | Receive common palmar digital veins |
| Dorsal hand venous networks | 2 | Cephalic receives the lateral side |
| Palmar metacarpal veins | 2 | Drain into deep palmar venous arch |
| Proper palmar digital veins | 6 | Received by common palmar digital veins |

These are ordinary anatomy relationships, not evidence of donor-specific
drainage. The deep and superficial arch names do not validate vascular plane,
complete continuity, tributaries, lumen, patency or flow in the source surfaces.
Grouped metacarpal and digital mesh components remain single source identities;
they are not independently named branches. The retained sample excludes held
little-finger identities `FMA85102` and `FMA85103`. Thumb-specific and common
palmar digital vein geometry is absent, so questions mentioning common veins
do not imply an Atlas selection or a fully reconstructed physiological map.
No CT/MRI contour, comparison match, or patient-space registration follows from
the mesh. All questions remain drafts pending revision-bound radiologist
sign-off. Software checks do not grant clinical approval. Atlas, imaging-case,
and lecture access remain independent.

Factual reading: Texas Tech University Health Sciences Center El Paso,
[Veins of the Upper Limb](https://anatomy.ttuhscep.edu/anatomytables/veins_upperlimb.html)
for lateral cephalic and medial basilic drainage; Jozsa and Varacallo,
[Anatomy, Shoulder and Upper Limb, Hand Volar Arch Arteries](https://www.ncbi.nlm.nih.gov/sites/books/NBK545377/?report=classic),
Blood Supply and Lymphatics, for the named palmar venous relationships. The
five question/choice/explanation sets contain 100 original factual words
grounded in the StatPearls article and 27 in the university table, within the
respective 190- and 60-word limits. No source prose, media or questions were
copied. The StatPearls article's NC-ND rights are not treated as a licence for
republication; this content is a short original synthesis of facts.

`scripts/test-hand-venous-quiz.mjs --source-only` checks exact source
bindings, previous generated Quiz notes, provenance refusals, and five
QuickCheck interactions. Full mode additionally checks routed transitions,
preservation of all other topic placements, lazy Quiz notes, exam hiding and
revision-bound Review packets.

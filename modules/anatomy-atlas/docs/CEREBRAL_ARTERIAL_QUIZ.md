# Cerebral arterial anatomy questions

Five original formative questions cover eight retained root selections:
basilar artery, anterior communicating artery, and the right/left anterior
cerebral, posterior communicating and posterior cerebral arteries. They
replace generated-identification Quiz notes through the existing quick check.
No geometry, model, imaging link or navigation control is added.

Source baseline: `25f5dccb6e9f5e7d02450de1ef58144e7eb18718`.
Complete displayed-identity pin digest:
`d3a7c608b201010c6e80a08f32f62487946879f14a03467015252ad5f854383b`.
`content/cerebral-arterial-quiz-pins.json` binds each complete displayed
identity, all source files, model bundle and coordinate system to its previous
Quiz note. The resolver refuses any altered source or unpinned identity.

| Selection | FMA ID(s) | Focus |
| --- | --- | --- |
| Basilar | 50542 | Paired vertebral inflow |
| Anterior communicating | 50169 | Connection between paired ACAs |
| Anterior cerebral | 50029 / 50030 | Predominantly medial frontal/parietal territory |
| Posterior communicating | 50085 / 50086 | Internal carotid–PCA connection |
| Posterior cerebral | 50584 / 50585 | Usual basilar bifurcation origin, with variant caveat |

Both PCA selections bind nine original `PART-OF` source files each. The other
six selections use `IS-A` sources; basilar binds two files. Left `M` filename
suffixes are retained source labels, not proof of mirrored acquisition. Source
surfaces cannot prove a lumen, patency, flow, continuous arterial circle,
complete perfusion territory, donor-specific variant or patient registration.
The questions express normal relationships and remain drafts pending
revision-bound radiologist sign-off. Software checks do not grant clinical
approval. Atlas, imaging-case and lecture access remain independent.

Factual reading: University of Texas Medical School at Houston
[anterior circulation](https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p06_index.html)
and [posterior circulation](https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p07_index.html).
The wording, choices and explanations are original; no figures, scans,
publisher exercise or source geometry were copied into the teaching content.

`scripts/test-cerebral-arterial-quiz.mjs --source-only` checks the eight exact
source bindings, direct lessons, source/provenance refusal and five quick-check
interactions. Full mode verifies eight routed transitions and preservation of
all 9,928 other topic placements, lazy notes, exam hiding and revision-bound
Review packets.

The initial pin-generation check rejected an incorrect `IS-A` expectation for
the PCA composites. The expectation now explicitly matches their retained
`PART-OF` identities; source data was not changed. Original failure and corrected
logs are retained in the scoped E-drive checkpoint directory.

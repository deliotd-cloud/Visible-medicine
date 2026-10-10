# Deep-brain anatomy questions

Six original formative questions cover the twelve retained left/right caudate,
putamen, globus pallidus, thalamus, lateral geniculate body and medial
geniculate body selections. They replace generated-identification Quiz notes
through existing collapsed controls; no model, source geometry, imaging link or
navigation control is added.

Source baseline: `9d40a9fcad09cbe3fc6eb89692cb0e2eaaa3b763`.
Complete displayed-identity pin digest:
`6ab3a1675f49936b62210879aa7bd28c2875ad461c2b5ff9d2a0650d42ec6d74`.
`content/deep-brain-quiz-pins.json` binds each complete displayed identity,
source component, model bundle and coordinate system to its prior Quiz note.
The resolver refuses changed source/provenance or an unpinned identity.

| Pair | FMA right / left | Focus |
| --- | --- | --- |
| Caudate | 72826 / 72827 | Relationship to putamen in neostriatum |
| Putamen | 72828 / 72829 | Relationship to globus pallidus in lentiform nucleus |
| Globus pallidus | 72830 / 72831 | Internal-segment output to thalamus |
| Thalamus | 258714 / 258716 | Third-ventricle wall landmark |
| Lateral geniculate body | 73303 / 73304 | Visual system |
| Medial geniculate body | 73309 / 73310 | Auditory system |

The retained left medial geniculate identity uses source component `FJ1816M`
(not the right side's `FJ1816`), with unchanged `isa` source-tree and
`licensed-source-mesh`, recovered, unvalidated provenance. Its suffix does not
by itself establish how the source geometry was acquired or derived. No
independently acquired bilateral anatomy or clinical accuracy is claimed.

These questions teach general relationships, not subdivisions or connections
shown by the whole-structure surfaces. In particular, the globus pallidus
question specifies the **internal segment** because the displayed source
does not separately resolve that segment or its fibres. No nuclear territory,
tractography, physiological activity, tissue boundary or patient registration
is inferred. All six are drafts pending exact-revision radiologist review; a
passing test is not clinical approval or diagnostic evidence.

Factual reading (University of Texas Medical School at Houston):
[basal ganglia relationships](https://nba.uth.tmc.edu/neuroanatomy/L10/Lab10p05_index.html),
[pallidal motor-circuit output](https://nba.uth.tmc.edu/neuroscience/m/s3/chapter04.html),
[geniculate sensory systems](https://nba.uth.tmc.edu/neuroanatomy/L5/Lab05p10_index.html),
and [thalamic ventricular landmark](https://nba.uth.tmc.edu/neuroanatomy/L10/Lab10p25_index.html).
Facts were checked on 9 October 2026. Wording, alternatives and explanations
are original; no publisher exercise, prose, figure, scan or dataset was
imported. Existing model licences and source holds remain unchanged.

`scripts/test-deep-brain-quiz.mjs --source-only` checks exact pins, twelve
intended transitions, all other topic placements, source/provenance mutations
and six actual quick-check interactions before coordinator integration. Full
mode also checks routed lessons and revision-bound Review packets. Atlas,
imaging-case and paid-lecture access remain independent.

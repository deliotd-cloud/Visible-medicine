# HRA lymph-node source review — 17 September 2026

**Not admitted as human anatomy.** This is a new bounded screen of the seven
`Yao_*` mesh descendants of `Yao_lymph_node` in the retained official HRA female
v1.10 assembly. It does not fill the Atlas's human lymphatic-system gap.

## Provenance changes the decision

The current assembly metadata names Browne/Schlehlein and the Visible Human
Dataset, but that assembly-wide description is not sufficient donor provenance
for every component. Each selected mesh's embedded `glb_file_of_single_organs`
identifies `NIH_F_Lymph_Node`. The [official organ-specific HRA v1.2 record](https://cdn.humanatlas.io/hra-releases/v2.0/markdown/ref-organs/3d-vh-f-lymph-node.md)
describes a Ce3D-derived reference, credits Weizhe Li/NIAID's method, and explicitly
distinguishes mouse from human lymph-node size and composition. Its cited
[Ce3D study](https://pubmed.ncbi.nlm.nih.gov/28808033/) concerns experimental mouse
imaging. Female assembly membership and a mesenteric ontology label therefore
do not establish a human female-donor segmentation, normal human dimensions or
patient-specific mesenteric anatomy. Treat this as a mouse-data-derived generic
reference, not replacement human source anatomy. No byte-equivalence with the
older standalone GLB or unrecorded derivation steps is asserted.

The node prefix alone does not identify a separate artist's rights chain. Do not
import Li Yao's other web illustrations or models under the HRA licence.

## Original geometry screen

The full cached GLB is 374,505,632 bytes, SHA256
`95f0c3d2f918582608692ca1139e8bdb18c147a16470e9ee9af8b276bd77c422`.
The seven original mesh nodes contain **254,663 triangles**. The reproducible
[audit](hra-lymph-node-source-audit.json) records hierarchy, node metadata, exact
crosswalk rows, all attribute/index hashes, full source-to-world transforms,
original materials, millimetre bounds and topology. It compares all 21 pairs
for exact shared faces; none were found. This is not an intersection proof.

| Source surface | Triangles | Findings |
| --- | ---: | --- |
| Afferent lymphatic vessels | 4,526 | Three components, including a 76-face microcomponent; four open boundary edges. |
| Capsule | 9,442 | One component, 48 open boundary edges. Do not infer a closed complete envelope. |
| Follicles | 5,758 | Fourteen closed components; not a normal human follicle count. |
| Efferent vessel | 4,154 | One closed component; mesh name says `efferent_lymph_node`, while crosswalk and embedded ontology identify an efferent vessel. Preserve both. |
| Medulla | 88,388 | Three components, 63 duplicate faces, 72 boundary edges, 118 nonmanifold edges. |
| Paracortex | 10,910 | One closed component; source ontology says T-cell domain. Not a cell segmentation or validated human compartment. |
| `Yao_blood_vasculature` | 131,485 | Name says blood; embedded and crosswalk labels say lymph vasculature (UBERON:0004536). Nineteen components, 308 duplicate faces, 296 boundary edges, 636 nonmanifold edges and one winding inconsistency. Identity unresolved. |

All original data is preserved. No smoothing, repair, hole closure, fragment
removal, welding, renamed vessel identity, scaling to a human node, registration
to BodyParts3D or generated anatomy has been performed. Open edges and component
counts are source diagnostics, not diagnoses of what each surface should be.

## Rights and next action

The [v1.10 metadata](https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.10/metadata.json)
was re-fetched with HTTP200 and matched the retained SHA256
`b9f137b1176c31419c68b78ac87f0926f874dad22f56d4dde7df3e2f15bab501`.
Both the current assembly and organ-specific record state **CC BY 4.0**. Retain
the HRA creators, licence link, source DOI and change notices for any derivative;
no mandatory asset fee is indicated. The original organ record credits Kristen
Browne and Heidi Schlehlein, reviewer Marda Jorgensen, HuBMAP, and DOI
[10.48539/HBM463.LFHF.874](https://doi.org/10.48539/HBM463.LFHF.874).
Derived source metadata and geometry diagnostics in this audit retain
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), with that attribution;
the report adds calculated diagnostics and preserves the source labels.
Existing assembly notices remain unchanged; no new model, font, texture, patient
data, figure or fee-bearing service enters the product.

Keep the set out of the human atlas. A future explicitly labelled comparative
teaching module would need a deliberate product decision plus source-specific
species, terminology, defect and clinical review; a green topology test cannot
provide that approval. Prioritize a separately licensed, human-source lymphatic
reference or other source-backed human anatomy work. Do not repeat this audit
as a new admission or count these seven surfaces toward human coverage.

Run `node scripts/audit-hra-lymph-node-original.mjs --check` against the retained
original source. The first `--record` refuses overwrite; the checker compares the
whole report exactly and fails on changed model, metadata or crosswalk bytes.
This audit-only change needs no website rebuild, UI activation or deployment.

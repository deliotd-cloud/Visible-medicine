# Lumbar spine and sacrum — draft structure checks

Six original four-choice questions replace generic identification prompts on the
existing L1–L5 and sacrum selections. They use the existing folded Quiz Notes;
there are no additional panels, controls, images, dependencies or fees.

| Existing selection | Question focus |
| --- | --- |
| L1 — FMA13072 | Patient vertebral numbering cannot be inferred from an atlas label |
| L2 — FMA13073 | Ligamentum flavum as a non-bony contributor to stenosis |
| L3 — FMA13074 | MRI assessment of discs and neural tissues beyond bone contours |
| L4 — FMA13075 | Degenerative versus isthmic mechanisms of vertebral slip |
| L5 — FMA13076 | Pars defects versus vertebral displacement |
| Sacrum — FMA16202 | Occult insufficiency fractures and complementary MRI/CT findings |

The exact full identities and prior lessons are pinned in
`content/lumbar-sacral-quiz-pins.json` against source commit
`e3849b6a31eac0ae8e556d753d4fe86e5e19c90a`. Changed or incomplete identities do not
receive these questions. Only six Quiz Notes placements change; the other 9,930
root topic placements, shoulder teaching, recipes and source geometry are retained.

## References and commercial scope

Original wording is based on factual reading of [Konin and Walz, AJNR 2010](https://pubmed.ncbi.nlm.nih.gov/20203111/),
AAOS [lumbar stenosis](https://www.orthoinfo.org/diseases--conditions/lumbar-spinal-stenosis/),
[adult spondylolisthesis](https://www.orthoinfo.org/diseases--conditions/adult-spondylolisthesis-in-the-low-back/),
[spondylolysis and spondylolisthesis](https://www.orthoinfo.org/diseases--conditions/spondylolysis-and-spondylolisthesis/),
and [Lyders et al., AJNR 2010](https://pmc.ncbi.nlm.nih.gov/articles/PMC7964142/).
No source prose, figures, scans, tables, PDFs or datasets are imported. Outbound
citations are not permission to redistribute publisher assets. New original code
and questions use the project's MIT terms; existing BodyParts3D credits and
commercial-compatible CC BY 4.0 obligations remain unchanged.

## Clinical review still required

All six questions remain draft and need revision-bound radiologist review of the
wording, distractors, answers and source-selection scope. A reference mesh does not
diagnose stenosis, slip or fracture, establish patient numbering, demonstrate
marrow signal, or register a CT/MRI acquisition. Anatomical substructures mentioned
in questions are not newly segmented selections. Existing unresolved T12–L1 disc
and sacral substructure limitations remain explicit; no held anatomy is released.
Atlas, imaging-case and lecture access remain independent. No approval is migrated.

## Verification

Run `node scripts/test-lumbar-sacral-quiz.mjs --integrated` and
`node scripts/lumbar-sacral-quiz-transition.mjs --check`. Tests cover exact source
identity, unchanged teaching/geometry, four unique answers, references, correct and
incorrect feedback, keyboard focus, retry/reset, lazy folded rendering and exam
concealment. These automated checks are not browser/GPU or clinical acceptance.

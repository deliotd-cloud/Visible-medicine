# Iliac arterial imaging drafts

17 September 2026. Six existing selections receive sixteen draft sections:
CT/MRI/Ultrasound for common and external iliac arteries, CT/MRI for internal
iliac arteries. Eight original modality texts and three anatomical orientation
notes reuse the current Imaging tabs; there are no new panels or mesh files.

## Exact source scope

| Paired artery | Right / left FMA | Right / left source | New topics |
| --- | --- | --- | --- |
| Common iliac | 14765 / 14766 | FJ3565 / FJ3464 | CT, MRI, Ultrasound |
| External iliac | 18806 / 18807 | FJ3567 / FJ3466 | CT, MRI, Ultrasound |
| Internal iliac | 18809 / 18810 | FJ3569 / FJ3468 | CT, MRI |

Full source identities, ordered files, frame, laterality and the existing
pelvis-vessels-recovery bundle are pinned against Atlas a7161ab2. Each identity
must match exactly. Neighbouring veins, branches and donor surfaces are not
substitutes. No model-derived lumen measurement or patient transform is added.

Internal-iliac ultrasound and all six X-ray slots remain pending. A case report
title describing an internal-iliac aneurysm on ultrasound was found, but the
available record alone was insufficient for detailed normal-artery teaching.
This is an evidence gap, not a claim that the modality cannot image the artery.

## Primary references and reuse

- [TTUHSC El Paso thigh table](https://anatomy.ttuhscep.edu/musculoskeletal_system/thigh_tables.html) and [pelvic dissection manual](https://anatomy.ttuhscep.edu/schemes/urinary.html): orientation and branch names. No tables or illustrations reproduced.
- [Rieker et al., 1997](https://pubmed.ncbi.nlm.nih.gov/9308477/): CTA comparison in 30 occlusive-disease patients; axial review and calcification limitation. No accuracy threshold is offered as clinical guidance.
- [Hany et al., 1997](https://pubmed.ncbi.nlm.nih.gov/9240520/): contrast-enhanced MRA in 39 symptomatic patients, with separate iliac segments. Historical evidence is not an acquisition prescription or a routine-MRI claim.
- [Karacagil et al., 1996](https://pubmed.ncbi.nlm.nih.gov/8740930/): triplex evaluation in 20 subjects without clinical arterial disease. No technique instructions or numerical normal ranges are imported.
- [Li et al., 2019](https://pubmed.ncbi.nlm.nih.gov/30944625/): internal-iliac branching and tumour-feeder imaging in 43 patients. Terminal-branch limitations are retained; this is not a donor-specific tumour map.

Primary abstracts and university text were read. The PMC article initially
returned a browser challenge; its primary PubMed abstract supplied the evidence
without bypassing it. These are original short factual summaries with links,
not licensed reprints. Publisher media, scans, figures, fonts and datasets are
not bundled; no new dependency or commercial asset obligation is introduced.
Existing BodyParts3D attribution and licence terms remain unchanged.

## Validation and sign-off

`npm run iliac-arterial-imaging:test` compares the current curriculum with the
actual saved parent replayed from Git: only sixteen pending-to-draft placements
may differ. The other 9,911 root topics, shoulder teaching and recipes are
unchanged. It checks bundle bytes, full-identity mutations, defensive copies,
content contracts and revision-bound review material. See
`iliac-arterial-imaging-validation.json` and dated browser/recovery evidence.

The owner radiologist must review anatomical relationships, variants, imaging
scope, wording and source applicability. These are introductory drafts, not
comprehensive vascular reporting or treatment protocols. Scans, exact image
anchors, independent case/Atlas/lecture entitlements, registration and clinical
approval are not supplied by text. Browser/device and hosted acceptance remain
separate from source checks.

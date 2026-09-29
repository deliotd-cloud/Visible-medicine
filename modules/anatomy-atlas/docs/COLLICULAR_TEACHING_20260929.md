# Inferior-collicular brachia: MRI and clinical teaching

Six new draft placements: MRI, Clinical and Pathology for the unchanged left
FMA73464/FJ1761 and right FMA73463/FJ1809 source envelopes. They appear under the
existing Imaging and Clinical groups. No new controls, meshes or patient data.
Anatomy, Function, self-check, identity pins and model limitations remain exact.

## Primary evidence inspected 29 September 2026

- [Sitek et al., 2022](https://pubmed.ncbi.nlm.nih.gov/35392412/), diffusion-MRI
  research; [publisher full text](https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2022.751595/full),
  adjacent-white-matter segmentation, results and limitations inspected. Supports
  research connectivity estimates involving the brachium, not routine clinical
  tract visibility, individual axons or accuracy of this reference mesh.
- [Fischer et al., 1995](https://pubmed.ncbi.nlm.nih.gov/7750451/), primary case
  abstract: a combined inferior-collicular/brachial/medial-geniculate lesion.
  Cannot isolate the brachium's causal contribution or generalise ear deficits.
- [Thomas et al., 2012](https://pubmed.ncbi.nlm.nih.gov/23349608/), primary case
  abstract and indexed article text: unusual SSPE involvement with supporting
  clinical, EEG and antibody findings. Not a diagnostic sign or usual pattern.

Original short summaries, each under100 words. No images, scans, article passages,
segmentations, research datasets or tractography are reproduced or downloaded.
PMC direct retrieval presented a browser challenge; no bypass was attempted.
The MRI full text was inspected through the publisher; the case-report claims
are limited to the accessible abstract/indexed primary text. References are
reading links, not asset-reuse licences or endorsements. No new dependency,
font, fee-bearing service or commercial-use restriction is introduced.

CT/X-ray/US remain pending: the sources do not justify brachium-specific teaching
for those modalities. Superior brachia FJ1735/FJ1736 remain held for contradictory
source laterality. No original source or accepted boundary is changed.

## Acceptance

`npm run collicular-teaching:test` checks both exact selections, rendered sections,
MRI initial-tab rendering, source-bound review equality, pending modalities,
mutated-source rejection and preservation of source/catalogue/review pins.
The previous geometry test retains every face/side/held-source assertion.
The nested suite explicitly counts the new draft placements and references;
its earlier corpus/reference digests remain enforced.

Tests establish software integration, not clinical accuracy or publication.
Radiologist sign-off is required for these exact teaching revisions and remains
separate from geometry and acquired-image approval. No clinical decision is set.

Recorded acceptance: both-side source/review/render tests, all568 original
triangles, 9,541 nested checks, preserved75 teaching bindings, brainstem regression,
TypeScript and both module builds passed. Actual375x812 browser checks traversed
all six new placements and left CT-pending state without horizontal overflow;
right Pathology screenshot inspected. [Evidence](evidence/collicular-teaching-20260929.json).
Natural query "inferior collicular" returned no matches; "brachium" succeeded.
This search vocabulary gap is recorded for a separate navigation change.

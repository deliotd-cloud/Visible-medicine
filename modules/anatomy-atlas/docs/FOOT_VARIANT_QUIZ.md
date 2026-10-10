# Foot variant quick check

One original four-choice question replaces generated identification in the Quiz
tab for the two retained source-labelled opponens digiti minimi foot selections:
FMA86034 (right) and FMA86035 (left). Existing complete identities in
`content/foot-muscle-imaging-pins.json` are reused without modification. Other
regions, topics, source geometry and clinical holds remain unchanged.

The teaching distinguishes a variably described deep fifth-toe flexor component
from a universally separate muscle. It does not infer thumb-like motion or patient
imaging boundaries from the source label. It is a formative draft, not an approved
exam question or confirmation of anatomical completeness.

## Evidence and rights

Zaottini et al., *Ultrasound of the plantar foot: a guide for the assessment of
plantar intrinsic muscles* (2023), lateral-group anatomical description:
https://pmc.ncbi.nlm.nih.gov/articles/PMC10508328/;
publisher https://reference-global.com/article/10.15557/jou.2023.0024?tab=article.
The publisher text was inspected on 10 October 2026. This is an anatomical
review/sonographic guide, not a prevalence study or validation of these meshes.

The article is CC BY-NC-ND: no article text, illustrations, scans, tables or
question-bank material is imported, adapted or redistributed. It is only a
factual reading reference for independently worded project teaching. The new
question/code retain project MIT terms; existing BodyParts3D identities and
meshes retain their CC BY 4.0 notices. No new asset, dependency or fee.

## Verification

`npm run foot-variant-quiz:test` checks the two exact identities, all other
placements, stale/tampered Review packets, changed-identity rejection, unchanged
model bytes and actual learner quick-check callbacks (correct, incorrect, retry
and exam hiding). Generated renderer/Review revisions must be refreshed first.
Automated checks do not provide clinical approval or browser/GPU acceptance.

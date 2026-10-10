# Coronary arterial X-ray orientation

Four draft X-ray lessons bind the exact existing records in
`content/coronary-arterial-us-pins.json`; those pins are reused, not changed.
The new content distinguishes contrast catheter angiography from routine chest
radiography and coronary CT. No angiographic image or patient mapping is added.

| Source | FMA | Supplied pieces |
| --- | --- | --- |
| Left coronary trunk | FMA3855 | FJ2737 |
| LAD / anterior interventricular branch | FMA3862 | FJ2631–FJ2648, ordered aggregate |
| Circumflex branch | FMA3895 | FJ2649–FJ2654, ordered aggregate |
| Right coronary trunk | FMA3802 | FJ2723 |

The labels describe retained geometry, not validated lumens or complete trees.
No vessel is moved, renamed, smoothed or connected. No cardiac dominance,
stenosis, patency, acquisition angle or treatment decision is inferred.
Reassembly is required before gross spatial comparison; explode positions are
not anatomy. Existing CT/MRI/ultrasound topics and reasoning questions remain.

## Factual references checked 10 October 2026

- [University of Minnesota, coronary arterial anatomy](https://www.vhlab.umn.edu/atlas/coronary-system-tutorial/coronary-arterial-anatomy.shtml): typical coronary origins and LAD/circumflex/right coronary courses. About 135 words of original anatomy summaries across the four bodies; no illustrations or source prose copied.
- [NHLBI, during cardiac catheterisation](https://www.nhlbi.nih.gov/health/cardiac-catheterization/during): contrast-assisted X-ray coronary imaging. Used for modality distinction, not a catheterisation protocol.
- [Green et al., 2005, original comparative study](https://pubmed.ncbi.nlm.nih.gov/15744720/): projection-related foreshortening and overlap. The study concerns PCI working views; no percentages, operator recommendations or acquisition angles are generalised into these lessons.

Original prose and code retain MIT terms; existing geometry retains BodyParts3D
CC BY 4.0 credit. Cited material is a factual reference, not an imported asset.
No anatomy dataset, font, texture, publisher figure or patient scan is added.

## Review and reproduction

Run `npm run coronary-arterial-xray:test` after regenerating renderer and display
fingerprints through their existing commands. The regression compares against
immutable source `61ff057d5204caaaa4be654bacb371de7de8f038`: only four X-ray
placements and their teaching revisions may change. All source identities and
geometry remain exact. Tampered identities, changed Review packets and stale
teaching decisions must fail closed. Draft readiness is not radiologist approval.

Earlier EUS and abdominal-spatial regression suites separate their original
baseline-to-completed transition counts from current owned-feature checks.
Their current dispatch, exact target content, identity rejection and Review
security checks remain live; the current coronary suite proves preservation of
all 9,932 other topic placements and 1,100 other Review packets against 61ff057d.
This avoids unrelated later teaching additions invalidating historical counts.

Review the clinical wording, usual-anatomy versus source-piece limits, distinction
between modalities, and display/readability in the normal viewer. Approval must
bind the resulting teaching revision. Website delivery requires a later normal
generated import; do not edit the exported learner modules by hand.

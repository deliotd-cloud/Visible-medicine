# Thoracic venous X ray teaching review

Five existing Thorax and Whole body selections now have original X-ray teaching
drafts. Open an affected structure and choose X-ray; its revised teaching and
reading links are included in the exact-revision Clinical Review packet.
Clinical approval remains with the owner's radiologist review.

## Teaching scope

| Existing selection | Main distinction to review |
| --- | --- |
| Anterior cardiac vein source group | Right atrial drainage differs from the coronary-sinus pathway; two surfaces are not a normal vein count. |
| Great cardiac vein | Anterior interventricular relationship and contrast venous-phase identification are not arterial identification. |
| Middle cardiac vein | Posterior interventricular course differs from the artery and posterior left ventricular vein; 14 source components are not 14 veins. |
| Hemiazygos vein | Enlarged collateral systems on disease-case radiographs do not establish normal visibility of this individual vein. |
| Right internal thoracic vein | A frontal catheter projection can be misleading; the catheter line does not outline a normal venous lumen or prove safe placement. |

The left and right musculophrenic X-ray notes remain pending: the available
anatomical drainage descriptions do not establish a specific radiographic
teaching observation. The twelve pending thoracic Ultrasound placements are
also outside this batch.

## Evidence and reuse boundaries

- [TTUHSC thoracic vein teaching table](https://anatomy.ttuhscep.edu/anatomytables/veins_thorax.html)
  supports anatomical drainage and neighbouring vessels. The copyrighted table
  is not imported or reproduced.
- [Pina anterior cardiac vein study, 1975](https://pubmed.ncbi.nlm.nih.gov/1163193/)
  supports variable courses and right atrial openings. Only the abstract's
  qualitative observation is used; no eponyms, percentages or anatomical media
  are imported. Publisher full text is access-restricted.
- [Gilard and colleagues coronary angiographic study, 1998](https://pubmed.ncbi.nlm.nih.gov/9825333/)
  supports venous-phase study in several projections and identification of
  great and middle cardiac veins in its 100-patient sample. Abstract evidence
  is not a universal visibility rate or a pacing recommendation.
- [Catalano hemiazygos-system case report, 1983](https://pubmed.ncbi.nlm.nih.gov/6406316/)
  describes enlarged collaterals in caval obstruction on frontal and lateral
  radiographs. Its abstract concerns a system, not validation of the retained
  individual mesh or routine normal radiographic visibility.
- [Yao and Jiang catheter-malposition case, 2023](https://qims.amegroups.org/article/view/115406/html)
  illustrates a misleading frontal projection, anterior lateral-view course
  and CT confirmation of right internal thoracic placement. CC BY-NC-ND 4.0
  publication terms do not permit commercial image reuse; no patient details,
  images or procedural instructions are imported.
- [ACR and RSNA venography explanation](https://www.radiologyinfo.org/en/info/venography)
  supports the distinction between contrast X-ray venography and plain
  radiography. No text extracts or media are redistributed.

All application prose is independently written. Reading links are not imported
datasets, asset licences or an endorsement of this atlas by their publishers.
Existing source-model rights and attribution remain unchanged.

## Source and review contract

Bindings reuse the complete records in `cardiac-venous-tour-pins.json`,
`central-vessel-imaging-pins.json` and `internal-thoracic-imaging-pins.json`.
The original unspecified, midline and right classifications remain intact.
Names, FMA IDs, geometry, surface counts, transforms, catalogues and other
teaching tabs are unchanged. A matching name or FMA alone cannot transfer the
draft to a substituted source record.

Only the five X-ray placements and corresponding teaching packet revisions
change. Old decisions do not approve the new text. No new acquired image,
annotation, registration, case entitlement or paid-lecture entitlement is
created. These are semantic reference-anatomy comparisons, not patient-space
synchronization or catheter simulation.

Before clinical acceptance, review terminology, evidence scope, grouped source
limitations, component boundaries, projection/phase wording and the actual
acquired-study examples separately. A content test does not confer approval.

## Focused verification

`npm run thoracic-venous-xray:test` compares every teaching placement and Review
packet with exact Atlas baseline `c6fd5a1789ce8c6f06c48693aa9d5479a00d610a`.
It checks source substitution and stale/forged review refusal. Normal source
renderer and Review generation, types and content validation precede the
ordinary website module and protected Review export.

# Organ Anatomy: location, relationships and selection scope

8 September 2026: 21 new Anatomy drafts cover the heart, both lungs/main bronchi, trachea, esophagus, liver, gallbladder, cystic/common hepatic ducts, pancreas, stomach, small/large bowel, spleen, kidneys, adrenals and bladder. Existing Function descriptions were inspected and match these source identities; all remain unchanged. The interface, dissection recipes and source geometry are unchanged.

## Identity and model limits

The resolver accepts only exact FMA, organ system/category, side, primary region, secondary membership and Anatomy topic. The gallbladder's stable ID retains a legacy `pelvis` token, but its authoritative region is abdomen; do not derive anatomy from an ID token or rename IDs without migration. Esophagus/trachea thorax membership is a browsing assignment, not proof of complete cervical/abdominal coverage.

Official cached v4 ISA/PART-OF rows were compared with each selection. The 21 selections use 472 source components from 505 parent-index memberships. Four aggregates omit 33 memberships already excluded by the existing atlas: heart 27, liver 3, small bowel 1 and large bowel 2. Full index lists, included files and exclusions are pinned separately in the before evidence. These are membership counts, not counts of unique structures or missing organs. Coverage notes identifying separately selectable structures remain visible; this change does not add or remove any surface.

The notes distinguish lung lobes from segments, organ definitions from selected aggregates, cortex/medulla or bowel layers from external surfaces, and cystic/common hepatic/common bile duct identities. They do not promote clipped surfaces into scans, pretend internal compartments are individually selectable, certify luminal continuity or model filling/motion.

## Factual references and rights

Brief original factual notes were checked on 8 September 2026 against [Texas Tech thoracic anatomy](https://anatomy.ttuhscep.edu/anatomytables/viscera_thorax.html), [abdominal anatomy](https://anatomy.ttuhscep.edu/anatomytables/viscera_abdomen.html), [biliary anatomy](https://anatomy.ttuhscep.edu/schemes/liver_tables.html), [NHLBI heart anatomy](https://www.nhlbi.nih.gov/health/heart/anatomy), [NIDDK digestive overview](https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works), [urinary overview](https://www.niddk.nih.gov/health-information/urologic-diseases/urinary-tract-how-it-works), [NCI adrenal anatomy](https://www.cancer.gov/types/adrenocortical/childhood) and [SEER spleen anatomy](https://training.seer.cancer.gov/anatomy/lymphatic/components/spleen.html).

General references do not validate this source specimen. Conflicting or oversimplified table statements (including a lingula assigned to the inferior lobe) were not copied. No reference prose, table, diagram, scan or other asset was imported. Government-hosted pages may contain separately copyrighted illustrations. Citation links are not reuse grants. Original code/text retain MIT terms; BodyParts3D-derived evidence retains separate CC BY 4.0 obligations. No added dependencies, fonts, paid APIs or patient/private-review information.

## Verification and remaining work

`npm run organ-anatomy-curriculum:test -- --source` checks 21 official index memberships, exact identity guards, untouched topics, display/export parity, retained coverage notes, detached arrays and eleven rejected regressions. Twenty-eight offline projections preserve 1,576 explicit topic edits against the unchanged original baseline. Historical material is comparison evidence only; runtime/export remain current.

Current body Anatomy: 994 draft, 28 identity-only. Function: 1,018 draft, four pending (FMA45097/FMA45098/FMA19728/FMA61970), zero identity-only. No organ-system Anatomy remains generic, but this is not a complete organ curriculum or complete model. Most CT/MRI/Ultrasound/Pathology/Clinical sections remain pending. Independent anatomical/editorial review, detailed specialist teaching, clinical acceptance, real device/visual testing and acquired-study integration remain required.

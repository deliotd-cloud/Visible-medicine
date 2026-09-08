# Thoracic vessel teaching

8 September 2026: 68 original Anatomy/Function drafts for 34 existing vessel representations (29 definitions, 72 source components), without additional controls, geometry or dependencies. All remain draft educational content, not clinical approval.

## Scope and identity

The batch covers aortic segments, caval/azygos routes, inlet vessels, selected coronary arteries and cardiac veins, pulmonary arteries/veins and anterior-wall vessels. Exact pre-authoring FMA/side/region/file observations are pinned in the validator and checked against cached official BodyParts3D v4 ISA/PART-OF rows. LAD FMA3862 is a PART-OF union of 18 files; circumflex uses six, middle cardiac vein fourteen, and left superior/inferior pulmonary veins two/three. Components are not independently assigned to branches, lung segments or atrial ostia.

Dispatch requires exact FMA, laterality, vessel category/system, thorax primary region and every required secondary region. Inlet vessels retain shoulder/head-neck membership; inferior anterior-wall vessels retain abdomen membership. Unspecified laterality and the midline hemiazygos classification remain unchanged. No missing left internal thoracic vein is mirrored into existence.

Notes distinguish subclavian origins and scalene relationships, coronary trunks/branches, anterior/posterior cardiac venous grooves, pulmonary artery–bronchus relationships and usual lobar venous return. Pulmonary circulation is described in the usual postnatal setting. Atlas red/blue still denotes artery/vein, not oxygenation. Source warnings remain visible.

## Evidence and rights

Bounded factual sections consulted on 8 September 2026:

- [Thoracic aorta](https://www.ncbi.nlm.nih.gov/books/NBK538140/), [superior vena cava](https://www.ncbi.nlm.nih.gov/books/NBK545255/) and [azygos system](https://www.ncbi.nlm.nih.gov/books/NBK554430/): major routes and variation.
- [Subclavian arteries](https://www.ncbi.nlm.nih.gov/books/NBK539736/) and [veins](https://www.ncbi.nlm.nih.gov/books/NBK532885/): origins, continuations and scalene relationships.
- [Coronary arteries](https://www.ncbi.nlm.nih.gov/books/NBK470522/) and [cardiac veins](https://www.ncbi.nlm.nih.gov/books/NBK549786/): selected major pathways.
- [Pulmonary arteries](https://www.ncbi.nlm.nih.gov/books/NBK534812/) and [veins](https://www.ncbi.nlm.nih.gov/books/NBK545205/): bronchial relationships and usual lobar return.
- [Internal thoracic](https://www.ncbi.nlm.nih.gov/books/NBK537337/) and [epigastric arteries](https://www.ncbi.nlm.nih.gov/books/NBK537156/): anterior-wall routes.
- [TTUHSC El Paso mediastinal tables](https://anatomy.ttuhscep.edu/cardiovascular_system/sup_med_tables.html): internal thoracic and musculophrenic venous connections.

References are not assumed error-free. Right internal thoracic termination differs between the table (direct SVC) and the general brachiocephalic tributary description; the lesson flags the disagreement without claiming the mesh resolves it. Unrelated fixed dimensions/levels, valveless assertions, disputed septal territory statements, developmental claims and procedural advice were not adopted.

Only brief original factual teaching is added, not publisher prose, illustrations, scans, tables or datasets. Copyright/NC-ND terms and university publication rights are not commercial asset grants. Original application code/text retain MIT terms; separate DBCLS BodyParts3D evidence retains CC BY 4.0 attribution/change obligations. No new font, texture, mesh, paid API or private data.

## Verification and review gates

`npm run thoracic-vessel-curriculum:test -- --source` checks 34 source memberships, 72 components, guarded dispatch, display/export parity, detached arrays, coverage preservation and twelve rejection cases. Twenty-two offline projections preserve 1,314 pinned topic edits against the immutable original baseline. Earlier milestone counts remain historical. Four unresolved Function holds (FMA45097, FMA45098, FMA19728, FMA61970) remain protected, including readiness-only mutations.

At this milestone: Anatomy 850 draft/172 identity-only; Function 906 draft/112 identity-only/four pending. These are readiness counts, not accuracy or completion scores. Most specialist/modality and authored quiz content remains incomplete.

Independent review must assess compound membership, branch continuity/origins, venous termination, coronary dominance/territories, pulmonary ostia/drainage, neurovascular clearance, calibre and wording. Surfaces cannot establish patent lumina, wall disease, measured haemodynamics, physiological movement, safe access corridors, patient registration or Doppler findings. No clinical, device or new browser acceptance is claimed. Next: remaining generic vessel and nerve teaching, followed by source-specific clinical/modality drafts. Local saves are not remote delivery.

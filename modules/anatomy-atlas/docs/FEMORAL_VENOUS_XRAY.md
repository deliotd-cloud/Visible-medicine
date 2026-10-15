# Femoral venous X-ray teaching

Six existing bilateral thigh selections receive original draft contrast
venography orientation. No acquired venogram, new model, procedural guidance or
patient-space synchronization is added. CT/MRI/ultrasound and other topics stay
unchanged.

| Selection | Right FMA | Left FMA | Existing bundle |
| --- | --- | --- | --- |
| Femoral vein | 21188 | 21189 | thigh-vessels-recovery |
| Deep femoral vein | 51042 | 51043 | deep-leg-veins |
| Great saphenous vein | 21379 | 21380 | thigh-vessels-recovery |

The complete six identities in `content/lower-venous-imaging-pins.json` bind the
lessons; its other eight entries remain outside this addition. Names/FMA matches
or similar position alone are insufficient. Original source surfaces, coordinates,
labels, hashes and unvalidated status remain unchanged. Femoral selections do not
separately validate common-femoral versus femoral segments; profunda has no
validated complete tributaries/junction/valves/lumen; great-saphenous selections
do not separately map the saphenofemoral junction, all perforators or valve leaflets.

## Evidence and rights

- [ACR/RSNA venography](https://www.radiologyinfo.org/en/info/venography): contrast X-ray scope, not ordinary unopacified plain-film lumen visibility.
- [Quinlan et al., 2003](https://pubmed.ncbi.nlm.nih.gov/12821771/): original retrospective 808 thrombus-free limb venograms, including femoral duplication; not a universal single-channel source pattern.
- [Bundens et al., 1995](https://pubmed.ncbi.nlm.nih.gov/7563535/): original terminology surveys establish the misleading “superficial femoral vein” wording. The femoral vein is a deep vein.
- [Almgren et al., 1990](https://pubmed.ncbi.nlm.nih.gov/2313828/): ascending/descending phlebography in 126 selected limbs with deep-venous incompetence, including differing profunda anatomy. No reflux criterion or normal visibility claim is transferred.
- [Tang et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC11764913/): original dissections of 126 limbs documenting profunda/tributary variants, not venographic diagnostic performance or a model-specific junction.
- [Leopold et al., 1986](https://pubmed.ncbi.nlm.nih.gov/3526935/): 50 bypass candidates compared with operative findings; venography could miss saphenous presence/continuity. No current protocol or size threshold is derived.
- [Tepelenis et al., 2024](https://pubmed.ncbi.nlm.nih.gov/37160721/): the original 75-limb cadaveric component documents variable saphenofemoral tributaries; its narrative review is not used as primary evidence.
- [UAMS lower-limb veins](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/vein-tables/selected-veins-of-the-lower-limb/): great-saphenous superficial medial drainage orientation.

Original primary abstracts, Tang's original study and institutional material were
checked on 15 October 2026. Prose and code are independently written project-MIT
work. No reference prose, figure, image, table, diagram, scan, mesh or dataset is
copied, traced, adapted or redistributed. Reading access does not confer media
rights. BodyParts3D attribution/CC BY4.0 obligations stay intact. No new packages,
fonts, textures, services or mandatory fees are introduced.

## Clinical review

Review the exact revised X-ray worksheets and verify deep versus superficial
terminology, acquired opacified course versus projection crossing, cohort limits,
source aggregation and the absence of mapped valves/junctions. Review assembled
surfaces separately. Colour, source laterality, screen side, contact or explode
offsets cannot establish patient side, continuity, flow, reflux, patency or a safe
route. CTV, MRV and ultrasound are different examinations, not model renderings.

All six lessons remain draft and require revision-bound radiologist sign-off.
Earlier decisions cannot approve changed teaching. No real decisions are written
or migrated. Atlas, Education case and paid-lecture access remain independent.

## Regeneration and verification

`npm run femoral-venous-xray:test` checks full identities/mutations, exact six
pending-to-draft changes, non-target preservation, root Review packets and
stale/forged refusal before storage. Generate teaching snapshots/display pins/
renderer revisions normally, then check contracts, types and build. Normal four
learner exports and protected Review import deliver the website; do not hand-edit
generated copies. Tests do not establish browser/GPU, clinical, acquired-study
or public-release acceptance.

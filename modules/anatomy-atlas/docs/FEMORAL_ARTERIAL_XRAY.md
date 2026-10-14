# Femoral arterial X-ray teaching

Six existing bilateral thigh selections receive original draft angiographic
orientation in the regional and whole-body Atlas. This adds teaching, not acquired
images, new vessels, procedural guidance or patient-space synchronization.

| Selection | Right FMA | Left FMA | Existing bundle |
| --- | --- | --- | --- |
| Femoral artery | 70249 | 70250 | thigh-vessels-recovery |
| Deep femoral artery | 20796 | 20797 | thigh-vessels-recovery |
| Descending lateral circumflex femoral branch | 21422 | 21423 | circumflex-femoral |

The complete identities in `content/lower-limb-arterial-pins.json` and
`public/models/bodyparts3d/circumflex-femoral/catalog.json` bind the lessons.
Names, FMA matches or similar positions alone do not admit teaching. The deep
femoral selection contains the lateral circumflex parent as an aggregate; that
parent is not separately selectable. No junction or continuous lumen between
the separate descending branch and aggregate has been validated. Original source
coordinates, surfaces, labels and unvalidated status remain unchanged.

## Evidence and scope

- [UAMS lower-limb artery table](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-lower-limb/): usual arterial relationships, not source-specific branch verification.
- [ACR/RSNA catheter angiography](https://www.radiologyinfo.org/en/info/angiocath): X-ray/contrast examination, distinct from CTA and MRA.
- [Nasr et al., 2014](https://pubmed.ncbi.nlm.nih.gov/24590524/): original 90-femoral-triangle cadaveric study of profunda and circumflex origins.
- [Seto et al., 2017](https://pubmed.ncbi.nlm.nih.gov/27566991/): original femoral angiography cohort showing bifurcation-level variation. No access-site recommendation or threshold is imported.
- [Uzel et al., 2008](https://pubmed.ncbi.nlm.nih.gov/19085859/): original 110-region cadaveric study, including separate ascending/descending circumflex origins.
- [Halvorson et al., 2008](https://pubmed.ncbi.nlm.nih.gov/18176215/): original acquired lower-extremity angiogram study of the descending branch. No cohort patency claim is transferred to this model or a learner's scan.

Primary abstracts and the original institutional resources were checked on
15 October 2026. All lesson prose/code is independently written project-MIT work.
No reference prose, figure, table, diagram, scan, mesh, image or dataset is
redistributed or adapted. Reference accessibility is not media reuse clearance.
Existing BodyParts3D attribution and CC BY4.0 obligations remain intact. There
are no new dependencies, fonts, textures, services or mandatory fees.

Plain radiographs do not ordinarily map the unopacified arterial lumen. Wall
calcification is not a complete lumen map. On acquired contrast studies, names
depend on demonstrated origins and junctions, not projected crossings. Model
colour, screen side, source laterality and explode offsets are not patient-side
markers or evidence of perfusion, patency, continuity or registration.

## Review and verification

Review the six exact revised X-ray teaching worksheets, particularly common versus
superficial femoral naming, profunda aggregation, variant circumflex origins and
the limits of each modality. Anatomical fidelity requires a separate assembled
surface review. All new teaching remains draft and requires revision-bound
radiologist sign-off. Changed teaching cannot inherit earlier approval. Atlas,
Education case and separately paid lecture entitlements remain independent.

`npm run femoral-arterial-xray:test` checks exact identities, every non-target
topic, all root Review packets, source/geometry preservation and stale/forged
decision refusal before storage. Regenerate teaching snapshots, display pins
and renderer revisions through their existing scripts. Normal four-runtime
exports and protected Review import are required for website delivery; never
hand-edit generated copies. These checks do not establish browser/GPU, acquired
scan, clinical or publication acceptance.

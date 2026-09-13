# Head/neck vessels: imaging orientation drafts

13 September 2026. Five concepts, nine retained selections, 36 new CT/MRI/
ultrasound/X-ray topic placements. All are original teaching drafts for
revision-bound radiologist review, not image annotations or clinical approval.

## Retained source scope

| Concept | FMA identities | Existing source pieces |
| --- | --- | --- |
| Common carotid, right/left | FMA3941 / FMA4058 | FJ3564 / FJ3483 |
| Internal carotid, right/left | FMA3949 / FMA4062 | FJ1682 / FJ1682M |
| Vertebral, right/left | FMA3958 / FMA4066 | FJ1725 / FJ1725M |
| Internal jugular, right/left | FMA4754 / FMA4762 | FJ3585 / FJ3485 |
| Basilar | FMA50542 | FJ1672 + FJ1844 in one existing selection |

All belong to the unchanged `head-neck-vessels-recovery` bundle. Exact catalogue
identity, source hashes, laterality, bounds and anchor are pinned against source
commit `b76fe16e01197a475a82e1adb461f86f29e5792c`. Matching a name or FMA alone
cannot apply these notes to another mesh. No generic donor-to-patient alignment,
vascular-wall segmentation, V1–V4 or C1–C7 subdivision is created. The basilar
pieces are not given invented segment names. Existing geometry, source holds,
Anatomy/Function/Clinical/Pathology/Quiz teaching and independent website pilots
are unchanged.

The existing Imaging tabs carry the notes; no toolbar, gate, service or permanent
control is added. Coverage, contrast timing, CTA/MR flow artifacts, cervical
duplex versus transcranial Doppler and the difference between a radiograph and
contrast catheter angiography are distinguished. The jugular selection retains
position/flow limitations rather than implying a static safe access path.

## Reading sources and reuse boundary

Twelve references were inspected on 13 September 2026:

- [TTUHSC head/neck arterial anatomy](https://anatomy.ttuhscep.edu/anatomytables/arteries_head_neck.html) and [UTHealth posterior circulation teaching](https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p07_index.html): anatomical orientation.
- RSNA/ACR RadiologyInfo: [CTA](https://www.radiologyinfo.org/en/info/angioct), [MRA](https://www.radiologyinfo.org/en/info/angiomr), [carotid stenosis imaging](https://www.radiologyinfo.org/en/info/carotidstenosis) and [catheter angiography](https://www.radiologyinfo.org/en/info/angiocath): modality distinctions.
- AIUM [extracranial cerebrovascular parameter (2022)](https://onlinelibrary.wiley.com/doi/10.1002/jum.15877) and [transcranial Doppler parameter (2023)](https://onlinelibrary.wiley.com/doi/10.1002/jum.16234): examination scope, not a reproduced protocol or threshold table.
- [CTA image quality and artifacts study (2010)](https://pmc.ncbi.nlm.nih.gov/articles/PMC7964077/): arterial pseudolesions and jugular contrast/flow artifacts. This older scanner-specific study is used for artifact principles, not a claim of current incidence or performance.
- [Chong et al., vertebrobasilar flow model (1994)](https://www.ajnr.org/content/ajnr/15/4/733.full.pdf): sequence-dependent vessel appearance. Model research is not patient diagnostic accuracy; the indexed article abstract was available when direct PDF opening failed.
- [Provenzale and Kranz, MRV interpretation pitfalls (2011)](https://doi.org/10.2214/AJR.10.5323): indexed text describing internal-jugular TOF signal loss. No general normal/abnormal cut-off is inferred.
- [Head rotation and neck vascular relationships (2018)](https://pmc.ncbi.nlm.nih.gov/articles/PMC6182958/): variable jugular/carotid relationships and compressibility, not permission to use a generic mesh for intervention.

Only brief original factual synthesis and reading links are added. No publisher
prose, image, scan, table, diagram, protocol or dataset is imported. Access to a
reference is not a redistribution licence or endorsement. Existing MIT terms for
original code/notes and BodyParts3D CC BY 4.0 obligations remain separate. No
dependency, model, texture, font, paid API or mandatory service is added.

## Verification and clinical work still required

The focused validation checks all 1,101 current schema records, renders the
actual note callback for all 36 additions, rejects 540 changed-source/topic
combinations and verifies unchanged source-bundle bytes. It preserves all 9,873
other topic placements, shoulder teaching and recipes against the pre-authoring
snapshot. Pins and recorded transitions have independently checked source-parent
identities; historical reconstruction preserves the prior fixed expected hashes.
See `head-neck-vessel-imaging-validation.json` for machine evidence. These are
source/schema/React-render checks, not anatomical or clinical acceptance.

TypeScript and the final production build pass, including lossless delivery
verification of 133 model files / 1,504 meshes. The earlier six brain/muscle
imaging suites and original 33,444-check historical content suite pass without
replacing their expected hashes. Revision-bound SQLite checks pass for 1,101
contexts / 3,303 tracks using synthetic fixtures; 235 shoulder review safeguards
also pass. Body display evidence advances to
`9c0a3d93d6d88fb3cbdf8b0a44a646fae97ef4ac929b370c48ae7ee1d2e0ba2f`
(480 inputs); no private approval is migrated. Existing large-chunk warnings
remain and are not a performance acceptance result.

Actual local-browser samples: right internal-carotid CT/ultrasound, basilar
ultrasound with Isolate & frame, and left internal-jugular MRI. At 390×844, the
MRI group/subtab survives entry into the information drawer, the text is
readable and document width equals scroll width (390). Practice setup hides the
imaging notes; returning to Explore retains Imaging/MRI. No practice questions
were started, answers submitted or review decisions changed. These samples do
not establish active-exam, physical-touch or comprehensive device acceptance.

For sign-off, review all five concepts and both sides where present against
appropriate real acquisitions, including CTA timing, MR source sequences and
flow pitfalls, extracranial/transcranial Doppler scope and X-ray limitations.
Confirm donor source extent and any proposed subdivision before admitting more
specific segment labels. Do not infer approval from a rendered note, source
licence or a successful test.

Real CT/MRI/US/X-ray and lecture anchors remain disconnected pending their own
release, source/registration, Education and entitlement gates. No source scan,
mask, accepted CT-head boundary, private review decision or patient identity is
read or changed by this batch. The separate native CT/MRI utilities remain local
QA, not a replacement for Didanix Education/light.

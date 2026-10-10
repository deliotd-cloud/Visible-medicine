# Cranial-bone X-ray orientation drafts

Subsequent suprascapular teaching checkpoint: this completed eight-topic epoch
is replayed from exact baseline `c78e383a37976e2e459fd41504eac6281241af1d` and
milestone `da1c7f692fcaf318a9c059aa5cb4ef0db8bbd6e8`. Its original counts,
identities and expected hashes are unchanged. The current
[suprascapular acceptance](SUPRASCAPULAR_VESSEL_ULTRASOUND.md) independently
checks preservation of all eight live X-ray lessons and every other older topic.

Scope: eight existing head/neck bone selections, six original lesson families;
no new geometry, patient image, segmentation, dependency or clinical approval.

| Source FMA | Family | Side | Component |
| --- | --- | --- | --- |
| FMA52734 | Frontal | Midline | FJ3200 |
| FMA52788 | Parietal | Right | FJ3380 |
| FMA52789 | Parietal | Left | FJ3274 |
| FMA52738 | Temporal | Right | FJ3386 |
| FMA52739 | Temporal | Left | FJ3281 |
| FMA52735 | Occipital | Midline | FJ3309 |
| FMA52736 | Sphenoid | Midline | FJ3394 |
| FMA52740 | Ethmoid | Midline | FJ3199 |

The complete source identity, not a name/FMA match alone, determines eligibility.
Only `xray` changes from pending to draft. All 9,928 other topic placements,
including CT/MRI, must stay exact against the saved `c78e383a` baseline; root
geometry, tours, quizzes, source labels and independent access rules stay exact.
The mesh remains a location aid, not a radiograph or registered patient label.

## References and licensing

- [UAMS bone table](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/bone-tables/bones-and-cartilages-of-the-head-and-neck/): bone relationships, not proof of mesh subdivisions or radiographic detectability.
- Dartmouth Hitchcock [skull](https://geiselmed.dartmouth.edu/radiology/wp-content/uploads/sites/47/2021/11/DX-Protocols-2021.pdf#page=38) and [sinus](https://geiselmed.dartmouth.edu/radiology/wp-content/uploads/sites/47/2021/11/DX-Protocols-2021.pdf#page=32) pages: historical projection descriptions, not current examination recommendations, positioning instructions or patient diagnoses.
- [RadiologyInfo](https://www.radiologyinfo.org/en/info/safety-hiw_04): general projection overlap, not per-structure diagnostic performance.

Reading links only. No publisher figure/prose, scan, texture, font or dataset
import. Original wording remains project MIT; pre-existing meshes retain their
BodyParts3D CC BY 4.0 notice. Neither citations nor a free download establish
permission to republish images. No new licence fee or hosted service dependency.

## Acceptance and clinical review

`npm run cranial-bone-xray:test` verifies the pinned baseline, exact transitions,
all-topic preservation, source-identity mutation refusals, cloned lesson arrays,
full Review material preservation, malformed packets and stale submissions
rejected before storage. The completed hyoid/epiglottis test replays its immutable
epoch; the new current suite independently proves those older topics unchanged.
Historical adapters never enter production dispatch. A prior cranial/costal
replay mismatch must be retained and separately diagnosed, not hidden by changing
its expected hash. A focused pass is not a full-suite or clinical acceptance claim.

Radiologist sign-off must bind exact source and teaching revisions, confirm the
projection/anatomical descriptions and disclaimers, and review actual learner
presentation after generated website integration. Internal air-cell walls,
foramina, sutures and pathological findings are not independently validated by
these whole-bone surfaces. Case/Atlas/paid-lecture permissions remain independent.
Any later X-ray correspondence needs approved image rights, verified side and
orientation, and explicit reviewed mapping. Imaging correspondence stays blocked.

No private decision is read, migrated or approved by this source batch. It does
not modify CT-head masks or the clinical desktop PACS. Website import, protected
Review/browser checks, publication and off-device backup are separate follow-ups.

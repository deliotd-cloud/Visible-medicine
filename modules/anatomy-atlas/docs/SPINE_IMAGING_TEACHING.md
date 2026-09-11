# Spine imaging orientation

Open **Spine → select a vertebra or disc → Imaging → CT / MRI / X-ray**. The existing six level studies and all ordinary spinal selections share the same compact notes panel. No new permanent control, page height or scan viewer is added.

## Scope

47 unchanged version-4 source representations receive 141 topic drafts, organized into **nine concept groups and 27 distinct modality topics**, not 141 unique authored concepts:

| Concept group | Source selections | Teaching emphasis |
| --- | ---: | --- |
| Atlas (C1) | 1 | Ring, lateral masses, absent vertebral body; not a ligament examination |
| Axis (C2) | 1 | Dens, body and posterior elements; upper-cervical relationships |
| Other cervical vertebrae | 5 | Body/arch/foramina, coverage and soft-tissue limitations |
| Thoracic vertebrae | 12 | Rib relationships, posterior wall and canal versus cord |
| Lumbar vertebrae | 5 | Body/posterior elements, neural landmarks and source-pose limitations |
| Whole sacrum | 1 | Alae/foraminal regions and limits of insufficiency-fracture depiction |
| Cervical discs | 6 | Whole surface versus disc tissue; source-labelled axis disc lies below C2 |
| Thoracic discs | 11 | Endplate relationships; unresolved T12–L1 source disc |
| Lumbar discs | 5 | Disc versus neural findings and independent lumbosacral numbering |

Selected structures retain their exact source names. Level-specific cautions supplement the shared group prose. The totals are 25 bone and 22 disc representations. At this milestone, root-body draft totals became **64 CT, 66 MRI and 53 X-ray**; the later [hip/thigh addition](HIP_IMAGING_TEACHING.md) updates current totals without changing these spinal topics. Independent specimens and overlapping dedicated-shoulder records are counted separately.

There is no C1–C2 intervertebral disc anatomically. The unresolved **T12–L1 mesh** is a source omission, not normal absence, collapse or fusion. The sacrum remains one surface, not independent S1. Whole-disc surfaces do not add annulus, nucleus, roots, ligaments, marrow, meninges or a clinically validated cord. Returning separation to zero restores source relationships, not patient registration.

## Source binding and history

`content/spine-imaging-pins.json` retains all 47 complete source records, relevant bundle records and the source coordinate definition. The runtime resolver rejects unknown IDs before reading unrelated fields, then compares the complete source record canonically. It has **no FMA-only or name-only fallback**; returned arrays are detached. Runtime lookup does not receive the entire catalogue, so frame/bundle consistency is checked offline, not represented as a live scan-registration check.

`spine-imaging.before.json` records the exact 141 formerly pending lessons from source commit `59a567c7fb76c954cf3d91eeec62124e207bbbf9`; `spine-imaging.transition.json` hashes their replacements. Offline history checks verify the exact transition before reconstructing earlier milestones. The focused test proves all other **9,057 body sections**, original shoulder data and dissection recipes are unchanged. Earlier review fingerprints, approvals and authoring baselines are not migrated or rewritten. Body export remains draft with no approved geometry, teaching or acquired-imaging revision.

Run `npm run spine-imaging:test`. It validates all official source name/file rows, complete identity rejection, current export, detached data, historical reconstruction and the actual existing note-render callback with installed React. This is not browser/GPU, touch, accessibility or clinical acceptance. Existing X-ray, knee, spinal-study and review/content tests remain relevant.

## Reading sources and commercial scope

Checked 11 September 2026. Brief original factual synthesis; no article, image, PDF, diagram, protocol, table or question bank is imported or embedded. Reference access is not permission to republish assets or an endorsement. The original prose/code uses the existing MIT grant; existing BodyParts3D v4 attribution and CC BY 4.0 obligations remain unchanged. No new model, dependency, font, texture, paid API, service or future mandatory fee is introduced by this pass.

- [AO upper-cervical radiological evaluation](https://surgeryreference.aofoundation.org/spine/trauma/occipitocervical/further-reading/patient-examination-radiological-evaluation-xr-ct-mri): bony landmarks and complementary planes, not a blanket radiography protocol.
- [AO thoracolumbar radiological evaluation](https://surgeryreference.aofoundation.org/spine/trauma/thoracolumbar/further-reading/patient-examination-radiological-evaluation-xr-ct-mri): bone, canal and ligament assessment distinctions.
- [RadiologyInfo spine CT](https://www.radiologyinfo.org/en/info/spinect) and [spine MRI](https://www.radiologyinfo.org/en/info/spinemr): modality capabilities and limitations.
- [ACR Acute Spinal Trauma](https://acsearch.acr.org/docs/69359/Narrative/): scenario-dependent examination choice. Older blanket recommendations for trauma radiographs are not adopted.
- [Magnetic resonance imaging of the spine](https://pmc.ncbi.nlm.nih.gov/articles/PMC7571515/): anatomical and sequence context, not copied figures or interpretation criteria.
- [Superiority of MRI for Evaluation of Sacral Insufficiency Fracture](https://pmc.ncbi.nlm.nih.gov/articles/PMC9456416/): a primary cohort supporting qualitative detection limits, not universal sensitivity claims.
- [AAOS herniated disk information](https://orthoinfo.aaos.org/globalassets/pdfs/herniated-disk.pdf): distinction between indirect radiographic disc spaces and direct soft-tissue assessment.

## Remaining validation and integration

1. Independent anatomist/radiologist review of every concept, retained source label, level mapping, clinical caveat and cited guidance; no trauma-clearance, treatment or acquisition-protocol use.
2. Source-interface and anatomical-variation review, especially craniovertebral, cervicothoracic and lumbosacral junctions. Source-centre ordering is not validated surface spacing or diagnostic measurement.
3. Independent browser, GPU, small-screen, keyboard and educator acceptance. Static rendering does not certify those interactions.
4. Owner-provided, rights-cleared, de-identified CT/MRI/X-ray/US resources; validated subject/series/side/level/frame mappings and separate review revisions before live synchronization. No spinal ultrasound lessons or scans are added here.
5. Separate entitlement enforcement for atlas subscriptions and each paid lecture/resource. Selecting anatomy or opening a link never grants access to another product; the resource registry is still unpopulated.

This completes introductory spinal imaging orientation for these records, not the spine or atlas overall. Prioritize substantive gaps elsewhere; oral detail remains deferred.

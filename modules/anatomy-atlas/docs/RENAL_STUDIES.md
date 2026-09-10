# Renal relationship studies

Open **Abdomen** or **Whole body → Study windows & focuses** and search for “kidney”, “renal” or “ureter”. Four focus cards reuse the existing rotate, select, isolate, fade, separate, set-aside, Undo/Redo and source-pinned link controls. Selecting a member also exposes its related studies. Nothing is added to the permanent toolbar.

| Study | Targets | Explicit context |
| --- | --- | --- |
| Right kidney relationships | Right kidney | Right renal artery, ureter, adrenal; aorta and IVC |
| Left kidney relationships | Left kidney | Left renal artery, ureter, adrenal; aorta and IVC |
| Renal arteries & great vessels | Renal arteries | Kidneys, abdominal aorta, IVC |
| Kidneys & proximal ureter relationships | Ureters | Kidneys |

These are independent relationship focuses, not successive surgical layers. The existing side filter applies to all members. A focus without its target is unavailable even if midline context remains; this prevents a left-only selection opening a right-kidney study. No broad skeletal background is included. “Proximal” describes the relationship being studied, not a newly segmented or truncated ureter mesh.

## Source boundary and licensing

The pinned BodyParts3D v4 ISA and PART-OF tables define one source OBJ per kidney: right FMA7204 / FJ3147 and left FMA7205 / FJ3145. The audited label search supplies no separate renal cortex, medulla, pelvis, pyramid or calyx definitions. This does not establish the absence of such anatomy in real kidneys or in every other dataset. It means this release cannot claim a validated internal renal dissection from these source labels.

Ten existing root representations are reused without moving their assembled coordinates or changing their bytes. The validator checks all four pinned index tables, current source holds, exact FMA/source-file membership and each reused raw OBJ hash. Its report is [renal-studies-validation.json](renal-studies-validation.json). No new mesh, texture, font, dependency or external illustration is imported; existing attribution and third-party notices remain applicable.

The displayed right renal artery reuses ISA/FJ2038 only; the broader PART-OF definition also lists FJ3576, FJ3581, FJ3582 and FJ3584. The left reuses ISA/FJ2046 only; its PART-OF definition additionally lists FJ3467, FJ3476 and FJ3481. These additional components are explicitly recorded, not silently counted as present or admitted without a separate geometry/identity review. Equal filenames across source trees are not assumed to be equal geometry. The studies do not claim complete renal arterial trees.

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. [Source licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html). Commercial reuse retains the CC BY attribution obligations; this is not a CC0 dataset. No new paid service is introduced.

Brief, original teaching text references [NCI SEER urinary anatomy](https://training.seer.cancer.gov/anatomy/urinary/components/kidney.html) and the [Texas Tech abdominal artery reference](https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html). No diagrams or reference-table datasets were copied.

## Validation still required

- Specialist review of laterality, position, renal/adrenal relationships and arterial course in the assembled source model; source identity alone is not anatomical approval.
- Independent, licensed and clinically reviewed internal kidney surfaces before cortex, medulla, calyces, pelvis or segmental anatomy is offered as selectable geometry.
- Renal venous anatomy, intrarenal branching, fascia, surrounding fat and attachment/lumen continuity are not established by these studies. An IVC context surface is not a renal-vein reconstruction.
- Exploded positions are inspection aids, never distances, normal relationships, surgical planes or blood/urine-flow simulation. Review the assembled model first.
- No CT/MRI/US pixels, registrations or patient data were added. Future scan mappings need reviewed source identities, orientation/registration and modality-specific access checks; atlas membership does not unlock separately paid lectures.
- Automated tests cover scoped membership, target gating, source-pinned links, set-aside/Undo/Redo, unrelated exclusions and immutable historical recipes. Interactive browser acceptance and clinical approval remain outstanding.

The shared-link resolver now rejects a focus when its target is absent from the requested side/region, even if a context vessel remains. Older orbital/navigation tests were updated to assert the existing Redo queue after Undo instead of incorrectly expecting an empty future. The runtime history behaviour was not changed.

Targeted lint and TypeScript pass. Repository-wide lint still reports unrelated existing findings; this milestone does not certify a clean global lint run. The production build retains the existing large-chunk and route-classification warnings.

Run `npm run renal-studies:test` from the atlas checkout. The raw-source audit requires the existing `../work/bodyparts3d/isa` and `../work/bodyparts3d/partof` caches; it fails explicitly rather than silently skipping missing source evidence.

# Wrist and foot bone exposure studies

Four focused views reuse 30 existing, side-specific source bone representations. No mesh, material, dependency, font, tissue label or source coordinate has been added or modified.

In **Hand → Study**, choose **Wrist: proximal carpal row** or **Wrist: distal carpal row**. In **Foot → Study**, choose **Foot: hindfoot bones** or **Foot: midfoot bones**. The same choices are exposure stages in the existing dissection controls. Each filters to its bones; no whole-skeleton background or permanent toolbar is added. Select a side, rotate, select/remove a bone, and Undo/Redo or restore the Skeletal framework. Existing supported separation modes remain available. Zero separation is required to inspect the original arrangement.

| View | Each side | Initial view |
| --- | --- | --- |
| Proximal carpal row | Scaphoid, lunate, triquetral, pisiform | Anterior/palmar |
| Distal carpal row | Trapezium, trapezoid, capitate, hamate | Anterior/palmar |
| Hindfoot | Talus, calcaneus | Superior/dorsal |
| Midfoot | Navicular, cuboid, medial/intermediate/lateral cuneiforms | Superior/dorsal |

The instructions distinguish the pisiform's palmar position from a flat carpal row. Bone views are educational exposure windows, not sequential surgical layers, joint-motion simulations, cartilage/ligament segmentation, weight-bearing alignment or normal joint-space measurements. No radiographic projection or patient-image registration is inferred.

## Sources and rights

The original brief instructions were checked against [TTUHSC hand dissection teaching](https://anatomy.ttuhscep.edu/musculoskeletal_system/hand_ans.html), the [University of Utah ankle/foot dissector](https://anatomy.med.utah.edu/diganat/anatomy_tutorials/digital_dissector/index.php?add=/ankle_foot&lab=35&menu=35+Ankle/Foot&rcount=1&selectsize=Small&textsize=Small) and [Ficke et al., foot and ankle anatomy](https://www.ncbi.nlm.nih.gov/books/NBK546698/) on 10 September 2026. These are factual references only: no pictures, tables or third-party teaching datasets were copied or distributed. In particular, the NCBI-hosted chapter is not treated as a commercially reusable asset licence.

Existing BodyParts3D v4.0 geometry and its CC BY 4.0 credit/notices remain unchanged. FMA IDs are individually specified (including the nonsequential right trapezoid ID), never calculated or inferred from a neighbouring ID. No new external service, paid component or entitlement is introduced. Atlas and separate lecture access remain independent.

## Verification and outstanding acceptance

`npm run acral-bone-studies:test` checks the unchanged full catalogue hash, exact sided memberships, stage/focus equivalence, related-view navigation, removal, Undo/Redo/reset and preservation of every prior recipe. The historical comparison admits only this exact four-view addition and rejects unrelated changes. Shared dissection tests exercise projected camera bounds and existing controls separately; automated checks are not browser/device or clinical approval.

Independent anatomical review still needs to assess the source bone shapes, pisiform position, joint relationships and teaching. Keyboard/screen-reader, touch and GPU/device acceptance remain outstanding. Actual CT/MRI/X-ray/US links need separately approved resources and registration evidence.

Verified locally: the four-view/12-side-scope tests, TypeScript, shared guidance/handler checks, renal-view preservation, 145-stage/135-focus dissection regression with 10,440 projected camera-bound checks, and production build. The shared regression now accepts actual bone targets and checks unavailable opposite-side focuses against the existing Study library gating. Regenerating the dissection manifest also catches up its eight previously implemented renal focuses; those are not newly added runtime anatomy. The build retains its existing large-chunk/static-route-classification warnings.

# Connective tissue and deep-spinal detail

## Delivered milestone — 6 September 2026

The atlas contains **892 selectable body entries in 71 bundles**, plus the unchanged nine-structure shoulder pilot. There are **97 dissection stages and 79 focused views** across eleven regions and the whole-body explorer. This milestone adds eleven entries / fifteen source components, six windows and eight focuses. All 881 prior catalogue records retain every field and all 67 previous model bundles retain their hashes.

| New source representations | Source concepts | Components | Main study window |
| --- | --- | --- | --- |
| Right/left wrist flexor retinacula | FMA40120 / FMA40121 | FJ1471 / FJ1471M | Wrist & hand → Retinaculum & carpal arch |
| Right/left iliotibial tracts | FMA58776 / FMA58777 | FJ1423 / FJ1423M | Hip & thigh → Lateral thigh & iliotibial tract |
| Linea alba | FMA11336 | FJ1448 | Abdomen → Anterior midline junction |
| Lumbar interspinal set | FMA71307 | FJ1550 + FJ1550M | Spine & back → Deep lumbar muscle sets |
| Cervical interspinal set | FMA71309 | FJ1552 + FJ1552M | Spine & back → Deep cervical muscle sets |
| Anterior/posterior cervical intertransverse sets | FMA71442 / FMA71443 | FJ1549 + FJ1549M / FJ1553 + FJ1553M | Same cervical window; also a Head & neck focus |
| Right/left levatores costarum breves sets | FMA74077 / FMA74078 | FJ1462 / FJ1462M | Thorax → Short rib-elevator sets; also a Spine & back focus |

The four new GLBs total **1,110,372 bytes** and add 60,734 triangles / 30,581 vertices. Body assets now total 92,912,960 bytes, 4,749,434 triangles and 2,380,709 vertices. Exact hashes and source aliases are in `content/axial-source-audit.json`; the catalogue records every source file/hash and unchanged uniform coordinate transform. No anatomical surface has been guessed, retopologised, moved or mirrored by this milestone. Files whose source names end in `M` are supplied source components, not newly generated mirrors.

## Source and rights gates

All additions come from the official BodyParts3D IS-A `isa_BP3D_4.0_obj_99.zip` archive. Exact source concept names and component lists are pinned in `scripts/axial-selections.mjs`. The official [licence page](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), updated 27 February 2025 and rechecked for this milestone, grants CC BY 4.0 use with attribution. Keep **BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International**, its licence link and the adaptation notices. No new packages, fonts, textures, paid APIs or third-party diagrams were added. This does not guarantee future hosting quotas or operating costs.

Admission checks include archive CRC/size, source SHA-256, exact canonical geometry fingerprints, nonempty finite bounds, gross source-frame envelopes, side-centroid signs for side-labelled entries, held aliases and previous-surface duplication. These do **not** prove anatomical accuracy, detect every partial intersection, certify attachment footprints or establish patient registration.

The source assigns broader fascial aliases to the wrist/iliotibial surfaces. The atlas uses the narrower explicitly pinned concept; it does not claim complete forearm investing fascia or fascia lata. Muscle sets remain grouped: paired components do not become separately identified left/right fascicles. Side filters retain these grouped records with a visible caution.

Two source-labelled **levatores costarum longi** candidates, FMA74075/FJ1463 and FMA74076/FJ1463M, remain outside the model. Their full thoracic superior extents (approximately 1061–1380 mm) are close to the breves candidates (approximately 1063–1380 mm). The named distinction requires fibre-course, vertebral-level and overlap adjudication; this similarity alone is not proof of duplication or a source error. Their grouped alias FMA71313 is also held. Previous pelvic-floor, disc, cord/canal, optic-nerve, laterality and superior-epigastric holds remain intact. The original four catalogue exclusions remain unchanged.

The regenerated inventory still covers 4,273 source definitions / 3,492 archive entries: 1,280 admitted definitions, 51 admitted under another definition, 1,736 represented but not separately selectable, 192 partly represented, 993 unused available and 21 held definitions. These include aliases and aggregates, **not counts of distinct missing human structures**.

## Context windows and teaching

Focus recipes now distinguish a target rule from optional context rules. Both are intersected with region/side scope; the close windows explicitly disable automatic restoration of all bones. Carpal views keep the sixteen carpal surfaces, cervical views keep C1–C7, and lumbar views keep lumbar vertebrae plus the existing lumbar intertransverse groups. The same rule union drives each corresponding stage. Existing focuses without context rules retain their previous behaviour.

All targets can use existing select/frame/isolate, hide/restore/undo, system fade, clipping, explode, plate, labels, named views and opt-in imaging-selection linkage. Explode remains illustrative centroid separation: attachments and relationships must be judged assembled at zero. Thin surfaces have no reconstructed internal tissue and clipped surfaces are not scans.

Original brief anatomy/function notes link to [TTUHSC hand teaching](https://anatomy.ttuhscep.edu/musculoskeletal_system/hand_tables.html), [back muscles](https://anatomy.ttuhscep.edu/anatomytables/muscles_back.html), [thoracic muscles](https://anatomy.ttuhscep.edu/anatomytables/muscles_thorax.html), [abdominal topography](https://anatomy.ttuhscep.edu/anatomytables/topogr_abdomen.html) and primary [iliotibial anatomical research](https://pubmed.ncbi.nlm.nih.gov/17349469/). These support factual summaries; no textbook illustrations, tables or prose passages are imported or relicensed. Notes and model relationships remain draft. CT/MRI/ultrasound, clinical and pathology tabs remain explicitly pending where specialist material is absent.

## Verification and release gates

- `npm run axial:test`: 2,725 assertions; eleven identities, fifteen components, original 881 records / 67 assets, held candidates, exact target/context membership, side handling, landmarks, draft/no-imaging states, hide and undo.
- Full-body: 892 identities / 71 GLBs, schema categories, hashes, finite geometry, unchanged transform, 432 numerical framing checks. Recovery: 2,616 checks. Earlier gap-preservation gates pass.
- Current inventory: 8,932 checks. Deep-brain/label regression: 195,458 checks. Counts vary with catalogue and inventory states; no prior-preservation gate was removed.
- Dissection: 2,856 checks / 6,984 camera checks. Explode: 465,600 pair checks / 7,280 framing checks. Inspection: 1,081,399 assertions. Saved views: 17,081. Imaging selection: 42,102 across 892 body and nine shoulder identities. Review safeguards: 189.
- Type checking, focused lint, production build and 808-package licence audit must pass before publishing. Licences retain notice obligations; automated tests are not medical approval.

The baseline is pinned to source commit `e007550faec7c75947569c2a30fa1a032c7bf5f0`. `axial:test` works in a source snapshot with installed dependencies and no old Git history; re-running the source-candidate audit requires that historical commit. No browser/device acceptance, clinician sign-off or actual imaging adapter is claimed.

**Next:** investigate abdominal-wall source coverage (rectus/internal layers are not supplied by the current anterior-midline window), then strengthen focused learning/practice and accessibility. Anatomical attachment/level review, pixel-label/occlusion and touch testing, the user's imaging function and validated image registration remain separate requirements. The continuing improvement goal remains active.

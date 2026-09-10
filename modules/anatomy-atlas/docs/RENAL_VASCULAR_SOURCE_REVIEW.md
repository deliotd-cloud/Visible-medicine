# Renal vascular detail: source review and staged prototype

This is preparatory anatomy work, not a published expansion of the atlas. The live renal studies still use the ten root representations documented in [Renal studies](RENAL_STUDIES.md). No candidate below has been added to the live model or clinical teaching registry.

## What the source adds

The pinned BodyParts3D v4 tables identify ten candidate groups across thirteen OBJ files. Four renal/suprarenal venous groups are available in the ISA source, despite their absence from the live atlas. The source still does not establish separately selectable kidney cortex, medulla, calyces or renal pelvis.

| Source group | Files | Engineering disposition |
| --- | --- | --- |
| Right renal arterial trunk, FMA66363 | PART-OF/FJ3576 | Exclude overlapping alternative to the current artery |
| Left renal arterial trunk, FMA66364 | PART-OF/FJ3476 | Exclude near-coincident alternative to the current artery |
| Right ureteric arterial segment, FMA70492 | PART-OF/FJ3581, FJ3582 | Stage as one named group; preserve all components |
| Left ureteric arterial segment, FMA70493 | PART-OF/FJ3481 | Stage |
| Right inferior suprarenal artery, FMA69265 | PART-OF/FJ3584 | Stage |
| Left inferior suprarenal artery, FMA69266 | PART-OF/FJ3467 | Exclude pending explicit defect handling |
| Right renal vein, FMA14335 | ISA/FJ3577, FJ3578 | Stage as one named group |
| Left renal vein, FMA14336 | ISA/FJ3477, FJ3478 | Stage as one named group |
| Right suprarenal vein, FMA14343 | ISA/FJ3580 | Stage |
| Left suprarenal vein, FMA14349 | ISA/FJ3480 | Stage |

“Stage” means a reproducible local prototype, not clinical approval or admission to the live catalogue. No unnamed fragment is assigned an invented anatomical label. ISA and PART-OF are distinct sources; equal filenames are not assumed to mean identical geometry.

## Evidence and findings

[Source audit](renal-vascular-source-audit.json) verifies the four pinned tables, the source-hold policy and catalogue, exact definitions and raw-file hashes. It screens bounds for all 1,022 root structures, performs 365 near/shape-compatible comparisons and compares all 45 candidate-group pairs. Geometry fingerprints are checked against the inventory; no exact represented match, shared triangle or translated-shape match was detected by these tests. These negative screens are not proof against every possible geometric alias.

The two alternative renal trunks nevertheless closely follow the current artery surfaces. Left-trunk source-to-current samples have a median distance of about 0.080 mm and a maximum of 0.855 mm; the right median is about 0.465 mm. Different tessellation and a failed strict duplicate-shape threshold do not make these new anatomical structures. They must not be layered on top of the existing trunks.

PART-OF/FJ3467 has one main 952-triangle component and an isolated two-triangle, three-vertex component with zero algebraic volume and one duplicate face. The small component is about 0.000566 mm² in total face area. The raw source is preserved. Neither removal nor a repaired vessel has been silently substituted; this group is excluded from the prototype.

The right ureteric group retains both source files, including two components in FJ3582. Component count is not a count of distinct arteries or proof of connected lumens. All source coordinates remain unchanged.

## Prototype and ingestion gate

`scripts/export-renal-vascular-prototype.mjs` pins the reviewed audit and stages seven meshes / ten source files / 14,332 triangles outside `public/`, under `../work/renal-vascular-prototype`. Only exactly identical source vertices are welded for normals. No tolerance welding, face deletion, smoothing, endpoint bridging or source repositioning is performed. The existing source-to-scene transform is reused.

The exported GLB is loaded back and checked against every source vertex and triangle index, including names and source IDs. Maximum measured export displacement is approximately 0.0000124 mm, below the 0.0001 mm gate. [Prototype evidence](renal-vascular-prototype-validation.json) records the exact asset hash and exclusions. Geometry precision is not anatomical accuracy.

Next implementation steps:

1. Integrate the reviewed source groups into a kidney-bound **vascular relationship** study, using the existing nested dissection controls. Keep cortex/medulla/pelvis absent and explain the asymmetric arterial coverage.
2. Reuse same-side kidney, adrenal, ureter and great-vessel context with exact source binding. Parent selection is a navigation association, not a claim that suprarenal vessels are kidney tissue.
3. Validate selection, source labels, isolate/fade, removal/restore, separation, cutaway, Undo/Redo, exam suppression, deep links and loaded-asset error recovery. Extend the teaching and licensing registry without granting lecture or scan access.
4. Review arterial and venous junctions, side, course, visual legibility and context with an anatomist/radiologist. No distance sample establishes vessel attachment, patency, perfusion territory, normal variation or a surgical plane.
5. Perform browser/device acceptance before calling the new study user-validated. CT/MRI/US registration remains separate and requires reviewed correspondences and entitlements.

Run `npm run renal-vascular:audit` offline with the cached source files; `-- --check` verifies report freshness. `-- --download` explicitly refreshes requested cache entries from the official ZIPs with size/CRC validation. Run `npm run renal-vascular:prototype` only for first creation; existing prototype files are never overwritten. `-- --check` recreates the bytes in memory and verifies the staged files; `-- --record` also refreshes the source-side validation receipt.

## Licensing

The official [BodyParts3D licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) permits commercial reuse subject to CC BY 4.0 obligations. Required credit: BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. Original files remain in the source cache; the derived prototype records the transformation and exact originals. Existing [third-party notices](../LICENSES/THIRD_PARTY_NOTICES.md) apply. No new dependency, font, texture, paid service or copied third-party diagram is introduced.

The [Texas Tech abdominal artery reference](https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html) is a factual teaching reference only; its table and illustrations were not imported. The source review above is based on the pinned model evidence, not on tracing a copyrighted diagram.

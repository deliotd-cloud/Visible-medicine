# Bile ducts and gallbladder: source-bound relationship view

**Liver → Explore liver branches → Study view → Bile ducts & gallbladder** retains both internal biliary groups as selectable structures and adds three existing external landmarks with faint liver tissue. Rotate, select either internal group, hide/show landmarks, separate and reassemble using the established compact workbench. There is no additional main toolbar, route or subscription product.

The relationship opens anteriorly with separation reset to zero. Landmarks are nonselectable and use a small colour key: gallbladder gold, cystic duct pale green and source-labelled common hepatic duct yellow-green; liver tissue remains faint. They disappear during separation and reappear at zero. The context toggle retains the relationship selection when hidden. Switching to an ordinary branch preset removes the added landmarks. Selecting the relationship is one layer-history step; Undo/Redo restores the established layer selection/visibility state, not a saved camera or complete relationship session.

## Source audit and reuse

`public/models/bodyparts3d/hepatic/biliary-context.json` pins the exact existing root records and their two bundle manifests, parent metadata, coordinate frame, source evidence, credit and topology findings. `scripts/audit-hepatic-biliary-context.mjs` verifies current source tables/holds, raw source hashes and existing public bundle hashes. It refuses to overwrite changed pins without deliberate review.

| Existing landmark | Source | Retained triangles |
| --- | --- | ---: |
| Gallbladder, FMA7202 | PART-OF / FJ2817 | 2,396 |
| Cystic duct, FMA14539 | IS-A / FJ3080 | 278 |
| Source-labelled common hepatic duct, FMA14668 | IS-A / FJ3079 | 1,364 |

The 4,038 triangles already exist in `pelvis-organs` and `abdomen-organs-inventory` (90,440 bytes combined); no new GLB or geometry is created. The gallbladder's historical public ID contains `pelvis`, but its current region metadata is abdomen. The ID, source tree, coordinates, names, source hashes and asset identity are preserved rather than inferred from the ID text. None of the three source files is part of the existing hepatic branch/tissue source set.

Each raw landmark is one closed, consistently oriented combinatorial component with no detected duplicate, collapsed or degenerate faces, open boundary or non-manifold elements. This is not a self-intersection test, anatomical acceptance, evidence of a patent lumen or a clinical volume. The verification compares every existing GLB triangle and winding with the transformed source (rounded to 0.00001 scene units for floating-point export tolerance).

## Anatomical limits

The common-hepatic-duct source extends approximately 84 mm in the source superior axis. Its label and full extent are retained, not split or relabelled as a common bile duct. An anatomist/radiologist must adjudicate its proximal/distal boundaries and the relationships of the supplied ducts. No separately modelled common bile duct, validated confluence, ampulla, papilla, open lumen, bile flow, obstruction or surgical safe plane is supplied. No source gap is bridged. Existing liver segment VI/VII overlap and VIII grouping remain unresolved.

The short original guide uses the liver-production/gallbladder-storage facts from [NIDDK's biliary-tract overview](https://www.niddk.nih.gov/health-information/digestive-diseases/gallstones/definition-facts), read 10 September 2026 (page review November 2017). The source diagram/article is not copied or traced. The reference supports educational context, not this mesh's correctness or patient care. Anatomy and imaging teaching remains draft; this view provides no scan registration or paid-lecture access.

## Rights and verification

The [official BodyParts3D licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) and [v4 source description](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html) were rechecked 10 September 2026. Existing CC BY 4.0 attribution and adaptation notices cover this metadata/context reuse. No new dependency, font, image, texture, paid API or third-party mesh is imported. Asset licences do not guarantee indefinitely free hosting or clinical review.

Run `node scripts/audit-hepatic-biliary-context.mjs --check`, `node scripts/validate-hepatic-biliary-context.mjs`, `npm run nested-history:test`, `npm run nested-cutaway:test`, `npm run origin-guides:test`, TypeScript, requirement freshness and production build. The component test executes real callbacks with only the GPU scene stubbed: parent rejection, paired selection, optional context, selection exclusion, colours, loading/failure gates, separation/reassembly and ordinary-view reset. Browser/device, keyboard/focus, contrast/occlusion and clinical acceptance remain outstanding.

# Brainstem and cerebellar source dissection

## Use

Select **Brain** in Head & Neck or whole-body, open its details, then **Dissect brain**. One selector switches between **Brainstem and cerebellum** (default) and **Ventricular spaces**. This extends the existing nested workspace without another global toolbar, route or launcher. The main scene is suspended while open; Back to atlas restores its camera, selection and launcher focus. Active practice retains the existing guard.

Four narrow name/switch rows select and hide the midbrain, pons, medulla oblongata and cerebellum. Presets show all, brainstem only or cerebellum only. Undo layers stores 30 meaningful selection/visibility snapshots; repeat actions do not consume history. Reassemble restores all four and zero separation. Frame selected and Fade others operate within the focused study. Six camera views and free rotation reuse the atlas renderer. The existing responsive side-panel layout is retained; the study selector moves to a separate header row on smaller screens.

The folded **Separate structures** control offers Lift selected, Spread in 3D and Spread on flat plate. Zero separation retains source positions; nonzero separation is a teaching layout, not anatomical displacement or a surgical simulation. Optional fourth-ventricle context is faint, unlabelled and below the picking-opacity threshold. It is hidden during separation, returning at zero if enabled. No connecting tubes or nerve trajectories are created. Study changes remount the inner workbench, resetting nested selection, hidden structures, history, separation, view and loading/failure state rather than carrying unrelated IDs across studies.

## Complete source-table ownership

| Compound | FMA | Existing PART-OF source files |
|---|---|---|
| Midbrain | FMA61993 | FJ1738, FJ1762, FJ1770, FJ1779, FJ1810, FJ1817, FJ1826 |
| Pons | FMA67943 | FJ1775, FJ1822 |
| Medulla oblongata | FMA62004 | FJ1769, FJ1831 |
| Cerebellum | FMA67944 | FJ1781, FJ1830 |

These are the exact complete compounds in the pinned official v4 PART-OF table, not just a conveniently named hemisphere file. The first three compounds together equal all 11 source files of the official brainstem FMA79876. Cerebellum is separate from brainstem. All 13 files already belong to the 59-file main Brain FMA50801 representation; that parent, its original catalogue and its GLB remain unchanged. Every source file belongs to exactly one selectable compound. Fourth ventricular space FMA78469/FJ1731 is reused without changing its record/bundle and does not overlap those 13 files. Parent geometry is never rendered over the children. This is not a complete brain decomposition or additional unique whole-body coverage.

Stable child IDs use `vm:anatomy:body:head-neck:midline:organ:<source-name>`. Exact source files, hashes, parent, coordinates and anatomical review status are carried by the sidecar. Both studies require the original full parent binding; stale source identities fail closed. The new children are not yet independent curriculum, bookmark, exam, lecture or imaging-registry targets.

## Geometry and limitations

The GLB contains 94,588 retained triangles / 1,707,728 bytes, SHA-256 `fd1d8d04656a300fe0e8271a418ec0807b227baa96d6afa822d0df6ad0bf72ba`. It has four mesh nodes and a content-hash URL suffix. The generator verifies the pinned source tables, source-hold policy, 13 original hashes and full parent membership before converting. It welds at 0.000001 source units, recomputes normals, applies the established source-to-scene matrix and calculates finite bounds and retained-surface label anchors. No source triangle is intentionally deleted, mirrored, cropped or reconstructed.

Original pons source irregularities are deliberately visible in the audit: FJ1775 contains a tiny eight-face disconnected remnant; FJ1822 contains two tiny two-face remnants and two duplicate faces. These 12 triangles are retained, not silently removed or newly invented. The other 11 source files each have one connected component. No source has reported collapsed/degenerate faces, boundary/nonmanifold edges or inconsistent winding under the exact-coordinate diagnostic; that diagnostic is not proof of no self-intersection or anatomical correctness. The pons is not claimed to be a clean manifold. Source-defined completeness does not establish clinical completeness.

Colliculi remain part of the complete midbrain selection; nuclei, tracts, cerebellar lobules and peduncles are not individually selectable. Colours are diagrammatic distinctions, not MRI signal or functional territories. The faint fourth ventricle represents a space, not tissue or a measured wall. No acquired image, segmentation, registration, CSF flow, anatomical measurement, clinical approval or surgery planning is provided.

## Reproduce and verify

Run `npm run brainstem:export` against the retained v4 cache, then `npm run brainstem:test`. Missing/stale sources fail instead of downloading unpinned replacements. The test independently compares every exported triangle's positions, winding and multiplicity with original OBJ geometry at 0.001 mm quantization; checks source compounds, topology, finite normals, bounds and surface anchors; rejects stale parent/sidecar identities; and checks exact reused context. It exercises presets, hidden-selection recovery, no-ops, Undo/history cap and the actual study-switch callback. Two server renders verify controls and scene props with only the GPU scene replaced. These are software/data checks, not interactive browser, touch, screen-reader or clinical acceptance. Run ventricular, eye, model-first and content regressions, TypeScript, requirement audit and production build before release.

## Rights and clinical review

BodyParts3D v4 uses [CC BY 4.0 under the official distribution terms](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html), rechecked 10 September 2026 local time. Preserve DBCLS attribution, the licence link and modification notice. No new dependency, font, texture, paid service or external anatomy asset is included. Licence compatibility does not promise perpetual free hosting, legal clearance or free clinical review.

Four brief original factual notes reference UTHealth's [brainstem overview](https://nba.uth.tmc.edu/neuroanatomy/L10/Lab10p29_index.html) and [pons, cerebellum and medulla laboratory](https://nba.uth.tmc.edu/neuroanatomy/L1/Lab01p36_index.html), checked 10 September 2026 local time. Reference images, chapters and tables are not copied or redistributed. The source grouping evidence comes from BodyParts3D tables, not these teaching pages.

Before educational/clinical publication: obtain specialist review of all source shapes, laterality conventions, compound boundaries, both-sided completeness, anchors, fourth-ventricle relationships, known pons artefacts and notes; adjudicate source cleanup separately with traceable evidence; and complete desktop/mobile/keyboard/accessibility acceptance. The provisional CT/MRI head project and its separate subjects retain their own review/privacy/publication gates. Atlas access does not confer paid lecture access. Future links require reviewed child IDs and host-authorized resource bindings; no protected lecture or scan is imported or unlocked.

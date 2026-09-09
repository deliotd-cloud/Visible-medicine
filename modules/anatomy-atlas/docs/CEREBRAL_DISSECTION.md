# Cerebral-region dissection and superior temporal source additions

## Use and navigation

Select **Brain** in Head & Neck or whole-body → details → **Dissect brain → Cerebral regions**. One existing study selector now offers brainstem/cerebellum, ventricles and cerebral regions. There is no new global toolbar or route. Seven paired rows expose 14 selections with anatomical Left/Right headers, individual visibility switches and selection buttons. Contralateral regions use the same teaching colour; the scene's labels continue to follow projected surface positions. Select by surface or by the labelled button; selecting a hidden region restores it.

Presets show all supplied regions, left, right, insulae or temporal regions (including the four superior temporal additions). Hide/restore, 30-step Undo, Reassemble, fading, framing, six camera presets and free rotation reuse the existing workbench. Folded separation offers Lift selected, Spread in 3D and Spread on flat plate. Optional lateral-ventricle context remains faint, unlabelled and below the picking threshold. It disappears during separation and returns at zero if enabled. Nonzero separation is a teaching arrangement, not a biological displacement.

Switching studies remounts the inner workbench, resetting its selection, visibility/history, view, loading/failure/retry and separation. Return preserves the main atlas camera/selection and refocuses its launcher. Parent and child canvases never render together. Practice guards are unchanged. The paired controls use the existing narrow switches, with horizontal hit-area expansion removed at this call site to avoid overlapping the adjacent selection button; no vendored primitive is changed. Device and accessibility acceptance remains outstanding.

## Source ownership, not inferred completeness

| Selection pair | Left FMA / files | Right FMA / files |
|---|---|---|
| Frontal lobe representation | FMA72970 / FJ1744, FJ1787, FJ1800, FJ1833 | FMA72969 / FJ1745, FJ1788, FJ1801, FJ1834 |
| Parietal lobe representation | FMA72974 / FJ1732, FJ1797, FJ1835, FJ1841 | FMA72973 / FJ1733, FJ1798, FJ1836, FJ1842 |
| Temporal lobe representation | FMA72972 / FJ1746, FJ1783, FJ1785, FJ1789 | FMA72971 / FJ1747, FJ1784, FJ1786, FJ1790 |
| Occipital lobe representation | FMA72976 / FJ1791 | FMA72975 / FJ1792 |
| Insula | FMA72978 / FJ1748 | FMA72977 / FJ1749 |
| Anterior part of superior temporal gyrus · additional ISA source | FMA72801 / FJ1837 | FMA72800 / FJ1838 |
| Posterior part of superior temporal gyrus · additional ISA source | FMA72805 / FJ1839 | FMA72804 / FJ1840 |

The first ten selections contain all 28 files in their official PART-OF definitions. All 28 were already in the 59-file Brain FMA50801 aggregate. These definitions do **not** establish a complete cortex: the temporal compounds omit superior temporal parts; fine gyri, functional territories, white matter and other regions remain incomplete or absent. Do not assign the model to an exhaustive cortical parcellation or patient segmentation.

The last four selections come from the official ISA archive, not the old parent. They are independently named anatomical subdivisions, not new whole lobes. Their `sourceRelationship: supplemental-source`, `sourceTree: isa`, raw hashes and `supplementalIds` distinguish them from `parent-component`/PART-OF records. `studyParentId` binds the launch context, not a false claim of original membership. The original parent, 1,022-record catalogue and all prior GLBs remain untouched. Four source parts are genuinely new displayed coverage, available only inside this nested study; the other ten cerebral selections are subdivisions of existing geometry. These child IDs are not yet independent curriculum/bookmark/exam/lecture/imaging-registry targets.

Two existing lateral-ventricle records are exact context copies. None of the 32 selected source files overlaps those context files. The limbic source groups are not also rendered: the right limbic definition shares FJ1786 with the temporal group, while the corresponding left source grouping differs. No symmetric replacement or extra overlapping parent is invented.

## Additional-source evidence

`content/cerebral-supplement-audit.json` records the four new raw SHA-256 values, official definitions, pinned inventory/table/hold evidence, archive CRC/length and topology. Initial acquisition used the v4 ISA ZIP with CRC and length checked against the already pinned archive inventory. Subsequent reads require the exact recorded SHA-256 values. Equal filenames across archives are never assumed to mean equal geometry.

Two independent existing references, FJ1748 (left insula) and FJ1787 (left middle frontal gyrus), have different OBJ bytes across ISA and PART-OF but exactly matching source-coordinate triangle surfaces: 2,448 and 3,416 triangles. The validation script additionally checks their triangle winding/multiplicity. No transform is fitted or guessed. The four additions lie entirely on their declared source side, each has one closed/oriented combinatorial component, and none shares exact triangles with the original parent. Bidirectional bounded surface samples record proximity to the corresponding middle temporal gyrus. These are geometric consistency checks—not proof of anatomical continuity, absence of all intersections, anatomical correctness or patient registration.

Additional triangles: left/right anterior 1,804/1,892; left/right posterior 2,264/2,264; **8,224 total**. No clinical approval or existing source hold is cleared by this admission to the explicitly draft view.

## Geometry and reproducibility

New GLB: **102,158 triangles / 1,856,608 bytes**, SHA-256 `7a62de7b68d7fe823b299ad5dfc9eb628db7a105d120f571789eacf7b3314410`. Fourteen selectable mesh nodes; immutable content-hash URL. Sources are grouped, welded at 0.000001 source units, normal-smoothed and transformed with the existing source-to-scene matrix. Every triangle is retained; no mirroring, hole filling, smoothing of anatomical coordinates or reconstruction. Bounds and label anchors derive from retained vertices.

Detached original frontal source components remain: FJ1744 has 16 faces, FJ1745 22, FJ1833 196 and FJ1834 164 outside their largest connected component. Some are millimetre-scale, not automatically disposable noise. They are documented, not cropped. All 32 sources report no duplicate/collapsed/degenerate faces, boundary/nonmanifold edges or inconsistent winding in the exact-coordinate diagnostic; that is not a self-intersection or clinical-surface guarantee.

Commands, from the existing project:

```bash
node scripts/audit-cerebral-supplements.mjs --fetch # acquire/verify pinned ISA additions and references
npm run cerebral:source                          # deterministic local-cache evidence
npm run cerebral:export                          # retained PART-OF cache also required
npm run cerebral:test
```

Missing/stale source files fail closed instead of substituting a newer model. The test verifies every exported triangle's location, winding and multiplicity against source at 0.001 mm quantization, complete definition memberships, exact hashes/topology, finite normals/bounds/anchors, source relationships, context reuse and reference-coordinate equivalence. It rejects stale parent bindings, exercises presets/hidden selection/history cap, executes the real study-switch and paired selection/visibility handlers, and server-renders all three brain studies with only the GPU scene substituted. Re-run brainstem, ventricular, eye, model-first and content safeguards, TypeScript, requirement audit/check and final build before release. These checks are not browser, touch, clinical or educator acceptance.

## Rights, teaching and clinical gates

The [official BodyParts3D v4 distribution](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html), checked 10 September 2026 local time, supplies the PART-OF and ISA sources under CC BY 4.0. Preserve DBCLS credit, licence link and modification notices. No new package, font, texture, paid API or publisher image is introduced. Source rights do not guarantee free hosting, perpetual service availability, legal clearance or free specialist review.

Brief original notes use UTHealth's [cerebral fissures/lobes laboratory](https://nba.uth.tmc.edu/neuroanatomy/L1/Lab01p06_index.html) and [functional-area overview](https://nba.uth.tmc.edu/neuroanatomy/L1/Lab01p27_index.html), checked 10 September 2026 local time. Source membership facts come from BodyParts3D's pinned tables. No publisher prose, diagram, scan, chapter or table dataset is copied. Colours distinguish source groups, not functional areas or MRI signals. Fourteen selections do not equal fourteen complete lessons.

Before educational/clinical release, obtain independent review of all group boundaries, missing cortex, supplemental identity/position, source interpenetration, laterality, anchors, detached fragments and teaching. Do not infer Broca/Wernicke boundaries, motor/sensory maps, vascular territories or language dominance from these shapes. Complete desktop/mobile/keyboard/screen-reader review. The separate provisional CT/MRI project retains its subject/privacy/release gates; these generic surfaces are not registered to its scans. Atlas access never unlocks separately paid lectures. Actual links require reviewed child-ID/resource bindings and host authorization.

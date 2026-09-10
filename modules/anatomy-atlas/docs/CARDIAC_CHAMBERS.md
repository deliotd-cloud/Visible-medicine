# Cardiac chamber study

Select **Heart → Explore heart chambers**, or search for a cardiac cavity name/FMA ID. The same model-first workspace now serves a thoracic organ: four selectable cavity shapes, optional faint atrial-wall references, six camera presets, labels, visibility switches, Undo layers, fade/frame and three separation mechanisms. Study presets compare all four spaces, the right or left pair, the atria or the ventricles. No new permanent sidebar or route is added.

## What is represented

| Role | Source definition | Source file |
| --- | --- | --- |
| Selectable | Right atrial cavity FMA11359 | FJ2424 |
| Selectable | Left atrial cavity FMA9465 | FJ2425 |
| Selectable | Right ventricular cavity FMA9291 | FJ2423 |
| Selectable | Left ventricular cavity FMA9466 | FJ2422 |
| Nonselectable context | Right atrial wall FMA9457 | FJ2439 |
| Nonselectable context | Left atrial wall FMA9531 | FJ2438 |

All six are original, unique single-file PART-OF definitions within the existing 56-file heart FMA7088. Original SHA256 values, source transform and source triangles are retained; export welds vertices/recomputes normals but does not reconstruct surfaces. No extra unique whole-body anatomy is claimed. The 1,022-entry root catalogue and previous 92 GLBs remain unchanged; one display GLB adds 587,588 bytes and32,276 triangles. Its source/geometry audit is embedded in `public/models/bodyparts3d/cardiac/catalog.json`.

The coloured objects are **cavity shapes**, not solid tissue. Colours distinguish selections, not oxygenation, CT/MRI/ultrasound signal or cardiac phases. This is not a measurement of cardiac volume, pressure, wall thickness or contraction. The main heart aggregate is not rendered on top. Context is disabled/hidden during separation and cannot intercept selectable-object click handlers. Reassemble restores all spaces and zero separation; Undo restores layer selection only. Existing context preference remains independent.

## Source conflicts: not silently relabelled

The source tables contain overlapping mappings that do not establish independent dissection boundaries:

| Source conflict | Exact shared files | Decision |
| --- | --- | --- |
| Right ventricular wall FMA9533 and right ventricular papillary-muscle compound FMA7259 | FJ2419, FJ2430, FJ2437 | Identical compounds do not independently identify wall versus papillary extent. |
| Mitral valve FMA7235 and aortic valve FMA7236 | FJ2426, FJ2431 | Do not treat both compounds as disjoint validated valves. |
| Posterior mitral leaflet FMA7243 and inferior LV wall FMA9561 | FJ2432 | One surface has conflicting anatomical roles. |

None of these files is admitted to the chamber study. Other valve, chordal, ventricular-wall, papillary and conduction structures are not shown. This is a recorded study-specific exclusion, not a claim that the existing whole-heart aggregate has been repaired or that every remaining cardiac source is unusable. Adjudication needs the actual surfaces, upstream mappings, spatial relationships and a qualified anatomical reviewer. Do not construct missing valves from these cavity boundaries or infer hidden geometry from a 2D image.

## Architecture, teaching and integration

`lib/cardiac.ts` resolves only the exact current parent source identity and its four selectable children. `app/ventricles.tsx` retains its legacy export name but is the shared component-study workbench; `ComponentStudy` extends the existing brain studies with cardiac. The modal selects its supported family from the guarded parent, so a heart cannot expose brain-study choices. Existing brain/eye behaviour and UI primitives are preserved.

Nested navigation now resolves the destination's actual region rather than assuming every child is in the head. There are41 current nested targets (the previous37 unchanged plus four cavities). Search, source-pinned v2 study links and the opt-in learning registry include the four; context walls remain excluded. Combined learning representations total1,072 with the original1,031 root bindings unchanged. No live external resources, patient registration or paid-lecture entitlement is created.

The shared search-display source changed, so all nine shoulder display/geometry review fingerprints are conservatively refreshed. Existing private review records are not read, migrated or approved; earlier fingerprints remain reconstructible for offline historical tests. Shoulder teaching/mesh identity is unchanged. The exported shoulder fixture carries the current fingerprints.

Four original, brief source-pinned lessons add Anatomy, Function and unscored self-checks. Clinical, Pathology, CT, MRI and ultrasound remain explicitly pending for these cavities. Existing37 lesson snapshots and three parent snapshots are preserved exactly. `pin-nested-teaching.mjs --extend-only` is an explicit editorial extension operation: it rejects changed or removed old bindings/parents and requires genuine new bindings. Normal generation still refuses migration. This is not clinical approval.

References consulted10 September2026: [NHLBI heart anatomy](https://www.nhlbi.nih.gov/health/heart/anatomy), [University of Minnesota cardiac physiology](https://www.vhlab.umn.edu/atlas/physiology-tutorial/the-human-heart.shtml), [TTUHSC heart tables](https://anatomy.ttuhscep.edu/cardiovascular_system/heart_tables.html). Source rights rechecked at the [official BodyParts3D v4 archive](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html). No reference illustration, scan, video, chapter or table is copied. Attribution/CC BY4.0 for DBCLS and existing MIT/authored-text obligations are preserved in `LICENSES/THIRD_PARTY_NOTICES.md`. No new dependency, font, texture, paid API or runtime source download.

## Reproduction and remaining acceptance

Run `npm run cardiac:export` with the verified v4 source cache, then `npm run cardiac:test`. The test checks exact parent/table/source binding, topology, every transformed triangle including winding/multiplicity, finite geometry, bounds and anchors, source exclusions, prior teaching-pin preservation and actual control callbacks with five rendered control states. The GPU scene alone is replaced for control testing. Nested navigation/teaching/learning regressions cover all41 current selections and legacy compatibility.

Independent anatomical review must assess cavity and atrial-wall fidelity and resolve source conflicts before further dissection is admitted. Browser/device acceptance remains pending: depth/transparency, clicking through context, all orbit/explode styles, labels, keyboard/focus return, 200% text and narrow screens. Clinical editorial review and real CT/MRI/echo/X-ray correspondence require their own approved sources. Static surface QA cannot prove those outcomes.

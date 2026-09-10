# Pancreatic source review and display correction

The subsequent [duct dissection](PANCREATIC_DISSECTION.md) exposes the two retained duct files separately with one optional envelope. The findings and root display correction below remain unchanged; “combined selection” describes the root atlas view, not the new internal study.

## Finding

The existing pancreas aggregate contains four BodyParts3D v4 PART-OF files. A source-coordinate audit found two nearly coincident outer surfaces, not evidence of separate dissectible tissue layers:

| Source | Source identity | Triangles | Display decision |
| --- | --- | ---: | --- |
| FJ1895 | Pancreas in the IS-A index | 4,890 | Retain envelope |
| FJ1896 | Pancreatic duct | 3,368 | Retain in the combined selection |
| FJ2629 | Parenchyma of pancreas | 4,272 | Omit overlapping alternative from display only |
| FJ2630 | Pancreatic duct tree in IS-A | 4,432 | Retain in the combined selection |

The two envelope alternatives share 93 exact-coordinate triangles. All unique FJ2629 vertices and about 96.69% of FJ1895 vertices are within 0.25 mm of the other surface; median distances are approximately 0.00090 and 0.00158 mm. These are mesh diagnostics, not clinical measurements. The retained choice preserves the source-labelled whole-organ envelope; it does not adjudicate microscopic parenchyma or claim the other source is anatomically invalid.

The two duct sources have no exact shared triangles and do not match under the bounded translation-comparison test. Their median nearest-surface distances are about 1.94 and 2.15 mm. This does not establish duct continuity, separate accessory drainage or patency. The PART-OF duct-tree definition contains **both** FJ1896 and FJ2630; its IS-A definition contains only FJ2630. Do not silently present those definitions as two complete independent duct trees.

## What changes in the atlas

The pancreas keeps its stable anatomical ID and remains one selectable organ in whole-body and regional views. A lazy-loaded display derivative contains 12,690 retained triangles, omitting only the 4,272-triangle alternative. The original aggregate, source files, source tables and every original bundle remain unchanged and recoverable. There is no new anatomical selection or extra control. Removing an overlapping display surface is not a new internal dissection.

`scripts/audit-pancreatic-source.mjs` checks exact index membership, raw hashes, topology and all-vertex nearest-surface distances. `scripts/export-pancreas-display.mjs` pins that audit, preserves the common transform, recomputes display normals and emits the separate GLB and correction sidecar. Retained coordinates and face winding are checked independently against the raw OBJ faces. No smoothing, inferred connection, scaling, relocation, mirror or generated tissue is used.

`lib/body-display-catalog.ts` applies the pancreas and existing eye correction atomically per complete source record, preserving all IDs and archived bundles. Changed source version, coordinates, source record or original/corrected bundle binding is rejected. The adapter is idempotent and does not mutate input data. Labels, framing, lazy loading, practice and outgoing model references consume the replacement record together.

The display record lists its three retained source files. Existing draft factual teaching is preserved through an exact-record **teaching-only** match; only model-scope notes change. This does not remap scan or lecture permissions. An old four-source resource binding differs from the new three-source binding and requires independent correspondence review, not automatic reuse. Atlas and target-resource entitlement gates remain unchanged; no external resources are configured.

## Rights and reproduction

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. The [official licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), checked 10 September 2026, allows redistribution and derivatives under its attribution obligations. Retain the credit, licence and this modification notice. No new dependency, font, texture, patient image or paid service is added.

The [NCI SEER accessory-organ reference](https://training.seer.cancer.gov/anatomy/digestive/regions/accessory.html) was consulted for general pancreatic context, not as proof of these mesh subdivisions. No diagram, article, table, scan or patient case was copied. Existing clinical paragraphs retain their references and draft status.

Run the audit with `node scripts/audit-pancreatic-source.mjs --check`, the deterministic export with `node scripts/export-pancreas-display.mjs --check`, and `node scripts/validate-pancreas-display.mjs`. The last check verifies all retained triangle coordinates/winding, the omitted triangle count, exact display bindings, unchanged IDs/archive, current bounds/anchor, lazy loading/practice, draft teaching continuity and incompatible old resource bindings. Eye, nested-navigation/learning and clinical-content regressions also apply. Tests are not GPU, browser, mobile or clinical acceptance.

## Next dissection work and acceptance gates

Prepare separately selectable pancreatic duct sources using their exact index scope, with a **single** optional tissue reference and the combined root organ suppressed. Confirm how the named duct and duct-tree component should be described before claiming distinct functional routes. Reuse existing selection, cutaway, separation, history, search and collapsed teaching controls. Do not represent the omitted envelope as a newly discovered internal layer.

Independent anatomical review must assess duct courses/junctions, the envelope choice and source variation. Actual-device review must assess rendering, labels, clipping and recoverability. Microscopic acini/islets, pancreatic divisions, duct patency, disease geometry and CT/MRI/US registration remain unvalidated or absent. This correction is progress toward a more faithful model, not completion of pancreatic anatomy or clinical sign-off.

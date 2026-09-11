# Cardiac valve and papillary source review

11 September 2026. Offline candidate evidence only; **no new anatomy is admitted**. The four-cavity heart study, its vessel comparisons, original whole-heart aggregate and all teaching remain unchanged. Oral anatomy remains lower priority.

## Scope and findings

The four named valve compounds and two ventricular papillary-muscle compounds resolve to **16 distinct retained PART-OF source files**, 2,562,706 bytes and 38,792 triangles. They already occur within the original 56-file heart; exposing them would add dissection identities, not new source tissue. The reproducible [evidence](cardiac-valve-candidates.json) binds the original heart, coordinate frame, both official English tables, file hashes, exact topology and conflicting definitions. It contains no repaired geometry.

| Candidate | Evidence requiring a decision before admission |
| --- | --- |
| Tricuspid leaflets | Three unique single-file labels. The septal file FJ2436 contains a separate eight-face microcomponent. The anterior/posterior files pass the recorded closed-surface topology checks; that does not establish faithful leaflet or chordal boundaries. |
| Pulmonary cusps | Three unique single-file labels. FJ2434 contains a separate two-face component with one duplicate face; the other two pass the recorded topology checks. Do not silently drop the fragment and call the valve validated. |
| Mitral/aortic apparatus | The mitral and aortic compounds share FJ2426/FJ2431. Posterior mitral leaflet FJ2432 is also labelled inferior LV wall/myocardial zone. The mitral fibrous-ring compound overlaps the aortic-cusp files as well. These mappings do not establish disjoint validated structures. |
| RV papillary muscles | The three-file papillary compound exactly equals the RV-wall compound; anterior FJ2419 and posterior FJ2430 also have individual wall labels. The septal singleton is not independently cleared by being uniquely named. |
| LV papillary muscles | FJ2418 also denotes a myocardial zone and includes a separate 24-face component with negative algebraic volume. PART-OF lateral papillary muscle uses FJ2418/FJ2429, whereas IS-A uses FJ2429 alone. These are not interchangeable definitions. |
| Chordae tendineae | No separately named chordae tendineae row was found in the two retained English tables. This is **not** proof that compound meshes contain no chord-like features; no separable chordal identities or attachments are established. |

All sixteen corresponding IS-A files were already cached. Their raw hashes differ from PART-OF, but their ordered vertex/face fingerprints match exactly. Switching trees therefore does not supply a repaired surface or settle conflicting labels. Raw differences and the measured geometric agreement are retained separately; filenames alone were not treated as proof.

## Decision and next admissible step

Keep this set out of the live selectable model for now. This is a bounded engineering screen, not a blanket rejection of every cardiac component. A qualified cardiac anatomist should adjudicate the specific source-role conflicts and leaflet/chordal boundaries using the actual original surfaces. A documented derivative may separately address the recorded microcomponents and duplicate face; preserve originals and exact face-change records, and independently review the resulting surface. Do not reconstruct valve leaflets, chordae, annuli or muscle attachments from cavity shapes or unrelated illustrations.

Any subsequently accepted study should preserve the source frame, retain source terminology until nomenclature is adjudicated, distinguish tissue from chamber cavities, and disclose incomplete valve sets. Validate registration, local relationships, selection and removal/restore behaviour before exposing it. Physiological movement, coaptation, pressure, flow, stenosis/regurgitation and patient imaging require additional evidence; static topology cannot validate them.

This source screen is complete. Do not repeat the same table search or auto-repair fragments during goal continuation without new evidence or a deliberate review decision. Continue other substantive regional gaps and cleared resources; do not return to routine oral expansion. There is no new live control or additional UI clutter.

## Reproduction and rights

Run `node scripts/audit-cardiac-valve-candidates.mjs --check` from the project with the retained v4 source cache. It verifies all original bytes against the existing heart, recomputes topology and cross-tree fingerprints, and compares the complete evidence. Missing/altered sources fail; there is no network download, export or repair path. Initial recording refuses to overwrite an existing report. Any later evidence change must be investigated rather than silently recaptured.

Primary source references rechecked 11 September 2026: [official archive description](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html), [official reuse terms](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), and [Texas Tech heart terminology](https://anatomy.ttuhscep.edu/cardiovascular_system/heart_tables.html). Source geometry/index reuse retains **CC BY 4.0** and the required credit: BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. No university diagram, table, chapter or patient image is copied. No new model download, dependency, font, texture, paid service or entitlement is introduced. See [third-party notices](../LICENSES/THIRD_PARTY_NOTICES.md).

Code/source diagnostics are not clinical acceptance, self-intersection proof, browser/GPU/device testing or a completed backup of private review data. This documentation-only pass does not require rebuilding or republishing the unchanged live application.

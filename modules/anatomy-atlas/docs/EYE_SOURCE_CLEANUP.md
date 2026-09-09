# Traceable right-eye source cleanup

## Why this changes the live atlas

The first eye-layer release withheld four right components because their source bounds extended into the opposite orbit. A full connected-component inspection shows nine disconnected specks, each below 0.1 mm extent on every axis and below 0.01 mm² surface area. Together they contain 36 triangles / approximately 0.00299536 mm² surface area. Their positive source X places them on the left, whereas all retained triangles in these files are on the right. These measurements describe the mesh, not clinical tissue size.

| PART-OF file | Source triangles | Suppressed zero-based face indices | Suppressed count |
|---|---:|---|---:|
| FJ1340 (right cornea) | 4,606 | 4,588–4,605 | 18 |
| FJ1371 (right lens suspensory ligament) | 7,376 | 7,372–7,375 | 4 |
| FJ1337 (one right-choroid file) | 28,872 | 28,862–28,871 | 10 |
| FJ1368 (right sclera) | 39,524 | 39,520–39,523 | 4 |

Exact SHA-256 values and component bounds, triangle counts and areas are retained in the generated `sourceCleanup` / `cleanup` evidence. The cleanup helper accepts only pinned file/hash/range/count combinations, checks every removed face is entirely opposite-sided and rejects unexpected opposite or cross-midline faces. Export also verifies source topology against the recorded fragment scope. Same-side small pieces are deliberately **not** discarded. No general size threshold is applied to unrelated anatomy.

The original raw OBJ files and original 87 archive GLBs are preserved. This is a reproducible derivative, not source replacement: no hole filling, topology reconstruction, reflection, smoothing of positions or invented anatomy. Normal recomputation is for shading only. Four formerly withheld components return to the layer view, bringing it to eight left and seven right; absent right chamber/retina/finer tissues remain absent. Independent ophthalmic review must still assess identity, continuity, retained same-side artifacts, boundaries and missing detail.

## One display identity, consistent spatial data

`scripts/export-eye-layers.mjs` writes the 15-component `eye-layers.glb`, plus a separate `right-eyeball.glb` made from the exact seven cleaned right components. They are never rendered together. `display-correction.json` binds the original full structure record, the replacement, exact GLB/hash, unchanged source coordinates and fragment evidence. Asset URLs carry content hashes so stale cached geometry is not reused after a correction.

`lib/body-display-catalog.ts` applies that correction at the body catalogue loading boundary, before study-link resolution and `bodyLinkEntries`. It accepts exactly one original record with the expected full metadata and coordinate system. It rejects duplicate, stale or conflicting source/asset bindings; reapplying to the exact corrected catalogue is idempotent. All other 1,021 body records and original asset bytes are unchanged.

The right-eye X extent changes from approximately 81.0103 mm (including opposite-side specks) to 26.3201 mm. Its bounds-centre X changes from approximately −3.1129 mm to −30.4580 mm. The label anchor is recalculated on an actual retained vertex. Framing, separation, clipping frame, saved-view framing and outbound reference hooks now consume the corrected record. The source FMA/name/laterality/ID and original OBJ provenance stay unchanged. Practice waits for the new corrected bundle; a cached old aggregate cannot falsely mark this model ready.

The main structure panel identifies the source-cleaned model; the nested viewer details the modification. This is still **not patient registration**. No CT/MRI/US/X-ray data, coordinates from a patient, scan synchronization, lecture entitlement or clinical approval is introduced.

## Exports and integration boundary

The historical `full-body/catalog.json` is archived ingestion data and remains pinned by previous audits. It is intentionally not overwritten. Any future website/server integration must call `bodyDisplayCatalog` or apply the complete exact-bound `display-correction.json` before deriving rendering or reference coordinates. Do not combine the corrected mesh with the old root bounds. Raw content exports and source-inventory classifications remain source records, not a new live display catalogue or a clearance of all source artifacts. Existing learning-resource source IDs/hashes remain valid; they do not independently grant access.

Verification: `npm run eye-layers:test` covers source/triangle preservation, independent side-predicate expectation versus pinned-index implementation, nine fragment components, corrupted-source/range rejection, immutable one-record display replacement, corrected bounds/anchor/reference point, load and practice scopes and child-parent consistency. Existing model-first/content tests preserve archived baselines separately. No browser/GPU/device/clinical acceptance is claimed.

CC BY 4.0 credit, licence link and modification notice apply to both generated meshes and source mappings. See `LICENSES/THIRD_PARTY_NOTICES.md`. No new model source, third-party media, dependency, font, texture or paid service is used.

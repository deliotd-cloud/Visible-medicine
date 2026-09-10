# Dental gingiva source review

Status: **two source envelopes preserved for review; neither admitted to the live atlas**. The existing 28 selectable teeth, jaw bones, teaching and controls remain unchanged. This is source-ingestion progress, not completed periodontal anatomy.

## Identity and commercial reuse

BodyParts3D v4 IS-A supplies `FMA59763 / FJ1252` (gingiva of upper jaw) and `FMA59764 / FJ1253` (gingiva of lower jaw). Original OBJ bytes are retained in `content/prototypes/gingiva/source/`, with SHA-256 pins in `scripts/gingiva-candidates.mjs` and the prototype catalogue. Neither has a root owner or an exact represented-inventory geometry match. Other-archive filename aliases do not create additional anatomy: the PART-OF “upper jaw” alias is not a second complete jaw.

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. The [official notice](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html) and [CC BY 4.0 terms](https://creativecommons.org/licenses/by/4.0/) permit commercial adaptation with attribution, licence-link and modification obligations. This is not CC0 or exclusive Visible Medicine anatomy. No new dependency, subscription, texture, font, scan, textbook diagram or paid service is added. Hosting/platform usage remains separate from asset licensing.

The [v4 release notes](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/release_4.0_e.html) caution about mapping and skeleton-position changes. Both candidates stay in the existing v4 frame; no older-version geometry or cosmetic relocation is used.

## Evidence

`docs/gingiva-source-audit.json` pins the source tables, current root catalogue and all compared raw-source hashes. Its SHA-256 is `21aec7193cc0879dfc93f5ee62af065a79329757086912e9b5ad20b035637420`.

- All 1,022 root envelopes are screened at a 1.01 mm margin in original millimetres. The 108 nearby candidate/reference comparisons find no exact shared triangle; this does not prove absence of approximate duplicate anatomy elsewhere.
- Separate comparisons use the combined maxillae, mandible, 14 upper teeth and 14 lower teeth. Every candidate unique vertex and every triangle centroid is queried; centroid threshold fractions are area-weighted. Reverse reference vertices are explicitly sampled. Distances are unsigned, not intersection or tissue-thickness measurements.
- Upper: 1,848 triangles in four components (1,814 / 16 / 16 / 2), with one duplicate triangle. Lower: 1,918 triangles in one combinatorially closed, consistently oriented component without duplicates. Neither result certifies anatomy or absence of self-intersection.
- Upper-to-combined-maxilla vertex distance has a 1.39 mm median; lower-to-mandible, 1.00 mm. Opposite-jaw distances are much larger. This supports investigating the source arch assignments, not validating attachment or thickness.
- Offline orthographic projections of actual gum/tooth triangles were inspected. The envelopes and marginal boundaries are coarse; projected tooth/gum overlaps need dental assessment. This is not a robust triangle-intersection result or a validated gingival margin. No live browser/GPU or device acceptance was performed.

## Retained artifact

`content/prototypes/gingiva/gingiva-prototype.glb`: two identified meshes, 3,766 triangles, 70,732 bytes; SHA-256 `2fb2e2af77c3207cd0d83f301cefd7d795116baf6f521c5b1c8290266cf888d6`. The catalogue pins 31 existing tooth/jaw context records and their two original bundles; context geometry is referenced, not duplicated or reclassified as new anatomy.

Modification: exact-coordinate vertex indexing, recomputed display normals, the existing transform and Float32 storage. All faces and winding remain, including upper fragments/duplicate. No positional smoothing, decimation, bridging, mirroring or repair. GLB round-trip maximum error is about 0.0000243 mm: conversion fidelity, **not anatomical accuracy**. Raw OBJ files are protected against Git line-ending conversion.

The folder is outside `public/`, with no runtime import, navigation, teaching, imaging mapping or access entitlement. Every record is prototype-only/unvalidated. Passing integrity tests does not approve admission.

## Reproduction

From the module checkout with locked dependencies installed:

```sh
npm run gingiva:prototype -- --check
npm run gingiva:test
```

These checks use retained originals and existing context GLBs, without the ignored download cache. To reproduce the full audit, retrieve its exact licensed source references into the ignored sibling `work/bodyparts3d/` cache:

```sh
npm run gingiva:audit -- --download --check
```

The official ZIP reader checks size/CRC; SHA-256 is then checked against retained pins. Without `--download`, all compared originals must already be cached. Upstream/source changes fail; do not silently substitute or repin. Initial export is create-only; existing artifacts use `--check`.

## Admission and clinical-validation gates

1. Adjudicate upper detached components and the duplicate. Any justified derivative must enumerate original face indices and preserve original bytes; small size alone is not grounds for removal.
2. Assess the extent actually represented by each envelope, marginal shape and tooth/bone/palate relationships. Use robust section/intersection inspection and dental specialist review before anatomical claims. A source label or plausible arch is insufficient.
3. Scope any admission as a coarse source envelope unless validated otherwise. Free/attached/interdental subdivisions, mucogingival junction, periodontal ligament, cementum, pockets, tissue thickness, root canals and complete periodontium are not supplied by these meshes. Occlusion and clinical numbering remain unvalidated.
4. Once scope is established, use the existing compact Teeth & jaws study: original-position context, independent gum visibility, selection/fade, same-side labels, reversible separation and return to 0%. Do not add a permanent control panel or invent surgical peeling/deformation.
5. Add original referenced exact-ID teaching and independent editorial review. CT/MRI/X-ray/US matching needs separate image/segmentation validation; atlas access must not grant separately paid lecture sections.

No existing source hold is cleared. If these envelopes cannot support the intended scope, leave them withheld and pursue a better licensed source or clinician-authored original rather than cosmetically concealing the limitations.

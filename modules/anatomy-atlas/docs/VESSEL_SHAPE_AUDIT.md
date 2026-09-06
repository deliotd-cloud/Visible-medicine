# Bounded artery–vein shape screen

## Scope and result

Screened all **223 currently rendered vascular source identities** in their **18 existing vascular bundles**, following the two plantar venous shape/provenance holds. The catalogue and every model remain unchanged. No tissue was admitted, removed, relabelled, reshaped or clinically approved.

The screen considers **10,362 artery–vein pairs** under the conservative source-type classifier. It excludes **3,378 opposite explicit-side pairs**, then prunes **6,983 pairs** with dissimilar three-axis extents. **One pair** passes this filter: right colic artery FMA14811 and right colic vein FMA15407. Its sampled bidirectional distances do **not** meet the near-translated similarity threshold. Thus **no additional pair is flagged by this bounded screen**—not a claim that all vascular geometry is independently correct or distinct.

Two positive controls are the original, still-withheld plantar venous sources FMA44883/FMA44884 against rendered arterial arches FMA43943/FMA43944. Their raw OBJ hashes are checked against the foot audit before comparison; both meet the diagnostic threshold and remain excluded. A translated copy of an existing shape is detected; a scaled copy is not. All these comparisons are temporary numerical diagnostics, never product transforms.

## Method and limitations

1. Verify source bundle hashes and exact node/identity bindings. Recover source millimetres through the inverse common scene transform, including mesh world transforms.
2. Compare opposite source vessel types; exclude only opposite explicit left/right sides. There is no triangle-count or region filter.
3. Retain pairs whose extent differences on every source axis are within `max(0.5 mm, min(3 mm, 8% of the larger extent))`.
4. Temporarily align bounding-box centres by translation only. In each direction, sample at most 128 deterministic vertices and find the closest point on every comparison triangle. Degenerate triangles use segment/point distance fallback.
5. Flag only if **at least 95%** of samples are within **0.1 mm** and **all sampled distances are at most 0.3 mm**, in both directions.

The strict extent filter intentionally bounds the check and can exclude partly corresponding surfaces. Vertex sampling can miss local differences. Same-type, opposite-side, unclassified, differently rotated/scaled or incompletely overlapping shapes are not equivalent-search coverage. This is not full Hausdorff distance, topology matching, vascular continuity or lumen validation. A match is a reason for source review, not proof of copying, wrong anatomy, venous correspondence or patient registration; absence of a match is not clinical validation.

## Reproduction and rights

`npm run vessel-shapes:test` performs **319 assertions**, reloading all 18 immutable product bundles and recomputing current screened geometry/comparisons. It tests independent translated, remeshed, scaled, rotated, indented, collinear and point fixtures, invalid triangles, inverse transforms and non-mutation. The default test verifies the held-control recorded hashes/criteria without requiring cached raw sources.

`npm run vessel-shapes:audit` regenerates `content/vessel-shape-audit.json`, including both real held-source controls. It requires the original v4 `FJ2129.obj` and `FJ2128.obj` in the ISA cache resolved by `scripts/bodyparts-archive.mjs`; missing or changed raw hashes fail closed. Product catalogue SHA-256 is pinned to `b9888bf57e7eee61638c2c6920677fe3e6b6bd55ad97df3d19f45829865c13d5`. `docs/vessel-shape-validation.json` binds the generated evidence hash. No patient data or private review records are used.

All derived BodyParts3D source evidence remains under the existing [official CC BY 4.0 grant](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), checked 6 September 2026. Retain **BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International**, licence links and change notices. It is not converted to MIT or CC0. No added dependency, paid service or model licence is introduced.

## Next work and external gates

Retain all existing source and component/aggregate holds. A specialist must adjudicate the plantar venous shape/depth issue and review admitted vascular identities, spatial relationships, continuity, calibre and variants. Broader same-type/partial-shape diagnostics and remaining nonvascular source candidates can be investigated separately without automatic admission. Clinical review, real-device acceptance and acquired US/CT/MRI integration remain open.

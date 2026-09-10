# Cricothyroid muscle-part prototype

Status: reproducible, non-public staging artifact, **not admitted to the live atlas and not clinically validated**. Existing 1,022 root representations, 65 nested representations, dissection controls, teaching and product access remain unchanged. This prepares a source-grounded head-and-neck extension rather than inventing gland or nerve geometry.

## Source and derivative

BodyParts3D 4.0 provides four IS-A part definitions, not proof of complete cricothyroid anatomy:

| Source definition | Original OBJ | Retained triangles | Omitted original zero-based face indices |
| --- | --- | ---: | --- |
| FMA46611 — right straight part | FJ2801 | 3,222 | 2968, 2969, 2970, 3045, 3226–3231 |
| FMA46612 — left straight part | FJ2783 | 3,268 | 226, 228 |
| FMA46613 — right oblique part | FJ2799 | 5,566 | None |
| FMA46614 — left oblique part | FJ2781 | 5,580 | None |

The raw four files contain 17,648 triangles. Six detached islands each contain exactly two coincident triangles with reversed winding and zero algebraic volume. The display derivative omits those **12 specifically pinned faces**, leaving 17,636 triangles. No other triangle is removed. Some paired face indices are nonconsecutive; removal is never inferred from a range or largest-component rule.

Every retained triangle preserves its original coordinates, ordering and winding. Unused indices are compacted; only identical coordinates are subsequently welded for export normals. There is no tolerant welding, smoothing, hole filling, bridging, translation, attachment adjustment, new segmentation or AI-generated tissue. All four retained surfaces are single closed consistently oriented combinatorial components. This does **not** establish absence of self-intersections or anatomical correctness. The maximum measured GLB round-trip position error is below 0.0001 mm, solely an engineering export check.

`content/prototypes/cricothyroid/` retains the four byte-identical original OBJ files, a four-mesh GLB and a provenance catalogue. The artifact is outside `public/` and is not imported by the application. Names and independent part IDs can support a later selection registry; they do not create imaging correspondence or paid-resource access.

Path-specific `.gitattributes` disables text conversion and textual diffs for these four originals. Their source trailing whitespace is deliberately preserved, not formatted. The validation script also checks Git's checkout filtering with Windows-style automatic line-ending conversion enabled. General whitespace checks apply to authored files, not to immutable third-party original bytes.

## Evidence and safeguards

`docs/cricothyroid-source-audit.json` pins source definitions, all relevant alias-definition hashes, raw hashes, existing hold policy, catalogue, coordinate system, removal coordinates/indices and retained triangle hashes. Broad aggregate aliases such as “zone of cricothyroid” are not extra structures. No current root owner, cross-tree filename owner or represented exact geometry fingerprint matches these candidates.

All 1,022 root envelopes were screened. Seventy-eight original-coordinate comparisons and six candidate-pair comparisons found no exact shared triangles; none met the recorded 25% sampled-near-surface diagnostic at 0.25 mm. Equal-extent muscle screening found no additional translated candidates. Eight cartilage comparisons include every unique candidate vertex and area-weighted triangle-centroid distances against thyroid/cricoid surfaces. Proximity is not an attachment-footprint or continuous intersection proof.

The narrow cleanup helper rejects same-winding duplicates, shared-vertex islands, repeated/invalid indices, collinear pairs, incomplete cleanup and a nonmanifold retained surface. Byte pins and hold checks are mandatory at the exporter; the helper alone does not authorize repair or admission. Previous laryngeal and other held candidates stay withheld.

Reproduce from the source directory:

```sh
node scripts/audit-cricothyroid-source.mjs --download --check
node scripts/export-cricothyroid-prototype.mjs --check
node scripts/validate-cricothyroid-prototype.mjs
```

The full overlap audit additionally needs the existing hash-pinned root OBJ cache. The exporter check uses the four retained original files, not the cache. Neither check overwrites a reviewed artifact. A first export into an absent prototype directory deliberately refuses to overwrite an existing directory. Future catalogue changes require an explicit historical-evidence/integration update rather than silently repinning this snapshot.

## Anatomical references and remaining review

The [TTUHSC El Paso laryngeal teaching table](https://anatomy.ttuhscep.edu/nervous_system/deepneck_tables.html) describes the muscle between the cricoid arch and inferior thyroid cartilage, its contribution to vocal-fold lengthening, and motor supply through the external superior laryngeal branch. It supplies context, not validation of these four surfaces.

[Mu and Sanders, J Voice 2009; PMID 18191374](https://pubmed.ncbi.nlm.nih.gov/18191374/) reports rectus, oblique and horizontal bellies in a human anatomical study. The abstract was read; full-text methods and figures were not reviewed. Accordingly, the source's straight/oblique labels must not become a claim that only two bellies exist or that all cricothyroid tissue is represented. No horizontal part, intramuscular nerve branches, thyroid gland, airway or functional motion is fabricated.

Before admission/clinical use, separately review source labels and laterality; muscle-part boundaries and completeness; attachment footprints and cartilage penetration; local intersections and normals; missing structures/variations; and how omitted artifact faces are disclosed. Teaching, pathology, imaging visibility and quizzes need exact-ID review. Clinical approval cannot be supplied by a mesh topology test.

## Next integration step

Use the existing compact dissection workbench with thyroid/cricoid landmarks and four selectable parts. The cartilage may be a **navigation landmark**, not a tissue parent. Reuse selection, fade/isolate, hide/undo, cutaway and chosen separation style, preserving source-position guides and correct screen-side labels. Keep landmarks optional and absent during separation. Do not add another permanent toolbar or invent a phonation simulation. Add current-source admission tests, referenced introductory teaching and mobile/keyboard checks before publishing the new study.

## Commercial use and notices

BodyParts3D, © The Database Center for Life Science, licensed under CC Attribution 4.0 International. The [official licence page](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) was checked on 10 September 2026. Retain DBCLS attribution, the licence and this indication of modifications with both raw originals and derivative. This is an attributed derivative, not a wholly proprietary anatomy dataset; no fee or new dependency/font/texture/service is introduced by this addition. Existing hosting and service terms remain separate.

The university table and research abstract are references only. No third-party diagram, image, scan, lecture, table or article is imported or relicensed; no endorsement is implied. Their accessibility is not permission to reuse their assets. See `LICENSES/THIRD_PARTY_NOTICES.md` and `LICENSES/ASSET_REGISTER.md`.

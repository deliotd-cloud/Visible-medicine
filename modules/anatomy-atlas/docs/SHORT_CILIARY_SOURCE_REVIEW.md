# Short ciliary nerve: original-source review

17 September 2026. Research checkpoint against Atlas `44444d490c6862c1362a650d560a85b2ea90b8db`.
**Not admitted, not deployed, not clinically approved.** This review supports the
next anatomy addition; it does not replace source/review bindings or authorize a
complete ocular autonomic pathway.

## Source identity and licence

BodyParts3D v4 IS-A `FMA7041` (short ciliary nerve), representation `BP6623`,
contains the ordered pair `FJ1319`, `FJ1370`. Five other definitions share this
pair; importing those aliases as additional anatomy would duplicate geometry.
There is no separately sided short-ciliary definition in the inspected source.

The [current archive README](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html)
expressly lists `isa_BP3D_4.0_obj_99.zip` and CC BY 4.0, with a February 2025
licence update. The [archive licence page](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)
agrees. The older [project information page](https://lifesciencedb.jp/bp3d/info/index.html)
still displays legacy share-alike terms; it must not silently override the
current, archive-specific terms or justify relicensing unrelated historical
downloads. Retain attribution, licence link and adaptation notice on derivatives.

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution
4.0 International. [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
The research viewer uses the already installed Three.js and includes its MIT
notice. It uses system fonts, no texture or publisher illustration, and no paid
service. Clinical papers are references only, not copied media.

## Verified original geometry

| Original file | Source SHA256 | Triangles | Topological components |
| --- | --- | ---: | ---: |
| FJ1319 | `7f45ad84f0874a8aeb62085affb9e9303057bea8b46068cc0b3e7e341a1258e7` | 602 | 2 |
| FJ1370 | `8e8853c389c874fa12b5db73c008755eb5a98a3fe9ce7457757c809ef0c9ded9` | 638 | 2 |

Fresh ZIP-member downloads match the previously size/CRC-checked cached bytes
and these hashes. The upstream directory matches the retained inventory pin.
FJ1319 lies wholly on positive source X; FJ1370 lies on negative X. That supports
presentation-side metadata under the documented source axes, **not a new sided
FMA identity**. Two connected components do not mean two anatomical nerves:
each side visibly has several elongated projections.

No duplicate, collapsed or degenerate triangles, nonmanifold/boundary edges,
nonmanifold vertices or inconsistent winding were found by the initial
combinatorial audit. This is not a self-intersection or anatomical-validity proof.

The subsequent ownership screen hash-checked 1,814 original files used by 1,102
root selections, 104 reachable nested selections and nine shoulder parts.
Neither candidate is directly owned or an exact geometry-fingerprint duplicate.
The 41 bounding-box-near or extent-comparable pairs contain no exact shared
triangles or positive translated-shape diagnostic. Fingerprints are order
dependent; sparse unsigned distances and bounded candidate screens are not
exhaustive geometric equivalence, continuous contact or penetration proofs.
Independent v3/HRA/UM specimens were deliberately not mixed into v4 coordinates.

## Visual and interaction evidence

The local standalone review uses 12 hash-verified source files: both candidate
files plus each side's ciliary ganglion, communicating branch, long ciliary
nerve, sclera and lateral rectus. Original vertices/faces are retained with a
common rigid axis rotation and recomputed shading normals. There is no per-part
movement, mirroring, surface repair, smoothing or generated connector.

Main inspected oblique, posterior and superior source views. The candidate
projections extend from the ganglion vicinity toward the posterior globe context;
this visual relationship does not establish fibre continuity or penetration.
The close view intentionally frames nerves rather than the whole globe.
Left-panel mouse orbit changes only that camera; three preset buttons work;
the context checkbox hides/restores both globe/muscle pairs and presets retain
its state. No browser page errors occurred. These checks concern the research
viewer, **not the production atlas or mobile clinical acceptance**.

Authoritative coordination evidence, relative to the main workspace:

- `work/short-ciliary-initial-20260917.json`, SHA256
  `c46e45ec3a2ca1d3df3227f91c9729feb7f8694fbf878a50307800b1bfce6e62`.
- `work/short-ciliary-owners-20260917.json`, SHA256
  `953c4a9f58d3b5f68961b8aefba1452ff20b215b0c8a927eb65886d045f357d6`.
- `work/short-ciliary-visual-20260917-v2.json`, SHA256
  `518fa63c5f931b1c5c4a1d9dfd08ce23176a8bd31014f1120b8d6a74dca905a3`.
- `work/short-ciliary-review-20260917-v2.html`, SHA256
  `611a3ba6ea04827e50cc34b24f6333b2ab9e2590acdc4037e42d78354ebb5dbc`.
- Reproduction scripts `work/audit-short-ciliary-initial-20260917.mjs`,
  `work/audit-short-ciliary-owners-20260917.mjs`,
  `work/render-short-ciliary-20260917.mjs`; run from the Atlas checkout.
  Audit/JSON outputs refuse replacement; rendering regenerates its own v2 HTML
  and screenshots. Earlier v1 artefacts are superseded, not anatomical evidence.

## Admission design and next implementation

Do not add the bilateral aggregate as an ordinary `unspecified` selection: the
current unilateral filters intentionally include unspecified structures, which
would show the contralateral candidate. Hiding it in every unilateral view would
avoid that leak but would not satisfy the intended individual-region dissection.

Implement source-file presentation parts under **one canonical FMA7041 identity**:

1. Preserve both original files, their order and hashes in the canonical record.
   Export separate render nodes bound to those files, not fabricated clinical IDs.
   Each original file remains intact, including its two topological components.
2. Add explicit presentation-side metadata supported by this source audit, kept
   separate from the unsided semantic FMA mapping. Do not globally reinterpret
   other unspecified records or infer side from scene position after explosion.
3. In unilateral mode render/pick/frame/label only the relevant source part; in
   Both render both under the shared identity. Visible bounds and label anchors
   must follow displayed parts, including exploded positions. Selection/search,
   study routes, isolate and review hashes must preserve that distinction.
4. Verify exact original geometry and holds, ordered identity, per-side geometry
   visibility and picking, framing/labels, side switches, deep links, saved views
   and review invalidation. Inspect desktop/mobile Explore and Dissect in-app.
5. Only then add source-limited Anatomy/Function and clinical/modality drafts
   with primary references. Do not infer normal nerve count, complete innervation,
   an accepted dissection plane, procedural guidance or individual MRI visibility.
6. Owner radiologist review must bind to actual geometry/content revisions and
   scope. Existing staging, hosted delivery, privacy and clinical/device gates
   remain. CT-head masks, private scans and clinical PACS remain untouched.

The complete Atlas goal stays active. This source review clears research work;
it is not a request to substitute a smaller anatomy goal or stop at this report.

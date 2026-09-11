# Genicular arteries and current source review

Ten original BodyParts3D v4 IS-A source groups add right/left middle, superior medial, superior lateral, inferior medial and inferior lateral genicular arteries. They are source meshes, not generated tubes or competitor geometry. Current display: 1,056 selections; archival 1,022-record catalogue unchanged.

In **Knee & leg**, **Hip & thigh** or **Whole body**, search **genicular**, choose a side and select a branch. **Arterial connections** offers the same-side popliteal source and reversible artery/bone isolation. Selecting popliteal exposes available branches. Rotation, source-anchored labels, fading, cuts, focus, hide/Undo/Redo and separation reuse existing controls; no permanent toolbar or extra scrolling surface.

| Source group | Right / left source | Triangles, right / left |
| --- | --- | ---: |
| Middle | FMA22562/FJ2167; FMA22563/FJ2084 | 2,348 / 2,360 |
| Superior medial | FMA22586/FJ2166; FMA22587/FJ2083 | 1,764 / 1,766 |
| Superior lateral | FMA22588/FJ2162; FMA22589/FJ2080 | 2,192 / 2,234 |
| Inferior medial | FMA43890/FJ2152; FMA43891/FJ2077 | 2,280 / 2,290 |
| Inferior lateral | FMA43892/FJ2150; FMA43893/FJ2076 | 2,226 / 2,226 |

All 21,686 ordered source faces and winding are retained. Each middle group has **two disconnected pieces**, preserved together under its original label. Other groups each have one component. No smoothing, fitting, cropping, bridging or generated counterpart. Source symmetry is not independent population evidence. At 0% separation the original positions are retained; clipped exterior surfaces are not angiograms or reconstructed tissue interiors.

## Evidence and limits

Original bytes reside in `content/sources/genicular-arteries`, protected from line-ending conversion. `scripts/genicular-artery-sources.mjs` pins names, complete membership, sides, hashes and component counts. Original archive directory, CRC and size were verified on retrieval. `docs/genicular-artery-source-audit.json` screens 1,046 earlier display envelopes and 222 bounded spatial/shape comparisons; no shared source triangles or translated duplicate detected. Twelve closed-oriented combinatorial components are not proof against self-intersection or clinical error.

Export applies only the established source-to-scene transform, exact-coordinate indexing for normals and Float32 storage. GLB: 403,484 bytes, SHA256 `a62ea69e56014790059ecd85cf9281bebb93280220b5a5677954c85b01ef5e9a`. Independent tests compare every decoded face corner to the original OBJ. Historical 29 lower-limb artery pins remain unchanged; ten are appended separately. The extended lower-limb map has 39 selections, 20 concepts and 40 typical relationships; all arterial maps together have 118 selections and 128 relationships.

Anatomy/Function/self-check are source-bound drafts informed by [TTUHSC El Paso](https://anatomy.ttuhscep.edu/anatomytables/arteries_lowerlimb.html). Clinical/Pathology/CT/MRI/X-ray/Ultrasound remain pending. No table, passage, diagram, scan or paid teaching material is redistributed. A branch edge is not a validated donor junction, joined lumen, flow, perfusion territory or procedural target. Complete anastomoses and cruciate microvasculature are not reconstructed. Radiologist review must assess identities, course, incomplete groups and teaching before sign-off; browser/GPU/mobile and clinical acceptance are separate.

## Current source-review gate

`scripts/current-source-holds.mjs` supplements the unchanged archival policy with four separately documented held concepts (seven files): superior collicular brachia and both fibular-vein groups. Report hashes, held-row identity, reason and complete membership are verified. Holds are tree-scoped and also block shared-file aliases and subsets. A matching filename in another archive is not geometry equivalence or admission permission. Export proposals must include the complete source definition.

The coverage ledger consolidates five previously separately recorded calf-vein files. Its 518 root-only differences comprise 24 nested-covered, 50 direct holds, one exclusion, one related cross-tree hold and 442 further review candidates. These are source pieces, not complete missing structures. Genicular/cubital/brachial/deep-leg exports use the new gate. Other legacy exporters retain historical workflows and must adopt the current gate before new admissions. Passing is never anatomical or clinical approval.

Checks: `node scripts/validate-current-source-holds.mjs`, `node scripts/audit-genicular-arteries.mjs --check`, `node scripts/export-genicular-arteries.mjs --check`, `node scripts/validate-genicular-arteries.mjs`, `npm run arterial-connections:test`, and reference-coverage validation. Tests cover immutable history, tree scope, input mutation, aliases, subsets, source/frame/bundle rejection, ordered faces, deep links, same-side arterial relationships and dissection restoration.

## Rights

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. Original/derived anatomy remain CC BY 4.0 with attribution and documented changes; [official terms](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html). New original code/brief teaching are MIT. No dependency, font, texture, paid runtime or mandatory fee added. Independent CC0 and legacy ShareAlike specimen terms remain separate.

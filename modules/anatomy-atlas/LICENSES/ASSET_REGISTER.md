# Asset register

## Ventricular dissection — 10 September 2026

`public/models/bodyparts3d/ventricles/ventricles.glb`: four source space representations, 46,794 triangles, 846,988 bytes, SHA-256 `e99326a0fd0b0bdc0a64d2a1adbb7a63c758af6f765199b8febe851e62b9eab1`. BodyParts3D v4 PART-OF sources FJ1767/FJ1814/FJ1730/FJ1731 already belong to the 59-file brain aggregate; its original asset is unchanged. The sidecar retains exact source hashes, parent binding, topology evidence and transform. Five faint context records reuse existing deep-brain assets. This makes 90 retained GLBs overall, including 87 archived originals and three derived display assets; it does not add four unique structures to the whole-body count. Existing CC BY 4.0 attribution, licence link and modification notice are displayed. Source surfaces remain unvalidated; see `../docs/VENTRICULAR_DISSECTION.md`. No new font, texture, publisher diagram, patient scan or paid dependency.

## Eye-layer extension — 9 September 2026

Current `public/models/bodyparts3d/eye-layers/eye-layers.glb`: 15 selectable components, 3,578,388 bytes, SHA-256 `4bf32947ee7b783000a9559cad1c1cf7ecb894e367c6b6bb7780cfcf98a6be78`. Uses all 17 existing parent OBJ files: eight left components and seven right. A traceable cleanup suppresses exactly 36 disconnected opposite-side triangles from four files; all retained positions remain unchanged. The corrected main aggregate `eye-layers/right-eyeball.glb` is 1,756,184 bytes, SHA-256 `f5759ee53e5d8bd893830e767783cbc49f50e18e84d1eb216229fe5acdae9ac7`, with 97,338 triangles. Original 87 main/shoulder GLBs remain archived; these two derived assets make 89 overall, never overlapping aggregate and child rendering. `catalog.json` and `display-correction.json` retain source hashes, coordinates, parent bindings, fragment evidence, credit and replacement bounds. BodyParts3D v4 CC BY 4.0 applies, including modification notices. No new font, texture, external diagram or paid dependency. See `../docs/EYE_SOURCE_CLEANUP.md`; specialist review pending. The earlier 11-component/88-GLB checkpoint is historical.

## Brand and coordinated-rendering update — 6 September 2026

Two exact approved Visible Medicine lockup PNGs have been reused at the user's request from their existing website project. These are proprietary brand assets, excluded from the application MIT licence; not CC0 or freely sublicensed. Exact hashes and provenance are in `docs/BRAND_ALIGNMENT.md`. No new font binaries, textures, anatomical meshes, scans or paid dependencies were added. The new shoulder orthographic plates are runtime adaptations of the existing attributed BodyParts3D meshes and retain their CC BY 4.0 source notice.

The official [BodyParts3D licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) and [CC BY 4.0 conditions](https://creativecommons.org/licenses/by/4.0/) were rechecked on 6 September 2026. Commercial adaptation is permitted subject to attribution, licence linking, modification notices and the other licence terms; this is not a medical-accuracy warranty.

| Asset class | Included? | Source | Licence / status |
|---|---|---|---|
| Anatomical meshes | 11 meshes / 9 selectable structures | Official LSDB BodyParts3D 4.0 archive; exact hashes and mapping in `public/models/bodyparts3d/manifest.json` | CC BY 4.0, commercial adaptation permitted with attribution; see `BODYPARTS3D.md`. Replaces all procedural anatomy shapes. |
| Textures | No | CSS/material colours only | Not applicable |
| CT/MRI/ultrasound images | No | Explicit no-study-loaded state | No simulated scan images |
| Fonts | No bundled fonts | Operating-system UI font stack | No font files redistributed |
| Icons | Yes | Lucide React package | ISC |
| Shoulder joint vector plate | Yes | [NIAMS original; SVG by Angelito7](https://commons.wikimedia.org/wiki/File:Shoulder_joint.svg), downloaded 2026-09-05; SHA-256 `FFDF4E456CED4F28DCEE3F59977CF6FD894A01786F2D6A794CCB1A5389B96799` | Public domain: U.S. federal-government original; SVG derivative dedicated to the public domain worldwide. Commercial use, modification and redistribution allowed without fee or attribution requirement. Provenance retained voluntarily in the UI. |
| Posterior shoulder plate | Yes | [Henry Vandyke Carter, Gray's Anatomy 20th ed.](https://commons.wikimedia.org/wiki/File:Arm_shoulder_gray.png), downloaded 2026-09-05; SHA-256 `98C71BC65F1035DDB0482218391F4332BBFA225F405CC307E7E696CB23115894` | Public domain mechanical scan of a public-domain 1918 illustration; marked free of known copyright restrictions. Commercial use, modification and redistribution allowed without fee or attribution requirement. |
| Anterior shoulder plate | Yes | [Henry Vandyke Carter, Gray's Anatomy, plate 410](https://commons.wikimedia.org/wiki/File:Arm_muscles_front_superficial.png), downloaded 2026-09-05; SHA-256 `E95556A33B564DFD2D1CB9930F15268C5524F9A18D9EA43581A254A0E35AE7F0` | Public domain mechanical scan of a public-domain 1918 illustration; marked free of known copyright restrictions. Commercial use, modification and redistribution allowed without fee or attribution requirement. |
| Anatomy dataset | Small source ID map + authored teaching copy | BodyParts3D source FMA references and original draft records | Source mapping CC BY 4.0; authored copy MIT; clinical review required |
| Patient data | No | None | Not applicable |
| Full-body / regional anatomy | 823 source representations in 61 GLBs | Official BodyParts3D 4.0 IS-A and PART-OF archives, downloaded 2026-09-05; all hashes and bindings in `full-body/catalog.json` | CC BY 4.0 commercial-compatible with attribution. See `BODYPARTS3D_FULL_BODY.md`; four candidate entries withheld after laterality checks. |

Any future asset must be added to this register with its source URL, author, exact version, licence, required attribution, commercial-use confirmation, modification rights, distribution rights, reviewer and approval date.

The 62-entry gap pass on 2026-09-06 uses only the same official v4/CC BY 4.0 archives. No legacy v3 mesh, reference diagram, new texture or font was bundled; the research/hold ledger is `docs/GAP_FILLING.md`. Source ingestion checks are complete, but anatomical approval remains pending.

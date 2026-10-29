# BodyParts3D v3 foot source review specimen

BodyParts3D, Copyright© The Database Center for Life Science licensed by CC Attribution-Share Alike 2.1 Japan.

Source: https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/README_e.html
Original archives: https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/BodyParts3D_3.0_obj_99.zip and https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/BodyParts3D_3.0_obj_95.zip
Licence: https://creativecommons.org/licenses/by-sa/2.1/jp/

The twelve original OBJ meshes, source tables and adapted model.json remain CC BY-SA 2.1 Japan. Attribution and share-alike conditions apply to distribution, including commercial distribution. Do not restrict recipients' licensed asset rights through subscription terms or DRM. This is not a claim that the meshes are MIT or CC0. The source README, licence deed and legal code are retained with exact hashes.

Changes: selected the original right and left dorsal interosseous **groups** and ten metatarsals, separately from each official 99%- and 95%-reduced mesh archive. Retained original triangle order and all coordinates, including small fragments. The browser uses Float32 display positions and recomputed normals. No subdivision, smoothing, repair, mirroring, sculpting, numbered-muscle segmentation, or spatial registration. Camera changes do not transform source geometry. The 95% reduction specimen has more source triangles; this does not establish greater clinical accuracy. The two releases are kept separate, never blended within a specimen.

Ten existing version-4 metatarsal originals are retained only for the coordinate comparison, hash-matched to the canonical Atlas catalogue. Those version-4 sources remain under their existing CC BY 4.0 terms (https://creativecommons.org/licenses/by/4.0/), with BodyParts3D / The Database Center for Life Science attribution. They are not included in the displayed v3 specimen. This diagnostic comparison is not a registration or a newly approved combined model.

Raw index topology is reported separately from exact-coordinate diagnostic welding. Welding is used only to measure topology; the displayed mesh is not welded or repaired. A topologically closed surface does not prove anatomical correctness or absence of self-intersections. Tiny components are not automatically discarded or interpreted as individual muscles.

Three.js 0.185.1 is used from the existing local project under its MIT licence. Its local package and renderer files are hash-pinned in REVIEW_PACKET.json. System fonts only; no textures, web fonts, external runtime requests or new dependencies. Review code and conversion recipes are original Visible Medicine work, separate from the share-alike assets.

Not clinically approved or admitted into the whole-body Atlas. Version 3 positions are not interchangeable with version 4 or patient coordinates. The preview is a local, independent source-comparison aid. The authoritative source and accepted scan masks remain unchanged.

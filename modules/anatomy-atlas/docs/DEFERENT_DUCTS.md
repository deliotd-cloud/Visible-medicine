# Male pelvis: deferent ducts

In **Pelvis** or **Whole body**, open **Study → Male pelvis: deferent ducts**. Ten available structures provide a focused reference: two newly added deferent ducts with eight existing organ selections (bladder, prostate, paired seminal vesicles, testes and ureters). A left/right filter reduces this to six selections. Select, fade/isolate, remove/Undo, extract and compare separation layouts using existing controls. Return separation to zero to assess original source positions. Search accepts **vas deferens**, **ductus deferens** and **vasa deferentia** while keeping the original anatomical labels.

This is an unvalidated anatomical surface study, not a surgical dissection plane, continuous reproductive tract, acquired scan or simulation of sperm transport. Whole ureter sources remain whole; no camera crop or geometric trimming was introduced. Clinical/device acceptance remains outstanding.

## Original sources and rights

Both sources are unchanged originals from the official [BodyParts3D v4 IS-A archive](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip), retained under `content/sources/deferent-ducts`.

| Selection | Source | Triangles | Original OBJ SHA-256 |
| --- | --- | ---: | --- |
| Left deferent duct | FMA19236 / FJ3135 | 1,110 | `75091a49ea2b9d0074eab9564d9d484094c82006a2e10bcb7d4f5f1c4e2b5648` |
| Right deferent duct | FMA19235 / FJ3140 | 944 | `f5fa6eca33541ceffdd87a910e4fb2e804f3bcd4418ee06555dcbb0b60aa581d` |

BodyParts3D, © The Database Center for Life Science, licensed under [CC Attribution 4.0 International](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html). Commercial use requires retaining credit/licence and modification notices. The GLB applies the established atlas coordinate transform, exact-coordinate indexing for normals and Float32 storage, retaining every ordered source face. No mirroring, fitting, smoothing, face removal or generated connection. GLB: 39,612 bytes, SHA-256 `53d2cdcb86c04d78671705b34f5b82c0130427735c8c7986553b3a042d8c7544`.

The [NCI/SEER Duct System](https://training.seer.cancer.gov/anatomy/reproductive/male/duct.html) was read for terminology, typical course, function and the seminal-vesicle duct relationship. Brief original Anatomy/Function/self-check text is draft. No source diagram, passage, scan, texture or font is copied. Original project code/teaching use MIT. No package, mandatory paid service or lockfile change is introduced.

## Admission, interaction and reproducibility

The [source audit](deferent-duct-source-audit.json) checks official membership, file bytes, whole-definition coverage and the current source-hold policy. Each source has one closed oriented manifold component and no duplicate faces. Comparisons with 1,058 pre-existing display envelopes and 102 bounded surface/shape comparisons find no exact shared triangles or translated duplicate. Surface proximity is recorded, not interpreted as proof of intersection, clinical correctness or a joined lumen. Historical audit scopes explicitly exclude this later bundle so earlier reports remain reproducible.

The atomic source addition binds both new records plus eight exact existing context records, their bundles, licence, release and coordinate frame. The same study-source check protects UI transitions and incoming study links. Changed source/frame/context is rejected rather than silently reused. The exact historical recipe transition is hash-pinned for offline comparison only; prior clinical/display approvals are never migrated.

The shared search vocabulary changes the conservative display fingerprint for all nine shoulder review identities although shoulder mesh/teaching bytes are unchanged. Current review metadata and the shoulder content export carry the new revisions. An exact whole-document inverse validates the preceding display snapshot offline only; prior sign-offs require re-review. The body-renderer dependency fingerprint also includes the new source/study modules.

Run from the source checkout:

```sh
node scripts/audit-deferent-ducts.mjs --check
node scripts/export-deferent-ducts.mjs --check
node scripts/validate-deferent-ducts.mjs
node scripts/record-deferent-duct-study.mjs --check
node scripts/validate-deferent-duct-study.mjs
node scripts/validate-current-source-holds.mjs
node scripts/validate-anatomy-search.mjs
```

The focused validators check source hashes, all 2,054 face-corner round trips, sides/anchors, 95 invalid admissions, eight ordinary structure links, 44 study links across six region/side scopes, 20 invalid-source links, actual parent event handlers/exam locks, 12 server-rendered menus and hide/Undo. These are source and controlled component checks, not browser/GPU or medical certification. Coverage, review queues and source-based search now include 1,060 root selections; the source-file review queue still contains 438 pieces.

## Required radiologist and device review

- Identity, laterality, full course/extent and spatial relationships with bladder, prostate, seminal vesicles, testes and ureters; assess misleading source overlaps and missing segments.
- Epididymides, ejaculatory ducts, spermatic-cord coverings and nerves are **not added**. Do not infer a complete duct junction, continuous lumen, patency, fertility, operative plane or a missing nerve network.
- Review the short Anatomy/Function/self-check drafts independently. CT, MRI, X-ray, Ultrasound, Clinical and Pathology remain pending; no patient registration or scan-specific finding is supplied.
- Actual desktop/tablet/phone framing, labels, picking, side filtering, hide/Undo, extraction and every separation layout. Source and controlled-handler tests cannot replace these checks.
- Approval must identify the exact source, teaching and renderer revision. Atlas, imaging resources and paid lectures remain separate entitlements.

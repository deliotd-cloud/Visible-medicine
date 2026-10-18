# Shared Atlas reset and keyboard orientation integration — 24 September 2026

The contained regional/whole-body viewer in `public/atlas-runtime/head-neck` was generated from committed Atlas source `77e20b8139ec2894abcb3d17552afb1b4c2b0a2a` (manifest SHA-256 `119c13ef1ee689eb459ba4c8a9287e41e93f1edf2a4449f37e354c4e619d30ec`). The directory name remains historical; the same runtime serves the existing whole-body and regional routes. The other three contained viewers are unchanged.

The reset icon now describes its actual scope for assistive users: camera, layout, cutaway, focus, isolation and separation reset, while chosen systems and removed anatomy remain. Keyboard arrow rotation updates a polite view-direction/orbit status; pointer rotation remains silent and a clamped key does not announce a change. The scene geometry, camera math, control behavior and clinical content are unchanged.

The generated manifest has 198 files, including 134 GLB entries. Its GLB path/size/hash list and regional scopes match the prior viewer manifest exactly. No paid asset, source scan, identifier, clinical PACS connection, permission or new model was introduced. This is code/source-contract evidence, not a screen-reader test or clinical review.

At this source-integration checkpoint, private Sites version 107 still serves website source `9cbc3fd9c7ba8946e1a3078d7e84547481b2d1e4` with Atlas `853ffd63d76c635da8975d0d351295f75ba0d1e2`. A new website commit, protected package, private deployment and browser/assistive-technology verification must be recorded separately. All six first-release gates and revision-bound radiologist sign-off remain pending.

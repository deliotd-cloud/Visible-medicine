# Inferior epigastric vessels

12 September 2026. Four original BodyParts3D v4 selections add the left and right inferior epigastric arteries and veins. Open **Abdomen → Study → Abdominal wall: epigastric vessels**, also available in Whole body. The focused view contains ten vascular selections: four new vessels, four external iliac vessels and two existing superior epigastric arteries. A single-side view contains five. No permanent toolbar or new layout is introduced.

Select, fade, frame, remove/Undo, rotate, label and separate these sources using existing controls. At zero separation they retain the original body frame. The vessels are also available in the pelvis region, but the complete focused study belongs to Abdomen/Whole body because its superior epigastric context is outside the pelvic scope.

## Source and geometry

| Source identity | Original file | Triangles |
| --- | --- | ---: |
| Left inferior epigastric artery / FMA20689 | FJ3511 | 6,824 |
| Left inferior epigastric vein / FMA21164 | FJ3512 | 7,466 |
| Right inferior epigastric artery / FMA20688 | FJ3604 | 6,888 |
| Right inferior epigastric vein / FMA21163 | FJ3605 | 7,790 |

All 28,968 original triangles are retained. Each exact IS-A definition contains one file. The official archive directory hash, file sizes and CRCs were checked on retrieval; SHA-256 hashes and unchanged originals are retained. All four source surfaces have one connected component and pass the oriented-manifold diagnostic, without duplicate or collapsed faces. Full membership, laterality and current source-hold checks pass.

The audit screens all 1,060 preceding displayed bounds, then performs 192 spatial/shape comparisons and six candidate-pair comparisons. It finds no exact reused triangle, represented geometry fingerprint or suspicious translated shape under these checks. Bounded sampling and manifold topology do **not** prove absent self-intersection, correct vessel course or clinical accuracy. Source limits are not repaired away.

Export only welds exactly equal coordinates for indexing/normals and stores the established display transform in Float32 GLB positions. The 526,756-byte GLB retains ordered faces and actual source-vertex label anchors. No mirroring, surface fitting, decimation, invented branch, vessel bridge or deleted face is used. Arteries and veins use existing category colours. The raw 1,022-entry catalogue remains immutable; the displayed atlas now has 1,064 selections.

## Teaching and anatomical limits

Anatomy, Function, Clinical and Quiz contain 16 introductory draft placements across the four exact source records. Shared artery/vein and inguinal-orientation text is not counted as sixteen independent lessons. All other original teaching is retained. CT, MRI, X-ray, ultrasound and detailed pathology remain explicitly pending.

The inferior epigastric arterial origin, superior-system communication and distinction from superficial epigastric supply were checked against [TTUHSC abdominal arteries](https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html). Deep venous return was checked against [TTUHSC abdominal-wall drainage teaching](https://anatomy.ttuhscep.edu/schemes/abdo_wall_ing_questions/abdo_wall_12_feedback.html). The [inguinal-region table](https://anatomy.ttuhscep.edu/schemes/inguinal_tables.html) supports the direct/indirect hernia orientation notes. Only short original factual synthesis is included; no question-bank wording, tables, diagrams, illustrations or patient scans are copied.

This is a vascular-reference study, not a complete rectus-sheath or inguinal dissection. Fascial sheets, rings, hernia sacs, nerves, full perforator networks and all venous companions are not supplied by the addition. The version-3 abdominal-wall specimen is **not** overlaid into this version-4 body. Surface proximity cannot establish a connected lumen, functional anastomosis, flow, safe puncture route, flap plan or patient finding. Radiologist sign-off must separately assess source extent, laterality, relationships, variants and teaching. Real imaging, reviewed crosswalks/registration and independently entitled lectures remain separate requirements.

## Validation and reproducibility

- `node scripts/audit-inferior-epigastric.mjs --check` replays the pinned source/hold/spatial audit using the verified local original cache. It excludes only this addition; later additions require an explicit historical audit decision, not silent report replacement.
- `node scripts/export-inferior-epigastric.mjs --check` verifies deterministic export and retained originals.
- `node scripts/record-inferior-epigastric-study.mjs --check` proves only the recorded two focus placements/references changed; earlier recipes remain exact. Offline history reconstruction never migrates clinical approvals.
- `node scripts/validate-inferior-epigastric.mjs` checks every one of 86,904 source face corners, exact source-bound admission, detached outputs, six study/side scopes, 64 source/Study links, 82 rejected source/frame mutations, original-vertex anchors, hide/Undo, six actual parent-handler cases and four real Study-menu renders. Existing deferent and arm vascular study regressions also pass.

These are source/CPU/React checks, not browser/GPU/mobile, physical touch, label-occlusion, assistive-technology or clinical acceptance. The previous model-first snapshot failure is not addressed or claimed passing by this work.

## Rights

The original v4 OBJ headers still cite historical CC BY-SA 2.1 Japan terms and are retained verbatim. This acquisition uses the official v4 archive's current CC BY 4.0 database grant (licence page updated 27 February 2025), consistent with `LICENSES/BODYPARTS3D.md` and the retained `LICENSES/bodyparts3d-license-evidence.html`. The current grant and older embedded notice are both disclosed, not conflated with the separately licensed version-3 specimens. This is engineering provenance evidence, not a legal opinion; retain the original notices and do not infer rights for other sources.

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. The [official source licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) was rechecked on 12 September 2026. Retained originals and generated model/catalogue adaptations keep attribution and modification notices. New original code and authored notes use the existing application MIT licence. No dependency, font, texture, proprietary model, paid API or mandatory new service is added. See `LICENSES/THIRD_PARTY_NOTICES.md`; unrelated version-3 ShareAlike rights remain distinct.

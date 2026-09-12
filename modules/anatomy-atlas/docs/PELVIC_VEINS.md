# Pelvic venous tributaries — 12 September 2026

## Delivered slice

Pelvis / Whole body → Study → Pelvic venous tributaries reuses the existing compact Study menu, side filtering, selection, labels, hide/Undo and separation mechanisms. No permanent control bar is added.

Ten full official BodyParts3D v4 IS-A source definitions (65,026 triangles) are added: paired iliolumbar, inferior gluteal, superior gluteal and obturator veins, plus right internal pudendal and right lateral sacral veins. Seven existing references supply paired common/internal iliac veins, paired hip bones and the sacrum. The focused view has 17 selections on Both, eight on Left and ten on Right.

All source positions and ordered triangles are retained. This is not a complete pelvic venous network: superior gluteal definitions contain only 320/330 faces, not an entire gluteal drainage territory. Plexuses, fascial canals, nerves, valves, connected lumens, flow and safe procedural corridors are not inferred.

## Deliberate source holds

FMA18919/FJ3525 (left internal pudendal) and FMA18907/FJ3526 (left lateral sacral) cross the source zero-X plane. Coordinate sign is not an anatomical diagnosis: midline course/source origin/laterality need radiologist adjudication. No shifting, cropping, mirroring or relabelling is performed. Their complete bytes are preserved offline, not in public assets. The shared export gate rejects these definitions and held-file aliases/subsets.

The source audit includes 12 complete source definitions, 1,064 pre-addition root envelopes, 357 spatial/shape comparisons and 66 candidate-pair comparisons. It found no exact reused triangles or represented/translated-similar shape findings within those checks. All 12 had one oriented manifold component and no duplicate/collapsed faces; this does not exclude self-intersections or prove clinical correctness.

## Teaching and imaging boundary

Original brief Anatomy/orientation and self-check drafts cover all ten selections. Two iliolumbar and one internal pudendal Function/drainage notes are drafts; seven other Function sections remain pending. That is 23 draft placements, not 23 distinct comprehensive lessons. All new CT, MRI, X-ray, ultrasound, Pathology and Clinical sections remain pending. No paid API, new dependency, font, texture, patient scan or competitor mesh is included.

Factual reading references, not copied illustrations/tables/question-bank wording:

- [TTUHSC pelvic/perineal veins](https://anatomy.ttuhscep.edu/anatomytables/veins_pelvis_perineum.html).
- [TTUHSC pelvic wall](https://anatomy.ttuhscep.edu/reproductive_system/pelvicwall_tables.html).
- [Original cadaver/venogram study of the iliolumbar system](https://pubmed.ncbi.nlm.nih.gov/17373712/).

Stable Visible Medicine IDs bind each record to its FMA, exact original hash, bundle and established reference coordinate frame. Existing study links and future imaging reference hooks are reused. No patient FrameOfReferenceUID, acquired image registration or production lecture entitlement is asserted.

## Verification / sign-off

Run `npm run pelvic-veins:test`, `node scripts/audit-pelvic-veins.mjs --check`, and `node scripts/validate-current-source-holds.mjs`. The audit replays the admission-time hold policy excluding only its own newly registered holds; all earlier evidence remains pinned.

Offline tests check every 195,078 exported face corner against the transformed original, actual source-vertex anchors, stable IDs, exact metadata/context/frame/bundle admission, 134 changed-source rejections, six sided scopes, 110 links, actual parent study handlers and four server-rendered menus. The raw root catalogue and previous recipe history remain unchanged. These are not browser/GPU/device or clinical acceptance tests.

Owner review must cover: source names/laterality including the two held definitions, extents, venous variants and junctions, bone/vessel relationships, self-intersections, labels/picking and separation on real desktop/mobile devices, and all factual teaching. Do not infer complete bilateral coverage or move the separate female-pelvis/abdominal-wall/back specimen into this coordinate frame.

Current comparison ledger: 1,074 root selections; 1,734 of 2,234 compared source-file IDs represented in root; 500 root-only differences. Of those, 422 require source/anatomical review, 52 are known holds, 24 are covered in nested views, one is a related cross-tree hold and one is display-excluded. These are file-coverage counts, not an anatomical-completeness score.

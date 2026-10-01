# Tentorium — incomplete right-sided source

1 October teaching update: the CT/MRI topics now have source-bound original
drafts; see [tentorium imaging](TENTORIUM_IMAGING.md). The source/admission
evidence below is the unchanged 11 September milestone. Its pending-topic wording
describes that historical revision, not today's CT/MRI readiness. Ultrasound,
X-ray, Clinical and Pathology remain pending; no source hold or approval changes.

Added 11 September 2026. **Head & neck → Study → Tentorium: supplied right portion** removes the brain and overlying skull, retaining the supplied fold with occipital, right temporal and sphenoid context. The same focus is available in Whole body. Choose Both or Right; no tentorial geometry is shown on Left. Use existing rotation, labels, separation, removal and Undo. No additional toolbar.

## Important anatomical distinction

The tentorium is a dural fold, not a paired organ. The official source names the whole tentorium, but **every supplied vertex is right of midline**. The application therefore calls this selection **Tentorium cerebelli (right-sided source only)**. Its display laterality is right; metadata separately records the source's unspecified laterality and partial coverage. This is not a renamed complete right tentorium or a complete meningeal dissection. No contralateral copy has been mirrored or generated.

Anatomy/Function provide original short draft notes based on the [Texas Tech brain tables](https://anatomy.ttuhscep.edu/anatomytables/brain.html), checked 11 September 2026. The fold covers the cerebellum and partly separates intracranial regions; the midbrain traverses its notch. Neither the complete notch nor exact attachments are established by this partial surface. Other topics remain pending. No source table, publisher prose, diagram or clinical image is imported.

## Source, rights and geometry

- BodyParts3D 4.0 IS-A identity: FMA83966, FJ1843.obj.
- Original: 1,492,065 bytes; SHA256 `bd212fe0b2800bcb8c3ea350099f5bc563d438d8efd5409761fff47e8b150533`.
- Official source: `https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip`. Download checked ZIP size/CRC; original bytes retained in `content/sources/tentorium/FJ1843.obj`.
- [Official description](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html) and [licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) checked 11 September 2026. Original and GLB/catalogue adaptations: **CC BY 4.0**. Retain attribution, licence and modification notice. No fee-bearing service, new dependency, font or texture.

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International

All **21,924 source triangles** retain coordinates, order and winding. Only exact-coordinate welding for indexed normals and Float32 GLB storage are performed in the existing source frame. No fitting, mirroring, smoothing, bridging, face removal or invented left tissue. GLB: 396,152 bytes, SHA256 `b7b35094243dab53b9681c98d5123aa4b93a881fb0e48de4a8d7f32186007d4c`. Source-mm bounds: X −63.3281 to −2.33016, Y −93.2923 to −5.82047, Z 1507.53 to 1541.65.

The [audit](tentorium-source-audit.json) checks 1,024 displayed-root envelopes, 18 nearby root surfaces and ten detailed brain surfaces. No existing direct geometry owner, represented fingerprint match, exact shared root triangles or known inherited source hold was found. The mesh has one closed oriented combinatorial component, without the tested boundary/nonmanifold/duplicate/degenerate/winding defects. These engineering findings do **not** resolve clinical extent, self-intersections or tissue interfaces.

## Architecture and tests

`lib/body-source-additions.ts` provides atomic complete-record/frame/bundle admission; `lib/tentorium.ts` supplies the pinned addition and exact-source teaching. Four context records (brain and three bones) and their bundles must match. Partial, duplicate, modified or colliding additions fail closed. Inputs are not mutated. `bodyDisplayCatalog` now has **1,025** selections; the archival raw catalogue remains **1,022**, with unchanged bytes. Previous brachial additions remain intact.

The ID `vm:anatomy:body:head-neck:right:connective:tentorium-source-portion` deliberately denotes the supplied representation. Exact source hashes, partial-coverage metadata and the qualified name remain in review material. Future imaging/lecture correspondences must target this representation explicitly, not assume that its FMA term establishes a whole-fold segmentation. Existing hooks expose source reference coordinates, never a patient frame, acquired pixels or scan alignment. The provisional CT/MRI head project and its privacy/clinical gates remain untouched; no separately paid lecture access is granted.

`npm run tentorium:test` checks deterministic export, the actual GLB, source-side/vertex anchors, source-admission rejection, focus composition, Left exclusion, four source-bound links, reversible removal and draft/pending teaching. Export reproduction and `node scripts/audit-tentorium-source.mjs --check` require the pinned original/index cache at `../work/bodyparts3d`; the runtime validator requires only committed project files. Restore exact sources and verify retained hashes, rather than silently accepting newer LATEST contents.

## Clinical and visual acceptance remaining

A qualified anatomist/radiologist must assess partial identity, course, thickness, free/fixed edges, relation to cerebellum/temporal/occipital lobes and brainstem, actual attachments, self-intersection/contact and usability for teaching. The complete left fold, full notch, falx/other dural folds, sinus lumens and patient-specific anatomy are not supplied. Sampled distances do not identify a surgical plane. No herniation, pressure, motion, blood flow or procedure is simulated. Source-label practice is not certification. Browser, mobile, GPU, touch and specialist acceptance remain pending; this background pass did not use the browser.

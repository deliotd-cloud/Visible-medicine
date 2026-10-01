# Separate HRA female pelvic study

1 October: optional six-stage [source-guided dissection](HRA_PELVIC_GUIDED_DISSECTION.md)
connects existing support and urinary/vessel views. Models and original studies
are unchanged; the new sequence is draft and requires revision-bound review.

17 September urinary-context extension: **43 selectable surfaces / 11 studies**.
The original 41 pelvic surfaces and eight study memberships are preserved.
Two existing renal-study ureters are reused at their original coordinates with
their original IDs, source/frame checks, lessons and attribution. They are not
two newly acquired anatomical structures. See [implementation and acceptance
limits](PELVIC_URINARY_CONTEXT.md).

Source-review supplement:
[ureteric-orifice candidates and same-source urinary context](HRA_URINARY_JUNCTION_REVIEW.md).
The local diagnostic adds no orifice candidates to production; clinical/source
holds remain intact. The original pelvic teaching totals are in the
[41-selection context extension](FEMALE_PELVIC_CONTEXT_TEACHING.md); the initial
and support batches described below are preserved historical baselines.

## Access and scope

Open **Pelvis / Whole body → Female pelvis**, or `/specimens/female-pelvis`. The existing compact workbench provides selection, search, labels, tissue filters, view presets, hide/Undo/Redo, isolate and separation. Practice preserves the dissection and hides answer labels; it remains disabled until model readiness is confirmed. The main-atlas exam does not expose the supplemental launcher.

The source-derived regional close-up centres the native pelvic region without
cutting long structures. Turn it off under **Display options** for the full
visible model. Selected-structure Frame, fading and separation suspend the
close-up; shapes and source positions remain unchanged.

Eleven studies: the original reproductive overview; all 41 native pelvic surfaces; uterus/cervix; left adnexa; right adnexa; supporting surfaces; uterine vessel context; bladder/uterus/rectum; plus ureters with pelvic organs and separate left/right ureter context views. Context appears only when requested. The initial view still contains 18 reproductive surfaces.

All **43 selections have source-bound introductory Anatomy/Function drafts**: the existing 41 pelvic lessons plus two reused ureter lessons. The original pelvic set spans 28 concepts and 178 extended draft placements, as documented in the [context teaching extension](FEMALE_PELVIC_CONTEXT_TEACHING.md). Incomplete modality topics remain explicitly pending. Source-identification rounds use up to ten eligible visible selections. These are not validated exams.

## Initial structure-specific teaching (preserved baseline)

The 17 source selections map explicitly to **12 distinct anatomical concepts**: ovary; ampulla, tubal isthmus, infundibulum and fimbriae; uterine body, fundus and lower segment; cervix, internal os and external os; vagina. Bilateral surfaces share typical facts, not donor-specific pathology. Exact source/frame/recipe checks remain mandatory. Returned lessons are independent copies, so a consumer cannot mutate another selection’s teaching.

This initial batch contains **69 extended draft placements**: Clinical 17, Pathology 17, MRI 17, Ultrasound 16 and CT 2 (ovaries only). X-ray remains pending throughout, as do CT elsewhere and vaginal ultrasound. These placements reuse **24 distinct topic texts across six relevant families**, not 69 unique lessons. Each of these 17 selections has a self-check; there are 12 distinct questions. The subsequent support extension adds 14 of the previously unavailable 24 surfaces; see its linked current totals above.

Topics include organ-of-origin assessment, hydrosalpinx versus ovarian lesions, uterine zonal MRI anatomy, external fundal contour versus cavity, cervical canal orientation and vaginal lesion location. They do not implement an O-RADS calculator, diagnostic threshold, cervical-length measurement, fertility assessment, cancer staging, procedural plan or patient image. No new toolbar or navigation step is added; references have readable source titles.

References are factual reading sources, not redistributed material: Texas Tech pelvic tables; NCI/SEER reproductive/cervical anatomy; IDKD benign uterine imaging; ESUR 2024 adnexal imaging, 2026 cystic pelvic lesions and 2020 congenital anomaly guidance. The exact links are in `content/hra-pelvic-teaching.ts`. No article passage, table, figure or scan is imported. Older recommendations are used only for stable anatomy/orientation facts, not diagnostic cut-offs, preparation instructions or current management algorithms. AIUM’s 2024 parameter was discovered but not used as an evidence citation because the full technical text was not available through the reader.

Run `node scripts/validate-hra-pelvic-teaching.mjs`: tests all mappings/counts, references, copy isolation, wrong-source rejection, unchanged geometry and 136 real React topic renderings, including pending/absent states. This verifies application behaviour, not medical correctness. Radiologist review must still approve terminology, contextual interpretation, modality notes and self-checks at the exact content revision.

## Original source and licensing

See [asset notice](../public/models/hra-pelvis/NOTICE.md) and the retained official `content/sources/hra-pelvis/metadata.json` / `crosswalk.csv`. The original v1.10 HRA release explicitly licences its model CC BY 4.0. No assembled competitor model, borrowed male skeleton, fitted donor muscles or pregnancy model is imported. This implements the audited recommendation to use independently sourced regional modules rather than combine mismatched donors.

The 47-surface retained subset is 4,476,228 bytes; 41 runtime surfaces are 3,796,080 canonical bytes with all 205,463 original ordered triangles retained. Normals and other vertex attributes are unchanged. Source-quality checks compare every retained original to its recorded topology. Six entire source groups are withheld, not repaired: the round-ligament pair, abdominal ostium, cornua and two wall alternatives. [Source audit](hra-pelvic-source-audit.json) records topology, positions, source labels and wall overlap.

## Identity and coordinate contract

Native pelvic IDs use `vm:reference:hra-united-female-v1-10:pelvis:<source-slug>`; the reused ureters retain their `...:kidneys:<side>-ureter` IDs. Ontology IDs are secondary metadata, not identity. In particular, paired cardinal ligaments share a source ontology term, as do bladder dome/base. They remain distinct. A missing ontology term is never invented. Original node names, including the source spelling “fibria,” remain traceable.

The original GLB coordinate convention is inferred from concordant ovary/tube/vessel pairs and bladder/rectum/sacrum: x left, y superior, z anterior. All retained ancestors have identity transforms. Source metres convert to independent LPS millimetres as `(1000*x, -1000*z, 1000*y)`; display coordinates are `(10*x, 10*y, 10*z)`. No translation, rotation fit or patient registration is applied. Clinical orientation review remains required.

Catalogue, bundle, frame, surfaces and study recipes are bound together; changed or foreign definitions cannot receive these lessons/practice. Shared workbench tissue groups are optional and preserve existing limb/abdominal defaults. The 1,060 main-body selections and male-source coverage ledger are unchanged. Do not add independent surfaces to those counts.

There is no automatic clinical approval or private-review migration. A future approved imaging crosswalk must include source-local identity, side, version and a separately validated spatial transform. Atlas, imaging and lecture entitlements stay independent. No CT-head prototype is published by this change.

## Reproduction

From the checkout:

```sh
node scripts/export-hra-pelvis.mjs --check
node scripts/validate-hra-pelvis.mjs
node scripts/audit-hra-pelvis-original.mjs --source=PATH_TO_ORIGINAL_RELEASE --check
node scripts/validate-hra-pelvis.mjs --original=PATH_TO_ORIGINAL_RELEASE/3d-vh-f-united.glb
```

The first two commands are offline and need only retained repository assets. The last two verify the full official original and its audit; obtain the exact original from the notice, check its SHA-256, and keep it outside the runtime bundle. `export-hra-pelvis.mjs --retain-source --source=...` reproduces the subset only with the exact official GLB, metadata, crosswalk and audited candidate report. Normal export never reads another donor.

Technical validation covers every vertex/normal/index, topology, original-to-subset identity, installed GLTF decoder round-trip, all eight recipes, foreign/stale teaching rejection, practice state and real React workbench markup. It is not GPU, browser, mobile, clinical or anatomical acceptance.

Release check limitation: the legacy `validate-model-first.mjs` fails at its named-handler snapshot, which predates earlier motor/vascular/navigation additions. An AST comparison confirms all 24 named handlers are unchanged from the preceding source commit. Its baseline was not silently replaced. New launcher/exam/close callbacks and the shared specimen workbench are tested directly by `validate-hra-pelvis.mjs`; the full legacy layout suite is not claimed passing.

## Radiologist acceptance still required

- Source label/side/orientation and spatial relationships, particularly ovaries, tubal segments and uterine vessel remnants.
- Uterine/cervical boundaries, duplicated envelopes, open shells, bladder regions and suitability of source-local grouping.
- Review the six withheld groups separately; technical tests do not justify automatic admission.
- Selection, labels, clipping, separation, overlap/occlusion and Undo on actual desktop/mobile devices. Explode offsets are display operations, not operative planes.
- Complete structure-specific anatomy, imaging, pathology and clinical teaching with references, then approve the exact revision.
- Pelvic floor, nerves, complete reproductive/urinary lumens and complete female skeleton remain missing; the two reused ureter surfaces do not establish continuity, patency or validated insertion.

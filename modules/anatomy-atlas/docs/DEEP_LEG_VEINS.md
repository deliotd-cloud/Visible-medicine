# Deep leg venous extension — source review pending

11 September 2026. Six selectable source groups, eight retained OBJ files, 71,522 original triangles. No procedural anatomy, copied diagrams or paid service. This is an engineering admission of original reference surfaces, **not anatomical or clinical approval**.

| Source identity | Files (right / left) | Triangles (right / left) |
| --- | --- | --- |
| Anterior tibial vein FMA44336 / FMA44337 | FJ2132 + FJ2193 / FJ2097 + FJ2183 | 15,596 / 15,634 |
| Posterior tibial vein FMA44338 / FMA44339 | FJ2173 / FJ2118 | 13,782 / 13,826 |
| Deep femoral vein FMA51042 / FMA51043 | FJ2135 / FJ2099 | 6,346 / 6,338 |

## Navigation and architecture

Search the name in Whole body, Knee & leg, Hip & thigh, or the supplied tibial context in Ankle & foot. Selection, surface-anchored labels, layer/system toggles, isolation, fade, explode modes, hide/Undo, side filters and source-bound study links use existing controls. No additional toolbar or lecture entitlement is introduced. The selected vein's existing collapsed **Venous drainage** panel offers typical tributary/outlet relationships and a reversible neighbouring-vessel/bone view.

`bodyDisplayCatalog` appends the source addition atomically through `applyBodySourceAddition`. The original 1,022-record ingestion catalogue is unchanged; display now contains 1,031 selections. Every new record, context record, bundle and coordinate frame must match in full; changed source bindings fail closed. All eight OBJ originals are retained under `content/sources/deep-leg-veins`. `public/models/bodyparts3d/deep-leg-veins/catalog.json` pins their hashes, complete records, context and GLB hash.

Twelve original Anatomy/Function drafts attach to exact source records, not name-only matches. CT, MRI, X-ray and Ultrasound content remain pending for these additions. Existing reference-coordinate IDs and link hooks are available; no DICOM frame UID, registration transform, segmentation, image intensity, measured lumen or diagnosis is fabricated. Atlas and separately paid-lecture access remain independent.

The systemic map has 44 source selections, 24 groups and 46 typical relationships (92 reciprocal rows). The new outlets are qualified as **via unmodelled** collecting/junction regions. This explicitly distinguishes textbook drainage from donor continuity. Deep femoral return joins the common femoral region; it is not represented as entering a distal femoral segment.

## Evidence and limitations

`docs/deep-leg-vein-source-audit.json` records the official IS-A definitions, source/index/inventory hashes, topology, handedness, direct owners and cross-tree geometry fingerprints. It screens 1,025 prior record envelopes, performs 203 bounded source-surface comparisons plus six same-side candidate comparisons, and finds no exact shared triangles or confirmed translated duplicates in those comparisons. Each admitted source file passes the closed/oriented combinatorial manifold check; anterior tibial groups deliberately retain two components. Bounded distance sampling is not exhaustive collision or self-intersection certification.

The export retains every source face in order and its winding. Only exact-coordinate welding for indexed normals, the existing coordinate transform and Float32 GLB storage are applied. Re-import verifies exact stored positions, indices and metadata. The GLB is 1,295,728 bytes before delivery compression; no texture or external fetch is needed.

**Held:** right fibular vein FMA44885 includes FJ2190 fragments with positive source X and proximal Z 539–718 mm, despite the right-side label. Do not crop these fragments out to admit a convenient subset. Left FMA44886 also contains accessory disconnected fragments; both fibular aggregates remain withheld pending source-identity and anatomical review. Their hashes/topology/bounds are recorded in the audit, not included as learner anatomy. This does not assert that the left source is necessarily anatomically wrong.

Other known omissions include complete venae comitantes, fibular and muscular collecting systems, exact confluences, perforators, valves and lumen. Source proximity is not proof of communication; a displayed gap is not pathology. The generic adult-male source is not patient-registered anatomy.

## Commercial provenance

Source archive: [BodyParts3D 4.0 IS-A](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip). Retrieval checked ZIP CRC and unpacked size; exact SHA-256 values are retained. [Official licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html): CC BY 4.0, commercial reuse permitted with conditions, including attribution and change notices.

**BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.** Preserve `LICENSES/CC-BY-4.0.txt` and `LICENSES/THIRD_PARTY_NOTICES.md`. New original code/teaching use the project's MIT grant. This addition introduces no dependency, font, texture, paid API or mandatory subscription; deployment costs remain subject to the chosen host's terms.

[Ultrasonography of the lower extremity veins: anatomy and basic approach](https://pmc.ncbi.nlm.nih.gov/articles/PMC5381851/) is a factual reading reference for original short notes, not an imported asset, article, diagram or clinical protocol. A citation does not grant reuse of a publisher's content.

## Reproducible checks and required review

Run `node scripts/audit-deep-leg-veins.mjs --check` with the retained source cache and inventory; `npm run deep-leg-veins:test`; `npm run systemic-venous:test`; the existing body-review/decision and historical teaching tests; `npx tsc --noEmit`; and `npm run build`.

The addition's tests exercise six meshes, source integrity, surface anchors, handedness, 32 source-bound links, hide/Undo, 146 mutation rejections and absence of held fibular identities. The systemic suite covers 282 plans, 128 links, 384 rejection cases, 44 actual panel renders and 88 parent-handler cases, including exam-mode suppression. No browser/device or independent visual QA was performed in this background pass.

Before clinical release, an anatomist and vascular imaging reviewer must check each source's course, full extent and terminology against surrounding bones, muscles, arteries and veins; review the two-part anterior tibial construction and deep femoral relationships; resolve fibular holds; review all draft notes and drainage qualifications; and test label/explode readability on desktop/mobile. Any future CT/MRI/US link requires separately licensed/de-identified images, validated correspondence and modality-specific review. Never infer clinical readiness from these engineering tests.

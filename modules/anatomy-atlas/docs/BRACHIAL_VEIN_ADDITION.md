# Medial brachial veins

Added 11 September 2026: two independently selectable BodyParts3D 4.0 surfaces in **Whole body**, **Shoulder & arm** and **Forearm**. Search for “medial brachial vein”, select the side, remove surrounding structures, or use the existing collapsed **Venous drainage** panel. Rotation, labels, separation styles, side filters, source-bound study links and reversible removal reuse the existing viewer. No additional toolbar.

## Source and commercial rights

| Identity | Side | Official IS-A file | Source SHA-256 |
| --- | --- | --- | --- |
| FMA22935 | Right | FJ2341.obj | 0468a157795c7346d964d1884627464d5cfe9c4c8bcc84661aefdb2bc2d18259 |
| FMA22936 | Left | FJ2313.obj | 3707bf67b5959e140fea0eca643bc31db00e97620e63afbe48ed10357af44ec8 |

Downloaded from the official `isa_BP3D_4.0_obj_99.zip`, with archive CRC/size and retained official identity-table checks. Originals are retained in `content/sources/brachial-veins/`. [Official dataset description](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html) and [licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) were checked on 11 September 2026. **CC BY 4.0** permits commercial reuse subject to its terms. Retain this credit, the licence and adaptation notice:

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International

The 100,360-byte GLB and catalogue are attributed source adaptations, not proprietary anatomical originals. Existing UI credit and licensing links apply. No new dependency, font, texture, paid service, patient data or third-party diagram was imported. UAMS is a factual reading reference; its table/prose is not copied into the product.

## Geometry and admission

The [offline audit](brachial-vein-source-audit.json) screens 1,022 root envelopes and 52 actual source comparisons. Neither candidate has an existing direct owner, known hold, matching geometry fingerprint, exact shared triangles or a translated-similarity hit in the screened set. Both have one closed, oriented combinatorial manifold, without the tested boundary/nonmanifold/duplicate/collapsed/degenerate/winding defects.

All **5,422 original triangles** retain coordinates, order and winding. Export performs only exact-coordinate welding for indexed normals and Float32 GLB storage in the unchanged source-to-scene transform. There is no fitting, mirroring, smoothing, bridging or face removal. Anchors are actual stored surface vertices. The GLB hash is `e603953fca42e17c45f3daa91d3c53bedc0ccf83b70b18b864f9dc72d6bbe265`.

`lib/brachial-veins.ts` adds both complete records and their bundle atomically through `bodyDisplayCatalog`. Eight exact adjacent source records, their bundles, source version, licence and frame must match. Missing, duplicated, changed or partly admitted sources fail closed. Repeated application is idempotent and does not mutate the archived catalogue. The raw catalogue remains **1,022**; the current display catalogue is **1,024**. Whole-body review material and current requirements counts use the display catalogue; historical ingestion checks remain scoped to the original archive.

The systemic drainage graph appends the new admissions separately from its immutable original pins. It now has 38 veins, 21 groups and 40 typical relationships. Both new veins have a same-side axillary confluence relationship; no geometric or physiological junction is inferred. Anatomy and Function contain source-bound original draft notes; acquired CT/MRI/X-ray/US images remain pending. Imaging hooks expose a reference anatomy identity and coordinates, never a patient frame or automatic slice registration. No lecture access is granted.

## Verification and remaining validation

Run `npm run brachial-veins:test` and `npm run systemic-venous:test`. The exporter check also needs the retained official source/index cache at `../work/bodyparts3d`. The runtime integration validator needs only committed project files. To reproduce an export without that cache, first restore the exact source archive/index version and verify its pinned hashes; never substitute a newer “LATEST” silently.

Automated coverage includes exact GLB records/triangle count/vertex anchors, 98 source-admission rejection cases, 12 new regional/side study links, reference-coordinate round trips, removal/Undo, draft/pending lesson gates, drainage directions, side isolation, component output and real parent handlers.

These checks are not clinical approval. A qualified anatomist/radiologist still needs to assess source identity, full course, calibre, relationship to artery/muscles/fascia/nerves and proximal/distal boundaries. Closed combinatorial topology does not exclude self-intersection or certify a lumen; sampled surface distances do not establish vascular joins. Only one **medial** vein per side is present, not every vena comitans, valve, perforator or deep forearm/calf vein. Validate readability and selection on actual desktop/mobile GPUs in a separately requested foreground acceptance pass. No browser/device testing or patient registration is claimed here.

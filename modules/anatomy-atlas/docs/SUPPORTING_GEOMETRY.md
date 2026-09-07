# Tendon and thumb-muscle source geometry

**Follow-up evidence:** the [connectivity and full-point audit](SUPPORTING_TOPOLOGY.md) now examines twelve candidate/context sources and all stored vertices/triangle centres in eight pairs. It identifies disconnected and doubled-triangle components that the original sampled proximity screen did not test. All holds and non-admissions remain; specialist/source adjudication is the next gate for these particular candidates.

This bounded audit adds **no anatomy**. It follows the index-only [supporting-source classification](SUPPORTING_CANDIDATES.md) and the separate four-artery [forearm admission](FOREARM_VASCULAR_DETAIL.md). The live catalogue remains 1,022 source representations, 86 body bundles, 138 stages and 120 focuses. All source coordinates and existing holds remain exact.

## Disposition

| Exact v4 source | Evidence | Next requirement |
| --- | --- | --- |
| FMA54159 / FJ1343: right levator-palpebrae-superioris tendon | Correct named side; 125/128 sampled tendon vertices lie within 0.25 mm of the existing right levator surface (median 0.021 mm). A separate tarsal-plate contact flag is also present. | Do not double-import. Adjudicate whether the existing muscle aggregate already includes this tendon, and establish a source-preserving parent/component split if appropriate. Proximity is not proof of anatomical identity. |
| FMA258850 / FJ1581: right intermediate tendon | Correct named side; no sampled proximity flag. Generic and right aliases share one source. | Establish the exact parent muscle and attachment identity from source-specific evidence. Location alone does not justify a digastric or other parent label. |
| FMA65198 / FJ1514 and FMA65199 / FJ1514M: superficial flexor-pollicis-brevis heads | Both source-labelled sides match their coordinates. Each has asymmetric contact flags with the same-side opponens and flexor retinaculum; no exact shared triangles. | Review the contact/extent and parent-head relationship before a separate bounded admission. These are not evidence that an entire missing muscle or deep head has been supplied. |
| FMA37389 / FJ1469 and FMA37388 / FJ1469M: previously held whole-muscle alternatives | Both remain on the opposite side from their source label. They were compared spatially with the corresponding nearby head regardless of that label; neither pair crosses the proximity-flag threshold. | Existing laterality holds remain. Do not mirror, silently relabel, use an aggregate alias to bypass a hold, or treat a non-flag as anatomical clearance. |

All six files contain finite source geometry and no degenerate triangles under the parser's checks. Four candidates are still unadmitted; two comparison controls remain held. This evidence-only milestone does not change the inventory's admission/hold policy.

## Reproducible evidence

`content/supporting-geometry-audit.json` records exact official ISA names/files, all index aliases with record hashes, ZIP size/CRC, raw and canonical geometry hashes, original-mm bounds/centre/extent, side counts, prior owners and holds. The preserved baseline pins both complete pre-audit catalogue and inventory hashes at source commit `bc48e1e2d627e4d1d88139b0e3023370720eb747`.

Every one of the preceding 1,022 catalogue bounds is inverse-transformed into original source millimetres. The 1.01 mm conservative margin admits 109 existing source structures for detailed checks. Of 6,147 considered pairs, 167 receive at most 128 deterministic vertex-to-triangle samples in each direction. Six pairs meet the explicit diagnostic flag (shared triangle or at least 25% of samples within 0.25 mm). Similar-extent, same/unspecified-side muscle/connective translation screening produces no qualifying pair. This is a limited screen, not a proof of nonintersection, source identity, dissection planes or clinical correctness.

Run `npm run supporting-geometry:test` without the Site Git history or raw cache to check the pinned complete historical evidence, aliases, policy, all-source screening and pair coverage. Run `node scripts/validate-supporting-geometry.mjs --raw-source` with the audited source cache to reproduce every one of the 167 detailed comparisons; **6,881 checks pass**. `npm run supporting-geometry:audit` regenerates the same evidence using the preserved baseline, official index and checked raw source files. The default test deliberately fails if any of these candidates has been silently imported; a future explicit admission must update that current-state gate with its own evidence, while retaining historical hashes.

## Rights and clinical acceptance

The original BodyParts3D v4 sources and derived audit data retain the official [CC BY 4.0 grant and DBCLS attribution](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html). No new runtime mesh, dependency, font, texture, copied medical diagram, paid service or patient/private review data is included. Retain existing change notices and commercial-distribution obligations in `LICENSES/THIRD_PARTY_NOTICES.md`.

Specialist review is still required for tendon parentage, exact attachment extent, muscle-head completeness, legitimate adjacent contact versus duplication, laterality and any future clinical teaching. No AI-generated substitute or clinical sign-off is created.

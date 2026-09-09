# Draft content contract

Current teaching totals are generated in [CURRENT_STATUS.md](CURRENT_STATUS.md). Historical additions and preservation transitions are retained in [the contract history](CONTENT_CONTRACT_HISTORY_2026-09-09.md); they are not current readiness totals.

## Delivered scope

The separate [learning-resource v1 contract](LEARNING_RESOURCE_CONTRACT.md) links scope-specific anatomy to resource/anchor revisions without changing this v2 teaching-seed schema. It imports no clinical approvals and currently configures no external resources.

The version-2 draft seed separates source representations from topic text and clinical approval. Existing body and shoulder identities, source bindings and clinical-review boundaries are preserved. Interactive reasoning questions remain a separate practice inventory, not promoted Quiz-tab lesson text or validated exam records. The [multimodal plan](MULTIMODAL_LEARNING_PLAN.md) does not change this schema or add an imaging/lecture database.

## Record identity and multi-part geometry

The current schema remains at `content/schema/anatomy-structure.schema.json`, with `schemaVersion: 2` and a versioned schema identifier. It describes a **draft content seed**, not a universal source-admission format. Its current source profile is the audited BodyParts3D v4 reference frame; adding another dataset/version requires explicit profile, rights and registration work.

The record key is **`(representationScope, id)`**, not the ID alone. `shoulder-pilot` and `body` may use the same anatomical ID with different asset scopes and scene transforms. Do not overwrite one with the other or infer a new clinical identity. The existing imaging bridge's explicit source-based representation mapping remains unchanged.

Each `meshBindings` entry stores asset identity/path/SHA-256, exact GLB node, source version/tree and all source OBJ filenames/hashes/FMA-definition references. The shoulder deltoid has three bindings; a grouped body mesh can have one binding with several source components. Neither case is reduced to one guessed source. An FMA definition associated with a grouped component is not a newly authored part identity.

`coordinateSystem` retains the actual reference-frame identifier, common uniform scale and column-major source-to-scene matrix. No explode offset, current camera, pointer position, cutaway percentage or patient-frame identifier is exported. Scale/rotation validity uses the existing reference-transform validator. Source binding validation additionally requires the exact current matrix, so a plausible but moved/recentred record is rejected.

The biceps source GLB contains the historic descriptive slug `biceps-long-head-muscle`; the product identity remains the existing `...:muscle:biceps-long-head`. Binding uses the manifest's exact GLB node, source filename/hash and FMA reference, not that internal slug. The immutable asset and canonical ID are unchanged.

## Clinical review is separate

All exported records have `validation.status: draft` and `clinicalApproval: not-included`. The schema rejects imported `validated`/`approved` flags, reviewer fields, arbitrary imaging revisions and unknown patient metadata fields. This is not a patient-data detector: free text can contain inappropriate material and still needs editorial/privacy review.

Shoulder material revisions are copied from the existing public geometry/teaching fingerprints; imaging stays null. A fingerprint is not an approval and the export does not contain or read private review snapshots. Body material revisions are null because the separate shoulder review pilot is not an atlas-wide review system—even for shared anatomical IDs. No D1 schema, private review, clinical checklist, review-expiry behaviour or authentication is migrated.

The semantic validator binds source/identity/provenance/revision fields to a separately constructed current trusted registry. It rejects a changed shoulder lesson carrying its old teaching fingerprint. Update authoring source and regenerate reviews before producing the next shoulder export. Body draft seed text is not backed by a clinical review revision; validation does not certify its medical correctness.

## Reproduction and integration

```sh
npm run reviews:revisions
npm run content:export
npm run content:export -- --check
npm run content:test
npm run requirements:audit
npm run requirements:audit -- --check
```

The default writes or checks `content/exports/shoulder.v2.json`. `npm run content:export -- --scope=body` can produce `content/exports/body.v2.json` from the same current source; the body representation is tested in memory but no duplicate bulk body export is committed by this milestone. Exports remain outside `public/`; there is no new download/upload or database-write endpoint. The command only accepts the two known scopes and `--check`, with fixed output locations.

`lib/content-export.ts` supplies pure typed exporters. `scripts/content-contract-tools.mjs` bundles the real source authoring helpers and validates records with the already locked Ajv 8.20.0 JSON Schema 2020-12 implementation. Ajv is used by offline tooling only, not added to the app's browser/Worker imports. No dependency or lockfile changes, new licence class or paid service is required.

A later content store can normalize records into anatomy identities, scope-specific representations/bindings, versioned topic text/readiness and source provenance. Private clinical review must remain separately authorized and revision-bound. This milestone does not implement that store or replace the current source-controlled authoring workflow. Do not expose the offline validator as an authenticated ingestion API without separate body limits, authorization, text/privacy policy and storage design.

## Legacy policy

`content/schema/anatomy-structure.v1.schema.json` preserves the original schema bytes. Versionless/v1 documents are rejected by the v2 ingestion check with an explicit migration message. Existing runtime catalogue, saved study views, canonical IDs, review data and imaging contracts retain their formats; they are not legacy v1 content records and are not migrated.

There were no schema-complete v1 curriculum records in this app. Do not silently wrap a legacy single mesh as the complete deltoid, infer topic readiness from prose or import old approval flags. Any external legacy record needs explicit correspondence to all trusted source bindings, topic readiness and separate review handling before re-authoring as v2. Retaining v1 for inspection is not a claim that automated lossless migration is implemented.

## Evidence and limits

[The contract validation report](content-contract-validation.json) covers the current scope-specific records, complete bound nodes and asset hashes; it also checks malformed, stale, legacy, source and approval rejections. Explicit before/after curriculum transitions preserve the original unrelated-copy baseline instead of silently repinning it. See the dated curriculum reports for those authoring changes.

Run the reproduction commands above for current evidence. Automated checks do not certify browser/GPU/accessibility behaviour, medical accuracy, spatial registration, clinical approval or live database deployment. A review fingerprint is not an approval.

Original code/teaching retain existing MIT terms. Source geometry and derived metadata retain BodyParts3D CC BY 4.0, DBCLS credit and change notices; brand rights remain reserved. See `LICENSES/THIRD_PARTY_NOTICES.md`.

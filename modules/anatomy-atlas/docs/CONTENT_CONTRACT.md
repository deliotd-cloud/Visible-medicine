# Versioned anatomy content export

## Delivered scope

The content-ingestion format now represents every selectable source part and the actual readiness of each teaching topic. The committed `content/exports/shoulder.v2.json` is a real nine-record export of the current pilot, not an invented database example. The same exporter is checked against all 1,022 body records and all 87 existing GLBs. No new anatomy, teaching prose, clinical approval, scan, database table, endpoint or UI control is introduced.

`app/body-content.ts` now exposes `bodyLesson(structure, topic)`, returning the original section plus explicit `readiness`. The existing `bodyContent` display API strips only that new field, preserving every prior displayed section. Readiness is assigned by the relevant authoring branch, not guessed from a title or an imaging-tab label. Shoulder teaching is explicitly draft through `draftLesson`.

| Readiness | Meaning |
| --- | --- |
| `draft` | Some specific or source-group teaching is authored; it may be incomplete, uncited or shared. Not clinically reviewed. |
| `identity-only` | Generic source identity or vessel disclaimer, not a specific Anatomy/Function lesson. |
| `pending` | Specialist content has not been authored in that branch. |
| `generated-identification` | A generated find-this-structure prompt, not an authored clinical question or the whole practice session. |

The explicit classification corrected two prior heuristic false positives: Function for FMA61970 and FMA62072 already contained pending text under draft headings. No lesson was removed. At the contract milestone Function coverage was 257 draft, 146 identity-only and 619 pending body records. The later shoulder/arm curriculum now gives 289 draft, 146 identity-only and 587 pending records; see [current audit](REQUIREMENT_AUDIT.md).

## Record identity and multi-part geometry

**Current forearm extension:** body totals are now 269 draft Anatomy / 753 identity-only and 331 draft Function / 146 identity-only / 545 pending. The 84 forearm sections and 64 preceding shoulder/arm sections are explicit authoring changes, not a new baseline. `authoringBeforeForearm` first verifies/restores only its 84 pinned sections for offline preservation; `copyBeforeShoulderArmCurriculum` then applies the earlier shoulder/arm transition. Runtime/export APIs always return current drafts. The shoulder/arm test report labels its projected historical counts `bodyReadinessAtShoulderMilestone`; `requirement-audit.json` reports current counts. See [forearm scope and gates](FOREARM_CURRICULUM.md).

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

The current [test report](content-contract-validation.json) covers 1,031 scope-specific records, 1,033 bound nodes and all 87 asset hashes. Tests compare actual GLB nodes/source metadata; exact manifest/catalogue membership; every prior displayed topic/recipe fingerprint; detached export data; JSON round trips; order-independent binding sets; and 36 malformed/stale/legacy/source/approval rejection cases. A pinned pre-change baseline makes the original schema/source/review and all-copy checks portable without Site Git history.

The original source GLBs, catalogue, shoulder manifest, displayed copy, dissection recipes, review fingerprints and lockfile remain unchanged. Type checks, focused lint, anatomy/source, imaging, review, neuro, axial and practice regressions pass. The older axial test now uses the existing in-workspace helper bundler instead of ancestor configuration discovery; its assertions/source inputs are unchanged. No browser/GPU/accessibility, clinical validity, database deployment, source admission or actual imaging synchronization is certified by this suite. Future authored lessons must preserve unrelated copy and document explicit, pinned curriculum changes rather than silently replacing the full-copy baseline.

Source geometry and derived source metadata retain BodyParts3D CC BY 4.0 with DBCLS credit, change notices and licence links. Original teaching/code retain their existing MIT terms; those terms do not relicense the anatomical source. Brand artwork is not part of the export. See `LICENSES/THIRD_PARTY_NOTICES.md` and source-specific notices.

**Subsequent curriculum milestone:** [SHOULDER_ARM_CURRICULUM.md](SHOULDER_ARM_CURRICULUM.md) now adds 64 draft sections for 32 body representations. The original full-copy baseline above is retained: `curriculum-transition.mjs` checks pinned before/after snapshots and restores only those exact sections for the unrelated-copy comparison. The earlier statement of unchanged displayed copy describes the contract milestone, not this explicit later authoring. Schema, all geometry/bindings, shoulder export, reviews and unrelated topics remain unchanged. Next: a bounded forearm muscle curriculum. Missing nerve geometry, qualified clinical review, real-device acceptance, actual imaging inputs and private remote delivery remain separate gates.

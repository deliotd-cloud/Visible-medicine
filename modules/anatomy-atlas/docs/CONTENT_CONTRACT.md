# Versioned anatomy content export

## Delivered scope

**Current thoracic-bone extension:** [54 original drafts](THORACIC_BONE_CURRICULUM.md) cover 27 existing entries. Body totals: Anatomy670draft/352identity-only; Function726draft/146identity-only/150pending. `authoringBeforeThoracicBones` verifies/restores only these topics before seventeen prior projections; 954 edits remain pinned against the original baseline. Spinal and earlier report totals are explicitly historical. Current runtime/export stay current; no schema/source/geometry/review migration.

**Current organ extension:** [46 original drafts](ORGAN_CURRICULUM.md) cover 23 existing organ-system entries. Body totals: Anatomy 575 draft / 447 identity-only; Function 631 draft / 146 identity-only / 245 pending. `authoringBeforeOrgans` verifies/restores only these topics before fourteen prior offline projections, preserving 764 pinned topic edits against the original baseline. Current runtime/export remain current; the CNS report labels historical counts. No schema, source, geometry or review migration. Earlier extension totals below are historical.

**Current central-neuro extension:** [six topic edits](CENTRAL_NEURO_CURRICULUM.md) add three drafts, enrich two existing Anatomy drafts and retain a pending fornical Function clarification. Body totals: Anatomy 552 draft / 470 identity-only; Function 608 draft / 146 identity-only / 268 pending. `authoringBeforeCentralNeuro` verifies/restores these sections before thirteen prior projections; 718 edits remain pinned to the original baseline. Original commissural identity text is preserved; the orbital-nerve report now names historical counts. No schema/source/review migration.

**Current orbital nerve extension:** [40 drafts](ORBITAL_NERVE_CURRICULUM.md) cover 20 exact existing entries. Body totals: Anatomy 551 draft / 471 identity-only; Function 606 draft / 146 identity-only / 270 pending. `authoringBeforeOrbitalNerve` verifies/restores only those sections before the twelve prior projections; all 712 topic edits remain pinned to the original baseline. Trunk report totals are explicitly historical. Current runtime/export, source IDs, schema and private-review boundaries are preserved.

**Current trunk/back extension:** [76 drafts](TRUNK_CURRICULUM.md) cover 38 existing entries, including explicitly partial source groups and three trapezius portions. Body totals: Anatomy 531 draft / 491 identity-only; Function 586 draft / 146 identity-only / 290 pending. `authoringBeforeTrunk` verifies/restores those topics before eleven prior projections, preserving all 672 pinned edits against the original baseline. Runtime/export remain current; the deep-neck report now labels its historical counts. Source IDs, schema and private reviews are unchanged. Older totals below are historical.

**Current deep-neck extension:** [56 basic drafts](DEEP_NECK_CURRICULUM.md) cover 28 existing spine-route entries. Body totals: Anatomy 493 draft / 529 identity-only; Function 548 draft / 146 identity-only / 328 pending. `authoringBeforeDeepNeck` verifies/restores only these topics before the ten previous offline projections. All 596 topic edits remain pinned to the original baseline; runtime/export stay current. The neck report now labels its historical totals explicitly. No source/schema/review migration occurs; older counts below are historical.

**Current neck extension:** [28 basic drafts](NECK_CURRICULUM.md) cover 14 existing entries, including two explicitly regional rotator overviews. Body totals: Anatomy 465 draft / 557 identity-only; Function 520 draft / 146 identity-only / 356 pending. `authoringBeforeNeck` verifies/restores only these topics before nine earlier offline projections. All 540 topic edits remain pinned to the original baseline; runtime/export stay current. Prior counts below are historical. No source/schema/review migration occurs.

**Current swallowing extension:** [54 new basic drafts](SWALLOWING_CURRICULUM.md) cover 27 existing hyoid/tongue/palatal/laryngeal entries. Body totals: Anatomy 451 draft / 571 identity-only; Function 506 draft / 146 identity-only / 370 pending. `authoringBeforeSwallowing` verifies/restores only these topics before the eight prior offline projections. All 512 topic edits remain pinned to the original baseline. Runtime/export stay current; old reports/paragraphs retain milestone counts. No source/schema/review migration occurs.

**Current orbital extension:** [28 new basic drafts](ORBITAL_CURRICULUM.md) cover 14 existing orbital-muscle entries. Body totals: Anatomy 424 draft / 598 identity-only; Function 479 draft / 146 identity-only / 397 pending. `authoringBeforeOrbital` verifies/restores its exact topics before the seven prior offline projections. All 458 topic edits remain pinned to the original baseline; runtime/export stay current. Older reports/paragraphs retain milestone counts. No source/schema/review migration occurs.

**Current pelvic extension:** [six explicit topic edits](PELVIC_CURRICULUM.md) add five drafts and one still-pending Function clarification. Body totals: Anatomy 410 draft / 612 identity-only; Function 465 draft / 146 identity-only / 411 pending. `authoringBeforePelvic` verifies/restores these sections before the six earlier offline projections. All 430 topic edits remain pinned to the original baseline; runtime/export stay current. Historical paragraphs and reports retain their milestone counts. No source/schema/review migration occurs.

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

**Current foot extension:** 72 new drafts give body totals of 407 draft Anatomy / 615 identity-only and 463 draft Function / 146 identity-only / 413 pending. `authoringBeforeFoot` verifies/restores its exact topics before the five earlier offline projections. All 424 changed topics remain pinned to the original copy/recipe baseline. The leg report explicitly labels historical body readiness. Runtime/export stay current, with no source/schema/review migration. See [foot evidence](FOOT_CURRICULUM.md). The extension paragraphs below retain their milestone counts.

**Latest lower-leg extension:** 56 new drafts give body totals of 371 draft Anatomy / 651 identity-only and 427 draft Function / 146 identity-only / 449 pending. `authoringBeforeLeg` verifies/restores its exact topics before four earlier offline transitions. All 352 changed topics are pinned; the original copy/recipe baseline remains intact. Thigh readiness is explicitly historical in its report. Runtime/export stay current; no source/schema/review migration. See [lower-leg evidence](LEG_CURRICULUM.md).

**Prior hip/thigh extension:** 108 drafts gave milestone totals of 343 draft Anatomy / 679 identity-only and 399 draft Function / 146 identity-only / 477 pending. Its 296 changed sections remain pinned in the preceding transitions. See [hip/thigh evidence](THIGH_CURRICULUM.md).

**Latest hand extension:** 40 further pinned sections (34 newly drafted, six enriched) give current body totals of 289 draft Anatomy / 733 identity-only and 345 draft Function / 146 identity-only / 531 pending. `authoringBeforeHand` verifies/restores these exact sections for offline preservation before the forearm and shoulder transitions. The total is 188 explicitly changed sections; the original copy/recipe baseline remains intact. The forearm report now names its projected historical counts `bodyReadinessAtForearmMilestone`; current totals remain in the requirement audit. No runtime content, geometry, schema or review is rolled back. See [hand scope](HAND_CURRICULUM.md).

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

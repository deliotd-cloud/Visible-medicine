# Source-bound craniofacial CT teaching

Atlas source `3dcdf94a46db44202e72641be9fbcf1274ce5364`, tree
`b5ab50363b521aed2e8d4f0e34a8f5ed4ecee0d5`. The teaching introduction is
`2e67298f33a74ba4f45c868e10605ddd9b567af2`; the following commit refreshes
the normal derived regional snapshot and its renderer fingerprint.

This adds four CT orientation drafts to the existing bilateral stylohyoid
ligament and superior-oblique trochlea selections. It adds no mesh, mask,
scan, texture, dependency or fee. The complete source proof preserves the other
9,932 root topic placements, all source geometry, holds, tours and recipes.
The saved raw-base export separately catches up two ultrasound fields that were
already drafts in the preceding runtime; those are not new live lessons.

The short original summaries cite primary research without reproducing article
text or figures. A reference is not a licence to redistribute its images:
[Buch et al.](https://pubmed.ncbi.nlm.nih.gov/23945224/),
[Ko and Kim](https://pubmed.ncbi.nlm.nih.gov/20157406/), and
[Murtagh et al.](https://pubmed.ncbi.nlm.nih.gov/11498437/).
Each provider requires the complete source record, not a matching name/FMA alone.
The notes remain drafts requiring exact-revision radiologist sign-off.

## Delivery and checks

All four learner modules use the normal committed-source Vite/export pipeline.
The website imports the same commit through `scripts/import-clinical-review.mjs`,
then binds and builds its private Review viewer. Neither generated copy is
edited by hand. The new Review integration is
`7dcfd57c40219216347e3b89979723cbae3a9d8644f5381eb34e7f42800bd9e5`:
1,534 Atlas source identities and 1,664 combined inputs. The existing 137 unique
model payloads / 144 paths / 199,072,480 bytes remain unchanged.

The four coverage scopes are regenerated from this clean commit. Their counts,
source holds and documented target groups are unchanged; only revision/provenance
changes. Register59 preserves all 71 roadmap items, including eight optional ideas.
The previous delivery58 pin, original admission sources and immutable Review58
proof remain authentic. Only explicit current-source/tree/count admission seams
advance; the new regression verifies every previous assertion survives.

Relevant focused checks:

```text
node --experimental-strip-types --test --test-concurrency=1 tests/craniofacial-ct-current-delivery.test.mjs tests/current-atlas-delivery.test.mjs tests/clinical-review-portal-venous-current-admission.test.mjs tests/anatomy-coverage-view.test.ts
node scripts/verify-clinical-review.mjs
node scripts/check-anatomy-coverage.mjs --source-root F:/VisibleMedicine/atlas
node scripts/refresh-completion-checklist.mjs --check --verify-evidence
```

Local engineering evidence and current verification status are retained at
`F:/VisibleMedicine/recovery/checkpoints/20261019-craniofacial-ct-website-import`.
Build/test success, browser acceptance and remote source backup each require
their own receipts. A local source import is not public deployment or a complete
model/scan/database backup.

No decision is migrated. The changed global renderer/website binding requires
fresh applicable revision-bound review. Teaching notes do not supply acquired
images, patient coordinates or validated spatial registration. Semantic comparison
with the existing CT/MRI atlases remains distinct from spatial synchronization.
Atlas, imaging-case and separately paid lecture access remain independent.
Only Didanix Education/light web integration is in scope; the clinical desktop
PACS and specialist CT-head masks are untouched.

# Clinical Review source alignment — 26 September 2026

Local-only update from website base `7087d00`. The read-only review import and
its protected model viewer now use Atlas `f46b48c19266fe96a2126327042317484a0a4187`,
matching the shared regional learner runtime's source revision. The independent
shoulder, pelvis and lower-limb learner exports are unchanged. This is source
alignment, not transfer of approval between separate renderers or releases.

## What changed

- 837 imported source files (eight additions), including shoulder selectable
  quick checks and their explicit draft answer key/explanation in review,
  coronary arterial ultrasound drafts and elbow arterial CT drafts.
- The website review viewer was regenerated, with 31 files and 22 bundled
  packages. No dependency, model geometry, model inventory, patient image,
  account entitlement, database schema or saved personal decision changed.
- The source's unadmitted skin candidate remains in its separate Atlas inspector;
  its unsupported link and candidate routes are excluded from website review.
- Website integration fingerprint:
  `720ee642df45a847caded1fd005e96127f882f4e2b2dd7367ae5d5c78f7d9795`.
  Changed revisions require fresh review; prior history remains accessible.

## Verification

The pinned Git blobs for all 837 files were verified independently. All 776
overlapping regional runtime inputs match the pinned review source in content;
nine raw byte differences are solely CRLF/LF endings. The source-parity receipt
in the coordinating workspace lists them. Imported/adapted and generated viewer
hashes pass the existing verification gate.

Eleven focused tests pass, covering the actual website endpoints against a
disposable in-memory D1 database, all four review scopes, existing authorization
and isolation gates, protected model delivery, stale revisions and append-only
corrections. Frozen public material identities from website `7087d00` exercise
the real prior-to-current revision transition. Synthetic historical records stay
unchanged; obsolete posts fail and queue entries require re-review. These are
not real clinical decisions or evidence of clinical acceptance.

Review viewer production build, website production build and TypeScript pass.
Existing large-chunk and framework route-classification warnings remain.
Current browser acceptance is **outstanding**: the browser blocked navigation
to the local review page. Earlier browser evidence in the integration note
applies to the earlier revision, not this update. Do not claim live acceptance.

## Recovery and next step

See the coordinating workspace's `work/REVIEW-CURRENT-CHECKPOINT-20260926.md`
for commit, GitHub backup, independent D restore and publication status.
Source backups do not back up personal D1 decisions. No production database
was modified. Before release, verify the current review home, draft answer
evidence, exact selected model and small-screen flow in the browser, then obtain
revision-bound radiologist decisions. Publication remains a separate owner gate.

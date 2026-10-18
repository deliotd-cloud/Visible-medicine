# Dissection restoration in Clinical Review — 27 September 2026

The local protected review model imports Atlas `eecf73cdf5443dd99e308746547ffbe5b1f1463b`.
Restore one/matching reveals returned tissue by clearing isolation and selected-only
framing, resetting zoom and requesting a fresh camera fit. Exact removed-membership
guards prevent invalid requests; a group restore remains one dissection Undo step.
Existing selection, layout, separation and cutaway are preserved. A cutaway may
still clip returned tissue. No new anatomical geometry or teaching was introduced.

The 843-file import and 31 viewer artifacts match website integration fingerprint
`c7426019c4e602d17e32f91a843980a87bfe4102d0f8fa153b5c18dc30ea7bbb`.
The learner runtime stays `36c53fb`; other separately pinned modules are unchanged.
Prior review decisions are not migrated: the changed presentation requires fresh
revision-bound review. Model inventory, independent entitlements and personal
record storage are unchanged. Replaced generated chunks remain recoverable in Git.

## Evidence

- Atlas actual-handler restoration tests and earlier browser reproduction/fix are
  recorded in the main workspace's `work/RESTORE-VISIBILITY-CHECKPOINT-20260927.md`.
- Eleven website tests pass, including actual review endpoint authorization,
  account/institution isolation, stale revisions, append-only corrections,
  foot quiz evidence, alias search and protected model delivery. Two initial
  failures were stale import-revision pins; only those pins changed and both
  affected tests passed on rerun. Historical material fixtures are unchanged.
- New delivery test pins the canonical tested restore handlers, imported source
  checksum and every compiled viewer artifact. This is delivery evidence, not
  a substitute for behavior tests.
- TypeScript, review build, full website build and source/artifact verifier pass.
  Existing chunk-size warnings remain.
- Actual website-served foot model: Dissect stage 2, select Right talus, activate
  Fade others and Frame selected, restore right abductor digiti minimi. Removed
  count changes 6 to 5, both controls clear and selection persists. Screenshot
  confirms both feet refitted with normal opaque tissue and consistent labels.
- At 375px touch emulation the document remains 375px wide; the 353px canvas,
  search, tools and information entry points remain available. Emulation reloads
  the page; this is reflow evidence, not a mobile restoration-interaction test.

Local review delivery only: no public deployment, patient data, approvals, new
dependencies or clinical certification. Desktop PACS and specialist masks untouched.

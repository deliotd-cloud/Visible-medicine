# Bounded filtered anatomy practice

CT/MRI structure-index practice defaults to up to five questions instead of
starting every matching annotation. A contextual size selector offers one,
up to five, up to ten, or all results. The action shows the actual question count
and, when sampled, the eligible total. It appears only when discovery filters
are active and is hidden during questions alongside the index and style control.

A smaller set is sampled without replacement only after explicit Start. Full
sets retain index order. The existing whole-study distinct-mask eligibility
pool remains authoritative: aliases, point locators and filtered-out duplicate
representatives cannot become questions. Sampling copies rather than sorts the
index. Neither changing the size nor changing the style selects anatomy,
navigates, starts a set or changes existing scores. Invalid DOM option values
are ignored; empty results disable both controls. Existing stale-start guards,
failed-start context preservation and locate/label answer concealment remain.

The size preference is component-local, not a saved learner record. Guided
learning and selected-structure practice retain their separate current rules.
No patient geometry, source metadata, registration, approvals, entitlement or
clinical PACS behavior changes.

## Evidence and limits

Four new synthetic CT/MRI × locate/label component regressions fail against the
old component and pass with the change. They check default and explicit sizes,
membership, uniqueness, invalid values, no navigation/start on configuration,
unchanged index order, active-question hiding, stale callbacks and zero results.
Existing filtered/practice/index/link tests remain in the focused verification.
This scheduler is not concurrent-React, native-image/GPU or clinical acceptance.

Final evidence:100 focused tests, fresh TypeScript, unchanged combined Review
verification, isolated E-drive website build and four route/exact-client checks
pass. Local preview69773 replaces deliberately stopped38035. Existing loaded
scan/model tabs and historical port3001 were not reloaded or modified.

Receipts and scoped source recovery:
`E:/VisibleMedicine-LocalStaging/20261009-filtered-practice-size/`.
Same-machine recovery only; no public deployment or verified off-device backup.

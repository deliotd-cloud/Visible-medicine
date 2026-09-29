# Nested practice expansion — local acceptance

Source baseline: `ed3e0e2a202b359023be127567c2a268d901a396`.

50 existing named selections added to the original eight spaces, across eight
additional study types / ten parent-specific workbenches. The current exact
inventory is asserted independently in `scripts/test-nested-practice.mjs`.
No geometry, teaching, dependencies, fonts, source permissions or licences added.
Existing source attribution and clinical hold states remain in force.

Practice stays folded. Eligible questions must be visible, loaded, source-bound
and explicitly allowed. Isolation, clipping, failed assets and filtered lung
branch types deny launch. Context never becomes an answer. Rounds have at most
five questions, with answer-once grading, skip/reveal and missed-only retry.

Browser inspection revealed hidden deep targets in Find mode. A reversible,
label-free separated tray now exposes them. The explicit `practiceTray` opt-in
changes only layout/translation while retaining exam label, colour and selection
hint suppression. Ordinary exams keep their existing spatial layout. Packing
clearance is for source-entry projected bounds at the aligned tray endpoint,
not individual components within compound groups or arbitrary rotated views.

## Evidence

- Exact identity/pool/packing checks: 2,082 pass, including six camera views and
  all new parent-specific pools. Source records remain unchanged.
- Actual component callbacks: 1,027 pass, both modes across all 50 new selections,
  launch guards, missed retry, separated-view toggle and return-state retention.
- Existing identification engine: 56,948 checks pass.
- Selection visibility: 1,485,539; study navigation: 141,680; scene recovery: 792.
- Existing body arrangement: 16,182,451 checks pass (separate from new nested tests).
- Nested review: 108 contexts / 26 bundles / 75 teaching prerequisites unchanged;
  renderer revision regenerated, not treated as clinical approval.
- TypeScript and both standalone module production builds pass. Build warnings
  about large chunks remain; this is not a performance certification.
- Actual desktop browser: cerebral Find starts a five-question round, hides
  labels, toggles separated layout, and receives a source-surface canvas pick
  with answer feedback. Screenshot inspected at 1440×1000.
- Actual mobile browser (375×812): right renal Name mode excludes a hidden vein,
  runs three questions, reports one correct and two wrong as 1/3, retries only
  two missed targets and preserves the hidden vein on return. No horizontal
  overflow. Correct feedback explicitly observed for Right renal vein.
- Actual mobile pulmonary study: Airways filter disables practice with reason;
  restoring all branch types re-enables it. Three-question Find round and
  separated shapes render; mobile screenshot inspected.

Local QA server serves only an explicit generated/model inventory, no scans.
No publication, paid resources, private images, clinical approvals, fracture
changes or desktop PACS changes. Physical-device/assistive-technology and
radiologist acceptance remain open. Website import is the next delivery step;
these source checks do not prove the website already contains the change.

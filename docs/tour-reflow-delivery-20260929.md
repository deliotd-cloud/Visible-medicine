# Guided tour selector reflow — 29 September 2026

Local website imports Atlas `7dd7f5cfe4690ca1e5542107e52f97fa5142865f` from
website baseline047d488a. The selected tour title now determines trigger height;
its text wraps without the shared one-line clamp. The underlying shared Select
primitive is unchanged. No new control, anatomy, teaching, asset or dependency.

## Verification

- Source19tour selection/remount tests and requirement freshness pass.
- Compiled-source preview and final integrated website each pass114actual title
  containment checks: all19tour titles at320/375/1280px,100/200%text. Six keyboard
  journeys each use Enter/Home/Enter and verify the selected result. The test
  waits for popup focus before navigation; initial immediate-key probes raced
  the popup's focus transition, not a source regression.
- Final active carpal tour at375x812/200%text:359x189canvas fully reachable and
  Finish restores the workspace. Before/after screenshots inspected. Root work
  evidence `tour-picker-reflow-integrated-20260929.json` and
  `tour-reflow-mobile-visible-20260929.{json,png}`; compact report in these docs.
-305website tests pass in one full run; types and final build pass.
- Exact review source delta is only picker CSS and renderer revision. Both
  learner manifests and review match. Every137model byte and notice is retained.
  Existing carpal addition test keeps its historical import delta while still
  checking current tour evidence. No clinical decisions submitted or migrated.

No publication or clinical completion. Desktop PACS, scans, masks, entitlements
and separate fracture changes untouched. GitHub/C recovery is recorded in the
main workspace checkpoint; D remains full/pending and was not accessed.

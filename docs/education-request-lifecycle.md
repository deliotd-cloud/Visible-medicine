# Education viewer request lifecycle

12 September 2026. Extends [geometry safeguards](education-geometry.md); not clinical acceptance or a new imaging viewer.

## Correction

`EducationRuntime` previously applied localizer, saved-scene restore and saved-view-list results after an unconditional await. A late response could update another case or replace a newer selection; an obsolete request's finally block could clear a newer busy indicator. Restore also applied annotations and view controls before spatial mapping succeeded.

The runtime now uses `createLatestViewRequest` for three independent lanes: localizer/restore, saved-view reads, and saved-view write feedback. Tickets must remain current before applying success, errors or completion. Aborting is an optimization; ticket identity also rejects late work when the transport ignores abort.

- Committed context includes case, manifest, workbook/version, teaching/exam view, user/roles, attempt state, modality and preview role. Changes clear saved-view lists, annotations, restored scenes and crosshairs before paint. Leaving the workspace or unmounting invalidates requests; cleanup supports Strict Mode remounts.
- Localizer work additionally binds to series, frame, plane, layout, tool, cine, zoom and pan. Reset/tool/layout actions explicitly invalidate pending work even if their value is unchanged.
- New localizer selections remove old projections and success text. Failed mapping cannot present the old crosshair as the new selection.
- Restores apply new controls, annotations and mapped crosshair together only after current mapping succeeds. Non-spatial scenes need no localizer request. Hidden scene annotations remain hidden.
- Localizer and saved-view writes use separate busy ownership. Late completion cannot unlock newer controls.
- Dispatched presentation/bookmark writes are **not transport-aborted**: navigation cannot guarantee rollback of a server write. Their feedback/list refresh is discarded after leaving that context. Server authorization, immutable versions and idempotent write contracts are unchanged. Assessment answers are not modified by these guards.

No controls, dependencies, fees, medical assets, schemas or infrastructure were added.

## Evidence and remaining acceptance

Deterministic request-gate tests cover out-of-order completion despite ignored abort, context changes, same-position reset, leave/return, cleanup, and independent request lanes. Website suite and TypeScript/build results are recorded in the recovery checkpoint. These are synthetic/helper and compilation checks, **not mounted React, real browser or real-DICOM tests**.

Before pilot sign-off, delay real API replies in browser QA and exercise A→B→A case changes, workbook and teaching→exam changes, series/frame changes, same-position reset, rapid crosshair clicks, competing restores, failed restore, and navigation during save. Confirm no stale points, notes, errors or busy transitions; check successful and hidden-annotation restores. Repeat with actual Didanix Education events and separately revoked entitlements. Clearing client UI is not a paywall or clinical approval.

Private scans, masks, the separate Education source and generated shoulder export were not changed. Real-case validation and public release gates remain open.

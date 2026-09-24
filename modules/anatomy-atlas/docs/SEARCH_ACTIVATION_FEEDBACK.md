# Study activation feedback

Atlas Search now honours an explicit `false` result from a study handler.
Previously it closed Search, switched to Dissect and collapsed panels even
when a source guard rejected the requested study and kept the old view.

On rejection, Search retains the query and preview and announces a short
accessible error. Mode and panel changes happen only after successful
activation. Cancel or editing the query/filter clears the error; the existing
keyboard focus and successful-study handoff remain intact. A preview that no
longer matches the current search index receives a stale-result notice without
calling a handler. No permanent control or extra panel is introduced.

`BodyExplorer.changeStage` now explicitly returns `false` for rejected requests
and `true` after applying a stage, matching the existing focus-handler contract.
The Search callback types also accept legacy void-returning handlers; only an
explicit rejection is treated as failure. This is not an asynchronous load
completion indicator or a bypass of source-validation checks.

## Verification

`node scripts/test-search-preview-focus.mjs` exercises the actual AtlasSearch
component callbacks using controlled React hooks and focusable test nodes:
window/focus rejection in desktop, collapsed and focus-view layouts; retained
query/preview; absence of mode/panel mutations; accessible notice; cancel/query
recovery; successful and legacy-void handlers; stale entry; practice guards;
and the previous keyboard handoff paths. These are not browser/device tests.

The broader nested-navigation check passes 44,626 assertions, including actual
Search callbacks, source-bound routes and 318 server-rendered child selections.
TypeScript, targeted changed-file lint, renderer-revision checking and the shared
production build pass. Existing large-bundle warnings and four previously
recorded BodyExplorer hook-lint findings remain; this is not a whole-project
lint or performance acceptance claim.

Source/model bytes, anatomical IDs, study recipes, teaching, licenses, privacy
and independent entitlements are unchanged. Current review fingerprints and
the shoulder export are regenerated for the changed shared presentation code;
no private clinical decisions are read, migrated or approved.

The initial bounded check still showed an intermediate Vite missing-file error.
A later local browser pass successfully opened the popliteal study; see
[sampled browser QA](STUDY_CLOSE_UP_CAPTIONS.md). Rejection feedback itself has
controlled component coverage, not live fault-injection coverage. No hosted
publication is claimed.

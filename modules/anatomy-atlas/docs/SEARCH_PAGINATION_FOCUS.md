# Search pagination keyboard continuity

26 September 2026. Shared regional/whole-body Atlas Search, including the website
module. No change to the Didanix desktop application.

Previously, either Show more action inserted results before its button. Keeping
focus on that button skipped the newly revealed matches in forward tab order;
on the last page the focused button disappeared altogether. One shared limit
also expanded both direct results and related studies when only one was requested.

Each group now pages independently. After expansion, focus moves to that group's
first newly revealed result, whether it is a selection button or a regional link.
This is focus only: no selection, study activation, route change or mode switch.
The native focus operation may scroll the result into view; no animation, new
control, forced disclosure opening or extra confirmation is added.

Query/filter changes reset both page sizes and cancel pending focus. Closing
Search, starting an exam, or opening a study preview prevents a stale pagination
handoff. Closing the related disclosure preserves that user action. If the exact
target disappears, a still-connected dialog root is the fallback; the code never
guesses another structure or activates it. Existing study-preview cancellation
and modal-close focus behavior remain separate.

The dedicated regression test uses the actual AtlasSearch component with real
catalogue search results and controlled hooks/focusable nodes. This is not a
browser DOM or physical-keyboard acceptance claim. The coordination checkpoint
records completed tests and the exact saved revision; current browser/device
acceptance and publication remain pending.

Verification: fourteen pagination scenarios pass; the exact pre-change component
fails the newly revealed-result focus assertion. Existing preview/focus, anatomy
search, review/decision and shoulder-workspace regressions pass, as do TypeScript,
lint and both regional and shoulder production builds. Navigation validation now
passes 169,949 checks, including seven activation cases. Its previous failure was
also reproduced on the saved baseline: the test mock omitted the existing
validate-before-apply callback. The corrected harness tests accepted, rejected
and legacy callbacks against both revisions without changing runtime activation.

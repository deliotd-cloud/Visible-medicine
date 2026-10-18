# CT/MRI anatomy index keyboard navigation

No extra toolbar is added. With an approved local head package loaded:

- Down from the search field focuses the first current result; Up focuses the last.
- Up/Down browse results. Home/End reach the first/last result without wrapping.
- Enter or Space uses the existing button selection. Moving focus alone does not
  select anatomy, move the native scan cursor, change URL history or grade an answer.
- Escape returns to search, preserving the query and filters. Tab works normally.

Only the result list scrolls when revealing a focused entry. No page-level
shortcut, global key listener or scrollIntoView is used. Disabled search, empty
results, modifier combinations and IME composition are not intercepted. The
handler reads the currently rendered filtered entries, avoiding stale indexes.
The anatomy index and shortcuts remain absent during an active quiz.

Verification combines focused DOM-shape tests with real CT/MRI viewer component
handlers, native selection, history, practice and slice regressions. These do not
constitute clinical or loaded-scan browser acceptance. Local evidence and recovery:
`E:/VisibleMedicine-LocalStaging/20261009-head-index-keyboard/`.

No scan/mask edits, approvals, new libraries, licence changes, persistence,
entitlement changes or public release are introduced.

# Local MutationObserver attribution, 21 October 2026

Scope: read-only inspection of the canonical website at HEAD `b953ff3f5f1891599cb6e91cb91311d9d6006270`. No source, preview, browser, authentication, or private data was changed.

Observed evidence supplied by the main task: one uncaught `TypeError: Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'Node'.` in IAB tab 91 at 2026-10-21T10:42:59Z. The entry had no script URL or stack, and the tab has closed. Review Back navigation, a visible whole-body skeleton, MRI pons to existing 3D, and CT pons handoff worked in that session despite the entry. Those successful actions do not attribute the error.

Source paths inspected:

- `components/SiteFrame.tsx:155-181` obtains `main` from `frameRef.current?.querySelector<HTMLElement>("#main-content")`, returns when it is absent, and passes `main` to `observer.observe`. A successful DOM `querySelector` returns an Element, which is a Node; this source path does not normally pass a non-Node. It only runs after a captured eligible navigation and while waiting for a streamed heading.
- `atlas-review/app/practice-panel-navigation.tsx:49-66` obtains `popup` via `target.closest<HTMLElement>(...)`, returns if absent or not closed, then observes `popup`. This app-owned path also does not normally pass a non-Node.
- `components/LocalAtlasDiagnostics.tsx:5-10` mounts `installLocalAtlasDiagnostics` by pathname. `app/layout.tsx:60` mounts that component only in development. `lib/local-atlas-diagnostics.ts:67-121` listens for the exact TypeError on loopback `/atlas` pages and eligible same-origin public `/atlas-runtime/` iframes. It logs `[VM local atlas diagnostic]` with a sanitized script filename and up to eight sanitized stack locations, discarding query strings, fragments, and private path classes. `tests/local-atlas-diagnostics.test.ts` covers the scope, sanitization, listener lifecycle, and development mount.

Attribution remains unknown. The error entry lacks a source URL/stack. Generated public Atlas runtime bundles and their dependencies can contain observer calls; source inspection here cannot determine which executed. No source change or error suppression is supported by the current evidence.

Narrow next step for main: during one authorized local reproduction on the already-live canonical preview, capture the existing `[VM local atlas diagnostic]` console line, if emitted, and the uncaught exception's script URL, line/column and call stack from the actual frame. Preserve only sanitized script paths/locations and navigation action; do not record page contents, parameters, private data, or screenshots. If the error does not recur or the diagnostics still say `unknown script`, leave it unclassified and log that result. If a stack identifies an app-owned call, inspect that exact execution path before proposing a fix.

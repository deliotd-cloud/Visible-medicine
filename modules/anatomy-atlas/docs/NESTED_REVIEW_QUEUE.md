# Compact nested review queue

1 October 2026. The private nested Clinical Review sidebar now has Previous/Next
links through the current parent/study's filtered, source-pinned children, plus
a position count and Clear search. Search and the chosen 3D-anatomy/teaching track
survive selection navigation. There is no new permanent panel or toolbar.

Links carry the exact parent, study, child and source token already required by
the server. A query or track is only a navigation preference: it cannot create
an approval, grant access, or substitute for a source hash. Unknown scope/source,
array query parameters, hidden selections and empty results do not acquire an
arbitrary neighbour. Search is bounded to 160 characters; imaging is not an
accepted navigation track. The existing unsaved-edit confirmation applies to
the same ordinary links, and before-unload protection remains in place.

No model, teaching paragraph, clinical decision schema, review store, source
binding, paid entitlement, dependency or fee was changed. No existing approval
is migrated. This is source implementation; the canonical website must forward
`q` and `t` when importing this generated review component before users can rely
on persistence there. No deployment is claimed.

Run `node scripts/test-nested-review-queue.mjs`. It checks every one of the 108
exact-source links against the real selection resolver, all queue boundaries,
filtered order, rejected foreign identities, query/track parsing and real
server-rendered workspace states. It also pins unchanged source/teaching/server
files to the pre-change source commit. See
[evidence](nested-review-queue-validation.json).

Signed-in browser keyboard/focus, Back/Forward behaviour, dirty-confirmation
interaction and 200% zoom remain acceptance work. SSR and numerical tests are
not interactive browser or clinical evidence. The next separate feature candidate
is a source-bound eye-layer guided walkthrough with its sequence included in
revision-bound teaching review; it has not been implemented by this queue change.

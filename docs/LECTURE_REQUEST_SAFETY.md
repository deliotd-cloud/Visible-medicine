# Lecture editor request safety

Save, reload and existing review/publication actions share one synchronous
pending-request lock. Native fields stay disabled while a request is pending.
This prevents rapid/stale handler invocations from sending a second operation
before React renders the busy state. Declining a reload never acquires the lock.

A successful-shaped response must match both the requested lecture and course.
A mismatched response cannot replace local title/slides, clear the dirty state
or review comment, or change the editor's saved revision. The error is explicit;
an authorised matching retry remains possible. Existing server permissions,
expectedVersion checks and independent review/publishing gates are unchanged.

Unmounted editor instances ignore late fetch/JSON successes and failures and
cannot update state or unlock a newer operation. Lifecycle generations also
handle React StrictMode effect replay. The builder keys the editor by workbook
identity, not revision: another workbook remounts; a same-ID server refresh does
not silently replace unsaved local edits. Save or deliberate reload installs a
validated current response.

This is UI lifecycle protection, not server cancellation. A POST already sent
may still commit after navigation; check the saved version before repeating an
action. No durable local lecture draft recovery, undo of a server save, or
clinical/publication approval is implied.

Evidence: E:/VisibleMedicine-LocalStaging/20261008-lecture-request-safety includes
deferred actual-component checks, API/repository/routing regressions, fresh
canonical types, a sanitised local build and an isolated synthetic desktop
fixture. No identity is injected into the real website, and no course, review or
publication POST is sent by browser verification. Signed-in production
navigation remains a separate acceptance check.

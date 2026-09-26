# Clinical review home

Source route: `/review/overview`. Added 26 September 2026.

This is a common entry point to the existing four review workspaces, not a new
approval store. Search names, side, anatomical IDs and model context, or choose
Dedicated shoulder, Whole body, Internal anatomy or Independent specimens.
Results are paged in groups of twelve; changing filters starts on page one.
The searchable index uses public review metadata. A separate authenticated,
read-only endpoint loads the signed-in user's anatomy and teaching statuses for
the twelve visible selections only. It does not infer pending/approved status
from the existence or readiness of an anatomy draft.

Statuses are Not started, In progress, Changes required, Approval recorded,
Re-review required and Status unavailable. An old revision or checklist does not
keep its approved label. Failed or corrupt reads never mean Not started; there
is no fallback to a superseded approval. Refresh status clears the previous
snapshot before loading again. Navigation cancels obsolete requests. These are
personal saved decisions, **not institution sign-off or learner-publication
authorization**. Acquired-image approval is not summarized as anatomy approval.

## Review an item

1. Open the exact selection and source model. Sign in to load private decisions.
2. Check the displayed revision, then inspect anatomy and teaching separately.
3. Save corrections, evidence and your decision in that existing workspace.
4. Re-review changed material. An approval for another model or revision does
   not carry over; teaching wording does not approve acquired-image registration.

The hub indexes 1,575 scoped selections at this checkpoint (9 shoulder, 1,104
body, 106 internal, 356 specimens). These are review contexts, not counts of
unique physical structures or outstanding decisions. Duplicate identities across
model scopes remain distinct. Nested links retain the exact parent, study and
source token; independent specimen links retain their donor/model key.

Existing private record endpoints, account isolation, checks, append-only history
and save/discard guards are unchanged. `/api/review-overview` uses the existing
trusted Sites identity and stores; it returns only scoped keys and status labels,
with private/no-store caching. It accepts search parameters, never a reviewer ID.
There are no schema changes or new write endpoints. Tests use synthetic records
in memory only; no real reviewer records were read, created or approved during
implementation. Patient data, masks, viewer linking, entitlements and the Didanix
desktop application are unchanged.

## Delivery boundary

The route exists in the standalone Atlas source application. It is **not yet
available as a Clinical Review area in the live Visible Medicine website**.
That separate checkout is currently read-only to this task. Its own workspace
navigation and staff authorization must be integrated deliberately; do not add
a broken link to `/review/overview` on the hosted website or copy the standalone
authentication/database assumptions without checking compatibility.

Next website work needs authorized writes, protected staff navigation, server-side
reviewer checks, compatible private record storage and exact displayed-revision
binding. Verify save/reload, stale rejection, changes-required, unauthenticated
denial, cross-account isolation and existing independent product entitlements on
the actual integrated site. Browser accessibility/mobile acceptance and release
verification remain required. Local server-render tests are not those checks.

Read-only integration audit: website `components/SiteFrame.tsx` owns institution
workspace navigation; a website-owned `/workspace/atlas-review` area is the
intended integration point, not a learner or course-publication queue. Website
`lib/auth.ts` maps account IDs to `edu:<id>`; Atlas `lib/review-http.ts` currently
uses the raw trusted header for private account records and does not assign a
staff role. Never merge these namespaces or promote a private review to a shared
institution decision implicitly. A website adapter must verify the reviewer role,
preserve reviewer identity and exact scope/material evidence, and define explicit
institution access. Reject direct endpoint bypass and stale revisions; a review
record must not itself unlock learner Atlas delivery or other paid products.

## Verification

### Delayed-history protection — 26 September 2026

The internal-anatomy and independent-specimen editors previously allowed Refresh
while their initial history read was pending. If Refresh finished first, editing
became available, but the older initial response could then replace new notes.
The component regression reproduced this data loss in both editors on `d81a6f0`.

Each editor now owns one cancellable history read. Refresh cancels the initial
read, and leaving the editor cancels whichever read is active, including older
history pages. Results, errors and busy-state changes from cancelled reads are
ignored even if the transport finishes later. Existing dirty-edit reconciliation,
exact scope validation and save/version conflict rules are unchanged. Cancelling
a read is not cancelling a save or rolling back an accepted server write.

Twelve actual-component cases cover late success/error, refresh failures and
retry, cancellation during JSON parsing, dirty-note preservation, and historical
paging without changing the current draft/save version. All records are synthetic;
no live reviewer history was read or written. Live browser acceptance remains open.

### Sign-in continuity and keyboard focus — 26 September 2026

All four review workspaces now offer a normal top-level sign-in link when their
initial private-record load fails. Shoulder and body links retain the currently
selected structure; nested links retain parent, study, child and exact source
hash; specimen links retain the independent model key. The helper accepts only
fixed review routes and encodes parameters, not an arbitrary return URL. Existing
unsaved-edit guards, server authorization and revision validation remain intact.
No draft, reviewer identity, approval or entitlement is transported in the URL.
Returning restores the selection, not unsaved form contents or the active track.

The result-list focus outline is inset so the rounded list's clipping does not
hide it. The normal focus treatment elsewhere is unchanged. Component/URL tests
cover all 1,575 admitted selections, hostile parameter values, all five sign-in
surfaces and loading/loaded-history states; a static CSS regression covers the
inset rule. These are not live authentication or visual keyboard acceptance.
Those checks and website integration still require the authorized live workflow.

`npm run clinical-review:test` verifies complete source coverage, unique scoped
keys, exact routes/tokens, search, malformed parameters, deterministic pagination,
binding failures and actual server page output (only framework brand wrappers
substituted). It also runs real-SQLite synthetic status/privacy/revision tests and
actual-component loading, refresh, error and cancelled-response scenarios.
Existing four review suites remain separate regression gates.
The coordination checkpoint records build, test log and recovery evidence.

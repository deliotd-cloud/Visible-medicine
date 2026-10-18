# Private decisions on frozen candidates

This extends BASE-04 for exact **root-body selections**, not all review scopes.
Use `/workspace/review-candidates` through the normal authorized review account.
An inspection-only v1 candidate stays permanently read-only. A review-enabled v2
candidate has a new content-derived identity and a separately saved renderer.

## Reviewer workflow

1. Open a review-enabled candidate and choose its saved structure.
2. Inspect the saved model and expandable teaching/source material alongside it.
3. Select 3D anatomy, Teaching copy or Imaging. Record scope, notes, evidence,
   checklist and corrections. Drafts are allowed without asserting approval.
4. Approval requires every existing checklist and blocker gate, supporting HTTPS
   evidence, role, scope and explicit personal attestation. Imaging approval is
   unavailable: this package contains no validated acquired-image registration.
5. Save explicitly. Only a validated server acknowledgement reports success.
   History is append-only; old issues cannot be silently deleted. Resolutions
   require explanations. Each track has its own sequential version.
6. On a conflict or uncertain save, retain/export the written draft, refresh saved
   records and compare before continuing. Keeping a draft resets checklist and
   attestation; it does not save. Changing structures or leaving warns about
   unsaved work. Export is a private local working copy, not an approval import.

Records belong to the currently authorized account AND institution AND candidate,
structure and track. Account-context continuity is checked on every save. They
are personal records, not institutional sign-off, learner-release authorization
or registration. Current revocation still applies to every request.

## Immutable identities

The descriptor digest includes source/material/teaching hashes, frozen worksheet
file digest, saved renderer metadata, exact checklists and supersession relation.
Track revisions derive from these frozen identities, not the mutable normal
Review build. The client regenerates and verifies its context and complete events.
No current worksheet/model fallback, decision copying or automatic transfer.

`supersedes` is a traceable candidate relationship, not an assertion that a
correction was clinically accepted. The builder requires the previous registered
candidate to have the same exact structure selection. Earlier candidates remain
accessible under current access checks; existing inspection-only bytes are not
rewritten. Wider scopes and candidate-to-candidate correction review remain open.

## Storage and local operation

`db/schema.ts` owns `atlas_candidate_review_events`; generated migration
`drizzle/0010_keen_ultron.sql` adds only that empty table. Never recreate it during
requests, seed approvals, edit applied migrations or replay unrelated migrations.
Missing storage fails with 503 and preserves the written draft. No change to the
existing mutable body-review table. Primary-session reads and atomic expected-
version appends prevent stale saves. All failures are private/no-store.

After normal checks/build, stop the owned local preview, make a verified private
copy of its stopped D1 state, then apply only the new, unapplied local migration:

```powershell
node node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0010_keen_ultron.sql
```

This is local-only; no hosted migration has been applied. Do not expose local DB
copies or private records in GitHub/source archives. Build a new package with
`scripts/build-clinical-review-candidate.mjs --output ABSOLUTE-NEW-PRIVATE-DIRECTORY
--label LABEL --review --supersedes OLD-CANDIDATE-ID STRUCTURE-ID...`, then register
its exact descriptor and use the existing local-only staging tool while preview
is stopped. Do not overwrite old packages. A private package is not a new public
license grant; preserve the bundled dependency/model notices and source limits.

## Verification limits

Synthetic UI tests, ephemeral D1 contract/API tests, source checks and a build do
not prove authenticated visual or clinical acceptance. Require the owner's real
authorized review session; never grant roles or bypass sign-in for QA. Tests must
not write real approvals. Keep BASE-04 open until remaining review scopes and
correction/supersession work are covered.

# Corrections without changing a publication

Published teaching and assessment workbooks offer a closed **Create correction
draft** control on their Studio summary and focused builder. Lectures offer it
under **Review**. Opening the control checks the exact published source; a
required reason and explicit confirmation create a separately authored draft.
The verified acknowledgement offers **Open correction draft**. There is no
automatic navigation, replacement, approval or learner access grant.

## Source and authority

The protected `GET /api/studio/workbooks/[workbook_id]/corrections` returns only
the source ID, mode, version and verified immutable manifest hash. The protected
`POST` requires that exact context, published status, a UUID request ID, reason
and confirmation. Both authenticate and use the existing Studio rate limit and
private/no-store responses. Mutations require bounded same-origin UTF-8 JSON;
unknown failures never echo SQL, content or a reason payload.

Current active account, educator role, organization, membership, Studio
entitlement and institution course ownership are checked before preparing the
copy and again at commit. Expired or malformed entitlement dates refuse. The
source workbook and manifest, copied material and audit head must still match.
A fresh audit event binds the actor, institution, source ID/version/hash, reason
and new draft ID. Every draft insert is gated by that exact new event. A request
UUID replay refuses; failures roll back rather than leaving a partial draft.
The operation uses the existing [D1 transactional batch](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch)
and schema, with no new service, permission or migration.

## What is copied

All three modes create a new workbook ID at version 1 and status **draft**, with
the acting educator as its author. The original remains untouched.

- Lecture slides come from the verified published manifest, not mutable draft
  rows. Saved anatomy pins remain exact, including stale pins that the author
  needs to correct. Existing independent review/publication checks require
  current links before release; no pin is silently updated or made navigable.
- Teaching and assessment case choices and ordering come from their immutable
  manifest. Prompt overrides are reconstructed from that manifest, not stale
  draft edits. Shared case, media, question-option and rubric material must still
  match the published source. Changed or unavailable shared resources refuse
  rather than copying a different revision under an old hash.
- Teaching blocks and polls must match the published supplemental hashes. Their
  copied records get new IDs and draft status; live poll runs/responses do not
  follow them.

Approvals, review decisions, published manifests, releases, allocations, attempts,
submissions, answers, marks, results, progress and sessions are neither copied nor
rewritten. Atlas, lecture and case access remain independent. A fresh review of
the correction is still required; the new author cannot self-approve it.

## Failure and replacement boundaries

The client validates the source and final receipt against the current editor
context. Duplicate clicks are single-flight; old handlers and late replies are
revoked after context changes or unmount. An uncertain commit keeps the reason
and request UUID, blocks automatic retry and points the educator to Studio drafts
to check current state. **Check creation status** now offers a manual, read-only
recovery check for that same request. Definite refusals require an explicit source
recheck.

### Manual recovery of an interrupted response

The protected `POST /api/studio/workbooks/[workbook_id]/corrections/lookup` reads
the original request UUID and exact source context from bounded same-origin JSON,
not a URL query. It never sends another creation request, publishes, allocates,
replaces, or writes a workbook/audit/learner record. Normal authentication,
account provisioning and rate limiting are unchanged.

A confirmation requires current institution authority and the same published
source, plus a strictly verified original audit payload/hash, predecessor hash,
target workbook and acting author. The final primary-database SELECT rechecks
authority, ownership and source in one read snapshot; no read-replication setting
changes. Direct binding queries use the primary according to the
[D1 read-replication contract](https://developers.cloudflare.com/d1/best-practices/read-replication/).
The API returns no correction reason or unrelated educator’s result.

The confirmed receipt records the historical creation (version 1 / draft then),
not the workbook’s current version, publication state, approval or access. The
explicit **Open correction workbook** link still uses normal editor authority.
An unconfirmed result, failed check, revoked authority or changed/withdrawn source
keeps creation disabled and retains the reason, UUID and source in memory. Authors
may repeat the status check or inspect Studio; unconfirmed does not mean it is
safe to create another copy. There is no polling, automatic retry, navigation or
browser storage. Reload/context changes do not persist an unfinished request.

Creating this draft does **not** supersede the original publication. Publishing
the reviewed correction, creating/reviewing an updated course release, deciding
how old links and notices work, and deliberately retiring the original remain
separate steps. Existing prerequisites and live/open attempts are not migrated.
Use the separate guarded [retirement workflow](STUDIO_WORKBOOK_RETIREMENT.md)
when appropriate; do not silently redirect existing learners to new material.
STUDIO-04 therefore remains partial on the completion checklist.

## Verification scope

Synthetic tests execute production parsers, routes, components and SQL against
the existing production DDL in native SQLite. They cover three modes, immutable
material, authority/source/audit races, strict receipts, replay, rollback and
preserved populated learner evidence. Types/build and normal Review verification
are separate checkpoint evidence. These do not prove a signed-in desktop journey,
hosted D1 behavior, clinical approval or a real workbook mutation. No owner's
publication was copied, retired or otherwise changed during development.

The recovery batch adds strict lookup/receipt, current authority/source races,
other-actor isolation, corrupted/oversized audit, target/authorship and predecessor
checks. Synthetic lookup tests assert zero database writes, including with
populated attempts/submissions/marks/progress, and UI checks assert one creation
request even after repeated manual lookups. Hosted D1 and signed-in visual
acceptance remain separate gates.

No scans, accepted masks, new media, fonts, models or dependencies are added.
The desktop clinical PACS is out of scope. Work remains local and unpublished.

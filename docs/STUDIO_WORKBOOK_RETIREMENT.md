# Governed workbook retirement

Published teaching, assessment and lecture workbooks can be retired from their
institution-scoped Studio page. Case workbooks expose a compact **Archive or
withdraw** control on the summary and focused builder; lectures expose it under
**Review**. Legacy authoring lists link to Studio instead of sending a rejected
global API action. The default `/api/app` authoring block is unchanged.

Choose a disposition, give a reason (1–1000 characters, no patient/personal
identifiers) and explicitly confirm. Routine archive refuses live teaching and
open attempts; withdrawal is an urgent access stop. Both refuse active learner
or cohort prerequisites: remove those prerequisite rules first.

## Commit and access boundary

`POST /api/studio/workbooks/[workbook_id]/retirement` accepts only the exact
shared request envelope, same-origin JSON, at most8000 streamed UTF-8 bytes,
authenticated staff and existing Studio rate limits. Request/body IDs must
match; version, published status and explicit confirmation are required.
Responses are private/no-store and nosniff. Unknown errors never echo SQL or
reason payloads. No new role, permission, dependency, fee or schema migration.

The repository checks active staff/account/organization/membership and active
Studio entitlement, institution course ownership, exact workbook version,
title/mode, prerequisites and routine-archive activity. Expiring entitlement
dates must be canonical ISO UTC timestamps and still in the future; malformed
dates refuse. All of these predicates are checked again at commit.

A D1 transactional batch conditionally inserts a fresh chain-compatible audit
event at the unchanged audit head. That unique UUID/hash gates every subsequent
write, so replay/stale requests cannot obtain side effects from an already
retired status. Any SQL failure rolls back the entire batch; a changed guard
returns409 with no retirement writes. There is no automatic retry. Success
returns the exact version/disposition/audit ID/hash/time, with no fallible
postcommit snapshot read. The UI refreshes only after validating this receipt;
uncertain responses keep the reason and instruct the user to check current state.

## What changes and what is preserved

Both dispositions retain the published workbook version number, set its status,
revoke active individual/cohort allocations, close open polls and end live
teaching sessions. Withdrawal alone voids open unsubmitted attempts. Any attempt
with a submission row is preserved, even if its state still appears open.

Cases/media, lecture and assessment manifests, reviews, progress, submitted
attempts, answers, marks/results and course release evidence are not deleted or
rewritten. Independent lecture/case/Atlas entitlements are not changed. Existing
delivery checks require a published workbook for new learner playback; browser
content already loaded cannot be recalled. This feature does not implement
published revision correction/supersession, prerequisite migration or legal
record retention policy.

## Verification and release limits

Focused tests run actual production SQL against native SQLite with production
DDL, including authority/activity/audit races and rollback at every batch stage.
Actual route/parser tests cover origin, UTF-8/body bounds, strict envelopes,
authentication/rate limits and private errors. UI tests cover exact acknowledgements,
single-flight/stale completions and retained drafts. These are synthetic tests,
not a mutation of an owner's workbook, a Cloudflare hosted D1 end-to-end test,
signed-in browser acceptance or clinical sign-off. No real workbook was retired
while developing this milestone. Signed-in desktop workflow and institution
policy review remain release checks.

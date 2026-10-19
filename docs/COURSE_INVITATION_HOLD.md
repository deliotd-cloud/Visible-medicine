# Temporary invitation self-enrolment hold

Invitation self-enrolment is disabled during private evaluation by the literal
`INVITATION_SELF_ENROLMENT_ENABLED = false` in `lib/course-enrolment-policy.ts`.
There is no environment or client override. The server returns HTTP 409 after resolving
an invitation-access release, before looking up its code or granting enrolment,
workbook assignments/rules, success audit or notification outbox. The course
control clearly displays unavailable invitation enrolment without a code input.
The invitation landing page surfaces the hold before sign-in or profile-completion
prompts for non-enrolled visitors; it does not lead them through a disabled path.

Existing enrolled or instructor-assigned course access is unchanged. Existing
learners retain Continue course. Free-course enrolment and verified institution
membership enrolment remain available; institution nonmembers remain denied.
Atlas, cases and paid lectures retain their independent access policies. This
change does not modify clinical approvals, publication status or existing data.

The hold mitigates a reproduced source defect: concurrent requests can both read
the last invitation use, receive active grants and return success, although one
final capacity update affects zero rows. A failing final update also leaves
grants persisted; repeated requests can consume additional uses. The original
actual-export/in-memory SQL reproduction is retained in the coordination evidence.
No private deployment exploitation or patient data was observed.

## Preserve existing allocations on learner retries

The same server path previously also rewrote assignments during free and
institution enrolment. Learner self-enrolment now leaves existing enrolment,
assignment and rule fields intact. A non-active existing course enrolment returns
409 and requires instructor review; the learner cannot reactivate it. Existing
workbook revocations, availability dates, expiry, prerequisites, assigning actor,
due date, timestamps and versions are preserved, including an absent rule row.

Fresh assignments use conflict-do-nothing insertion. Rule creation selects only
the newly generated assignment ID in the same D1 batch, so an instructor who
creates an allocation after the empty lookup retains that allocation and its
rules. No orphan rule or unrestricted replacement is created. This requires the
declared unique assignment key; target schema/index verification remains open.

This is not a complete atomic enrolment repair. Free/institution enrolment still
has separate writes and can repeat audit/notification rows; no exactly-once email
claim is made. Course-level uniqueness, concurrent requests and real D1 lifecycle
remain separate migration/acceptance gates. Existing restricted workbooks may
remain inaccessible after enrolment; only the instructor can resolve their rules.

Verification from the website root:

```sh
node --test tests/course-invitation-hold.test.mjs tests/course-invitation-page-hold.test.mjs
```

The focused tests load actual current server, access policy and React component
modules. Synthetic service boundaries and disposable in-memory SQLite execute
the actual SQL. Thirty-nine checks cover the hold and UI, free/institution routes,
twenty-two allocation/retry cases, and actual workbook/case-access preservation.
The first twenty new regression cases failed against the saved preceding server before
the repair. The concurrent instructor case is an explicitly scheduled synthetic
interleaving; two further cases preserve concurrently created allocations without
rule rows. Neither is hosted concurrency acceptance. Tests make no remote requests or
real email deliveries. These are local
software checks, not deployment, clinical or full database-lifecycle acceptance.

Invitation self-enrolment is **unavailable**, not repaired. Re-enablement requires
a separately reviewed atomic redemption-ledger transition: validate exact release,
active/unexpired invitation and capacity inside the same atomic operation as all
grants; zero-row capacity admission must grant nothing; failures must roll back
capacity and access; retries must be idempotent. Preserve assignment restrictions
and independent entitlements, and make outbox/audit success contingent on genuine
admission. Do not enable through configuration or consume quota outside atomic
rollback. Migration/schema parity and private-deployment lifecycle remain separate
open gates.

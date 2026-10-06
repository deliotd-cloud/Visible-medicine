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

Verification from the website root:

```sh
node --test tests/course-invitation-hold.test.mjs
```

The focused tests load actual current server, access policy and React component
modules. Synthetic service boundaries and disposable in-memory SQLite execute
the actual SQL. Seven server scenario groups and six rendered UI variants cover
the hold, concurrent requests, unchanged free/institution routes and existing
Continue. They make no remote requests or real email deliveries. These are local
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

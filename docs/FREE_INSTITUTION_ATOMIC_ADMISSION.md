# Free and institution course admission

The existing free/public and active-institution paths now commit enrolment,
new workbook allocations, their own rules, the chain audit and a held
notification in one conditional five-statement D1 batch. Workbook count no
longer increases statement count or SQL parameter count. Existing instructor
allocations, restrictions and versions are not revived or relaxed.

SQL rechecks the current release/access/membership, trusted active account and
current nonempty consent, the existing computed onboarding policy, exact
published workbook set, active enrolment and allocation completeness. Each
write refuses an unsupported main-schema trigger profile on the five fixed
write tables. The audit's NOT NULL constraint makes failed prerequisites roll
back; all writes also have the trigger gate so ignored audit/outbox statements
cannot leave new access. Nullable outbox organisation comparisons are NULL-safe.

Audit-head collisions retry at most five times. An ambiguous batch response is
checked against this attempt's audit ID, sequence, hash and reason, not an old
outbox. Unknown commit outcomes still need operational reconciliation; there
is no claim that a postcommit exception reverses an already committed batch.
The deterministic outbox accepts only the exact organisation/recipient/template/
payload in a reusable held/sent state. Email follows commit. Failed delivery
stays held; provider acceptance or concurrent retries can duplicate delivery.
This is at-least-once retry state, **not exactly-once email**.

## Evidence and boundaries

- The exact old function reproduced partial grants after audit/outbox faults.
  E-only V1/V2 negatives additionally retain ignored-trigger, binding-limit,
  NULL-organisation and empty-consent failures. They are not passing evidence.
- The final V3 proposal passes 65 bounded SQLite checks. A separate native D1
  instance replayed all nine **committed** migrations 0000–0008 and passed 32
  selected checks. Its 500-workbook admission uses five statements and at most
  36 bound values, preserving a revoked instructor allocation and its rules.
  Account, bootstrap and email service seams are explicitly synthetic; the
  fixture is not a hosted target or real patient/account database.
- Canonical tests compile the actual current application, without replacing its
  write block. The older invitation/allocation suite uses a minimally amended
  fixture for the new audit contract and models an instructor winning before
  the atomic batch; its restrictions/access assertions remain intact.

Staging evidence is in
`E:/VisibleMedicine-LocalStaging/20261006-free-admission-native/` and
`20261006-free-admission-integration/`. The source change uses no new dependency,
media asset, migration, paid service or patient data. Cloudflare's
[D1 batch contract](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch)
supplies failure rollback; it does not certify the target's schema/data or costs.

Before production, verify target constraints/triggers, migration identities,
whole audit chain and relevant account/release/outbox data; genuine hosted
identity/consent and publication/version/rights; the complete worker invocation
budget and deployment plan; and reconciliation/delivery operations. A constant
admission batch is not a full free-tier or first-bootstrap capacity guarantee.
Invitation self-enrolment remains literally disabled; pending 0009/journal,
paid checkout, clinical approvals and independent Atlas/case/lecture access
remain unchanged. This is local hardening, not a release-gate approval.

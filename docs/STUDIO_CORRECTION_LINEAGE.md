# Draft correction source and next steps

Studio's workbook summary and current teaching/assessment/lecture editors offer a
closed **Correction source and next steps** disclosure for a draft. Opening it or
choosing its check button explicitly verifies the original published source and
current Studio authority. A verified result shows its exact version/publication
hash and ordinary review, publication and course-release steps. Source approval
does not transfer. Creating a correction does not replace/retire its source or
redirect existing learners, allocations or attempts.

This currently covers the original audited correction actor with current draft
authorship and institution access. Ordinary drafts, unavailable/corrupt lineage,
other educators and non-draft workflow states receive no source link. It is not
a general revision-history browser or a completed replacement/notices policy.

## Current editor state

The focused builder uses its live workbook state, not a duplicate page-level
control. Source identity, version, status, actor/institution and permission-context
changes retire old checks. Save, review submission/decision, publication, reopen,
reload, retirement and workbook-switch operations invalidate previous results.
Pending operations block checks; success or failure requires a fresh explicit
check. An editor-local external store tracks overlapping operations. Committed
effects, keyed instances, cancellation and ticket/context guards refuse stale or
abandoned-render handlers and late replies. No polling, auto-creation,
auto-publication, browser persistence or automatic navigation is added.

## Protected read-only lineage

`POST /api/studio/workbooks/[workbook_id]/correction-lineage` requires bounded
same-origin JSON with exact draft ID/version/mode. Existing authentication and
Studio rate limiting remain; account provisioning/rate limiting may write their
ordinary records. The lineage repository itself adds no workbook, audit or learner
mutation. Do not call the whole HTTP workflow side-effect-free.

Current active account, educator role, institution membership/entitlement,
course ownership and current draft authorship are rechecked. The existing audited
creation verifier proves the source/request/target relationship. Exact initial
audit and published-manifest snapshots are also hash-verified, then a final
parameterized SELECT rechecks authority, source, target, uniqueness and those
snapshots together. Private reasons and unrelated educators' material are not
returned; the response is minimal and private/no-store. D1's direct `prepare`
binding uses an always-primary session in its [official implementation](https://raw.githubusercontent.com/cloudflare/workerd/main/src/cloudflare/internal/d1-api.ts);
this change does not enable replication or alter platform configuration.

## Verification and remaining gates

Focused tests cover all three modes, exact receipts, authority/source/audit races,
malformed/oversized evidence, unchanged populated learner records, single flight,
live editor transitions, late replies and unmount. Four older lecture harnesses
receive only a shallow component boundary and committed-layout-effect simulation;
their original test bodies are preserved byte-for-byte in non-compilable archives.

Full canonical type/build and normal Review checks belong to the integration
checkpoint. A sanitized candidate deliberately omits private source-comparison
asset modules and cannot alone prove the full website typecheck. Synthetic checks
and code review do not establish hosted-D1, signed-in desktop, clinical or release
acceptance. No actual owner protected API/database call, clinical approval,
patient registration, scan/mask/model edit, new dependency/font/asset/fee/schema/
permission, public deployment or GitHub backup is conferred. Atlas/case/lecture
access and desktop clinical PACS remain separate. STUDIO-04 remains partial and
the complete website/Atlas roadmap remains active.

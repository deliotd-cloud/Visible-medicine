# Native MRI guide teaching review

Local-only implementation, 14 October 2026. Existing administrator/institution
authorization and private storage remain unchanged. No new database, migration,
Cloudflare resource, dependency or paid service was created.

## Where to review

Clinical Review inbox → **Native MRI guide teaching**. The five knee guides
also appear as individual status rows in the **Native MRI guide teaching** area:
cruciate ligaments, collateral ligaments, menisci, extensor mechanism and
posterior knee. The prior 50 head/source-comparison rows remain in place; these
five rows bring the extra first-page catalogue to 55, within its existing bound.
The regional MRI inspection page retains its existing Clinical Review inbox
link, which leads to the guide teaching catalogue. Its protected renderer input
was restored byte-exact rather than invalidating model review for a navigation link.

Each selected worksheet displays its exact ordered captions, references, public
structure IDs, authoring revision and independently calculated full-content
SHA-256. It does not need to open a scan or disclose a private scan identity.
Existing native viewer candidates, ownership/focus functions, five guide
definitions and 12 steps are unchanged. Only source-free authoring metadata is
newly exposed to the protected teaching catalogue.

## Decision scope

The form records **In progress**, **Changes required**, or **Teaching wording
approved**, privately for the signed-in account and institution. Approval needs
four checks and explicit clinical-reviewer attestation. Editing wording/checks,
restoring saved text, or starting a new review does not carry attestation forward.
No approval was entered by an agent during implementation.

A teaching-wording decision does not approve MRI annotations or extents, source
mask boundaries, 3D correspondence, patient registration, publication, learner
release or clinical use. Annotation acceptance cannot approve guide prose.
This personal record is not a blanket shared release or a professional-credential
verification system. The owner still controls clinical and release sign-off.

## Revision and recovery behavior

- Public review URLs require the exact region, guide ID and content SHA-256.
  Unknown, duplicated or extra selections fail closed. A known stale selection
  withholds current captions and shows a read-only recovery shell, not a nearest
  guide or substituted text. The same unkeyed review component can retain its
  in-memory copy during a soft source refresh; external retirement blocks all
  API activity, editing and saving. A hard reload cannot recover unsaved memory.
- The storage namespace is separate from anatomical, reference-teaching and
  imaging review namespaces. A stable region/guide history retains prior
  revisions; old approvals appear as **Re-review required**, not current approval
  and not an empty history. Every save is bound to the current full context.
- Append-only, optimistic version checks prevent another tab's save being
  overwritten. A conflict retains the working copy and requires explicit
  comparison/rebase. Unconfirmed saves cannot be automatically retried.
- Refreshing or loading older history does not replace unsaved text. A clean
  form can explicitly restore the latest saved review; restoration clears
  attestation and an older revision starts a fresh review instead of approval.
- Source/account changes retire saving. Pending reads/saves are aborted and late
  callbacks ignored on closing, context change or unmount. Before leaving a page
  with unsaved/uncertain work, a browser warning is requested.
- **Export notes only (.txt)** saves only the working note text, not the decision,
  checks, attestation or version. Keep that private local file securely. It is not
  a full decision backup. Saved append-only history is the decision record.

## Technical boundary and checks

Packet/resolver: `lib/regional-guide-review.ts`. Contract/API/store are separate
from the native package and scan correction contracts. Protected requests reuse
`runClinicalReview`, server-derived opaque account/institution keys, the existing
CSRF/context guard, bounded JSON bodies and the existing D1 prepared-statement
table. No permissions or authentication bypass was added. Official D1 prepared
statement and `withSession('first-primary')` documentation was checked; stale
skill examples suggesting session timeouts/close were not applied.

Tests use real authored packets, in-memory SQLite with the existing migration,
the actual route/access wrapper, status adapters and a synthetic component
harness. These are not live private saves, signed-in/browser/GPU acceptance or
clinical/release approval. Original source scans/masks and specialist boundaries
remain untouched. Broad UI redesign remains unapplied.

Evidence and scoped recovery, when terminal proof exists:
`F:/VisibleMedicine/staging/20261014-native-guide-review/terminal-checkpoint.json`
and `F:/VisibleMedicine/recovery/checkpoints/20261014-native-guide-review`.
This is not a new GitHub, off-device, private-data or full-project backup.

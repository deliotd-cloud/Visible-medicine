# CT-only comparison decisions

The six CT-only skull-bone comparisons now have individual private review forms
in Clinical Review → Head learning → CT-only skull bones. Open a bone's evidence,
inspect its CT and 3D links, then choose **Review … comparison**. The form and its
private history load only on request, avoiding six eager fetches and a crowded
page. Existing generated atlas geometry/review assets are unchanged.

## Deliberately narrow scope

Each concept has its own account-and-institution-private version stream. The
context binds the exact approved head-package manifest, independent comparison
packet revision, concept, checklist wording/version and attestation. No original
25-concept teaching note, MRI note, insula or globe decision can approve a CT bone
comparison. Packet revision remains
`084e59bd489af3f913a7f757c738d0b71ca2f0f69a00e6bd1140f611c3865605`.

Supported states are draft, changes-required and accepted-semantic. Acceptance
requires reviewer name, self-reported qualification, all four checks and explicit
attestation. This records a personal review of an educational semantic link,
**not** institutional sign-off, geometry validation, patient-space registration,
diagnostic suitability, teaching approval, publication approval or access rights.
Every context explicitly retains false clinical/publication/registration flags.
No real clinical decisions were created during development.

History is never overwritten or repinned. A later draft or correction supersedes
an earlier acceptance. Any changed source, packet, checklist or attestation makes
an old decision stale. Historical wording remains visible as recorded. Callers
must evaluate only the latest confirmed unpaginated history event, never search
older pages for an acceptance.

## Storage and authorization boundary

The store reuses `atlas_personal_nested_review_events`, with an independent
namespace and concept-specific key. There is no schema, migration or permission
change. A single conditional insert checks the latest version atomically;
competing saves cannot overwrite each other. History validates its database
envelope against the recorded context and fails closed on mismatch.

The `/api/atlas-review/head-ct-bone` route wraps the service with
`runClinicalReview` before calling it. The wrapper enforces current active
administrator/institution membership, derives storage identity server-side and
requires the loaded account/institution context before POST. Client-supplied
identity headers alone are not authorization. The body reader enforces same-site
origin, JSON and size limits. The service rejects unexpected fields, stale
contexts, invalid cursors and save conflicts; it does not log notes or identities.

## Verification

Focused contract and guarded-service tests use a disposable Miniflare/D1 worker,
the real website authorization wrapper and existing review-table migration.
They cover strict per-item identities, complete attestation, expiry, correction
supersession, authorization denial, account/institution and per-item isolation,
stale/altered context, origin/type/body-size checks, concurrent writes, pagination,
storage failure and corrupt-envelope refusal. Synthetic identities and decisions
remain in the disposable test database only. Existing CT evidence and independent
MRI/original teaching contracts are regression tested. Fresh TypeScript passes.

The real route is covered by the isolated authorization/D1 integration test.
Form interaction tests cover incomplete acceptance, renewed attestation on load
or edit, correction saves, uncertain responses, exact response validation, changed
source/session, explicit recovery and late responses after unmount. Existing MRI
notes, working copies and head-review navigation are regression checked. All 42
focused tests, fresh types, unchanged Clinical Review verification and the local
website build pass. Local HTTP checks confirm the mounted endpoint rejects
unsigned GET/POST and the protected page withholds review evidence. Signed-in
browser and radiologist acceptance remain separate from automated tests.

## Input preservation and remaining validation

The form preserves edits on authorization/source/conflict errors and uncertain
save responses. It validates success envelopes and never retries writes or
silently rebases onto new sources. Refreshing history alone cannot resolve an
uncertain save: preserve the working copy, compare history, then explicitly load
an entry or start fresh. A changed source or account requires page reload. Loading
accepted history clears attestation, and any edit requires it to be checked again.
Keyboard focus moves into the opened form; leaving with unsaved edits warns.

The working-copy download is private, local JSON, explicitly not a saved decision
or approval. It preserves incomplete form text and source context without uploading
anything. A requested download is not confirmation that the browser saved it.

Authenticated browser acceptance and radiologist decisions remain outstanding.
Insula, globe and MRI comparison decisions are not implicitly enabled by this
six-bone workflow; implement their independent contexts and tests separately.

# Insula and globe comparison reviews

Clinical Review → Head learning now provides an on-demand private review form
inside each left/right insula and globe comparison. Inspect the CT, MRI and
existing generic 3D links, then choose **Review … comparison**. Opening the page
does not fetch four private histories or expose four large forms at once.

## Independent evidence and decisions

The contract admits only `cortex-left-insula`, `cortex-right-insula`,
`orbit-left-globe` and `orbit-right-globe`. Every context binds its concept to the
correct independent comparison packet, exact head manifest revision, checklist
wording/version and attestation. Existing packet verifiers check CT/MRI identities,
laterality and generic parent/part or eyeball sources; they are not bypassed.

- Insula comparison revision: `000ef8732b522db2396d7315727c18d7d09b79e5b9916bba381450fe730d11c1`.
- Globe comparison revision: `46dad07e2b98482755eef0bccc84002f26d1626bb9b7996735755f55a70ee382`.
- MRI representations remain partial masks. Native and generic representations
  are different, unregistered subjects; matching boundaries are not implied.

Draft, correction request and accepted-semantic states reuse the CT-bone review
interaction pattern. Acceptance requires all checks, self-reported reviewer and
qualification, and explicit personal attestation. It does not approve anatomy
geometry, clinical use, registration, teaching, guided learning, publication or
access. Existing teaching and guided-learning sections remain independent drafts.
No real clinical decisions are created by implementation or testing.

Each concept has its own append-only account/institution-private history. CT-bone,
original head-teaching and MRI-only histories retain their separate namespaces and
contracts. Insula contexts cannot name a globe packet or vice versa. Changed
revisions or review wording expire previous acceptance without rewriting history.
Later drafts or corrections supersede earlier acceptance. Only the latest confirmed
history entry can represent the current decision.

## Reliability and access

The real `/api/atlas-review/head-paired-comparisons` endpoint uses the existing
`runClinicalReview` authorization and account/institution continuity checks. A
client identity header is not authorization. Same-site JSON requests, strict body
limits/fields, exact current contexts and atomic version-checked inserts are
required. No schema, role, membership or access policy is changed.

The UI preserves edits on uncertain saves, conflicts and changed sources/accounts.
Writes are never retried automatically. Refreshing history alone does not rebase
or unlock an uncertain edit; explicitly compare history, preserve the working
copy and load an entry or start fresh. Changed source/account requires a reload.
Loading an accepted entry or editing it clears attestation. The private JSON
working copy preserves unfinished text but is not a server-saved decision or
approval. Keyboard focus moves into the opened form; unsaved edits warn on exit.

## Verification and limits

Focused tests exercise contracts and the real guarded endpoint in disposable
Miniflare/D1 storage, including CT-bone namespace isolation, independent globe and
insula versions, unauthorized access, stale/malformed requests, complete
attestation, competing saves, pagination and corrupt envelopes. Form tests cover
uncertain/mismatched responses, corrections, working copies, source changes,
re-attestation and unmount safety. Existing CT-bone forms, protected page and review
navigation are regression checked. Synthetic records never touch live review data.

All 44 focused checks, fresh types, local build, unchanged 1,203-input generated
Review verification, 47 HTTP checks and unsigned endpoint denial pass. Signed-in browser acceptance and
the owner's radiologist decisions remain separate. No scan, mask, model or
specialist boundary is modified, and nothing is publicly deployed. Existing Sites
layout, persistent private storage and authorization patterns are retained without
new dependencies or paid services.

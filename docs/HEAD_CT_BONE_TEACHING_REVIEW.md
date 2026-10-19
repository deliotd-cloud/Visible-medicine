## Checkpoint — 9 October 2026: independent CT-bone teaching review

Protected Clinical Review now offers a separate, lazy **Review [bone] teaching**
button beside each of the six CT-only skull-bone notes. Reviewers can save a
draft, request corrections or explicitly accept the exact educational teaching.
This does not approve comparisons, geometry, masks, guided tours, MRI, clinical
use, patient-space registration, publication or access. No real approval was
recorded. Reviewer qualifications remain self-reported.

Each append-only personal decision binds the concept, head source, comparison
revision, teaching revision, checklist and attestation. Teaching remains pinned
to `2a15fac2f81c3bd68324a4f3a32faaeb8ef477b0acfb1181c676a962ed7a7137`.
The existing account/institution authorization guard supplies storage identity.
Independent namespaces prevent comparison history from approving teaching.
Atomic expected-version checks reject concurrent overwrites; old revisions stay
readable but cannot be resumed as current. Failed or uncertain saves lock further
writes until explicit recovery. Edits clear attestation, and loading a previous
accepted version requires fresh attestation. Private working-copy downloads
preserve unfinished text without claiming a server save or granting approval.

The existing database table is reused: no migration or access change. Closed
items do not load six extra forms or histories. Exact source, content and
existing comparison/tour digests remain unchanged.

Verification: 50 focused tests, TypeScript and the isolated E website build.
The backend suite executes the production API/store and existing migration SQL
against real in-memory SQLite: version races, separate account/concept histories,
comparison isolation, forged and stale payloads, pagination and corrupt stored
envelopes. Its first Miniflare fixture failed at startup; the same error occurred
with a minimal standalone worker before any request. Diagnostics are retained.
SQLite tests are not authenticated workerd write acceptance. Seven real local
route/access checks include signed-out GET/POST refusal on the new endpoint.

Browser QA uses the actual form and lazy panel with synthetic in-memory transport:
keyboard focus, refused incomplete acceptance, explicit test-only acceptance,
edit-triggered re-attestation and a later correction superseding it. No real
account, review record or patient data was used. Authenticated owner persistence
remains a separate acceptance check, not a reason to stall independent work.

Recovery and evidence:
`E:/VisibleMedicine-LocalStaging/20261009-ct-bone-teaching-review/saved-state.json`.
The local preview is on port 3000. All 60 unrelated specialist files and full
shared-plan tails are preserved. Only 144 redundant generated build-output model
copies were removed after verifying existing E recovery copies; canonical models
are unchanged. Sites local-only and the existing pinned Wrangler preview were
used. No public deployment, source scan/mask edits, desktop PACS changes, fees,
dependencies or permissions changed. E recovery is same-machine, not verified
GitHub/off-device backup. Full goal active. Next: continue substantive regional
anatomy/teaching and linked learning; retain authenticated review persistence and
loaded-model/GPU acceptance as separate verification gates.

# Elivion Education integrated platform architecture

## Product surfaces

| Surface | Route | Purpose |
| --- | --- | --- |
| Platform home | `/` | Discover Atlas, Courses and Studio |
| Atlas | `/atlas` | Reviewed radiological anatomy and linked explanations |
| Course catalogue | `/courses` | Official and institution course discovery |
| Learning runtime | `/learn` | Authenticated teaching, examination and review |
| Studio | `/studio` and `/learn?view=authoring` | Course, workbook, case, question and live-teaching workflows |
| Institution workspace | `/workspace` | Membership, entitlements, usage, reporting, integrations and publication control |
| Embedded delivery | `/embed` | Origin-restricted delivery contract and activation boundary |
| Trust centre | `/trust` | Intended use, content governance, accessibility and clinical separation |

The learning runtime retains the proven lightweight education-viewer interaction model while presenting Elivion Education as the user-facing product. Didanix remains the separate clinical PACS name.

## Runtime hierarchy

`Organisation → Course → Module → Workbook → Case → Series/slide → Scene/question`

- Courses organise institution or Elivion-owned learning.
- Modules group a pedagogic sequence.
- Workbooks are versioned teaching or assessment experiences.
- Cases group all linked questions and publication-cleared media.
- Immutable assessment manifests freeze the exact workbook policy, case order, media identifiers, prompts, marks and viewer-core version used for an attempt.

## Persistence domains

- **D1 learning domain:** users, roles, courses, modules, workbooks, cases, questions, cohorts, assignments, attempts, answers, submissions, marks, moderation, results, teaching sessions, polls, bookmarks, audit and learner progress.
- **D1 platform domain:** organisations, memberships, plan entitlements, approved embed origins and the education publication register.
- **R2 media domain:** education-only quarantine and later publication-cleared image derivatives. D1 stores the corresponding workflow metadata.
- **Durable Object live channel:** workbook-scoped revision notifications only. D1 remains authoritative; answers, notes, selections and viewer state are not stored in the live channel.

## Identity and authorization

- The private preview uses dispatch-owned ChatGPT sign-in for authentication.
- Newly provisioned production accounts are learner-only.
- A named owner-private evaluation allowlist may receive the full demonstration role set so the private product can be evaluated.
- Learner, instructor, examiner and administrator projections are enforced server-side by the runtime.
- Production institution identity requires a separate OIDC registration, organisation claims, role mapping, enrolment mapping, revocation and lifecycle evidence.
- Organisation tables are implemented, but full tenant enforcement across every imported runtime query remains a production hardening gate and must be completed before multiple real institutions share one deployment.

## Hosted and embedded delivery

- Hosted courses run first-party at `/learn` and use the complete education workspace.
- Institutions can record exact approved HTTPS origins against an embed-enabled entitlement.
- Recording an origin is an evaluation control, not public activation.
- Production embedding additionally requires short-lived signed launch tokens, audience and origin validation, replay prevention, key rotation, institution terms and a reviewed browser security policy.

## Atlas and publication flow

Atlas and Courses link in both directions: Atlas modules open relevant course pages; course launches open the full learning runtime; the runtime provides a direct Atlas reference route. Public or institution-published resources are also represented in a publication register.

The required publication state machine remains:

`draft → quarantine → de-identification verified → rights verified → annotation → specialist review → editorial QA → accessibility QA → published → superseded/withdrawn`

The private preview contains synthetic demonstration media. Real imaging must not enter public or learner routes until the accountable publication evidence exists.

## Commercial controls

The platform persists plan state, learner and educator limits, managed-storage allowance and Atlas, Studio, reporting and embed entitlements. This is an entitlement foundation, not payment processing. Production charging still requires approved prices, contracts, tax, invoices, refunds, support ownership and a payment or billing provider.

No education entitlement grants access to Didanix PACS or any clinical environment.

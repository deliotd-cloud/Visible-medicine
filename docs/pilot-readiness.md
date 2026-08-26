# Controlled pilot readiness

This implementation is deliberately **not activated for a real pilot**. It provides a testable product surface for learner, educator and institution workflows while external identity, email, billing, malware screening, observability and LiveKit Cloud credentials remain disabled by default.

## What can be evaluated locally

- Learner course search, filtering, recommendations, syllabus views and resume links.
- Education-only learner profiles, enrolment, progress, review queues, completions and certificates.
- Studio templates, empty-shell duplication, device-local draft recovery, publication checklists, immutable release snapshots and learner previews.
- Institution pilot briefs, organisation-scoped people and role management, bounded roster invitations and progress CSV export.
- Account data export, notification preferences and queued correction, restriction or deletion requests.
- Draft privacy, terms, acceptable-use and accessibility pages awaiting approved legal and contact details.
- Operational readiness evidence covering identity, tenancy, medical content, privacy, accessibility, security, operations and commercial controls.
- End-to-end live-teaching discovery, Follow Me synchronisation, polls and the recording-free video-classroom interface in a credential-disabled state.

## Controls that remain locked

- `activationAllowed` is hard-coded to `false` in the readiness snapshot.
- Invitation email is held in the notification outbox; the one-time invitation path is displayed only to an authorised organisation administrator.
- Production identity, email, billing, media screening and observability adapters are configuration indicators only. Adding an environment value does not activate them.
- The video classroom cannot connect until an approved LiveKit Cloud project is configured. Recording and LiveKit Egress are not implemented.
- Clinical connectivity is prohibited, and no workflow accepts patient records or clinical worklists.
- Draft policy pages are not represented as approved legal documents.

## Before a real pilot

1. Replace request-time schema assurance with reviewed deployment migrations and controlled fixtures.
2. Complete organisation-isolation and permission tests against a representative D1 test database.
3. Select and integrate approved identity, email, media-screening and monitoring providers.
4. Approve legal entity details, privacy notices, terms, retention rules and learner-rights procedures for the launch jurisdiction.
5. Load only publication-cleared, de-identified media and complete specialist, editorial and accessibility review.
6. Run accessibility, security, backup/restore, incident-response and content-withdrawal exercises.
7. Agree pilot support, onboarding, measurement and exit criteria with each participating institution.

Commercial activation and public registration should remain separate later decisions. Billing must stay disabled until contract, tax, invoice, refund, entitlement and support processes have named owners and approved evidence.

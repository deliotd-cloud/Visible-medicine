# Elivion Education production plan

## 1. Product model

Elivion Education should be a standalone Elivion platform, not a branch or screen inside the future clinical PACS. It combines a public learning destination with a paid institutional teaching product while maintaining an unmistakable education and research intended use.

The recommended experience has five connected zones:

1. **Atlas** — reviewed, searchable radiological anatomy organised by region, modality, plane and structure.
2. **Courses** — Elivion learning paths plus private institutional courses.
3. **Studio** — a gated authoring and delivery workspace for verified educators and organisations.
4. **Institutions** — organisation workspaces, roles, enrolment, reporting and support.
5. **Research** — provenance, versioning, citation, dataset and collaboration information.

“Elivion Education” is the working umbrella name. Atlas, Courses and Studio are product capabilities beneath it. Didanix is reserved for the future clinical PACS.

## 2. Architecture and ownership

| Capability | Owning domain | Integration rule |
| --- | --- | --- |
| Anatomy catalogue and public routes | Elivion Education Atlas | First-party, versioned publication records |
| Image-viewing primitives | Shared non-clinical viewer package | Released independently from clinical viewer code |
| Course authoring and assessment | Elivion Education Studio | Courses consume immutable published releases |
| Institutional enrolment and roles | Education identity and entitlement service | Organisation-scoped claims; no clinical tenant reuse |
| Learner bookmarks and progress | Elivion Education | Separate database and retention policy |
| Medical media | Education media pipeline | Publication-cleared derivatives in separate storage |
| Clinical workflow | Didanix PACS | No runtime, identity, database, entitlement or release coupling |

Share only deliberately versioned, non-clinical viewer primitives. Clinical tools must not enter the education bundle. Security fixes may flow between packages, but product features, validation and releases remain independently controlled.

## 3. Institutional commercial model

Use a staged model rather than inventing permanent pricing before pilot evidence exists:

- **Explorer:** limited public Atlas and course discovery.
- **Individual:** annual learner subscription for the full published Atlas, official courses and progress tools.
- **Institution:** annual platform licence with a private workspace, Studio, learner/educator roles and reporting.
- **Enterprise:** contracted multi-organisation, identity, LMS, storage, support and governance requirements.

An institutional quote should use transparent inputs: active learner band, educator/admin band, publication-cleared storage, SSO/LMS integration and support tier. Billing must not launch until entitlements, tax, invoicing, refunds, contract terms and support ownership are implemented. Payment never grants clinical Didanix access.

## 4. Medical-content production

Every Atlas module or institution-published resource should move through:

`draft → media quarantine → de-identification verification → rights verification → annotation → specialist review → editorial QA → accessibility QA → published → superseded/withdrawn`

Required evidence for every published medical resource:

- source and licence or contributor agreement;
- confirmation that direct and indirect identifiers are absent;
- modality, body region, plane, acquisition context and normal-variant notes;
- structure hierarchy, synonyms and terminology identifiers where licensed;
- named specialist reviewer and review date;
- references and last substantive revision;
- immutable published version plus correction and withdrawal paths.

Do not accept arbitrary learner uploads into public Atlas or Course catalogues. Educator media enters a quarantined Studio workflow and becomes public only after a separate publication decision.

## 5. Identity, tenancy and embeds

- Public Atlas browsing can remain anonymous.
- Bookmarks, progress, enrolment and assessment require learner authentication.
- Learner, educator, reviewer, publisher and organisation-admin roles are distinct.
- Every private object carries an organisation identifier and is denied across tenant boundaries.
- Education identities and entitlements remain separate from future clinical identities.
- Embed tokens are short-lived, origin-restricted, audience-restricted and scoped to one published course or workbook.
- Self-service public publishing remains disabled until moderation, takedown, rights and abuse procedures exist.
- Add SAML/OIDC and later LTI 1.3 only through institution-specific, audited configuration.

## 6. Data, privacy and security

Store only data required for learning. The initial progress model contains a user identifier, resource type, resource slug, percentage, last position and update time. Add analytics only after controller, lawful basis, retention, consent/cookie position, subject-access and deletion workflows are agreed for launch jurisdictions.

Before public registration, publish jurisdiction-specific privacy, terms, acceptable-use, content, cookie and contact information using the real Elivion legal entity and approved details. Do not invent those details in the application.

Required production controls include organisation-level authorisation tests, signed upload URLs, malware screening, quarantine, encryption, audit events, secrets management, dependency review, rate limiting, backups, restore exercises, monitoring, incident response and a documented content-withdrawal procedure.

## 7. Intended-use controls

- Repeat “education and research only” at site, viewer, upload, export, embed and commercial boundaries.
- Avoid diagnostic claims, reporting templates, patient worklists, clinical priors, patient messaging and treatment recommendations.
- Use synthetic or publication-cleared media only.
- Keep annotations educational, cited and reviewer-attributed.
- Separate clinical and educational naming, identity, infrastructure and release processes.
- Complete specialist, accessibility, security and privacy review before public launch.

## 8. Delivery phases

### Phase A — implemented private foundation

- Elivion Education umbrella brand and clear Didanix PACS separation.
- Home, Atlas, Courses, Studio, Research, Institutions, Plans and learner routes.
- Interactive generated Atlas demonstration.
- Integrated authenticated learning runtime with teaching, examination, review, authoring, live delivery, marking, reporting, integrations and audit workspaces.
- Authenticated progress APIs and a consolidated D1 schema.
- Organisation membership, role, entitlement, publication and embed-origin foundations.
- First-party hosted course delivery, institution workspace and trust centre.
- Responsive system, metadata, social image and owner-private hosting.

### Phase B — real Atlas pilot

- Select one bounded module, recommended: normal CT head.
- Secure publication rights and de-identification evidence.
- Build DICOM-derived media processing, thumbnails and manifest format.
- Create the structure ontology and annotation workflow.
- Complete dual specialist review and editorial QA.
- Replace the demonstration scan with the reviewed module.

### Phase C — Studio and tenancy hardening

- Extract the integrated runtime into versioned non-clinical packages without changing its behaviour.
- Replace the owner-private evaluation identity with approved institution OIDC and organisation claims.
- Enforce organisation scope on every course-runtime query and mutation, including authoring, media, enrolment and reporting.
- Replace request-time schema assurance and synthetic seed data with deployment-time migrations and controlled fixtures.
- Add production signed launch-token issuance after key-management, expiry, replay and origin-policy review.

### Phase D — controlled institutional beta

- Pilot with a small number of institutions and bounded cohorts.
- Test accessibility, performance, security, privacy, support, moderation, backups and recovery.
- Measure learner engagement, educator authoring time, storage, support load and willingness to pay.
- Use the evidence to set licence bands, service levels and onboarding requirements.

### Phase E — commercial and public scale

- Add subscription billing and institution invoicing only after entitlement and legal workflows are complete.
- Expand reviewed Atlas modules by body region and modality.
- Add search, bookmarks, spaced practice, revision history and citations.
- Add SSO and then LTI 1.3 after hosted and embedded delivery are stable.
- Introduce controlled research exports only with an approved governance model.

## 9. Release gates

The private software preview can be deployed now. Public content or paid access requires:

- permanent name, domain and trademark clearance;
- real production domain and canonical `SITE_ORIGIN`;
- education identity, organisation tenancy and entitlement integration;
- publication-cleared, de-identified imaging;
- specialist-reviewed annotations and citations;
- approved legal entity, privacy, terms, cookie and contact details;
- accessibility, penetration, privacy and dependency review;
- billing, tax, refund, invoicing and support processes for paid access;
- backup, restore, monitoring, incident, correction and withdrawal procedures;
- named owners for specialist review, editorial review, data protection and platform operations.

These gates prevent the education platform from quietly inheriting the risk profile, data boundary or market identity of the future clinical Didanix PACS.

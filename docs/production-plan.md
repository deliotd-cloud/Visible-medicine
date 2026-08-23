# Didanix Atlas production plan

## 1. Product model

Didanix Atlas should be a distinct first-party website rather than another screen inside the future PACS. This gives it a clear public identity, search and discovery surface, learner account, content catalogue, and educational risk profile. Didanix Education remains the engine behind institutional and educator-created courses; the Atlas consumes only published, versioned course releases.

The recommended experience has four connected zones:

1. **Atlas** — reviewed, searchable radiological anatomy organised by region, modality, plane, and structure.
2. **Courses** — official Didanix learning paths plus private institutional courses powered by Didanix Education.
3. **Studio** — a gated entry into Didanix Education for verified educators and organisations.
4. **Research** — transparent provenance, versioning, citation, dataset, and collaboration information.

## 2. Architecture and ownership

| Capability | Owning product | Integration rule |
| --- | --- | --- |
| Anatomy catalogue and public routes | Didanix Atlas | First-party, versioned publication records |
| Image viewing primitives | Shared non-clinical viewer package | Forked/released independently from clinical viewer code |
| Course authoring and assessment | Didanix Education | Atlas receives immutable published course versions |
| Institutional enrolment and roles | Didanix Education / identity service | Organisation-scoped claims; no clinical tenant reuse |
| Learner bookmarks and progress | Didanix Atlas | Separate D1 database and retention policy |
| Medical media | Atlas media pipeline | Publication-cleared derivatives in a separate R2 bucket |
| Future clinical workflow | Didanix PACS | No runtime, identity, database, or release coupling |

The shared viewer should be distributed as a versioned package with a narrow educational API. Clinical-only tools must not be imported into the Atlas bundle. Security fixes may flow between products, but features and releases remain independently controlled.

## 3. Medical-content production

Every atlas module should move through these states:

`draft → media quarantine → de-identification verification → rights verification → annotation → specialist review → editorial QA → accessibility QA → published → superseded/withdrawn`

Required evidence for each published module:

- source and licence or contributor agreement;
- confirmation that no direct or indirect patient identifiers remain;
- modality, body region, plane, acquisition context, and normal-variant notes;
- structure label hierarchy, synonyms, and terminology identifiers where licensed;
- named clinical reviewer and review date;
- references and last substantive revision;
- immutable published version and a withdrawal mechanism.

Do not accept arbitrary learner uploads into the public atlas. Educator media enters a quarantined Didanix Education workflow and can only appear in Atlas after a separate publication decision.

## 4. Identity and access

- Public atlas browsing may remain anonymous.
- Saving progress, bookmarking, enrolment, and assessment require an authenticated learner identity.
- Educator, reviewer, publisher, and organisation-admin permissions are separate roles.
- Published Atlas identity must be separate from future clinical identities even if a shared upstream identity provider is eventually used.
- Embed tokens must be short-lived, origin-restricted, audience-restricted, and scoped to one published course or workbook.
- Open self-service publishing stays disabled until moderation, takedown, rights, and abuse processes exist.

## 5. Data and privacy

Store only data needed for learning. Initial Atlas progress records contain a user identifier, resource type, resource slug, percentage, last position, and update time. Add analytics only after the controller, lawful basis, retention period, consent/cookie position, subject-access process, and deletion workflow are agreed for the intended jurisdictions.

Before public registration, publish jurisdiction-specific privacy and terms documents using the real Elivion/Didanix legal entity and contact details. Do not invent those details in the application.

## 6. Safety and intended-use controls

- Repeat “education and research only” at the site, viewer, upload, export, and embed boundaries.
- Avoid diagnostic claims, reporting templates, patient worklists, clinical priors, clinical messaging, or treatment recommendations.
- Use synthetic or publication-cleared media only.
- Keep annotations descriptive and educational, with citations and reviewer provenance.
- Maintain a clear correction, withdrawal, and incident-reporting process.
- Conduct specialist review, accessibility testing, threat modelling, dependency review, and privacy review before public launch.

## 7. Delivery phases

### Phase A — implemented foundation

- Product architecture and brand hierarchy.
- Public landing, atlas catalogue, module detail, courses, research, institutions, Studio, and learner routes.
- Interactive generated atlas demonstration.
- Authenticated progress API and D1 schema.
- Responsive visual system, metadata, social image, and owner-private hosting.

### Phase B — real atlas pilot

- Select one bounded module, recommended: normal CT head.
- Secure publication rights and de-identification evidence.
- Build the DICOM-derived media pipeline, pyramids/thumbnails, and manifest format.
- Create the structure ontology and annotation authoring tool.
- Complete dual specialist review and editorial QA.
- Replace the demonstration scan with the reviewed module.

### Phase C — Didanix Education connection

- Define a signed, versioned published-course contract.
- Add Didanix identity and organisation claims.
- Render hosted course releases on Atlas.
- Add gated Studio deep links and approved embed tokens.
- Implement enrolment, submissions, marking, and audit events without exposing clinical services.

### Phase D — controlled institutional beta

- Pilot with one institution, a small educator cohort, and a bounded learner cohort.
- Verify accessibility, performance, security, privacy, support, moderation, backups, and recovery.
- Measure completion, label accuracy, educator authoring time, and learner feedback.
- Resolve pilot findings before adding further institutions.

### Phase E — public scale

- Expand reviewed modules by body region and modality.
- Add search, bookmarks, spaced practice, revision history, citations, and controlled research exports.
- Introduce subscriptions or institutional licensing only after entitlements, billing support, tax, refunds, and service terms are ready.
- Consider LTI 1.3 after the hosted and embedded models are stable.

## 8. Release gates

The website software can be privately deployed now. Public medical-content launch requires all of the following:

- a real production domain and `SITE_ORIGIN`;
- approved Didanix identity integration;
- publication-cleared, de-identified imaging;
- specialist-reviewed annotations and citations;
- legal entity, privacy, terms, cookie, and contact details;
- accessibility and security review;
- backup, restore, monitoring, incident, correction, and withdrawal procedures;
- named owners for clinical review, editorial review, data protection, and platform operations.

These gates are deliberate product controls, not website placeholders. They prevent the educational Atlas from quietly inheriting the risk profile or data boundary of the future clinical Didanix PACS.

# Visible Medicine

Visible Medicine is a standalone education and research platform in the Elivion family. The working product combines four connected areas:

- **Atlas** — reviewed radiological anatomy explored through an educational imaging viewer.
- **Courses** — official learning paths and private institution-led teaching.
- **Studio** — imaging-native authoring, assessment, live teaching and controlled delivery.
- **Institutions** — organisation workspaces, roles, enrolment and reporting.

The platform is for education and non-clinical research only. It is not intended for diagnosis, patient care, clinical reporting, treatment planning or clinical decision-making.

## Brand and product boundary

The site uses a dedicated Visible Medicine monogram, Segoe typography and the Elivion deep-teal, accessible-teal and light-surface palette. Atlas retains a warm editorial accent while Courses and Studio use the same parent system, so the platform feels related without being mistaken for clinical software.

**Didanix PACS is a separate future clinical product.** It must retain separate identity, tenants, data stores, deployment, quality management, validation and release controls. Visible Medicine must not share patient records, clinical worklists, diagnostic tools, clinical uploads or clinical identity claims with Didanix PACS.

## Current implementation

- Multi-route Next.js/Vinext site covering the home page, Atlas, Courses, Studio, Research, Institutions, Plans and My Learning.
- Authenticated `/learn` runtime preserving the established education viewer layout: learner Home, Teaching, Exam, My Review, Course → Module → Workbook → Case rail, series thumbnails, viewer tools, notes/answers and dual-display support.
- Functional staff workspaces for workbook authoring, question banks, live teaching, content safety, marking, insights, integrations and audit.
- Enrolment-gated LiveKit Cloud video classrooms inside active teaching sessions, with role-bounded publishing, explicit pre-join device choices, connection recovery, a minimised viewer companion and recording disabled.
- Interactive Atlas demonstration with slice navigation, system filters, labels, practice mode, window presets and saved position.
- D1-backed per-user learning progress behind authenticated API boundaries.
- D1-backed organisation membership, education roles, plan entitlements, publication register and approved embed-origin registry.
- R2 binding reserved for publication-cleared DICOM-derived media and large teaching assets.
- Institution workspace with usage, entitlements, Studio, reporting, integration and publication-governance views.
- Searchable, filterable course discovery with learner-profile recommendations, full workbook syllabuses and latest-workbook resume links.
- Studio course templates, safe empty-shell duplication, device-local draft recovery, publication readiness checks, immutable release history and learner previews.
- Institution pilot briefs, email-ready people invitations with manual-link fallback, bounded roster import, role-aware access, readiness evidence and organisation-scoped CSV reporting.
- Public learner account entry, least-privilege provisioning, versioned terms/privacy consent, account lifecycle status, data export, queued learner-rights requests, in-app notification preferences and clearly marked draft policy frameworks.
- Trust centre plus hosted and controlled embedded-delivery product boundaries.
- Explicit education/research-only statements at global, content, institution and commercial boundaries.
- Owner-private managed hosting and an Visible Medicine social-sharing card.
- `/teach` permanently redirects to the clearer `/studio` route.

The current scan surface is an illustrative interface demonstration. Replace it with publication-cleared imaging and specialist-reviewed annotations before any public medical-content release.

The private release deliberately seeds synthetic education cases so the complete workflow can be evaluated. It does not authorize real learners, real examinations, patient-derived content, external embedding or paid access. Those require the production gates in the plan.

## Local development

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run lint
npm test
npx tsc --noEmit
npm run build
```

Generate D1 migrations after schema changes:

```bash
npm run db:generate
```

## Production configuration

The contained 3D modules support an optional [lossless model-delivery step](docs/atlas-model-delivery.md)
after the final build and before packaging. It retains the canonical exports and
all anatomy while reducing transferred bytes; no new website dependency is needed.

The hosted application requires:

- `DB`: D1 binding for learner progress and future catalogue metadata.
- `FILES`: R2 binding for publication-cleared imaging and teaching media.
- `SITE_ORIGIN`: canonical production origin used by metadata and social cards.
- A production education identity and entitlement adapter before external launch. The Sites sign-in adapter is suitable for the private hosted preview, not the final cross-product identity model.
- `VISIBLE_MEDICINE_EVALUATION_ADMIN_EMAILS`: a comma-separated owner-private evaluation allowlist. It grants the complete demonstration role set only when the application is deployed in production mode; ordinary new accounts remain learner-only. The previous `ELIVION_EVALUATION_ADMIN_EMAILS` name remains accepted during migration.
- `EMAIL_PROVIDER=cloudflare-email`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_EMAIL_API_TOKEN`, `EMAIL_FROM_ADDRESS` and `PUBLIC_SITE_URL`: optional server-side transactional-email settings. All are required before delivery activates; otherwise notifications remain held and invitation links remain available for manual handoff. Never commit the API token.
- `LIVEKIT_URL`: the secure WebSocket URL from a LiveKit Cloud project, for example `wss://your-project.livekit.cloud`.
- `LIVEKIT_API_KEY`: the server-side API key for issuing short-lived classroom tokens.
- `LIVEKIT_API_SECRET`: the corresponding server-side secret. Never expose this value to client code or commit it to the repository.

### Live video classrooms

Video is attached to Visible Medicine's existing live teaching-session model rather than operating as a separate meeting product. An instructor starts **Follow Me** from the Teaching workspace; the instructor and enrolled learners can then join the room from the same viewer. Tokens are scoped to that teaching session, expire after two hours, and are never persisted in the browser.

Learners can publish camera and microphone tracks. Instructors can also share their screen. Visible Medicine's existing viewer synchronisation, polls and attendance remain the teaching control layer. Recording is deliberately disabled: the token contains no recording grant and this integration does not call LiveKit Egress. If recording is introduced later, it should be treated as a separate consent, retention, access-control and governance project.

Active sessions are surfaced only to enrolled learners on the catalogue, course-detail and My Learning pages. Their deep link opens the correct workbook in Teaching mode with the classroom panel ready for an explicit join. The panel provides camera and microphone choices before entry, connection/reconnection status, an audio-playback recovery control and a compact mode that keeps audio connected while the learner uses the imaging viewer. Instructors can copy the learner link, but the link never bypasses authentication, enrolment or token checks.

See [docs/platform-architecture.md](docs/platform-architecture.md) for the integrated product model, [docs/production-plan.md](docs/production-plan.md) for governance and release gates, [docs/pilot-readiness.md](docs/pilot-readiness.md) for the current non-live controls, and [docs/naming-options.md](docs/naming-options.md) for the working-name shortlist.

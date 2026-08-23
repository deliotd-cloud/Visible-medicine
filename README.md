# Elivion Education

Elivion Education is a standalone education and research platform in the Elivion family. The working product combines four connected areas:

- **Atlas** — reviewed radiological anatomy explored through an educational imaging viewer.
- **Courses** — official learning paths and private institution-led teaching.
- **Studio** — imaging-native authoring, assessment, live teaching and controlled delivery.
- **Institutions** — organisation workspaces, roles, enrolment and reporting.

The platform is for education and non-clinical research only. It is not intended for diagnosis, patient care, clinical reporting, treatment planning or clinical decision-making.

## Brand and product boundary

The site uses the approved Elivion symbol, Segoe typography and the Elivion deep-teal, accessible-teal and light-surface palette. Atlas retains a warm editorial accent while Courses and Studio use the same parent system, so the platform feels related without being mistaken for clinical software.

**Didanix PACS is a separate future clinical product.** It must retain separate identity, tenants, data stores, deployment, quality management, validation and release controls. Elivion Education must not share patient records, clinical worklists, diagnostic tools, clinical uploads or clinical identity claims with Didanix PACS.

## Current implementation

- Multi-route Next.js/Vinext site covering the home page, Atlas, Courses, Studio, Research, Institutions, Plans and My Learning.
- Authenticated `/learn` runtime preserving the established education viewer layout: learner Home, Teaching, Exam, My Review, Course → Module → Workbook → Case rail, series thumbnails, viewer tools, notes/answers and dual-display support.
- Functional staff workspaces for workbook authoring, question banks, live teaching, content safety, marking, insights, integrations and audit.
- Interactive Atlas demonstration with slice navigation, system filters, labels, practice mode, window presets and saved position.
- D1-backed per-user learning progress behind authenticated API boundaries.
- D1-backed organisation membership, education roles, plan entitlements, publication register and approved embed-origin registry.
- R2 binding reserved for publication-cleared DICOM-derived media and large teaching assets.
- Institution workspace with usage, entitlements, Studio, reporting, integration and publication-governance views.
- Trust centre plus hosted and controlled embedded-delivery product boundaries.
- Explicit education/research-only statements at global, content, institution and commercial boundaries.
- Owner-private managed hosting and an Elivion Education social-sharing card.
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
npx tsc --noEmit
npm run build
```

Generate D1 migrations after schema changes:

```bash
npm run db:generate
```

## Production configuration

The hosted application requires:

- `DB`: D1 binding for learner progress and future catalogue metadata.
- `FILES`: R2 binding for publication-cleared imaging and teaching media.
- `SITE_ORIGIN`: canonical production origin used by metadata and social cards.
- A production education identity and entitlement adapter before external launch. The Sites sign-in adapter is suitable for the private hosted preview, not the final cross-product identity model.
- `ELIVION_EVALUATION_ADMIN_EMAILS`: a comma-separated owner-private evaluation allowlist. It grants the complete demonstration role set only when the application is deployed in production mode; ordinary new accounts remain learner-only.

See [docs/platform-architecture.md](docs/platform-architecture.md) for the integrated product model, [docs/production-plan.md](docs/production-plan.md) for governance and release gates, and [docs/naming-options.md](docs/naming-options.md) for the working-name shortlist.

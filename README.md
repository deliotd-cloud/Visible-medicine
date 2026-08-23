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
- Interactive Atlas demonstration with slice navigation, system filters, labels, practice mode, window presets and saved position.
- D1-backed per-user learning progress behind authenticated API boundaries.
- R2 binding reserved for publication-cleared DICOM-derived media and large teaching assets.
- Explicit education/research-only statements at global, content, institution and commercial boundaries.
- Owner-private managed hosting and an Elivion Education social-sharing card.
- `/teach` permanently redirects to the clearer `/studio` route.

The current scan surface is an illustrative interface demonstration. Replace it with publication-cleared imaging and specialist-reviewed annotations before any public medical-content release.

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

See [docs/production-plan.md](docs/production-plan.md) for architecture, governance and release gates, and [docs/naming-options.md](docs/naming-options.md) for the working-name shortlist.

# Didanix Atlas

Didanix Atlas is a standalone radiological anatomy destination in the Didanix family, which sits within the Elivion family. It combines a public, reviewed anatomy atlas with first-party courses and a route into private institutional teaching powered by Didanix Education.

The product is for education and non-clinical research only. It is not intended for diagnosis, patient care, clinical reporting, treatment planning, or clinical decision-making.

## Family brand system

Didanix Atlas uses the approved Elivion symbol, Segoe family typography, canonical deep-teal and accessible-teal palette, shared focus treatment, compact product badge, and Elivion → Didanix → Atlas lockup. Atlas retains a warmer editorial surface and restrained yellow-green highlight so it feels like a learning destination rather than the clinical PACS. These tokens are local to Atlas and do not create a runtime dependency on any clinical product.

## Product boundaries

- **Didanix Atlas** owns public discovery, reviewed anatomy records, official courses, learner progress, and the first-party website experience.
- **Didanix Education** owns educator authoring, Course → Module → Workbook → Case composition, assessment, live teaching, moderation, and approved embedding.
- **Didanix PACS** remains a separate future clinical product with separate identity, data stores, security controls, quality management, validation, and release processes.

No clinical tenant, patient record, clinical identity, diagnostic workflow, or clinical upload route should be shared with the Atlas product.

## Current implementation

- Multi-route Next.js/Vinext website for the atlas, courses, research, institutions, educator Studio, and learner dashboard.
- Interactive atlas demonstration with slice navigation, system filters, labels, practice mode, window presets, and saved position.
- D1-backed per-user learning progress with authenticated API boundaries.
- R2 binding reserved for publication-cleared DICOM-derived media and large teaching assets.
- Owner-private managed hosting workflow and social-sharing image.
- Explicit education/research-only statements at global and module level.

The current scan surface is an illustrative generated interface demonstration. It must be replaced by publication-cleared imaging and expert-reviewed annotations before public medical-content release.

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

- `DB`: D1 binding for learning progress and future catalogue metadata.
- `FILES`: R2 binding for publication-cleared imaging and teaching media.
- `SITE_ORIGIN`: canonical production origin used by metadata and social cards.
- A production Didanix identity adapter before external launch. The included Sites sign-in adapter is suitable for the private hosted preview, not the final cross-product identity model.

See [docs/production-plan.md](docs/production-plan.md) for the release plan, governance gates, and content workflow.

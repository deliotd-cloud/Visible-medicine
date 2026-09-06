# Anatomy atlas backup — 6 September 2026

This branch preserves the current standalone Visible Medicine anatomy application in [`modules/anatomy-atlas`](../modules/anatomy-atlas/). The existing main website files are unchanged. This is a source-and-assets checkpoint, **not an integration or website deployment**.

## Snapshot

- Source application commit: `2cb4f447208844f7f3f0caa282952210ff502977`.
- Main website base commit: `c4ff08f8afc90bd94d04162625f97af9d94401cf`.
- GitHub backup branch: `backup/anatomy-atlas-2026-09-06`.
- All 257 tracked application files are preserved byte-for-byte from that source commit, including 62 GLB bundles, the official brand lockups, content, scripts, configuration, dependency lockfile, licences, review database schema/migration and documentation.
- The atlas covers 823 selectable source representations, 11 regional explorers and the dedicated nine-structure shoulder pilot. These are not claims of anatomical completeness or clinical validation.
- The shoulder review workspace has independent geometry, teaching and imaging review tracks, evidence/issues, versioned records and revision-bound approval safeguards. Acquired scans and specialist approvals remain absent.
- The deep-inspection update adds three-plane surface cutaways, tissue opacity, clipped-surface picking, regional/whole-body orthographic illustration and varied 5/10/20-question practice with results. No source geometry, anatomical coverage, licences or dependencies were changed.
- The study-context update adds 20 device-local named views with dissection/camera restoration, source-change safeguards and targeted recovery from failed anatomy loads. Its 16,916 helper assertions pass; actual saved browser preferences are not part of this source backup. The ordered continuing work queue is in the atlas's `docs/CONTINUOUS_IMPROVEMENT.md`.
- The imaging-connection framework adds an opt-in, runtime-validated two-way structure-selection contract, explicit shoulder/body group mappings, tested reference-coordinate transforms, region/side and practice safeguards, and bounded replay/adapter lifecycle handling. It passes 38,928 helper assertions. No imaging viewer, acquired scan, patient registration, new anatomical surface or clinical approval is included. The integration contract and external requirements are documented in `docs/IMAGING_LINK.md`.

The currently published atlas remains at [Visible Medicine anatomy](https://visible-medicine-shoulder-atlas.deliotd.chatgpt.site). Saving this branch does not redeploy that site or the main website.

## Working with this copy

Treat the atlas as a separate application and use its own directory, package file and lockfile:

```sh
cd modules/anatomy-atlas
npm ci
npm run db:local
npm run dev
```

Use Node.js 22.18 or later; Node 24 is the tested version. Follow the [atlas README](../modules/anatomy-atlas/README.md), [review workspace guide](../modules/anatomy-atlas/docs/REVIEW_WORKSPACE.md), [delivery plan](../modules/anatomy-atlas/docs/DELIVERY_PLAN.md) and [website integration notes](../modules/anatomy-atlas/docs/WEBSITE_INTEGRATION.md).

This branch intentionally does not turn the repository into a configured multi-application workspace. Before merging/deploying it as such, define separate build roots and TypeScript/lint scopes; the main application's broad file globs must not accidentally include this nested application. Do not copy the atlas's migration into the main application's database or reuse authentication headers outside their documented trusted boundary.

The copied `.openai/hosting.json` is provenance/configuration for the existing anatomy Site. It contains logical bindings and a project identifier, not credentials. Do not publish the main website using that nested configuration or change the existing Site's ownership inadvertently. For a new hosting target, follow the documented platform setup.

## What is deliberately not in GitHub

- API keys, access tokens, local environment secrets and authentication cookies.
- Live D1 database contents, personal review records or patient information. The repository contains the schema and migration, **not a database backup**.
- Installed dependencies, build output, local database/cache files and temporary downloads.
- The anatomy application's earlier Git history; this is a complete current-file snapshot, with the original source commit recorded above.

The 189 automated review checks, 984,199 inspection assertions, 16,916 study-view assertions, 38,928 imaging-link assertions and numerical anatomy/dissection/explode checks passed for the source snapshot. Type checks, focused lint, the production build and 808-package dependency licence audit also passed with notice obligations retained. Browser interaction testing of the new review forms, inspection/bookmark/retry/imaging-link controls, a real imaging adapter and specialist clinical validation remain outstanding; no test result should be read as medical approval. Cutaways show clipped exterior surfaces, not CT/MRI or reconstructed tissue interiors.

## Rights and ongoing storage

Keep the atlas's [licence](../modules/anatomy-atlas/LICENSE), [third-party notices](../modules/anatomy-atlas/LICENSES/THIRD_PARTY_NOTICES.md), [BodyParts3D licence evidence](../modules/anatomy-atlas/LICENSES/BODYPARTS3D.md) and visible attribution together. MIT application code does not relicense third-party anatomy or the proprietary Visible Medicine brand marks.

Keep the repository private unless public source/brand release is deliberately approved. The source snapshot is about 95 MB; no Git LFS or new paid service was introduced for this backup. GitHub source storage is distinct from hosting, large future imaging collections and database backups; quotas and service pricing can change. Never add patient imaging or private review exports to this repository as a substitute for appropriate data storage.

# Anatomy atlas backup — 6 September 2026

This branch preserves the current standalone Visible Medicine anatomy application in [`modules/anatomy-atlas`](../modules/anatomy-atlas/). The existing main website files are unchanged. This is a source-and-assets checkpoint, **not an integration or website deployment**.

## Snapshot

- Source application commit: `0b1c27632fb4fc7d7cd21b8c500c6f883bd6c645`.
- Main website base commit: `c4ff08f8afc90bd94d04162625f97af9d94401cf`.
- GitHub backup branch: `backup/anatomy-atlas-2026-09-06`.
- All 321 tracked application files are preserved byte-for-byte from that source commit, including 74 GLB bundles, the official brand lockups, content, scripts, configuration, dependency lockfile, licences, review database schema/migration and documentation.
- The atlas covers 924 selectable source representations, 11 regional explorers, 102 dissection stages, 84 focused views and the dedicated nine-structure shoulder pilot. These are not claims of anatomical completeness or clinical validation.
- The shoulder review workspace has independent geometry, teaching and imaging review tracks, evidence/issues, versioned records and revision-bound approval safeguards. Acquired scans and specialist approvals remain absent.
- The deep-inspection update adds three-plane surface cutaways, tissue opacity, clipped-surface picking, regional/whole-body orthographic illustration and varied 5/10/20-question practice with results. No source geometry, anatomical coverage, licences or dependencies were changed.
- The study-context update adds 20 device-local named views with dissection/camera restoration, source-change safeguards and targeted recovery from failed anatomy loads. Its current 17,081 helper assertions pass; actual saved browser preferences are not part of this source backup. The ordered continuing work queue is in the atlas's `docs/CONTINUOUS_IMPROVEMENT.md`.
- The imaging-connection framework adds an opt-in, runtime-validated two-way structure-selection contract, explicit shoulder/body group mappings, tested reference-coordinate transforms, region/side and practice safeguards, and bounded replay/adapter lifecycle handling. It passes 42,102 helper assertions with the expanded catalogue. No imaging viewer, acquired scan, patient registration or clinical approval is included. The integration contract and external requirements are documented in `docs/IMAGING_LINK.md`.
- The source-inventory milestone reconciles every official BodyParts3D v4 index definition: 4,273 tree-specific records and 3,492 archive entries. It adds 36 source-derived representations (29 vessels, two ciliary ganglia and five organ/duct/airway segments) in five new bundles, with two new dissection windows and six focused views. All previous 823 catalogue records and 61 body bundles are unchanged. The 8,980 offline inventory assertions pass. Source-labelled superior epigastric vein candidates and earlier ambiguous anatomy remain held; source identity, hashes and plausible coordinates are not clinical validation. See `docs/SOURCE_INVENTORY.md` for exact source evidence, limitations and next actions.

- The deep-brain milestone adds 22 source concepts / 24 components in a separate model bundle, three study windows, five source-ID-based focused views, draft notes and distinct study colours. Every previous 859 structure record and 66 model bundle hashes is preserved. Regional labels now follow the visible bounds in all six presets, avoid duplicate selected labels and correct exploded local coordinates. Its 193,082 source, study and label helper assertions pass; they do not validate source anatomy or on-screen text collision. Grouped bilateral mammillary and choroid-plexus sources are explicitly disclosed. See `docs/DEEP_BRAIN.md` for evidence, clinical limits and remaining work.

The currently published atlas remains at [Visible Medicine anatomy](https://visible-medicine-shoulder-atlas.deliotd.chatgpt.site). Saving this branch does not redeploy that site or the main website.

The connective/deep-spinal milestone adds eleven source entries / fifteen components in four separate GLBs, six new study windows and eight focuses. Carpal/cervical/lumbar views use selected context rather than automatically restoring all regional bones. Prior 881 records / 67 bundles remain exact. Two longi candidates and their grouped alias are held for level/course/overlap adjudication. The new 2,725-assertion admission/context suite passes alongside the existing regressions; no clinical or device approval is implied. Source evidence, licences and next work are in `docs/AXIAL_DETAIL.md`.

The targeted-practice milestone adds regional/whole-body find/name response modes, major/all-visible/focus-only target policies, skip/reveal and all-eligible-missed retries. The dedicated shoulder retains its three prompts but shares the tested answer-once/reset engine. All existing anatomy files are unchanged. The new 54,457-assertion practice suite passes; shared display fingerprints were refreshed without creating approvals. Six v3-only abdominal-wall candidates were audited but not imported because registration and exact-version asset rights remain to be established. See `docs/PRACTICE.md` and `docs/ABDOMINAL_WALL_AUDIT.md`. Sessions are in memory; no learner responses or clinical database records are included in this backup.

## Working with this copy

The whole-body/regional arrangement milestone adds nine prominent system presets, a model-first folded tool section on the whole-body overview, and a same-scale system-grouped tray. At 100%, conservative projected entry bounds are separate; intermediate positions and compound source interiors can still overlap. The original spatial explode, all source shapes/coordinates, 924 catalogue entries and 74 total GLBs are preserved. Tray pan/zoom, six directions, select/frame, clipping/labels and optional backward-compatible saved-view state are connected. Shared orthographic camera depth/zoom was corrected and display review fingerprints were refreshed without creating approvals. The new 1,926-layout/5,778-fit suite passes 12,074,267 numerical/helper assertions; existing dissection/practice/imaging/review/geometry checks, type/lint/build and licence audit also pass. See `docs/BODY_ARRANGEMENT.md`. No browser/device or clinical acceptance is claimed; the anatomy source queue resumes next.

The regional dissection workbench now separates the existing 102 recipes into 47 regional layer steps and 55 independent study views. Every individual region gains named layer navigation, exact next-step visibility previews, and a searchable/system-filtered removed-tissue tray with atomic group restoration and one-step Undo. All source anatomy, licences, coordinates, 84 focused views and saved-view format remain unchanged. The new 70,927-assertion workbench suite and existing dissection, practice, saved-view, imaging, inspection, explode, source-integrity and review checks pass, as do type checks, focused lint, build and licence audit. See `docs/DISSECTION_WORKBENCH.md`. No browser/device or clinical acceptance is claimed. The whole-body arranged-layout improvement is the next presentation milestone, not part of this update.

The dental/orbital milestone adds 28 source-labelled teeth and four orbital connective surfaces in two separate model bundles (791,696 bytes), five close-up windows/focuses, draft teaching notes and ivory tooth materials. All 892 previous records and 71 body bundles remain byte-identical. Source hashes, exact aliases, unchanged transforms and gross position checks are documented in `docs/HEAD_DETAIL.md`; these are not clinical approval. No third molars, internal dental tissues, clinical tooth numbering or patient registration are supplied. Existing holds, source notices, private access and the main website are preserved. The current build, type checks, focused lint, geometry/interaction regressions and licence audit pass; clinical and hands-on device validation remain outstanding.

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

The 4,301 head-detail assertions, 54,502 practice assertions, 189 automated review checks, 1,115,959 inspection assertions, 17,156 study-view assertions, 43,574 imaging-link assertions, 8,900 current inventory assertions, 202,370 deep-brain/label assertions and numerical anatomy/dissection/explode checks passed for the source snapshot. Type checks, focused lint, the production build and 808-package dependency licence audit also passed with notice obligations retained. Browser interaction testing of the new review forms, inspection/bookmark/retry/imaging-link controls and anatomical views, a real imaging adapter and specialist clinical validation remain outstanding; no test result should be read as medical approval. Cutaways show clipped exterior surfaces, not CT/MRI or reconstructed tissue interiors. Committed baselines and exact source evidence allow the inventory, neuro and axial tests to run without old Git history (neuro:test and axial:test require the installed project dependencies); source-candidate audits and some earlier historical comparison scripts still require the original source history.

## Rights and ongoing storage

Keep the atlas's [licence](../modules/anatomy-atlas/LICENSE), [third-party notices](../modules/anatomy-atlas/LICENSES/THIRD_PARTY_NOTICES.md), [BodyParts3D licence evidence](../modules/anatomy-atlas/LICENSES/BODYPARTS3D.md) and visible attribution together. MIT application code does not relicense third-party anatomy or the proprietary Visible Medicine brand marks.

Keep the repository private unless public source/brand release is deliberately approved. The source snapshot is 108,622,832 bytes (about 108.62 MB); no Git LFS or new paid service was introduced for this backup. GitHub source storage is distinct from hosting, large future imaging collections and database backups; quotas and service pricing can change. Never add patient imaging or private review exports to this repository as a substitute for appropriate data storage.

# Visible Medicine

## Tests and local evidence

`npm run test:list` lists both TypeScript and JavaScript-module test entries
without launching tests. `npm test` runs the complete inventory with concurrency1
and preserves source fingerprints, process identities, logs and drift-aware
terminal receipts under ignored `.local/`. See [complete test runner](docs/test-runner.md)
for the scope and limits; focused passes are not a full release or clinical gate.

The persistent [completion checklist](docs/completion-checklist.md) includes
the [scoped anatomy inventory and remaining gaps](docs/anatomy-coverage/README.md).
Verify its exact Atlas source with `node scripts/check-anatomy-coverage.mjs --source-root F:/VisibleMedicine/atlas --check`.

Visible Medicine is a standalone education and research platform in the Elivion family. The working product combines four connected areas:

- **Atlas** — reviewed radiological anatomy explored through an educational imaging viewer.
- **Courses** — official learning paths and private institution-led teaching.
- **Studio** — imaging-native authoring, assessment, live teaching and controlled delivery.
- **Institutions** — organisation workspaces, roles, enrolment and reporting.

The platform is for education and non-clinical research only. It is not intended for diagnosis, patient care, clinical reporting, treatment planning or clinical decision-making.

## Brand and product boundary

**Atlas publication:** the complete model set now uses private registered storage.
After building exact committed source, follow the mandatory build-only preparation
and archive checks in [Atlas protected delivery](docs/atlas-protected-delivery.md).
Keep originals and notices; do not publish duplicated static GLBs that bypass the
delivery access checks. All current anatomy remains administrator-review draft.

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

### Approved CT/MRI head: private browser-local testing

`/atlas/ct-head` and `/atlas/mri-head` now use the website's read-only native head-atlas module, not the old illustrative scan. Open **Choose atlas folder** and select the prepared `browser-data-verified` directory. The owner-private copy is on E: under `VisibleMedicine-LocalStaging/20261007-head-website-integration/adapter`. Select the directory itself, not its ZIP, manifest alone or original specialist release. Switching between CT and MRI navigates to the matching URL and resets the previous study and structure; switching or refreshing requires choosing the folder again. No cross-subject selection is carried over.

The selected source is cosmetic approval v1.0.2 (355 CT annotations,117 MRI annotations,324 paired masks/surfaces plus accepted point/curve locators and two supplementary MRI regional centrelines). The browser transport manifest is SHA-256 pinned to `0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5`. Every requested image/mask/surface buffer is verified before display. An offline, checksum-gated conversion preserves native scalar bytes, KJI mask crops, source affine matrices and world-RAS surface positions; it does not resample, resegment or smooth anatomy. Original source files remain unchanged. The private conversion and readback receipts remain outside Git.

The module provides native axial/coronal/sagittal slice controls, linked crosshairs, structure/system search, approved overlay colours and opacities, window controls, panel enlargement and a rotatable selected surface/locator. Scroll vertically over a native image to change its slices without scrolling the page, including at the first/last slice. Trackpad increments are accumulated; predominantly horizontal and modified gestures are left alone. Scrolling outside an image remains normal, and Ctrl+wheel browser zoom is preserved. Native oblique planes have compound direction labels; they are not anatomical-orthogonal reslices. Labels use square screen pixels independent of voxel anisotropy and appear only on selected slice intersections. A deterministic stratified sampler sets the initial MRI contrast without altering image values. CT presets operate on unmodified native intensity; an independently verified intensity-unit declaration has not been added. MRI intensity is never labelled HU.

File objects and decoded buffers remain in browser-session memory. There is no head-media upload endpoint, public-data copy, URL-embedded data, browser persistence or automatic filesystem access. No dependency was added. This does not grant imaging-case, Atlas or lecture entitlements. CT and MRI are different subjects; neither is registered to the generic 3D reference. Didanix Education's existing spatial-link adapters remain available, but this module is not a new DICOM/PACS implementation and does not alter the clinical desktop application.

This import is an engineering/radiologist review aid, not the completed Didanix Education learner integration. Its structure search appears after opening the approved folder. The previous illustrative CT Practice control and the separate 3D atlas's structure tests are not connected to it; no CT/MRI identification quiz is currently implemented. The learner-facing next step is to integrate the accepted source through the Education/light website viewer boundary and provide consistent anatomy-learning controls, without altering the existing desktop application.

Before external use, the radiologist must approve the exact target-viewer revision: left/right and oblique orientation, native mask alignment, surface rendering without a second affine, paired-structure positions, curves and locators, scope/uncertainty qualifiers, label leaders and final appearance. Package-readback and synthetic tests do not confer this acceptance. Multi-structure group display, whole-head assembly, DICOM SEG/source-frame export, validated cross-subject registration and authenticated hosted head-media delivery are not implemented by this private import. Deferred entries remain excluded. Publication, privacy/rights verification and revision-bound clinical sign-off are separate gates.

Run `node --test --experimental-strip-types tests/head-atlas-import.test.ts tests/atlas-navigation.test.ts` and `node node_modules/typescript/bin/tsc --noEmit --incremental false` for the focused source checks. The E: head-only preview excludes unrelated private fracture images and replaces three unrelated private source-comparison asset maps with empty maps **only in the staged copy**, keeping those deliveries unavailable; it is not acceptance of the complete production website. Canonical source and the existing private review payloads are preserved. No public deployment is implied.

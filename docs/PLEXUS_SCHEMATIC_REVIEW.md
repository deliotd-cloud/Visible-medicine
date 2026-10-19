# Private original plexus schematic review

This is a diagrammatic fallback for teaching typical right C5–T1 named topology,
not a replacement for a validated spatial brachial-plexus nerve mesh. It contains
35 independently selectable named parts and 38 directed connections. Units are
arbitrary; no nerve dimensions, fascicle/root-territory tracing, neighbouring
registered anatomy or patient/imaging transform are provided.

## Access and review

The locally integrated page is `/workspace/atlas-review/source-comparisons/plexus`,
linked from Clinical Review → Source comparisons. Page and layout independently
require the existing active administrator/institution principal. All iframe
assets and decision endpoints authenticate every request. This is local work,
not evidence of a new live deployment or radiologist sign-off.

Topology and presentation have separate checklists and revisions. Save a draft
or corrections first, then personally inspect the exact revision and provide
professional qualification, exact scope, HTTPS evidence and attestation before
recording a review. The form does not verify professional credentials. Saved
decisions remain personal within the authorized institution; they do not grant
institutional sign-off, learner admission, imaging approval or entitlements.

History is append-only. Issues cannot disappear from later versions. Restoring
an old record creates an unattested draft; stale material clears checklist
confirmations. Failed saves and changed server revisions retain working notes
for export/reconciliation. Never put patient identifiers or scans in notes.

Existing `atlas_personal_specimen_review_events` stores a reserved schematic
envelope under a separate server-derived user namespace. Topology maps to the
table's `geometry` slot and presentation to `teaching` only for storage; payload
semantics remain `independent-schematic`. Existing specimen/overview decisions
cannot inherit these records. No database migration or specialist schema change.

## Reproduce and verify

From the existing website checkout, with its installed dependencies and the
clean Atlas source pinned to `de82626457fb60c3b92b4e4d87a0016b6c3c09ce`:

```sh
node scripts/import-plexus-review.mjs --source <existing-Atlas-checkout>
node scripts/import-plexus-review.mjs --source <existing-Atlas-checkout> --check
node scripts/verify-plexus-review.mjs
npm run build:clinical-review
npm run verify:clinical-review
```

The narrow importer never imports a donor mesh, scan or candidate model asset.
Generated assets stay in ignored, server-only `.local/plexus-review/assets.ts`,
not `public/`, model delivery, learner exports or the broad `atlas-review` source
import. Every served asset needs the exact material hash, verified byte count and
SHA-256. CSP forbids fonts and third-party connections; responses are private,
no-store, same-origin framed and noindex. Missing local assets fail the build
verification and closed delivery, rather than exposing a placeholder publicly.

The generated tracked manifest records every contributing runtime package and
complete licence-text hash. Only the existing permissive dependency graph is
used; no new dependency, external font, raster image, texture, mesh, paid API or
account is added. The original diagram/application code is MIT-authored. Source
facts are independently worded and referenced; no external figures are copied
or traced. React Three Fiber9.7.0's omitted npm licence text uses the source's
previously audited version-specific MIT notice. Notices are included in the
private packet. Existing hosting/storage quotas and operational charges are not
a promise that hosting will be free at every scale.

Topology revisions bind graph/wording/references, topology checklist and review
governance. Presentation binds topology plus curves, camera/selection, labels,
styles, wrapper/worksheet/delivery and exact built assets/package evidence.
Renderer-only changes preserve topology history but expire presentation;
graph changes expire both. Overall packet changes refuse stale saves before
review-storage access. Historical context is read against its recorded checklist.

Adding the private page to the existing shared Review shell requires its normal
conservative integration rebind. This rolls existing display/combined shoulder
review identities without editing their anatomy/teaching text or saved history.
The four learner runtimes and model bundles are unchanged.

## Clinical and release gates still open

- Radiologist review of all named parts, usual connections, wording, omissions
  and variants; particularly collateral origins and median roots.
- Actual signed-in desktop review, device/readability/camera acceptance and
  qualification/scope/evidence supplied by the human reviewer.
- Separate clearance/reconstruction and measured spatial validation of real
  nerve courses, units, laterality and relationships before a spatial mesh claim.
- Acquired-image rights/de-identification, CT/MRI/US frame and registration-error
  validation in the owning imaging task before any bidirectional mapping.
- Explicit learner-admission and publication decision; these remain false even
  after a schematic review is recorded.

Website Git backup carries code and the small immutable manifest. Ignored private
packet bytes require their separate verified local recovery snapshot or exact
regeneration. A same-machine E-drive snapshot is not an off-device backup. Raw
Atlas ancestry holds remain; this step does not clear third-party donor meshes.

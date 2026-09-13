# Shared regional website delivery

The existing BodyExplorer now supplies all eleven regions and the whole body to the website from
one audited module. This is a delivery change, not new anatomical geometry or
clinical acceptance. The original standalone routes and source catalogues remain.

| Website route | Regional selections | Nested selections | Deeper studies |
| --- | ---: | ---: | --- |
| `/atlas/head-neck-3d` | 290 | 75 | Seven existing head/neck families |
| `/atlas/thorax-3d` | 157 | 9 | Cardiac spaces and pulmonary branch groups |
| `/atlas/abdomen-3d` | 106 | 16 | Hepatic/biliary, renal and pancreatic relationships |
| `/atlas/pelvis-3d` | 81 | 4 | Deep-femoral source parts; independent female-pelvis and lower-limb studies |
| `/atlas/spine-3d` | 115 | 0 | Independent back-layer studies |
| `/atlas/3d?region=shoulder-arm` | 115 | 0 | Existing regional layers and arterial relationships |
| `/atlas/3d?region=forearm` | 86 | 0 | Existing forearm compartments and joint studies |
| `/atlas/3d?region=hand` | 124 | 0 | Existing close-up framing and hand studies |
| `/atlas/3d?region=thigh` | 95 | 4 | Deep-femoral source parts; independent lower-limb studies |
| `/atlas/3d?region=leg` | 76 | 4 | Deep-femoral source parts; independent lower-limb studies |
| `/atlas/3d?region=foot` | 122 | 0 | Existing foot framing; independent lower-limb studies |
| `/atlas/3d` | 1,101 | 104 | All thirteen nested families; separate back, female-pelvis and kidney studies |

The union includes 130 unchanged GLBs (198,121,124 canonical bytes), retaining
all preceding 93 GLBs (176,559,252 bytes), including
the separately framed abdominal-wall and HRA kidney specimens described below.
It includes every cardiac relationship view and all pulmonary roles plus airway
context, not just the default nested scene. Counts identify source selections,
not a complete set of nerves, vessels, chamber walls or anatomical variants.
Retain original coordinates, source-piece identities, asset holds and draft notes.

## Build and export

The existing `integration/head-neck` and `/atlas-runtime/head-neck/` names are
retained as stable delivery namespaces. They do not restrict the new scope.
The default remains head/neck; thorax uses `index.html?region=thorax`. No additional
permanent control is added to the embedded viewer. The website's Atlas catalogue
provides regional navigation and the existing viewers provide dissection tools.

```sh
node scripts/validate-regional-website-module.mjs
node scripts/validate-abdomen-website-module.mjs
node scripts/validate-pelvis-spine-module.mjs
node scripts/validate-whole-body-website-module.mjs
node scripts/validate-head-neck-module.mjs
npx vite build --config integration/head-neck/vite.config.mjs
# Commit the complete Atlas source before exporting; preserve an existing target.
node scripts/export-head-neck-module.mjs /absolute/website/public/atlas-runtime/head-neck
```

Manifest schema 2 retains the original head/neck fields and adds `regionalScopes`.
Each scope has its own root IDs, nested targets and required bundles; the file
inventory contains their hash-checked union only once. The exporter rejects stale
build inputs, dirty source, existing output, unsafe paths and conflicting models.
Generated website files must not be edited by hand.

Source-bound study links carry their exact destination region. Unknown, empty or
duplicate region fields produce an explicit error, never fallback anatomy.
Existing head/neck links remain valid. Bare cross-region links update the outer
website heading and selected region; source-bound study links remain contained.
The host supplies a single compact region bar, without a duplicate rail selector. Root/nested links are
tested against actual catalogues and stale/duplicate source identities; those
tests are not substitutes for browser, touch-device or clinical review.

## Rights and integration boundaries

All exported geometry was already admitted under the recorded BodyParts3D v4
CC BY 4.0, BodyParts3D v3 CC BY-SA 2.1 Japan, HRA CC BY 4.0 or Universiti Malaya CC0 1.0 licence.
Full attribution, source evidence and modification notices are copied.
Existing software licences accompany the bundled dependencies. No new
model, font, texture, package, external service or mandatory fee is introduced.
Website hosting/domain/review costs are not guaranteed free.

No scan, mask, case payload or standalone review connection is exported. Imaging
tabs retain original draft orientation teaching. Actual imaging will use Didanix
Education/light after case clearance, mapping and access checks; separately paid
lectures still require their own entitlement. Anatomy review remains revision-bound.

## Independent abdominal specimens

Abdomen uses `index.html?region=abdomen`, retaining all hepatic/biliary, renal
and pancreatic context/relationship bundles. Its two existing specimen launchers
use the same delivery base without rewriting either specimen catalogue:

- Abdominal wall: 29 surfaces, eight muscles, seven studies; CC BY-SA 2.1 Japan.
  The model, catalogue, full legal code, original README, evidence and ShareAlike
  specimen-data adaptation are explicitly included. The full original recovery
  ZIP remains in source/backup, not copied into the runtime by a directory glob.
- HRA kidneys: 82 admitted surfaces and nine studies; CC BY 4.0. Original release
  metadata and complete credit/modification notice accompany the model. All three
  source-defect holds remain. Papillary/calyceal letters are not drainage mappings.

Their source-bound links retain source hash, revision, frame, study, selection
and view under the contained abdomen route. Duplicate/mixed/stale fields fail
explicitly. Direct specimen links return to the abdomen; in-view dialogs retain
the previous body state and launcher focus. Standalone review links are omitted
only in contained delivery, with the original standalone interface preserved.
No patient registration, separate lecture access or clinical approval is granted.

The focused test checks 18 context states, 543 specimen link round trips, 5,973
rejections and 16 actual React study renders with an observed scene boundary.
It does not certify GPU, physical touch devices or clinical correctness. The
regional test retains all 853 root/nested link round trips across the five regions.

Two older tests used `unchanged` comparisons against pre-teaching/navigation
snapshots for files subsequently changed by saved milestones. Their original
preservation claims now compare the exact before/after Git commits; current
teaching, navigation, rendering and corruption rejection still execute against
current code. No historical expected content, approval record or model is rewritten.

## Publication gate and remaining work

Source delivery is not hosted availability. The current private website's
registered-storage inventory must admit and verify the additional models before
publishing a runtime that requests them. Preserve its working 94-model release
until that staged rollout is complete; do not substitute the old reduced bootstrap.
Use the website's current protected-delivery workflow, not the superseded lossless
static-asset preparation, for new publication. Continue other regions, whole-body
parity, framing and the complete shared anatomy/teaching/Education roadmap.

## Pelvis and spine delivery

Their 196 root selections and four nested source parts preserve all canonical
geometry. The separate back specimen has 48 surfaces and eight studies; female
pelvis has 41 surfaces and eight studies, retaining all six source holds. The
right lower-limb dialog starts at hip/thigh and retains all five scopes, 67 unique
surfaces and 26 recipes. They remain independent sources/frames, not fitted or
mirrored additions to the root body. Existing licences, metadata, modification
notices and ShareAlike specimen data accompany the export. No new source asset,
package, teaching text, scan, paid lecture or private review record is introduced.

Contained links restore their specific region, source revision, specimen, study
and camera. Wrong-region, mixed and duplicate routing fields fail explicitly;
stale source revisions remain rejected. UM links retain their originating pelvis,
thigh, leg or foot container, including when switching the independent study scope.
Closing an in-view dialog preserves the root workspace; a directly opened
specimen returns to its named region. Standalone review controls are suppressed
only in contained delivery, and the original standalone experience remains.

The focused check exercises 824 specimen links, 7,604 rejection cases and 42
actual React study renders with observed scene props. These are source/contract
checks, not WebGL, touch-device, other-account or clinical release evidence.

## Whole-body/remaining-limb verification — 13 September

The expanded regional check exercises 2,684 root/nested round trips and 5,368
stale/duplicate rejections, retaining the literal preceding five-scope counts
and all 93 prior exact model hashes. The added lower-limb-container test checks
104 source-bound links, 1,456 rejection cases and 104 actual React study renders.
Source frames remain independent. No anatomical surface, source hold, teaching,
font, texture, dependency, scan, mask or entitlement changes.

The original study-link test's extensionless TypeScript imports failed under
direct Node execution. Its loader now uses the existing confined builder; every
original assertion remains. All 303,882 checks/14,127 links pass against the
current catalogue. Dissection history (104,541 checks), reasoning practice
(10,611), revision-bound body decisions, shoulder review safeguards, TypeScript
and production/shared-module builds pass. Browser/device and release evidence
must be recorded separately in the coordinating checkpoint. Display fingerprints
advance conservatively; no private approvals are migrated.

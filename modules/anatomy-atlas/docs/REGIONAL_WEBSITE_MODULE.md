# Shared regional website delivery

The existing BodyExplorer now supplies head/neck, thorax and abdomen to the website from
one audited module. This is a delivery change, not new anatomical geometry or
clinical acceptance. The original standalone routes and source catalogues remain.

| Website route | Regional selections | Nested selections | Deeper studies |
| --- | ---: | ---: | --- |
| `/atlas/head-neck-3d` | 290 | 75 | Seven existing head/neck families |
| `/atlas/thorax-3d` | 157 | 9 | Cardiac spaces and pulmonary branch groups |
| `/atlas/abdomen-3d` | 106 | 16 | Hepatic/biliary, renal and pancreatic relationships |

The union includes 73 unchanged GLBs (110,546,620 canonical bytes), including
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
Existing head/neck links remain valid. Other regions open the independent Atlas
explicitly until their full contained delivery is ready. Root/nested links are
tested against actual catalogues and stale/duplicate source identities; those
tests are not substitutes for browser, touch-device or clinical review.

## Rights and integration boundaries

All exported geometry was already admitted under the recorded BodyParts3D v4
CC BY 4.0, BodyParts3D v3 CC BY-SA 2.1 Japan or HRA CC BY 4.0 licence.
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
regional test retains all 653 root/nested link round trips across the three regions.

Two older tests used `unchanged` comparisons against pre-teaching/navigation
snapshots for files subsequently changed by saved milestones. Their original
preservation claims now compare the exact before/after Git commits; current
teaching, navigation, rendering and corruption rejection still execute against
current code. No historical expected content, approval record or model is rewritten.

## Publication gate and remaining work

Source delivery is not hosted availability. The current private website's
registered-storage inventory must admit and verify the additional models before
publishing a runtime that requests them. Preserve its working 59-model release
until that staged rollout is complete; do not substitute the old reduced bootstrap.
Use the website's current protected-delivery workflow, not the superseded lossless
static-asset preparation, for new publication. Continue other regions, whole-body
parity, framing and the complete shared anatomy/teaching/Education roadmap.

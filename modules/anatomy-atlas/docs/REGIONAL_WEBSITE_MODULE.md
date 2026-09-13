# Shared regional website delivery

The existing BodyExplorer now supplies head/neck and thorax to the website from
one audited module. This is a delivery change, not new anatomical geometry or
clinical acceptance. The original standalone routes and source catalogues remain.

| Website route | Regional selections | Nested selections | Deeper studies |
| --- | ---: | ---: | --- |
| `/atlas/head-neck-3d` | 290 | 75 | Seven existing head/neck families |
| `/atlas/thorax-3d` | 157 | 9 | Cardiac spaces and pulmonary branch groups |

The union includes 52 unchanged BodyParts3D v4 GLBs (74,863,508 canonical bytes).
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
CC BY 4.0 licence; full attribution, source evidence and modification notices are
copied. Existing software licences accompany the bundled dependencies. No new
model, font, texture, package, external service or mandatory fee is introduced.
Website hosting/domain/review costs are not guaranteed free.

No scan, mask, case payload or standalone review connection is exported. Imaging
tabs retain original draft orientation teaching. Actual imaging will use Didanix
Education/light after case clearance, mapping and access checks; separately paid
lectures still require their own entitlement. Anatomy review remains revision-bound.

## Remaining regional work

Abdomen is not enabled by this change. It needs the complete hepatic/biliary,
renal and pancreatic relationship closure **and** its separately launched
abdominal-wall and HRA renal specimens. Those require explicit asset/return-link
handling and their own licences (including the abdominal-wall CC BY-SA 2.1 Japan
terms). Do not drop those controls or treat a root-only export as full parity.
Continue abdomen and the other regions/whole body under the shared master plan.

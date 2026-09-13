# Head and neck contained website module

13 September 2026. This is the actual regional BodyExplorer, not a replacement
illustration. The default standalone renderer is preserved. The explicit panel
entry fixes the region to head/neck, retains its dissection, three separation
styles, system/vessel filters, search, labels, inspection, teaching, saved views
and practice, and reuses the existing responsive panel layout.

## Source and delivery boundary

- 290 root regional selections and 75 nested selectable entries across seven
  existing study families: eye, ventricular spaces, brainstem/cerebellum,
  cerebral regions, visual pathway, cricothyroid and cranial artery source parts.
- 37 unchanged source GLB bundles, 48,356,348 bytes, including context used by
  nested studies. These counts are delivery scope, not complete anatomy.
- `integration/head-neck/delivery.ts` derives the asset closure from the actual
  display catalogue, exact nested parent bindings and context-catalogue functions.
  A new unrecognised nested family requires delivery review; it is not omitted.
- Canonical anatomy IDs, URLs, hashes, source coordinates and teaching remain
  unchanged. Delivery prefixes apply only to requests and retry caches. The raw
  full-body base catalogue is copied unchanged; it includes public metadata for
  other regions whose meshes are not all included in this module.
- Head/neck study URLs keep all existing strict identity/source validation,
  including duplicate-field rejection. Local search is region-bound. The compact
  panel does not advertise unloaded regional controls. A website Atlas return is
  separate from explicitly labelled links to the independent Atlas.
- Existing saved views are device-local and remain region/revision bound. They
  are not course progress, review decisions, attempts or server entitlements.
- No standalone review API, patient scan/mask, learner imaging case, paid lecture
  or clinical decision is exported. No Education adapter is registered. The
  existing optional conceptual imaging contract is not a spatial registration.

## Reproducible build/export

Use the existing lockfile. No new dependency, font, texture or mesh is introduced.

```sh
npx tsc --noEmit
node scripts/validate-head-neck-module.mjs
npm run build
npx vite build --config integration/head-neck/vite.config.mjs
```

Commit the verified Atlas source, then export to an explicit, absent destination:

```sh
node scripts/export-head-neck-module.mjs /absolute/website/public/atlas-runtime/head-neck
```

The exporter rejects a dirty source, stale/missing build inputs, non-regular
files, mismatched model bytes/hashes, changed licence or an existing destination.
Preserve an earlier module before replacing it; do not hand-edit generated files.
The manifest records the actual source commit, delivered identities and every
file hash. Full bundled software notices and existing CC BY 4.0 attribution are
retained. Branding is the existing approved asset, not redrawn.

## Verification and remaining acceptance

The initial automated checks cover all 37 physical model hashes/GLB headers,
365 root/nested study round trips, 730 stale/duplicate rejections, strict local
delivery paths, four actual navigation renders and base-catalogue immutability.
TypeScript and Atlas production build pass; the actual SQLite review safeguards
and shoulder review history pass without moving any approval to the new revision.
The build retains existing large-chunk warnings. Source/decoded scene equivalence
is checked by the existing lossless-delivery pipeline, not inferred from a URL.

Actual contained desktop/mobile/nested-view evidence and final GitHub/D/private
publication state belong in the main task's dated checkpoint. Source preparation
alone does not prove publication. Physical-device, accessibility, real cleared
Education/lecture journeys and revision-bound radiologist sign-off remain open.
All anatomy and teaching remain draft; existing source holds are unchanged.

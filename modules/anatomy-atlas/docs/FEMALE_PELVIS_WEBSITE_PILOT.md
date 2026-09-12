# Female pelvis — contained website pilot

The main Visible Medicine website can deliver the existing HRA female-pelvic workbench at `/atlas/female-pelvis-3d`. This is a separate source reference: 41 surfaces, eight studies, 31 selections with draft teaching and ten without. All source holds, coverage warnings, the radiologist review requirement and commercial-reuse notices remain. No nerve network, pelvic floor, complete female body or scan registration is claimed.

## Build and update

Use the installed, lockfile-pinned Atlas dependencies. Run `node node_modules/vite/bin/vite.js build --config integration/female-pelvis/vite.config.mjs`, then the normal source/teaching and TypeScript checks. Commit the clean source before running `node scripts/export-female-pelvis-module.mjs <website>/public/atlas-runtime/female-pelvis`. Export refuses an existing destination: preserve a previous export and use a clean staging destination for updates. Never hand-edit generated website files.

The build emits actual browser dependency licences, complete notice text and hashes of its source inputs. Export rejects stale builds, copies only allowlisted browser files, the single canonical model/catalogue/notice, and project licences. Its manifest binds every exported file to the Atlas source commit. No dependencies, fonts, textures, paid service or patient files are added.

## Boundaries

- `modelDeliveryUrl` adds an optional strict same-origin delivery prefix. Catalogue identity, coordinates, source SHA and clinical-teaching bindings stay unchanged. Default standalone calls still use `/models`; main scene, cache retry and identification all use the same prefixed URL in the module.
- `createHraPelvisSupplement` reuses actual teaching and practice; the standalone wrapper retains study links. The website export omits these standalone navigation controls and any review API connection. No fake website review endpoint is created.
- The iframe contains trusted first-party code. CSS isolation is not a security sandbox or paywall. Preserve owner-private audience; independent server-side Atlas/case/lecture rights remain mandatory before commercial launch.
- This is not a Didanix viewer or a patient model. The shoulder's selection adapter has not been falsely attached to pelvic source IDs. Add a source-validated Education adapter only with approved mappings and readiness evidence.
- Preserve accessible model/notice downloads and CC BY 4.0 reuse rights; no endorsement is implied. Separate code/teaching MIT terms do not replace model rights.

## Acceptance

Source tests check actual workbench and practice rendering with only WebGL stubbed, exact source identity, unchanged lesson bindings, loader/retry prefixes and invalid URL rejection. Website tests check the exact exported inventory, hashes, licences, single route and truthful coverage. These are not device or clinical acceptance. Real browser/GPU, touch, keyboard, 200% text, login/iframe and visual-anatomical review remain required. Source geometry and the specialist CT masks are not edited.

# Shoulder website pilot

## Delivery boundary

The shoulder has an opt-in `presentation="panel"` mode. Standalone routes retain their navigation. The panel uses its measured container size, not just viewport width, for the tools and information drawers. It retains dissection, explode styles, labels, source credit, practice, failure recovery and exit-exam controls.

`integration/shoulder` produces a self-contained, versioned browser module from the actual atlas components. The main website mounts it in a **same-origin iframe** at `/atlas/shoulder-3d`; CSS and React do not collide with the website. There is no cross-site cookie dependency, new service, copied clinical PACS, patient image or second learner viewer. This is not a security sandbox: the module is trusted first-party code and inherits the website's audience. Keep the website owner-private until the release gates pass; robots metadata is not access control.

## Rebuild and ingest

Using the existing atlas lockfile and installed packages:

1. `node node_modules/vite/bin/vite.js build --config integration/shoulder/vite.config.mjs`
2. Run shoulder tests, TypeScript and fingerprint checks; commit the exact source.
3. `node scripts/export-shoulder-module.mjs <website>/public/atlas-runtime/shoulder`
4. Verify the exported manifest hashes, website tests and website build. Commit the module and its source revision together with the host changes.

The exporter refuses an existing destination: preserve the prior module before replacing it in a clean checkout. It copies only the compiled entry/chunks, one hash-checked shoulder GLB, model credit and licences. It never walks private work directories or exports patient studies. Rebuild after any source edit before export. The source atlas is authoritative; do not hand-edit compiled chunks in the website.

Bundled runtime packages have their actual licence text collected at build time. Unsupported licences or missing text stop the build. React Three Fiber 9.7.0 omits its licence file from the installed package; its exact tagged upstream MIT text is retained under `LICENSES/react-three-fiber-9.7.0-MIT.txt`, retrieved from https://raw.githubusercontent.com/pmndrs/react-three-fiber/v9.7.0/LICENSE. Existing BodyParts3D v4 CC BY 4.0 attribution is retained. System fonts are used; no font binary, new package or paid API is added. Hosting costs remain separate.

## Imaging and lecture stages

1. **This milestone:** private website navigation plus the real shoulder module. No patient data, lecture unlock or external-viewer session is created. Shoulder review records remain with the separate atlas review workspace; the exported panel does not call the website's `/api/reviews`.
2. **Next:** connect Didanix **Education/light**, using the existing versioned anatomy/resource IDs, source frame identity, patient-LPS geometry and registration checks. A generic donor model must never be presented as registered to a patient without a validated transform. Unknown registration means independent comparison only.
3. Use one owner-approved, fully de-identified, publication-cleared case. Choose a lecture anchor only from a cleared lecture. Current registry has no cleared production links; do not fabricate one.
4. Independently enforce atlas, case and lecture entitlements server-side on every resource request. Client labels, URLs, iframe messages and successful atlas sign-in grant no lecture access. Missing/revoked entitlement denies access; locked lectures may show approved metadata without serving media.
5. Broaden region by region after the pilot is signed off. Do not alter CT-head masks or clinical Didanix from this integration.

## Acceptance still required

Radiologist review of geometry/labels/teaching; full case privacy/release review; Didanix real-DICOM/OIDC readiness; linked frame and registration verification; access/revocation tests; keyboard/focus/Escape, mobile/touch and 200% zoom; GPU loading, canvas/context recovery, embedded resizing and real-device performance. Automated/SSR tests are not clinical or browser acceptance. Public launch is not authorized by this private integration milestone.

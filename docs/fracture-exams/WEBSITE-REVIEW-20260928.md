# Didanix website fracture review

The owner requested that the pilot open in the actual website's Didanix
workspace. The resulting route is `/learn/fracture-review`, linked from
administrator Staff tools in the learning workspace and from the institution
workspace. It reuses the existing active-administrator/institution authorization
boundary. No roles, entitlements, cases or attempt records are created.

The existing general EducationRuntime currently renders seeded synthetic media
and posts answer/progress data to its backend. Its ingestion picker uploads to
quarantine. Neither is appropriate for these uncleared PNGs. The new real raster
review panel sits in the same website/Didanix education workflow and keeps its
file handling separate from those backend mutation paths.

## What to open

In the protected website route, choose **Open local pilot** and select
`fracture-pilot.vm-fracture.json` in the original ignored private pilot folder.
The package was prepared locally from the exact r1 draft/evidence/image hashes.
It contains six studies, twelve original PNGs and eighteen questions. It contains
no filesystem locators, original filenames or patient/study keys. Image bytes
and draft answers remain private and must not be uploaded or committed.

The website cannot automatically read a Windows path. The user must select the
package once per session. It is read into browser memory only. Closing/reloading
clears images and temporary notes; the existing private review worksheet remains
the durable correction record. No clinical sign-off or grading is recorded here.

## Isolation and integrity

The reviewer runs in a sandboxed iframe with only `allow-scripts`, without same-
origin, forms, navigation or popup permissions. All scripts/styles are inline
with exact CSP hashes. CSP denies network connections and permits only blob
images. The self-contained reader requires no authenticated subresource calls
from its opaque sandbox origin. It has no upload, fetch, beacon, storage,
postMessage, form submission or analytics path.

The parser checks bounded exact shapes, pending statuses, package checksum,
unique opaque IDs/image hashes, PNG signature/dimensions and per-image SHA256.
Checksums detect corruption; they do not establish privacy, clinical accuracy
or approval. Untrusted question strings use textContent. Image object URLs are
revoked on case switch, replacement, close and page exit. Late asynchronous
imports cannot restore a replaced/closed package.

Reader limits: 64 MiB JSON, 12 cases, 32 images, 8 MiB per image, 40 MiB decoded
file bytes, 32 million pixels per image / 100 million total. These are local
resource bounds, not proof of device compatibility for every allowed package.

## Verification and publication boundary

The actual private pilot passed local sandboxed browser checks: all twelve
images decode across six cases; temporary responses survive case navigation;
zoom, invert, fit and draft disclosure work; no horizontal overflow at 1280,
375 and 320 pixels; zero network requests after import; Close removes all
image elements. No image screenshots were captured or transmitted.

Focused tests cover malformed/tampered/promotion/duplicate/oversized packages,
generated-reader CSP/source consistency, the existing draft contract and
patient grouping. Full applicable website tests, TypeScript and production
build are required before the publication checkpoint records success.

The full website test run exposed an existing stale head/neck source pin. The
test now pins the already committed `3f6f74478e2978109ff47587f1aa60e1b66ecd81`
chest-wall export documented in the existing delivery note. All geometry and
byte assertions remain intact; no Atlas source or generated runtime was edited.

Generic website code is published under the existing site access policy. No
case package, source images, private review notes or patient identifiers enter
the deployment. Clinical/privacy/reuse statuses remain pending. See the local
publication receipt for the actual saved version and deployment status.

## Rebuild

Run `node scripts/fracture-exams/build-reader.mjs` after modifying reader source,
then `node --test scripts/fracture-exams/*.test.mjs`. The generated `reader.html`
contains generic code only. Use `package-local.mjs <private-run-folder>` to
create a new local package; it refuses public/nonignored destinations and
existing package files. Never place that generated package in this checkout's
public assets, database, R2 or a deployment archive.

This feature was built in an isolated managed worktree while the main chat
continued Atlas work. Preserve these files and the two navigation links in
future website integrations. This change adds no hosted patient-image store.

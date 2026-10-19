# Frozen clinical inspection candidates

This is the first, **inspection-only** phase of completion item BASE-04. It does
not complete that item. Candidate-specific decisions and their history, wider
review scopes, correction/supersession relationships and release admission remain
to be implemented. Existing current-build decisions are unchanged and never
attach to these candidates.

## What is frozen

A candidate packages selected root-body worksheets (including all topic copy,
questions, references, tour evidence and original context), a separately built
worksheet UI and 3D renderer, the exact catalog, model bytes and notices. It is
not merely a checksum of files that will later be replaced. A content-derived
candidate ID covers the full file manifest and selection identities. Correction
or code/content/asset changes produce a different candidate ID. Registered old
IDs and their objects must remain available; never replace an old entry to make
it resolve to a new build.

The saved renderer uses a deliberately private, source-level build adapter for
model delivery. Its own renderer revision is distinct from the originating
normal Review revision. No exported learner module is edited by hand. Absolute
current model/catalog paths cannot be used as fallback. Candidate files live in
content-addressed R2 keys; models reuse the existing `atlas-models/v1/SHA.glb`
namespace, with exact recorded size and SHA-256. A missing or mismatched object
fails closed. Object paths and candidate IDs are not access credentials.

## Private access

`/workspace/review-candidates` reuses the current Clinical Review account and
institution layout gate. Every file request additionally rechecks the existing
administrator model-delivery gate, including HTML, JavaScript, worksheets,
catalogs, model ranges, HEAD and conditional reads. Responses are private and
no-store. Revocation stays current even though the renderer/content is frozen.
No Atlas, case or paid-lecture entitlement is inferred or granted.

No decisions, account names, patient images, scans or accepted masks are included.
The first candidate contains only two deep-plantar-artery review selections;
its contextual model inventory does not broaden its review/approval scope.
Other frozen model selections are inspection only, as in the current inspector.
The root-body snapshot excludes independent-specimen, nested and shoulder-pilot
worksheets. Acquired-image registration is not provided.

## Build and inspect locally

Run from the website checkout using the existing installed dependencies:

```powershell
node scripts/verify-clinical-review.mjs
node --experimental-strip-types scripts/build-clinical-review-candidate.mjs --output F:/VisibleMedicine/private/review-candidates/NEW-NAME --label "Saved inspection" STRUCTURE-ID
```

The output must be a new local directory. Build outputs, rendered modules and
model/worksheet objects remain private local artifacts. The builder checks
normal Review coherence, worksheet fingerprints, exact registered model bytes
and bundled package versions/licenses against the existing notice set. The
rendered package has no externally hosted font or new dependency. Original
commercial-compatible model/source attribution and dependency notices remain in
the package. This does not newly certify anatomical accuracy or third-party rights.

After independent checks, append the exact generated `candidate.json` entry to
`lib/clinical-review-candidate-registry.json`; do not overwrite earlier entries.
With the owned localhost preview stopped, stage its objects locally:

```powershell
node --experimental-strip-types scripts/stage-clinical-review-candidate-local.mjs --package F:/VisibleMedicine/private/review-candidates/NEW-NAME
node scripts/start-stable-preview.mjs
```

The staging command has no remote mode or database binding. It refuses to run
while port 3000 is listening, never overwrites/deletes a stored object and reads
back every staged object's bytes. It uses the existing local emulator bucket,
not a new paid/cloud resource. The package folder and emulator data are not a
GitHub/off-device backup. Hosted staging and any possible storage charges need
separate authorization; nothing here uploads or publishes the package.

Normal sign-in is required to inspect through the website. An unauthenticated
browser check verifies denial only, not signed-in visual acceptance. Synthetic
R2/authorization fixtures test behavior without changing real review accounts.

# Held disc comparison — local staff review

Open **Workspace → Clinical Review → Source comparisons → Unresolved disc**.
The comparison is separate from learner anatomy. FJ3211 remains held and its
named level unassigned. IS-A and PART-OF originals have different bytes but
identical ordered coordinates/topology; the IS-A name describes a 23-file
aggregate, not this single component. Optional T11/T12/L1/L2 source vertebrae
and two neighbouring disc definitions provide context, not certified numbering.

Rotate with drag, arrow keys or smooth camera presets; reveal or fade original
context. Inspect extent and boundaries from several views, then export a draft
note. Notes remain in the browser until downloaded. No upload, assigned level,
source admission, durable opinion or clinical approval is created. Do not enter
patient information. Actual revision-bound radiologist adjudication remains
required. This comparison contains no patient scan or registration.

## Reproduce locally

From this website checkout, use the clean source revision pinned in the importer:

```powershell
node scripts/import-disc-comparison.mjs --source "<existing Atlas outputs checkout>"
node scripts/import-disc-comparison.mjs --source "<existing Atlas outputs checkout>" --check
node --test --experimental-strip-types tests/disc-comparison.test.ts tests/optic-comparison.test.ts
npx tsc --noEmit
npm run build
```

The importer replays exact table/catalog/hold evidence, original bytes/SHA/CRC,
coordinates, faces and bounds. Only metadata is tracked in
`lib/disc-comparison-manifest.json`; the generated four-asset packet is an ignored,
`server-only` module under `.local/disc-review/assets.ts`. No original geometry is
added to Git, `public/`, learner catalogues or admitted review imports. Regenerate
it locally before building a fresh checkout; preserve the licensed original cache
and recovery copies. The existing optic packet stays independently pinned.

Both the page and every index/script/scene/notices GET/HEAD check the existing
Clinical Review administrator + active institution owner/administrator authority.
Revocation is checked anew on each request. The server rejects unknown assets,
writes, stale/duplicate/extra revision queries, missing or altered bytes/hashes,
assigned levels and lifted candidate holds. Responses are private/no-store,
same-origin and unindexed. General staff, learners, Atlas subscribers and paid
lecture access do not acquire review access. No schema or role changes are needed.

The browser additionally validates the exact report query before fetching the
adjacent scene. This guard is not server authorization. The two source-tree names,
original geometry, unassigned-level warning and draft-only status are retained.
BodyParts3D CC BY 4.0 credit and full Three.js/OrbitControls MIT notice are served
inside the protected inspector. No new library, font, texture or paid service.

This delivery is local and unpublished. Tests prove the checked software flows,
not signed-in browser/GPU appearance, camera perception, accurate anatomical
numbering or clinical acceptance. Embedding an ignored server packet does not
prove free-hosting size/storage suitability. Hosting requires separately
authorized size, privacy/licensing, per-request access and actual browser checks.
Scans, CT-head accepted masks/boundaries and clinical desktop PACS remain untouched.

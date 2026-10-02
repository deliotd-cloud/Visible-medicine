# Held optic comparison — local staff review

Open **Workspace → Clinical Review → Source comparisons**.
The comparison is a local-only extension, not a learner model, a clinical approval
control or a patient-imaging viewer. Each original right/left pair can be viewed
in matched split panes or original-frame overlay. Both panes share one smooth
camera. Anatomical side is explicit, not inferred from screen position.

Select a proposed next action and export a revision-bound draft note for the main
Atlas task. Notes stay in the browser until downloaded; no upload, decision API,
admission or durable clinical sign-off is implemented. Do not enter patient data.
Actual source identity/extent adjudication by the radiologist is still required.
The whole sphenoid is optional context, **not** a segmented or certified optic
canal. Camera/rendering success does not validate anatomy.

## Reproduce locally

The existing Atlas source must be clean at the exact revision pinned in
`scripts/import-optic-comparison.mjs`. Its original BodyParts3D cache and pinned
report must be available locally. From this website checkout:

```powershell
node scripts/import-optic-comparison.mjs --source "<existing Atlas outputs checkout>"
node scripts/import-optic-comparison.mjs --source "<existing Atlas outputs checkout>" --check
node --test --experimental-strip-types tests/optic-comparison.test.ts
npx tsc --noEmit
npm run build
npm run dev
```

Generation replays source holds, file hashes, original vertices/faces, report
and display geometry hashes before making the packet. Metadata alone is tracked
in `lib/optic-comparison-manifest.json`. Geometry, HTML, viewer bundle and notices
are embedded in **ignored `.local/optic-review/assets.ts`**, marked `server-only`.
Nothing is copied to `public/`, learner manifests or the vendored review import.
A fresh checkout without regeneration intentionally cannot build this route.
Keep the original licensed source cache for reconstruction; Git is not its backup.

Every index/script/scene/notices GET or HEAD goes through the existing Clinical
Review administrator + active institution owner/administrator check. Revocation
is checked on each request. Exact report revision, allowlisted path, byte length
and SHA-256 are checked before delivery; responses are private/no-store and
same-origin. General staff, learner and course/Atlas access do not grant access.
No schema, user roles, auth provider, patient data or desktop PACS is changed.

BodyParts3D attribution/CC BY 4.0 and Three.js/OrbitControls MIT notices travel
with the protected packet and are accessible inside the inspector. All source
coordinates/topology remain unchanged; only presentation is added. Existing
learner/review licences and display approval revisions remain untouched.

This batch is **unpublished**. Embedding a large ignored server packet is a local
review delivery mechanism, not proof of compatibility with free hosting limits
or deployment readiness. A future hosted version needs explicit authorization,
size/storage evaluation, complete source/licensing evidence, per-request access
tests and real signed-in desktop/browser verification before release.

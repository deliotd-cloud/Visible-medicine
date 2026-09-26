# Clinical Review website integration — 26 September 2026

The website workspace now contains the personal Clinical Review home and four
editors at `/workspace/atlas-review`: nine shoulder, 1,104 whole-body, 106 nested
and 356 independent-specimen contexts. These are 1,575 exact review contexts,
not a count of approved structures or institutional sign-offs.

## Source and material boundaries

The saved handoff pins the separately versioned Atlas source to
`3984c9782e35905996c53b791660ce30b75ba008`. `atlas-review/` is a generated,
hash-manifested dependency closure of that commit, imported read-only with
`scripts/import-clinical-review.mjs`. The changing Atlas working tree is never
copied. Source, model links and website renderer adaptations are bound together
by `scripts/bind-clinical-review.mjs`; a changed material fingerprint requires
re-review. Historical decisions and their original fingerprints are retained.

The review model iframe is separately built from this same pinned source in
`public/atlas-review-viewer/`. It preserves the source identity, side, region,
study, nested and specimen query fields. Its model bytes come through existing
protected delivery; it adds no model, acquired scan, mask or clinical archive.
The existing generated `public/atlas-runtime/` exports remain unchanged.
Source and bundled dependency licences accompany the viewer. The learner Atlas
may run a different source revision; approvals are never transferred to it.

## Identity, storage and authorization

Every page and API uses the real trusted host identity, never the development
demo identity. The exact `edu:<subject>` / `sites:<subject>` pair must have an
active account, global administrator role, and active owner/administrator
membership in an active institution. General workspace visibility is insufficient.
No user, role or membership is provisioned by these read/write checks.

Storage keys are versioned JSON tuples of website user and authorized institution.
The initial policy selects the earliest eligible institution deterministically;
there is no client-selected institution override. If account or institution
changes while a form is open, saving requires a fresh document/context. Access
and revocation checks use primary D1 reads on every request.

Migration `0008_solid_infant_terrible.sql` creates four new `atlas_personal_*`
append-only tables. It does not migrate, rename or merge original Atlas records.
Each save adds a version; atomic expected-version checks reject concurrent stale
saves. Revision, scope, source frame, origin, content type and payload limits
remain enforced by the source handlers. Responses are private and not cached.
Review decisions confer no Atlas, case, lecture, publication or institutional
approval entitlement.

## Reproduction and checks

After intentionally updating source/adapters, run:

```powershell
node scripts/import-clinical-review.mjs <separate-Atlas-repository>
npm run build:clinical-review
npm run verify:clinical-review
npm test
npx tsc --noEmit
npm run build
```

The importer stays pinned until deliberately reviewed. Ordinary website builds
verify the import receipt, material input hashes and viewer artifact hashes first;
they cannot silently publish a stale review viewer. New website adapters live
outside `atlas-review/`; do not hand-edit imported files.

The actual website endpoint tests run against isolated Miniflare/D1 storage with
synthetic accounts. They cover all four save/reload/correction paths, concurrent
conflicts, stale material, account/institution isolation, revoked roles and access,
identity mismatch, malformed/bypassed requests and context changes. The website
suite passes 216 tests; TypeScript and both production builds pass. The local
browser verifies a persisted shoulder draft/correction and stale re-review recovery
at a 390-pixel viewport. These records explicitly state that no clinical review or
approval was performed. Disposable fixtures are excluded from source/deployment.
All four browser editors load, keyboard search returns the expected result set,
and the standalone model opens the selected abdominal aorta and lower-limb source
part. Browser QA caught and corrected framework-adapter resolution and iframe
height issues. The build rejects accidental Next.js inclusion and debug artifacts.

The dependency audit reports six existing findings (five high, one critical) in
the unchanged baseline Next/Cloudflare tooling chain; none is introduced by the
new review dependencies. This integration does not claim to remediate them.
The static viewer retains source-sized large chunks; broad device/performance
acceptance is not implied by these checks.

## Release and recovery checkpoint

The coordinating handoff received a newer local-first preference while this
integration was underway. Publication is a separate decision from source recovery.
Consult `work/CLINICAL-REVIEW-INTEGRATION-CHECKPOINT-20260926.md` for the exact
source commit, GitHub/D restore evidence and deployment outcome. Until a deployed,
authenticated flow is actually tested, this work must not be described as live
acceptance. Independent Cloudflare migration, DNS, paid services, public sharing,
patient data, clinical sign-off and institution release remain outside this change.

To roll back the website UI, restore the prior source build; preserve the additive
review tables and history. Do not delete personal decisions as a rollback step.
Before live acceptance, back up real review storage separately and verify restore
using disposable data; a Git source bundle does not back up D1 records.

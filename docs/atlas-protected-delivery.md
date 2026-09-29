# Atlas model transport and release boundary

29 September update: native negotiated gzip is implemented for complete protected
responses. Canonical bytes, ranges and authorization remain unchanged. See
[local evidence and limits](atlas-lossless-delivery-20260929.md). Not published.
The package counts below describe the historical 13 September revision.

13 September 2026. Complements [staging evidence](atlas-model-storage.md).
This revision preserves the complete canonical four-module package: 59 GLBs,
127,449,300 original bytes, including the shared head/neck–thorax runtime and
compact regional controls. No geometry, source ID, teaching, licence or splash
setting changes. Publication/actual-browser results belong to the dated main-task
checkpoint; source implementation alone does not prove a deployed result.

## Delivery

The Worker preserves `/atlas-runtime/<module>/models/<path>.glb` and its optional
12- or 64-character source-hash query. Internally it dispatches to
`/api/atlas-delivery/<module>/models/<path>.glb`. Only exact registered paths and
matching revisions resolve. Unknown paths, duplicate/unknown query keys and
stale revisions fail closed, instead of loading geometry from another release.
Only GET/HEAD are supported. Stored SHA-256, exact size and key are checked;
responses stream with private/no-store, byte ranges and conditional reads.
`X-Atlas-Delivery: registered-storage-v1` identifies the protected transport for
diagnostics; it is not an authorization credential.

`atlas-delivery-policy.ts` binds the complete inventory SHA-256. The API computes
that fingerprint from its actual bundled inventory and rejects mismatch. The
current audience is **administrator-review**, without an approved revision.
Actual Sites identity must match an existing active account and persisted
administrator role. Authorization performs primary-session database reads only:
no schema setup, demo-user fallback, role creation, implicit provisioning or
membership reactivation. Each request, including range/conditional reads,
rechecks authorization. Previously downloaded bytes cannot be revoked from a
recipient's device; no claim of DRM is made.

The dormant reviewed-learner policy requires a matching release approval and an
active organization, membership and independent Atlas entitlement, including
expiry. It is tested with synthetic fixtures, not enabled in production. Course
enrolment/Studio access never grants Atlas access; Atlas access never grants a
lecture or patient-imaging case. Individual paid subscriptions, legitimate
second-account live acceptance and the full educational release workflow remain
future integration gates. Do not activate this policy merely to pass a test.

## Reproducible publication

After checking every stored model's complete bytes against the inventory, build
the exact committed source, then run:

```sh
node --experimental-strip-types scripts/prepare-atlas-delivery.mjs --plan
node --experimental-strip-types scripts/prepare-atlas-delivery.mjs --apply
node --experimental-strip-types scripts/prepare-atlas-delivery.mjs --verify
```

The script verifies the original inventory and every companion file/notice,
checks original and generated model bytes, rejects symlinks, out-of-root paths
and unregistered static GLBs, and checks the built delivery handler/policy.
Only then does it remove the exact 59 duplicated files **inside dist/client**.
No source/public model, stored object or backup is deleted. Rebuilding restores
those generated copies. A build receipt binds source commit/tree, inventory,
each omitted model and all runtime companions. Verify the packaged archive too:
all companion hashes must remain and no static GLB may bypass authorization.
Use the standard Sites packager afterwards, preserving migrations and bindings.
Do not run a second build between preparation and packaging.

For a newly admitted model, stage and verify its actual bytes first, regenerate
the inventory, update the matching delivery policy after source review, rebuild
and repeat this workflow. Keep clinical approval separate from transfer checks.

The staff maintenance page's **Check Atlas delivery** uses the actual original
model URLs to check HEAD, full-byte SHA-256, the exact 12-byte GLB header range
and conditional 304, with no client-supplied identity or approval. It rejects
static-route fallbacks and supports cancellation. The learner UI gains no toolbar.

## Acceptance and rollback

Private website **version 56**, source
`fb04d2464b662396eddbad00069ff8c26c84cc67`, deployed successfully on 13 September
2026 at 12:17:28 UTC. The native archive upload is now 30,980,933 bytes rather
than the failed roughly 104 MB full-static attempt. It retains all 78 registered
runtime/manifest/notice companion files and no static GLB copies. The exact
archive and source are recorded in the main task's protected-delivery checkpoint.

The actual authenticated staff browser completed **59/59 original model URLs**:
HEAD 200, complete GET size/SHA-256, exact GLB-header range 206 and conditional
304, all carrying the protected-storage marker and no-store response. No identity
or roles were changed for this check. Desktop thorax displays its 157 selections;
the first dissection stage removes two pectoralis selections and Undo restores
157. Searching for the left ventricular cavity opens the loaded nested four-space
cardiac study with the correct selected label. At 390×844 the model and controls
remain visible, page width equals viewport width, and hiding/restoring the right
atrial cavity works. The 290-selection head/neck view also renders. These are
sampled browser checks, not complete device, anatomy or clinical acceptance.

The captured viewer logs show the pre-existing Three.Clock deprecation warning,
not a loading error. Initial integrated overview framing remains small and is a
further presentation improvement. A direct browser navigation intended to inspect
a stale GLB query was blocked by the browser client; it is **not** recorded as a
live application rejection. Local stale-query tests pass. Legitimate non-owner
live denial, deployed cancellation/failure recovery and an exercised live
rollback remain open before learner release. Current access stays administrator
review, without clinical or public release approval. All 85 website tests,
TypeScript, production build and exact archive/source-companion checks pass.

Local tests exercise real Miniflare D1/R2 bindings, denied/revoked/expired access,
independent lecture rights and the browser diagnostic against that storage
handler. Packaging tests include corruption, unknown GLBs, missing notices and
source preservation. These are not actual deployed non-owner or clinical checks.
After private publication, run the staff delivery check and sample real nested
viewers, mobile controls, dissection/undo/reset and load errors. Retain exact
prior archives and objects. The previous private v55 static bootstrap is a
rollback candidate, not a substitute for preserving the full development source;
restore the exact prior release only if needed. Do not claim a live rollback was
exercised merely because its archive exists.

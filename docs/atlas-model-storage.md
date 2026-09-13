# Independent Atlas model delivery — staging phase

13 September 2026. The administrator staging mechanism is privately deployed in
website version 53, from `a88597fc91a4f2ecfcaea05f2363a412951546e7`.
After the upload tab closed, a new authenticated browser check confirmed all
59 registered models in live storage, with the expected SHA-256 and byte length.
The live learner routes and their four static model exports remain unchanged.
This is storage evidence, not full-download, loader or clinical acceptance.

## Why

The detailed head/neck–thorax website package reached 104 MB and its native Sites
upload timed out. Removing anatomical structures to fit that upload would not
satisfy the Atlas goal. The existing website already declares private R2 `FILES`.
Independent model uploads can separate model delivery from application updates.
No bucket, public domain, credential, paid plan or new service was created.
Infrastructure usage is not promised to remain free at arbitrary scale.

## Implemented boundaries

- `scripts/atlas-model-inventory.mjs` verifies **all files and companion notices**
  in the four existing module manifests before generating the server allowlist.
  It checks exact bytes/SHA-256, confined regular paths, source commit identities,
  no-patient-data declarations and GLB headers. It is not a clinical/licence audit
  and cannot admit a new source just because its manifest says it is safe.
- Current inventory: **59 unchanged canonical GLBs / 127,449,300 bytes**. The
  largest is 19,648,284 bytes. A 32 MiB per-file limit is an application safeguard,
  not a quoted provider limit. No model is simplified, recompressed or remeshed.
- `/workspace/atlas-models` is a separate administrator maintenance page, not a
  new learner toolbar. Its file picker validates the whole selection locally
  before sending any file. Uploads are sequential, cancellable and manually
  resumable; storage is rechecked rather than assuming an interrupted PUT failed.
- `/api/atlas-models/[sha256]` supports PUT, GET and HEAD for **registered hashes
  only**, with real Sites identity and an existing server-side administrator role
  check on every operation. The development demo identity is deliberately not
  accepted. No client role, custom auth token or bypass header exists.
- PUT requires same-origin, a complete unencoded GLB and the registered length.
  `FixedLengthStream` enforces actual size; R2 enforces the registered SHA-256
  over actual received bytes. A preflight HEAD and conditional create prevent
  overwrites, including simultaneous uploads. Existing unverified/corrupt objects
  fail closed. There is no delete, arbitrary object-key or private-scan API.
- Keys are `atlas-models/v1/<sha256>.glb`, separate from teaching quarantine.
  Reads verify R2's stored checksum and size, stream bytes, support single byte
  ranges and validators, and retain private/no-store responses. These staging
  reads require administrator permission; they are **not yet learner delivery**.
- Filenames, IDs, licences and full notices remain in their existing exports.
  Patient cases, masks, independent lecture rights and clinical sign-off are
  unchanged. No new dependency was installed. The test uses already locked
  MIT-licensed Miniflare 5.20260820.0-alpha and its provided v4-options adapter.
- The maintenance page also supplies a separate full-download check. It reads
  actual streamed bytes within the registered limit, checks GLB headers and
  SHA-256, rejects incomplete/oversized/error/redirected responses and supports
  cancellation. A green HEAD result alone never counts as a full-download pass.
  No browser credential, private case or additional dependency is introduced.

## Verification

Commands from the website checkout:

```sh
node scripts/atlas-model-inventory.mjs --check
node --test --experimental-strip-types tests/atlas-model-storage.test.ts
node --test --experimental-strip-types tests/atlas-model-download.test.ts
npm test
npx tsc --noEmit
npm run build
```

The new tests run the actual storage implementation in local Workers/Miniflare
with real local R2 bindings, not a hand-written bucket mock. They cover unknown
hashes, missing/learner permission, origin/method/type/encoding/length rejection,
bad checksums, actual short/oversized streams, concurrent writers, idempotent
repeat writes, full/ranged/conditional reads and stored corruption. The actual
largest model is uploaded and downloaded with an exact SHA-256 comparison.
The test-only authorization fixture is never imported by application routes.

The full-download addition passes four focused test groups, and the complete
website suite now passes 80 tests with TypeScript passing. Its production build
and live download outcome are recorded in the dated delivery checkpoint rather
than inferred from these tests. An earlier complete-suite run hit a transient local `ECONNRESET` during
Miniflare dispatch; its focused and subsequent full run pass without weakening
assertions. The Sites build helper's Windows npm resolution failed; the existing
`npm run build` completed successfully without dependency/config changes.

Actual local browser inspection verifies the staging page denies an unsigned-in
visitor and does not render the file picker/inventory. The actual API's unsigned-in
HEAD returns 401. The actual deployed owner session successfully uploaded the
registered files; a fresh 59/59 HEAD check confirms their R2 checksums and sizes.
Live non-owner denial, cancellation after transmission, all-device accessibility
and clinical acceptance are not established by this owner-session test.

## Required next steps — do not skip to asset removal

1. Completed: a compact **bootstrap deployment** preserves the current working
   learner experience, introduces the staging route and carries the complete
   expected model inventory. Inspect exact source/manifest differences. Do not
   The public audience and paid plans were not changed. The current full package still
   has the large-upload condition; repeating it is not a scalable solution.
2. Owner access and all 59 registered uploads/HEAD checks are verified. Retain
   originals/notices/source hashes; test other-user denial through legitimate
   accounts before learner activation. No test role header or fabricated identity
   may be introduced into production. Recheck objects after any interruption.
3. Verify every intended object through authenticated GET (including byte hash),
   HEAD/range requests, and the actual Three.js loader before activating delivery.
   Save a revision-bound delivery receipt. Staging success alone is not this gate.
4. Add an explicit manifest-bound delivery adapter and server authorization for
   the learner Atlas. Do **not** point learners at this administrator-only API or
   assume an Atlas entitlement grants a paid case/lecture entitlement.
5. Only then package without the separately verified model bytes. Preserve every
   model route, notice, ID and anatomical structure; test desktop/mobile rendering,
   nested dissection, reset, failure recovery, source parity and rollback. Keep
   prior objects/releases until a separately authorized retention policy exists.
6. Continue complete abdomen nested/specimen delivery and the full regional,
   teaching, Didanix Education/light and radiologist-release roadmap. Native MRI
   remains a local QA tool, not a replacement learner PACS.

Cloudflare guidance influenced the use of direct bindings, streaming, checksum
validation and conditional creation. Current official references:
[R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/),
[Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/).
Latest types 5.20260911.1 were retrieved outside the project and compared with
installed 5.20260823.1 for the relevant R2/FixedLengthStream interfaces; no upgrade
or manually duplicated binding interface was introduced.

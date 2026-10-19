# Protected Education image readback boundary

Status: local integration seam, not an enabled service. Website baseline
`66ac3fd40e6c50c5d05cb0cb9be4be6d30750ca1`. The existing global Education image
readiness gate remains false. No new route, schema, storage bucket, upload,
authentication setting, real dataset or desktop viewer change is included.

`lib/education-media-delivery.ts` implements a provider-neutral, one-object
verification pipeline. Its dependencies are trusted **server-only adapters**,
not values supplied by a learner or a readiness acknowledgement. It is not
currently imported by any production route or viewer. Tests use invented
identifiers and opaque synthetic bytes, not patient data or decodable scans.

## What a successful read means

1. An authenticated server identity requests an opaque assessment version,
   expected integrity hash, case and object identifier. Clients cannot choose a
   storage key or substitute Atlas/lecture access for case access.
2. The verified published assessment loader must return that exact version ID.
   Its immutable manifest must contain exactly one matching case. Both workbook
   and case access must be checked live, using the existing server policies.
3. A trusted binding must match the assessment hash, frozen case version and
   publication hash. Study, series, frame-of-reference and SOP identities must
   match exactly one non-slide series in that frozen case. A same-case extra
   object outside the frozen scan identifiers is refused.
4. Exact source and clearance revisions must remain rights/privacy-cleared and
   explicitly allow the object hash. Quarantine, revocation, absent bindings,
   changed revisions and self-declared client readiness are insufficient.
5. A private `education-media/` key resolves only on the server. The provider
   must enforce the declared byte cap while reading. This initial seam supports
   whole DICOM-instance objects of 1–16 MiB only; it is not a total study or
   process-memory budget. Returned length and SHA-256 must match before any
   bytes are exposed. The function owns a copy before hashing.
6. Binding, clearance and access are checked again after reading. Changed or
   revoked records refuse the buffered object. Errors do not expose internal
   keys or provider details. Successful output excludes the key and supplies
   private/no-store and nosniff response-header guidance.

The final access check is not an atomic transaction across storage and access
systems. A live adapter needs a documented authorization/revocation consistency
model. Headers must be applied by the eventual route; a return value alone does
not configure HTTP/CDN caching or stop another caller from mishandling bytes.

## Actual adapters still required

- Wrap `getVerifiedAssessmentManifest` from `assessment-manifest-store.ts`;
  preserve its published-status, manifest integrity and row/manifest checks.
- Require **both** `canAccessPublishedWorkbook` and `canAccessPublishedCase`,
  with authenticated server identity and exact frozen workbook/case IDs.
  No allow-all implementation, browser-provided roles or lecture subscription
  fallback is acceptable. Recheck each request; no durable access token is issued.
- Add reviewed immutable assessment-case → source-revision → object bindings
  and live revision-bound clearance lookup. These do not exist in the current
  database. Ingestion quarantine metadata is not that binding or clearance.
- Supply a cap-enforced private Education object reader with cancellation,
  operational logging without private identifiers, rate/resource controls and
  cache/revocation tests. Never read the clinical PACS or a public asset folder.
- Decode and validate the actual DICOM object's identities, transfer syntax,
  frame coverage and geometry against its binding. Test supported browser
  decoding and exact overlay alignment. This seam checks bytes and frozen
  identifiers, **not** whether those bytes form a valid playable DICOM instance.
- Review explicit contracts for multiframe instances, WSI tiles, NRRD volumes,
  derived PNG/JPEG frames, range/stream requests and study-level completeness.
  They are not enabled through a permissive content-type fallback. The approved
  browser-local CT/MRI head transport is a different format and remains unchanged.
- Before enabling readiness, verify **all** required exam images and the actual
  decoder/viewer contract for that exact revision. One verified object does not
  establish complete-study readiness. Keep independent Atlas/case/lecture access,
  hosting authority, clinical sign-off and privacy/publication gates separate.

No clinical approval or generic-3D/CT/MRI spatial registration follows from a
successful read. Different subjects remain semantic comparisons only. Existing
historical exam evidence and authoring/teaching workflows are unchanged.

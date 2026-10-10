# Unresolved disc source — local review

FJ3211 is still excluded from the learner atlas. This inspector resolves one
source-evidence question: IS-A and PART-OF originals have **different bytes but
identical ordered coordinates and triangles** (4,131 vertices / 3,476 triangles).
It does not assign the missing named disc level or lift either PART-OF generic
definition's hold. File equality, bounds and nearby geometry are not clinical review.

## Inspect

From the Atlas `outputs` checkout:

```powershell
node scripts/audit-unresolved-disc.mjs --check
node --test scripts/test-disc-source-review-packet.mjs scripts/test-unresolved-disc.mjs
node scripts/build-disc-source-review-preview.mjs
node scripts/serve-disc-source-review-preview.mjs
```

The builder refuses to overwrite `../work/unresolved-disc-preview-20261002`.
Use the verified existing preview if already built; keep its manifest/assets together.
The server prints a loopback URL, reads only four pinned assets and verifies every
response against the saved hashes. Foreign Host/Origin, writes, unknown paths,
query overrides, wrong report revisions and altered assets are refused.

The model stays in its original source coordinates. Choose either archive definition
within a single uncluttered canvas; optionally reveal four original source vertebrae
(T11, T12, L1, L2) and two already-admitted neighbouring disc definitions. They are
unvalidated context, not certified endplate subdivisions or level landmarks.
Camera presets use the existing 900 ms eased orbital arc; reduced-motion uses an
instant change, and manual orbit/keyboard rotation cancels a preset. Drag, zoom,
keyboard arrows and Shift fine steps are available. Actual GPU appearance and
perceived motion still need visual acceptance.

## Source interpretation

- `isa/FJ3211` is one component of generic FMA10446, a **23-file aggregate**. A
  single component must not be labelled as the complete aggregate or a named level.
- `partof/FJ3211` is the generic intervertebral-symphysis definition FMA25511;
  generic FMA10446 also aliases this file in PART-OF. Both holds remain authoritative.
- Exact source hashes/bytes, original archive CRCs and table/catalog/hold evidence
  are bound in `unresolved-disc-source-review.json`. No registration, mesh repair,
  reflection, rescaling, anatomy renaming or fabricated layer is applied.
- All unique candidate vertices and area-weighted triangle centroids are sampled
  against each context surface. These unsigned diagnostics are not endplate contact,
  intersection, anatomical equivalence or automatic radiological numbering.

Review the candidate's whole extent, relation to existing source vertebrae and
discs, segmentation boundaries and generic source labels from multiple views.
If a named level is proposed later, record the anatomical rationale and exact
source/revision in the established clinical process before any catalogue change.
No patient scan or accepted CT-head mask is used to make this decision.

Draft-note export binds the report hash, chosen tree/file/hash and observations.
It always retains `levelAssigned:false`, `clinicalApproval:false`, zero admissions
and the hold. It is not an Atlas sign-off, has no approval importer and saves no
server-side review record. Do not enter patient information. Protected website
Clinical Review integration is a separate subsequent delivery step.

Protected website copies must carry exactly `?revision=<report SHA-256>` in the
index URL. The viewer validates that query before any source fetch and carries it
to the adjacent scene request. Duplicate, extra, malformed, stale or foreign-base
requests are refused. The standalone loopback preview may omit the query; its
existing bundle remains the prior local-only build. Website asset authorization
is independent of this browser guard and must run on every asset request.

## Licence and validation

Only established BodyParts3D v4 and Three.js/OrbitControls are reused, with no new
dependency/font/texture or paid service. Official [CC BY 4.0 grant and required
credit](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html)
checked 2 October 2026; generated assets include
`LICENSES/unresolved-disc-source-review.md` and the full Three.js MIT notice.

The source/packet/HTTP suites cover exact geometry, source substitution, true bounds,
metadata/tree/name/count tampering, held/level flags, report revisions and asset
delivery rejection. Existing camera tests cover numerical easing/endpoints, not
actual browser movement or anatomical accuracy. Initial test errors were corrected:
the archival catalogue has 1,022 records (1,104 is displayed root coverage), and a
raw HTTP request is required to test a foreign Host because Fetch does not transmit
that header override. Neither correction changes production anatomy or access.

Learner runtime, teaching, source holds, model inventory, previous optic comparison,
private scans, accepted CT-head boundaries and clinical desktop PACS are unchanged.
This local tool is not published, clinically accepted or an admission of new anatomy.

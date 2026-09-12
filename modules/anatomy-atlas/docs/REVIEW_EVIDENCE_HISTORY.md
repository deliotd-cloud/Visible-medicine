# Current review evidence and historical comparisons

## Display-history repair

The broad content test stopped at the old deferent-duct display checkpoint:
expected `5365d114...`, current `a10f44f7...`. The current document had correctly
incorporated the website integration, Education adapter, responsive labels and
camera changes; the historical comparison had not accounted for them.

The fingerprint writer and history validator now share the same offline evidence
builder. It hashes the actual shoulder GLB and all 46 explicitly listed current
display inputs, then derives all nine geometry/teaching revisions. The complete
supplied document must match, including input membership/order and absence of
extra fields. A stale or forged input is not normalized into acceptance.

Only after that check does the offline comparison reconstruct the 44-input
snapshot from source `925056d1681b0a6668d34cb9584cf565bbbc3a97`. Its complete old
document must still match the original `5365d114...` digest. Changed source,
identity or teaching therefore cannot be concealed as a display-only update.
The following existing transport/X-ray/search comparisons retain their original
historical digests. No private approval is read, written or migrated.

`npm run reviews:test` covers current file evidence, historical geometry
expiry, unchanged teaching, 16 malformed/recomputed input rejections, caller
mutation isolation and the existing 235 review-workflow checks. Optional
`node scripts/validate-review-history.mjs --verify-source` additionally compares
the retained snapshot against the actual historical Git object in the Atlas
source checkout. The regular test does not need that Git history to be present.

The current `content/review-revisions.json` bytes and all runtime review behavior
are unchanged. Passing these tests is not a clinical review or release approval.

## Source equivalence evidence

Original BodyParts3D v4 IS-A/PART-OF pairs for **FJ1662, FJ1663 and FJ1692** now
join the four previously audited pairs. Both official archive directory digests,
uncompressed sizes and CRC values were verified; six additional unchanged OBJ
files are retained under `content/prototypes/reference-cross-tree` as audit-only
evidence. Existing byte-preserving Git attributes apply to them.

Each new pair has different file bytes but the same ordered numerical vertex
coordinates and face indices. This proves the measured surface equivalence used
by this source ledger, not file identity, normals/materials, anatomical naming,
vascular continuity, completeness, patient registration or clinical correctness.
The retained runtime PART-OF hashes are checked against their original evidence
before the IS-A comparison can count them. Altered source/geometry fingerprints
are rejected or explicitly lose equivalence.

The ledger still has 1,101 root selections, 104 nested selections, 1,788 referenced
root source IDs, 446 root-only differences, 54 source holds and 366 pieces needing
source/anatomical review. The three unverified root equivalence entries are now
resolved. No new mesh, source admission, repaired anatomy or approval is created.

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution
4.0 International. The [official terms](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)
were rechecked on 12 September 2026. Existing notices are extended to all fourteen
audit-only originals. No competitor mesh, new dependency or paid asset is used.

Replay with `node scripts/audit-reference-cross-tree.mjs --check`,
`node scripts/audit-reference-coverage.mjs --check` and
`node scripts/validate-reference-coverage.mjs`.

## Remaining verification work

The full `validate-content-contract.mjs` suite is **not passing**. After the
display-history repair it reaches the separate `authoringBeforeXray` assertion:
expected `a97bf058...`, actual `e84b5b9a...`. No X-ray teaching or authoring-history
resolver was edited in this pass. Reconstruct and compare that authoring history
against exact source evidence; do not replace a golden digest just to pass.

Continue substantive regional anatomy/teaching, revision-bound radiologist
review and the real Didanix Education integration under the shared master plan.
Private scans and masks remain untouched. Hosted availability and source recovery
are recorded separately in the main task's checkpoint.

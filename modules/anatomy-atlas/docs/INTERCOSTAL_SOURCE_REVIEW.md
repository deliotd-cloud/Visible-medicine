# First and second posterior intercostal artery source review

11 October 2026. **Not admitted to the learner atlas. No clinical approval.**

This audit investigates four missing same-version BodyParts3D v4 IS-A concepts,
not a new procedural reconstruction. Each official concept is one complete source
component; the combined first/second/posterior parent concepts must not be imported
as duplicate tissue. The official name does not establish donor-specific branching,
continuous lumen, perfusion or a safe dissection plane.

| Concept | Side / level | Original file | Source bytes | Source SHA-256 |
| --- | --- | --- | ---: | --- |
| FMA66242 | Right first | FJ1939 | 89654 | a11a93262445e16bae2d4a1bee6ded11c23ab0737b540fd97d270150991e057a |
| FMA5041 | Right second | FJ1950 | 161995 | 2b6c467538d03278583cd396dd5a86c6964908ca017d26ee0ae635e8a7d5f148 |
| FMA66243 | Left first | FJ1973 | 90536 | 1f4bd8e1281524c80dfc8eede887e71137985e1076d9d4a6de4fef16044142b3 |
| FMA4112 | Left second | FJ1974 | 164855 | f8342d545e64702ba5d6cac32751d7b4649d561797ee375fd072f71583b0c295 |

## Rights and provenance

Original components were retrieved by scoped ZIP member requests from the
[official v4 IS-A archive](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip).
Pinned official tables, ZIP CRC/size, calculated SHA-256 and original coordinates
and faces are retained. No fitting, mirroring, trimming, bridging or repair was
performed. No scans or private data are involved.

The [official licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)
is CC BY 4.0: commercial-compatible, with attribution, not attribution-free.
Required credit: BodyParts3D, © The Database Center for Life Science licensed
under CC Attribution 4.0 International. No new paid service or dependency was used.

## Exact evidence scope

`docs/intercostal-artery-source-audit.json`, SHA-256
`c80b51c4a0c26d2b032092b05e27c4c0aff18cf20638d5e4bd97f17eecaa728e`,
records source baseline `6934e7f`: 1,104 root selections, 108 reachable nested
selections and all 61 current held components. There are 1,277 screened target
records including the four proposals, and 285 directed narrow comparisons.
The audit pins the full source evidence/current-hold set and root/nested records;
a tooling-only commit is allowed, changed semantic inputs fail closed.

All four candidates have one closed oriented manifold component, consistent
source-X laterality, no directly owned component, no known exact represented
geometry match and no non-adjacent self-intersection predicate result. There are
no exact shared triangles or translated-shape duplicate flags. None of those
checks establishes anatomical acceptance.

Separate triangle predicates produced 18 directed intersection/touch comparisons
(14 against existing selections and four between candidate levels). These are
not 18 distinct anatomical defects: first/second pairs are recorded in both
directions, and an arterial contact can be a junction. Important unresolved
locations include:

| Candidate | Existing source surfaces with predicate results | Other proposed level |
| --- | --- | --- |
| Right first | Manubrium34 face pairs; right first costal cartilage85; external intercostal muscle22; internal thoracic artery60 | Right second95 |
| Right second | Right transversus thoracis111; internal thoracic artery76 | Right first95 |
| Left first | Left first rib62; manubrium36; left first costal cartilage81; external intercostal muscle17; internal thoracic artery53 | Left second95 |
| Left second | Left second rib21; left transversus thoracis108; internal thoracic artery77 | Left first95 |

No compared surface had degenerate faces excluded by the predicate. Diagnostics
include every unique candidate vertex, every triangle centroid with area weighting,
bounded reference samples, original face-pair IDs and noncoplanar segment bounds.
Floating-point predicates do not distinguish every touch from penetration, prove
containment or test self faces sharing an exact-coordinate vertex. Zero results
are not certified clearance. Source coordinates are not patient-space registration.

## Disposition and next action

**Pending spatial adjudication; do not export or admit these four components on
the strength of this audit.** In particular, inspect the original bone/cartilage
contact locations and the shared proximal first/second zones before selecting any
acceptable concepts. Do not alter accepted bones or trim/shift arteries to make
the audit pass. No new global source hold or old source policy was changed by
this diagnostic milestone; passing its known-hold screen is not admission.

Local source-space projections, original retrieval receipts, full logs and a
verified copy of the audited source dependencies are in the matching
`F:/VisibleMedicine/staging/20261011-intercostal-audit` and
`F:/VisibleMedicine/recovery/checkpoints/20261011-intercostal-audit` leaves.
The projections are scientific inspection figures, not clinical images or a
rendered learner-viewer acceptance test. The owner can review exact source
revisions independently while other platform and anatomy work advances.

Replay from the Atlas checkout with the pinned original-source cache present:

```sh
node --test scripts/test-intercostal-source-audit.mjs scripts/test-source-intersection-checker.mjs
node scripts/audit-intercostal-arteries.mjs --check
node scripts/audit-reference-coverage.mjs --check
```

The coverage ledger refresh changes only its reachable-nested digest and count
from 106 to 108 after the existing heart-guide update; it does not admit anatomy.
No website/runtime re-import or production build is needed for these tooling and
source-review changes. Existing learner geometry, CT/MRI masks, access and
clinical approvals remain unchanged.

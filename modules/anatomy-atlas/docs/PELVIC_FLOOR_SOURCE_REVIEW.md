# Pelvic-floor source review — awaiting radiologist adjudication

Seven held definitions, thirteen original ISA components and nine within-definition
comparisons are now available for review. Nothing has been added to the viewer,
repaired, reflected, trimmed or assigned a new anatomical label. Existing holds
and the catalogue remain unchanged.

## Review sheets

Each sheet shows the full source definition followed by every component alone,
in X/Z, Y/Z and X/Y projections. Scale and framing stay fixed within a sheet.
X=0 is a source-coordinate plane, not a validated patient/anatomical midline.
Names are the upstream source labels. Colours distinguish files, not tissues.

| Source definition | Original components | Review sheet |
| --- | --- | --- |
| FMA45854, right pubococcygeus | FJ2550 | [Open projections](reviews/pelvic-floor/isa-FMA45854.png) |
| FMA45855, left pubococcygeus | FJ1457M, FJ2545 | [Open projections](reviews/pelvic-floor/isa-FMA45855.png) |
| FMA45856, right puborectalis | FJ2551 | [Open projections](reviews/pelvic-floor/isa-FMA45856.png) |
| FMA45857, left puborectalis | FJ1458M, FJ2546 | [Open projections](reviews/pelvic-floor/isa-FMA45857.png) |
| FMA45858, right iliococcygeus | FJ2549 | [Open projections](reviews/pelvic-floor/isa-FMA45858.png) |
| FMA45859, left iliococcygeus | FJ1453M, FJ2544 | [Open projections](reviews/pelvic-floor/isa-FMA45859.png) |
| FMA46442, tendinous arch of levator ani | FJ1465, FJ1465M, FJ2552, FJ2553 | [Open projections](reviews/pelvic-floor/isa-FMA46442.png) |

## What the measurements clarify

The earlier bounds screen correctly found coordinates on both sides of X=0 in
three right-labelled files. Face-aware measurements now show that the positive-X
surface area is small. This is a surface-area calculation, not tissue volume,
accuracy, clinical significance or permission to delete those faces.

| File | Positive-X triangles | Their area (mm²) | Entire supplied surface area (mm²) |
| --- | ---: | ---: | ---: |
| FJ2550 | 50 | 0.3104 | 5873.4081 |
| FJ2551 | 150 | 1.6499 | 4821.5597 |
| FJ2549 | 30 | 0.2767 | 4954.2088 |

All vertices in these three files are referenced by faces; none of their triangles
has vertices on both negative and positive X. Bounds alone therefore must not be
described as a broad continuous muscle extension across X=0. Small fragments can
be almost invisible at the overview scale. Their origin and correct disposition
remain unresolved; no component cleanup is authorised by this report.

The left-labelled pairs have sampled median distances of 0.018–0.054 mm across
the two directions. Sampled maxima reach 1.147 mm: proximity is not equivalence.
For the arch, FJ1465/FJ2553 and FJ1465M/FJ2552 are the near pairs (median distances
0.010–0.050 mm). The other four pairings are separated by median distances of
roughly 63–67 mm. Do not merge all four as a single validated surface or infer a
new sided definition from these measurements.

Full precision, hashes and methods: [measurements](reviews/pelvic-floor/measurements.json).
The measurement revision SHA-256 is
`b91aae4bcf46ec25459ebba2456df4cdfcc5c1267104543b173ee31d46ea1999`.
[Projection evidence](reviews/pelvic-floor/projections.json) binds that revision
to each PNG. Images are original-source projections, not CT, MRI or ultrasound.

## Your review decisions

For each definition, record the exact tree/ID, component file and raw SHA-256
from the measurement report; identify the preferred supplied alternative, retain
the hold, or request a separately tracked correction. Record your name/date,
review scope, anatomical rationale, and the measurement revision above. A comment
does not automatically update an admission flag or transfer to later revisions.

Before admission, inspect attachments and boundaries against surrounding pelvic
bones, obturator internus, organs and the contralateral anatomy in the original
shared frame. These isolated projections do **not** establish those relationships.
Any proposed deletion, relabelling or subdivision needs its own immutable source
mapping, correction evidence and revision-bound review. Clinical release remains
separate from a decision that a candidate is suitable for further development.

## Reproduce and validate

From the Atlas checkout, with the original OBJ cache in `../work/bodyparts3d`:

```sh
npm run pelvic-floor:test
npm run pelvic-floor:review
npm run source-holds:test
npm run source-geometry:test
node scripts/validate-dissection-guidance.mjs
```

The review check is offline and reproduces all seven images and both JSON files.
To create an absent packet, run `node scripts/render-pelvic-floor-review.mjs`.
Existing mismatched output is never overwritten. Missing/changed source bytes,
component lists, archive evidence or hold status fail closed. Distance sampling
uses at most 128 source vertices in each direction against the opposite surface;
it is not a full Hausdorff bound, volume intersection or anatomical validation.
Surface-area categories are disjoint: negative/positive include plane-touching
faces confined to that side; crossing requires both signs; on-plane uses only
X=0 vertices. All supplied faces and vertices are retained.

## Rights and validation limits

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution
4.0 International. The [official licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)
was rechecked on 25 September 2026. Credit is retained on every image. No new
dataset, dependency, font download, texture, publisher illustration or paid
service was introduced. Cache originals stay outside runtime delivery; no patient
data, specialist CT-head masks, case rights or lecture access were changed.

Five focused tests and byte-for-byte projection regeneration pass; existing hold,
geometry and dissection-guidance checks also pass. These are engineering checks,
not anatomical sign-off. The packet does not certify mesh topology, exclude
self-intersections or establish complete pelvic-floor coverage.

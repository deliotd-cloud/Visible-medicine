# Optic nerve alternatives — local radiologist comparison

The learner atlas still excludes both held optic definitions. This source-only
inspector compares right FMA50875 (FJ1364/FJ1819) and left FMA50878
(FJ1313/FJ1772) **within the same anatomical side**, without choosing a winner.
The prior website turn was progress: its local carpal integration was committed
and verified. This batch adds actual missing pairwise evidence and a review tool,
not another duplicate inventory or a change to the accepted CT-head boundaries.

## Use

From the Atlas `outputs` checkout, with its existing dependencies and verified
`../work/bodyparts3d` caches:

```powershell
node scripts/audit-optic-alternatives.mjs --check
node --test scripts/test-optic-alternatives.mjs scripts/test-optic-alternative-preview.mjs
node scripts/build-optic-alternative-preview.mjs --v2
node scripts/serve-optic-alternative-preview.mjs --v2
```

The builder creates `../work/optic-alternative-preview-20261002-v2` and refuses to
overwrite an existing preview. Retain its manifest and assets together; never
hand-edit generated geometry. The server reports its own loopback-only URL and
verifies the current source/report and all asset hashes before listening. It serves
only four pinned assets, rejects writes and foreign Host headers, and has no
network imports, approval endpoint or patient data. Stop it with Ctrl+C.

The default view places candidate A and B in two panes with **one shared camera**,
identical spatial coordinates, scale, target and zoom. Coral is A; blue is B.
The two panes are alternatives on the chosen side, not right/left anatomy.
Choose overlay to see both together in their assembled source frame. Camera
presets use a 900 ms eased quaternion arc and target interpolation, not a straight
flight through the model; manual orbit cancels the preset, and reduced-motion
preferences use an immediate transition. Desktop controls stay beside the model.
Actual browser/GPU appearance and perceived movement still require visual QA.

Globe owners and visual-pathway context come from existing pinned source evidence.
Whole sphenoid is optional context, **not a separately segmented or certified optic
canal**. No camera transform changes the preserved source coordinates in the
packet. No nerve splitting, mirroring, scaling, mesh repair or new label admission.

## What to review

Inspect each pair's globe-side and central extent, course, apparent overlap and
source label. Compare all views and the overlay, not merely the default projection.
Context surfaces are also unvalidated; relationships do not prove tissue continuity.
The report records all exact unique vertex samples and area-weighted triangle
centroid samples in both directions, exact shared-coordinate triangles and geometric
component end bands. These bands are **not anatomical terminals**. Unsigned sampled
distances are not intersection, fibre continuity or clinical-equivalence proofs.

You can export a draft preference or retain-hold note. Its report hash, source
inventory/catalog/table/hold evidence, side, FMA and both individual file hashes are
included. It always retains the holds and explicitly has `clinicalApproval:false`
and zero admissions. It is **not an Atlas sign-off** and has no approval importer.
Please do not put patient identifiers or scan information into the notes. Retain
the exact report and scene version with the note; later revisions require review.

Before admission, resolve which extent represents the intended named structure,
the optic canal/globe/chiasm boundaries and any needed subdivision; then conduct
the existing source-hold, exact-identity, renderer/display-pin, anatomical, clinical
and delivery review process. Never lift a hold solely because distances are small,
because a licence allows use, or because this inspector passes its tests.

## Provenance and recovery

`docs/optic-nerve-alternatives.json` is reproducible from pinned original BodyParts3D
v4 sources. It records file sizes/SHA256, algorithm hashes, the existing preparation
and visual-pathway audit hashes, source units/transforms and zero admission flags.
`reportRevision` hashes compact report content without that field. The preview's
`reportSha256` hashes the complete pretty-printed LF report, including revision.
These are different hashes with different purposes, not interchangeable sign-offs.

Existing learner meshes/content, review bindings, source holds, patient scans,
CT-head masks and clinical desktop PACS are untouched. No website re-import or
publication is required for this offline inspector. No new dependency, font,
model dataset, texture or recurring fee. See `LICENSES/optic-alternative-review.md`.
Incremental C-drive recovery can save scripts/report; a preview bundle remains
local. Do not call that an off-device or D-drive backup without separate verification.

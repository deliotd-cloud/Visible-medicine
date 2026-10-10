# Clearer regional Spread — 2 October 2026

Root-body regions and Whole body now separate more strongly across narrow axes.
This improves the existing Spread mode without adding a toolbar, new stored mode
or a new anatomical model. Dedicated shoulder, nested organs, independent
specimens, guided tours, Tray and Extract retain their previous arrangements.

## Source and presentation contract

`bodySpreadScale` derives per-axis translation gains from the complete source
frame: longest dimension divided by that axis's dimension, clamped to 1–3.
Empty, flat or nonfinite frames fall back to identity. `bodySpreadOffset` multiplies
the existing radial translation by those gains; it never changes source vertices,
scale, rotation, bounds, identities, clipping coordinates or registration metadata.
Nonfinite amounts return zero; finite amounts clamp to 0–100. At 0%, all entries
are exactly assembled; anchored skeleton entries stay at source positions.

`BodyExplorer` opts in explicitly. `BodyScene` defaults to legacy offsets, keeping
other source frames independent. Gains depend on the full active source scope,
not its visible pool, selected entry or camera. Hiding, showing, focusing and
rotating therefore do not shuffle neighbours. Existing camera fitting, moved
world-space label anchors, source-coordinate cuts and original-position guides
consume the same offset map. Exam mode remains assembled and answer-safe.

This is a teaching arrangement, not anatomically plausible tissue displacement,
biomechanics, a surgical path, or CT/MRI correspondence. Intermediate positions,
different cameras, compound meshes and even maximum Spread can still overlap.
Use Extract or aligned 100% Tray when a clearer individual view is required.

## Evidence and remaining acceptance

`npm run body-spread:test` executes the exact helpers and real `BodyScene` memo
pipeline with current `bodyDisplayCatalog`, including sided compound projections.
It checks 36 region/side scopes, exact zero/anchor/exam positions, finite input
handling, source preservation, unchanged legacy/Tray/Extract behaviour, stable
visibility/selection transitions, fitted bounds and current screen-side labels.

The helper audit compares same-system/same-laterality conservative bounding boxes
with unanchored 100% legacy Spread. Forearm 3D intersections decrease from 200 to
98, Whole body from 758 to 226; no regional increase was observed. Preset/oblique
orthographic projection counts are recorded separately, not converted into a
guarantee of visible silhouette clearance. These counts are not patient anatomy,
tissue intersection, anatomical completeness, readability or clinical approval.

Local evidence: `.local/body-spread-test.json` and
`.local/body-spread-scene-test.json`. These are CPU/mathematical checks, not current
browser pixels, WebGL/GPU performance, font metrics or desktop visual acceptance.
Actual desktop review remains required before release. No meshes, datasets, fonts,
textures, citations, private scans, dependencies or licensing obligations added.
Teaching and entitlements are unchanged; presentation revisions require fresh
geometry/display review without migrating clinical approvals.

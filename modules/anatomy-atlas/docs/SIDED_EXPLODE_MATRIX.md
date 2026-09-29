# Sided separation regression matrix

29 September 2026. Added acceptance coverage; no learner geometry, teaching,
camera, labels, permissions or review decisions changed.

Run from the Atlas repository:

```sh
node scripts/test-sided-explode-matrix.mjs
```

The test uses the real display catalogue, sided presentation projection and
production arrangement functions. It executes the current `BodyScene` memo
statements through offset generation with a minimal dependency-cache harness.
This catches stale dependencies across view, side, selection and visibility
transitions without duplicating the component's arrangement orchestration.
It is not a React renderer or GPU/browser test; component source changes can
require updating the harness's supplied dependencies.

Coverage at the initial run against source `1ccfb21`:

- 36 whole-body/regional/laterality scopes, six standard directions.
- 1,080 Tray cases: conservative projected entry bounds have clearance at 100%.
- 33,534 Extract cases: selected entry clears the remaining visible entries;
  all other entries stay assembled, including removed-structure ghosts.
- 1,080 cached-versus-fresh transition comparisons.
- Four sided projections of audited bilateral compound sources.
- System disabled, hidden selection, ghosting, empty rendering, missing selection,
  unchanged source coordinates and retained canonical source identity.

The run passed. It prints source hashes and coverage counts for a reproducible
receipt. The source model catalogue and production scene were unchanged.

## Interpretation limits

Tray and Extract are educational display translations, not dissection planes,
anatomical positions, joint motion or CT/MRI registration. Clearance is asserted
at 100% along the six aligned standard views only. Intermediate values and free
orbit can overlap. Bounds of separate entries do not validate internal separation
within a compound source. No clinical approval is implied.

Browser acceptance must independently check actual selected labels, view/side
transitions, framing and mobile presentation. Merely seeing no labels when no
structure or stage landmark is selected is not evidence of label-placement
correctness; the selected label must be exercised explicitly.

## Local integrated-browser acceptance

The unchanged website runtime was checked through `/atlas/3d`, not a standalone
mock. Hand, foot and spine: both sides, six directions, 100% Tray and Extract
(72 states). Selected labels remained visible, within their canvas, non-overlapping
and on the side of their projected anchor. Side changes cleared the old selection.
Spread at 100% and keyboard orbit added six states; projected anchors moved after
rotation. Two resized hand states checked ordinary and doubled text.

A separate six-case hand check exercised all three separation styles at 375px
with ordinary and doubled text. Selected labels remained visible and bounded,
with no document-width overflow or browser page errors. Canvas screenshots were
captured separately so below-fold position was not confused with missing anatomy.

Evidence in the main coordination workspace: `work/sided-explode-browser-20260929.json`
(80 states), `work/separation-mobile-20260929.json` (six states), matching `.mjs`
scripts, logs and screenshots. Early test-harness errors were selectors collecting
unrelated native options and toggling an already-open details element; these were
corrected before the final runs. No production defect was reproduced or patched.
These selected-label checks do not establish dense multi-label, physical-device,
every-mesh framing, arbitrary-orbit clearance or clinical acceptance.

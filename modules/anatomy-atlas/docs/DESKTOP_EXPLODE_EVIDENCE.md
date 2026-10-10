# Desktop explode acceptance evidence

The Node-only checker in `scripts/desktop-explode-evidence.mjs` validates a
`vm-desktop-explode-qa/1` report captured through the browser. Run:

```sh
node --test scripts/test-desktop-explode-evidence.mjs
node scripts/desktop-explode-evidence.mjs /absolute/path/browser-report.json
```

It rejects malformed reports, nonfinite coordinates, viewport overflow, label
boxes outside their assigned half, wrong-side screen anchors and overlapping
boxes. One pixel of rounding tolerance is allowed. Screen side is deliberately
not anatomical laterality: rotating an anterior view reverses the displayed
side of a right-sided structure. Zero-label cases are permitted, but establish
no multi-label acceptance. Commit/digest fields are format-checked, not fetched
or verified by this checker; the integration checkpoint separately verifies
actual artifact bytes, manifest source commit and website HEAD.

## 3 October 2026 actual integrated spine sample

Evidence directory:
`E:/VisibleMedicine-LocalStaging/20261003-spine-desktop-acceptance/`.
The captured learner uses Atlas `59c881d0eac308c8c5a2bc87f2c5a0f3f6d6c763`
and website `92f5c1bf3a262699a7217454b9d5e5626e4f5659`.

- Twenty actual captures at 1280 × 900; 38 rendered label measurements, including
  four bilateral six-label cases in anterior/posterior views at 0/100% Spread.
- Spread, Extract selected and Tray at 0/50/100%; T2 selection, tray keyboard
  panning/framing and keyboard orbit. Two compartment-focus captures have no
  selected or stage landmarks; this is not a failed label test.
- Previous stage, Undo and Redo restore 109/101/109 enabled structures;
  Reassemble restores the assembled recipe with 115 enabled. Ghosting is
  exercised through its accessible switch. Counts mean enabled, not fully loaded
  surfaces or complete anatomy.
- No outer-page overflow in this sample. Fresh-load selection, imaging-tab,
  isolation and dissection/explode interactions produced no captured console
  errors. The earlier MutationObserver error remains in the previous checkpoint;
  its origin is unclassified and a source-code fix is not claimed.

Camera samples were already settled when observed. This does **not** prove smooth
motion, frame rate, anatomical clearance, correct geometry, registration, full
regional acceptance or clinical approval. Adaptive camera fit also means a small
screen-anchor displacement cannot measure world-space explode distance.

No production UI, geometry, teaching, source registry, Review approval or
entitlement was changed for this QA-only addition. No runtime rebuild/import or
publication is required. Remaining work includes broader-region/device samples,
measured camera/rendering acceptance, source-safe missing anatomy and
revision-bound radiologist review. The full goal remains active.

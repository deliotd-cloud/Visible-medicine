# Lower-limb Atlas pilot

The source-based right-limb dissection is available in this website at
/atlas/lower-limb-3d, exported from Atlas
`19e9d9b3e207ef0ee02b313c4e7d8dd42a2e9d1f`.
Its immutable manifest covers the actual browser bundle and all five model
groups; use the Atlas source pipeline described in
`docs/LOWER_LIMB_WEBSITE_PILOT.md`, never hand-edit this website's runtime.

One compact region picker contains hip/thigh (34 surfaces), knee (15), calf (15),
foot (23) and whole limb (67). These scopes overlap: there are 67 unique source
selections, not 154 different anatomical structures. Twenty-six study recipes
retain original groupings, diagrammatic appearance, source positions, history
and limitations. Regional loading is conditional; whole limb is a larger optional
download. The module delivers about 50.6 MB uncompressed including all models,
not all of which is downloaded for the initial knee view.

All 67 selections retain introductory draft teaching, 42 muscle attachment/motor
lessons and 65 clinical/pathology drafts. Modality coverage is partial (CT 11,
MRI 35, X-ray 31, ultrasound 21); no scan is supplied. The model includes no nerve
or vessel meshes. Grouped foot and pelvic surfaces remain grouped.

## Verification on 12 September 2026

- Exact catalogue/model checks preserved the 67 source meshes and their retained
  geometry. All five source/recipe revisions and 67 lesson pins verified;
  existing teaching, clinical and navigation rendering checks passed.
- Website inventory, bundle notices and route checks passed as part of the
  65-test suite. TypeScript and production builds are required for this milestone.
- Actual browser sample: all five regions loaded; deep-hip and deep-calf study
  switches, plantar foot search, fade, extraction/spread/tray, return to source
  positions, set-aside/undo, practice reveal/return, whole-limb loading and
  collapsed motor teaching were exercised. Not every one of the 26 recipes was
  manually inspected; all are covered by source/recipe tests.
- A source-bound deep-hip link restored the exact source/selection/study/camera.
  A conflicting duplicated scope was rejected without opening replacement
  geometry; the explicit current-knee recovery action worked.
- A 390×844 browser viewport retained the model above its independently scrolling
  controls. This is not a physical touch-device or 200% text acceptance test.
- One unattributed MutationObserver error was observed, as in prior module QA.
  No failed model or blocked tested control accompanied it. Its cause remains
  unverified; do not call this error-free browser certification.

## Still gated

User radiologist sign-off of this source revision, detailed anatomical/clinical
acceptance, physical devices, comprehensive accessibility and heavy-view
performance remain open. The source CC0 dedication and full permissive software
notices are included. No new dependencies, fonts, scans or commercial services
are added. Private patient data, source MRI/masks and original STL archives are
not in the runtime.

There is no standalone specimen-review database connection and no actual
Didanix study or paid lecture connected. Future links retain independent
authorization and clinical/privacy release gates. Keep owner-private access.
Use the coordinating task's LOWER-LIMB-MODULE-CHECKPOINT-20260912.md for exact
GitHub, D recovery and publication outcomes; the standalone Atlas is a separate
deployment and must not be reported as updated from this website export.

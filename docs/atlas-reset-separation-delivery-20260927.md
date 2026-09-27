# Reset separation correction — 27 September 2026

Learner and protected Clinical Review import Atlas
`9cea1892eaf33f9ee0655e4ecc03e50037844536` through generated pipelines.
Reset clears Original positions and Keep bones assembled, restoring default
regional framing while preserving removed tissue, systems, selection and styling.
All 136 models and twelve scopes are unchanged; no teaching, entitlement,
dependency, patient data or clinical decision changes. Review presentation
bindings refresh; this is not clinical approval or public deployment.

## Verification

- Source: 14 focused reset cases plus accessibility, historical migration,
  camera, dissection, selection and model-first checks; TypeScript/build passed.
- Website: 102 of 103 integration checks passed initially. The remaining check
  expected the old accessible help; updated to the new exact wording and passed
  independently. Initial log retained; no runtime changes were made for that test.
- Model inventory, review binding, TypeScript and both builds passed. Existing
  large-chunk and route-classification warnings remain.
- Actual embedded learner at 1440px and 375px: enable both options, Reset,
  foot close-up/camera action restored. At 375px outer page and iframe scrollWidth
  both equal viewport width. Source preview also checked at both sizes.
- Protected review worksheet and its linked model load at 320px with corrected
  Reset help. No review decisions submitted.

## Evidence

- Review integration: `1ceef6fa867703d998e1b511fecd9d157f3dbc9bf4dd7453d586e28e39814879`.
- Review body presentation: `1276f734610d7a543f7375888e95b669a8ca0e624cb715e653db9da8c88abe1f`.
- Learner manifest: `3d64d5023d2a6702ffad7cbebb3cce3d37b96399dcc44e976f095fad83cc0588`.
- Inventory: `dbbd657a418e5deff143b6b947bfcba9a9e1434a1feff22690194ea129e40ff9`.

Replaced generated learner assets were hash-copied to
`D:/VisibleMedicine-Atlas-Recovery/reset-separation-learner-prior-generated-20260927`;
Git preserves review outputs. Sites workflow retained existing checkout/preview
and skipped publication under the local-first plan. Backup receipts and logs are
in the main coordination workspace under `work/reset-separation-*` and
`work/website-reset-separation-*`.

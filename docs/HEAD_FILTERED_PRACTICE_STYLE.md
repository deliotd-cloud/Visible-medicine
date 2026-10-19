# Filtered CT/MRI question style

9 October 2026. Local-only extension of `HEAD_FILTERED_PRACTICE.md`.

After applying search, system or 3D-linked filters, learners can choose **Find it on the scan** or **Label the highlighted structure**. The existing start button states the chosen action and eligible mask count. Choosing a style alone neither starts practice nor changes navigation. The selector appears only beside a filtered, loaded index and disappears with that index during active practice.

Both styles reuse the existing practice controller and its exact saved-mask eligibility. The filtered entries intersect the whole-study pool, so hidden duplicate representatives, shared-geometry aliases and non-mask annotations stay excluded. No source mask, geometry, identity, scoring rule, registration or clinical approval changes. Question-style preference is in-memory only. Successful starts clear ordinary tour/URL context; failed starts preserve it. Stale callbacks cannot restart active practice.

## Verification and boundaries

- Four CT/MRI/style regressions fail before the selector exists. All 90 focused history, index, practice lifecycle/scoring and head-link cases pass afterwards.
- Fresh TypeScript and unchanged combined Clinical Review verification pass.
- Isolated E-drive website build and exact served-client/route checks are recorded in the local recovery receipt.
- This scheduled run skips a foreground browser handoff. Synthetic component interactions are not signed-in native-image, visual/GPU or clinical acceptance.
- Existing loaded scan/model tabs and historical port 3001 are preserved. The current local preview is rebuilt; nothing is publicly deployed.

Recovery: `E:/VisibleMedicine-LocalStaging/20261009-filtered-practice-style/saved-state.json`. Scoped same-machine source copies and incremental Git bundle, not verified GitHub or off-device backup. Atlas source remains `1dc4f82f677c3a9ccd04f2d0d875210ac0d1ef98`; generated learner/Review content and unrelated specialist edits remain unchanged.

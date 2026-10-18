# Lower-limb vessel questions — local website integration

9 October 2026. Source Atlas `59c40bbb213627c3fc423a0b826f6f3063ea605d`.
Website parent `8d4d4abaa3c47259fb31d2c14f920c29f40ef28f`.

## Delivered scope

Fifteen original, reference-backed question groups cover thirty existing bilateral
thigh, leg and foot vessel selections. The generated regional learner and
protected Clinical Review use the same exact source, identities, answers and
explanations. These are radiologist-review drafts, not approved teaching.

The teaching retains the deep-system classification of the femoral vein,
variation in small-saphenous termination, commonly paired calf veins and the
limited scope of the superficial medial plantar branch. References are reading
links, not permission to reuse their images or prose. No new assets, dependencies,
fees, scans, masks or geometry were introduced.

The dedicated shoulder module remains at `ed74d3e7c96501f21434f76e136c12a11493c020`.
Its verified reading-focus handlers match protected Review byte-for-byte; a
regional quiz change does not require rebuilding that independent module.

## Verification

- 35 focused integration checks pass, including all thirty new selections,
  fifteen group counts, matching learner/Review text and source hashes, and
  rejection of prior content, altered answers and altered source identities.
- 35 CT/MRI linking and guided-learning checks pass. Semantic comparison does
  not establish patient-space registration.
- Fresh TypeScript and the combined verifier pass: 1,162 imported Review source
  files; 1,129 regional learner source inputs.
- Regional export and isolated E website build pass. The local preview passes
  46 route/access/Review checks and 19 exact regional learner byte readbacks.
- All 136 regional models and twelve regional scopes are unchanged; the full
  137-model/144-path website geometry inventory is unchanged.

Build, route/access checks and exact served-byte receipts are recorded in the
scoped E checkpoint below. Automated checks do not establish signed-in browser,
native-image/GPU, keyboard usability or clinical acceptance.

## Recovery and boundaries

`E:/VisibleMedicine-LocalStaging/20261009-lower-limb-vessel-integration/saved-state.json`
records the final local commit, verification, preview handle and readback hashes.
The incremental Git bundle requires the website parent listed above. This is
scoped same-machine source recovery, not verified GitHub or off-device backup.

Obsolete generated chunks are archived and hash-verified before removal.
Redundant build-only GLBs are removed only after exact E recovery verification;
canonical model files are retained. Existing specialist edits and the complete
pending shared-plan tail are preserved. No authentication, entitlement, approval,
accepted CT-head boundaries, clinical desktop PACS or public deployment changes.

The full goal remains active. Continue substantive linked learning and regional
anatomy improvements; signed-in model interaction and radiologist acceptance
remain separate review gates, not a reason to halt independent development.

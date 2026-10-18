# Linked 3D tour step navigation

8 October 2026. Local-only website improvement; no clinical approval.

The existing **Linked tours** disclosure now includes the active tour's ordered
steps, with exactly one current-step marker. A learner can jump directly between
structures instead of repeatedly pressing Next. The existing compact closed
appearance, explicit tour-start form, Previous/Next and CT/MRI links remain.

All eight registered sequences use their existing exact concept/source/revision
links. Invalid or cross-sequence positions produce no step list. These are
semantic comparisons between unregistered subjects, not synchronized scan
coordinates. No teaching packet, anatomical geometry, accepted mask, approval,
score or completion record is changed. MRI-only sequences retain their CT gaps.

Ordinary links preserve browser history and keyboard activation. Escape closes
the disclosure and restores summary focus. The dropdown is internally scrollable
and remains collapsed until requested; it does not add a permanent side panel.

## Verification and limits

- 27 focused navigation, picker, handoff, learning and source-bound packet tests pass.
- Canonical TypeScript check and isolated local website build pass.
- All eight canonical final-step routes return 200 and contain the step list,
  current marker and finish navigation. Nine anonymous denied-save/recovery checks pass.
- Actual 1280 × 720 browser check: eight-step deep-grey list, keyboard jump from
  first to last step, correct CT/MRI destinations, browser Back and Escape/focus
  return. Dropdown bounds x940–1260/y175–643; internal scrolling, no page-width overflow.
- Browser session was unsigned; the protected model was unavailable. This is
  wrapper navigation/layout acceptance, **not** signed-in model loading, native
  CT/MRI image, clinical or patient-space registration acceptance.
- Preview tests had stale prior seven-tour assertions and were not used; all
  tests ran against the canonical eight-tour source. Only the three changed
  application files were synchronized to the existing preview checkout.
- Whole-worktree diff check still encounters an unrelated pre-existing shared-plan
  trailing blank line. The scoped staged diff is checked separately and that tail
  is preserved.

Evidence and verified source-only incremental recovery:
`E:/VisibleMedicine-LocalStaging/20261008-head-tour-steps/saved-state.json`.
Build receipt: `E:/VisibleMedicine-LocalStaging/20261007-imaging-layout/build-head-tour-steps.json`.
Preview session 9876 on 3000 uses the previously verified isolated runtime;
session 1613 was stopped before rebuilding. Historical 3001 is untouched.
144 generated build-only model copies were removed only after verifying their
existing E recovery hashes; canonical models remain unchanged. No publication,
GitHub/off-device backup, new dependency, fee, auth/entitlement change or PACS edit.

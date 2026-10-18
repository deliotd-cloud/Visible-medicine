# Keep practice results while reviewing anatomy

8 October 2026. Selecting **Review on this scan** from a completed CT/MRI
practice set no longer calls `practice.end()` and discards the set. The existing
Practice tab becomes **Results** while a completed set exists. It returns to the
same first-attempt results without adding a panel, duplicating an attempt or
storing anything outside the current session.

For sets started in Guided learning, inspecting a different completed answer
preserves the originating tour position. Comparison links while inspecting the
answer use that answer's exact concept, not the originating tour step. Returning
to Results retains the existing **Return to Guided learning** action. That action
restores the original tour and ends the practice session as before.

Only exact current-study result objects can be reviewed. Active/unfinished sets
and same-label/ID copies cannot invoke completed-result review. Starting a new
set, choosing another set, changing the package or closing the atlas continues
to clear the relevant session state. Browser Back/Forward retains its existing
navigation-reset semantics; this change does not promise persistent results
across history restoration, reloads or tabs.

## Evidence and limits

- 67 focused component/hook/navigation/teaching tests pass. Regression cases
  verify result object preservation, unchanged end count, exact scan focus,
  answer-specific CT/MRI links, Results return and original guided-step return.
- Canonical TypeScript, local website build and combined Clinical Review
  verifier pass. The source-bound Review and anatomy/teaching packets are unchanged.
- CT/MRI/3D routes and the exact rebuilt client bundle pass four HTTP checks;
  nine repeated anonymous denied-save/page-recovery checks pass.
- These are software/synthetic checks, not new signed-in browser, native-image,
  complete visual or clinical acceptance. No score is a competency certification.

Evidence/recovery: `E:/VisibleMedicine-LocalStaging/20261008-practice-results-return/saved-state.json`.
Main local preview session99744 on port3000 replaces1028; historical3001 untouched.
144 build-only duplicate models were removed after checking exact existing E
recovery copies. Canonical originals and all specialist edits are preserved.

No new dependency, source asset, mask, patient data, desktop PACS, permission,
entitlement, clinical approval or public deployment. E recovery remains scoped
and on this machine, not verified GitHub or off-device backup. Continue the full
roadmap; this is one navigation fix, not Atlas completion.

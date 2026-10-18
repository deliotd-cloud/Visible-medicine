# Consistent mask eligibility across practice systems

9 October 2026. Local correction to CT/MRI practice eligibility.

## Issue and correction

`practiceEntries(entries, family)` previously applied the family filter before
reserving each mask hash. A duplicate in a different family could therefore
enter an ordinary system-filtered question set, while completed review and
revisits (using the whole-study pool) excluded that same entry. This could leave
a scored question absent from its completed review.

Eligibility now chooses the first eligible whole-study representative before
applying the system filter. Each filtered pool is exactly the family subset of
the unfiltered pool. Points, missing hashes and declared geometry aliases remain
excluded; an excluded alias never reserves a mask hash. Input annotations and
mask buffers are not changed.

## Verification

Three new regressions fail on the old helper: direct filtered-pool equivalence,
and actual practice-hook Find-it/Label sessions finishing with every started
question represented in review. The corrected runs cover source immutability,
alias handling, both question modes, first-attempt score and revisit eligibility.
Existing filtered-index, guided, scoring and source-identity safeguards remain.

Final focused test/type/Review verification, local build, served-client checks
and exact source recovery are recorded in
`E:/VisibleMedicine-LocalStaging/20261009-head-practice-system-dedup/saved-state.json`.
No UI layout, source mask, teaching approval, authentication, entitlement,
dependency, model or public deployment changes. This code/component evidence
does not constitute new signed-in native-image, browser/GPU or clinical acceptance.
Existing scan/model tabs and historical port 3001 are preserved. E recovery is
same-machine only, not verified GitHub or off-device backup.

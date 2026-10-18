# Compact Guided learning chooser

Atlas source `af69bf38d0ca8a951281db0baf1a14b8d7c68bc5` replaces the duplicate
current-tour heading and placeholder with a native selector showing the active
tour. The desktop controls use one compact row; narrower layouts wrap.
Existing Find a tour filters remain optional and collapsed initially.

When filters exclude the active tour, a disabled selected option identifies it
as outside the filters. It is not counted as a matching result. Filtering or
clearing filters does not change the tour, camera, playback or imaging consent.
Actual tour changes still require manual Start and source readiness.

Generated learner and protected Clinical Review must use the same source.
All 37 regional tours, three nested guides, teaching, models, source holds and
entitlements are unchanged. Source controlled-component checks cover regional
defaults, filtering/no-results recovery, nested failures and exact player keys.
Signed-in model playback and clinical acceptance remain separate.

Local build, delivery, browser and source-recovery evidence:
`E:/VisibleMedicine-LocalStaging/20261009-compact-tour-integration/`.
No public deployment or verified GitHub/off-device backup is claimed.

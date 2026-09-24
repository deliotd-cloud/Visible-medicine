# Study close-up captions and sampled browser QA

The active recipe, rather than its containing route, now determines a joint
close-up caption. Whole-body popliteal and genicular studies say Knee; elbow
and cubital studies say Elbow. Unknown recipes use the neutral Study fallback.
Camera bounds, meshes, IDs, teaching, licensing and access remain unchanged.

`node scripts/test-study-close-up-label.mjs` checks 42 combinations against the
actual viewer caption expression, including whole-body, regional and unknown
recipes. It does not infer anatomical accuracy from caption correctness.

## Local browser observations, 24 September 2026

At `http://localhost:3191/regions/whole-body`, Search found and previewed the
popliteal artery/vein study. Confirming it changed the prior pes-anserinus focus
to the posterior paired-vessel study and returned focus to Search. The earlier
intermediate development error was absent. A 1087×854 screenshot showed both
knees and sided vessel labels; it exposed the wrong Elbow caption, corrected
and subsequently verified in the live UI.

Selecting the left popliteal artery displayed FMA77381 and its draft teaching.
Remove cleared its label and offered contextual Undo; Undo restored the label.
At 390×844, tools and information were collapsed, vessel labels remained sided,
and the Left filter removed the right vessel labels. The caption/credits extend
below the lower edge, so this is not a claim of zero scrolling or full mobile
acceptance. The temporary viewport override was reset.

These are sampled local UI checks, not clinical sign-off, anatomical registration,
complete device testing or hosted verification. Explicit source rejection and
stale-result feedback remain covered by the controlled component tests, not by
injected faults in the user's live browser. Website integration remains pending.

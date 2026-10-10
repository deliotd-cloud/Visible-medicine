# Guided-learning load recovery

Regional and whole-body tours now retain the existing scene loader's verified
failure category. A sign-in-required response and a refused-access response have
different explanations and a **Check access again** action; unknown/network
failures retain **Retry missing anatomy**. No new authentication request, access
grant, automatic retry or permission change is made.

The existing retry clears only failed required bundles. The current step,
caption and camera framing remain intact; playback stays paused until the model
is ready and the learner explicitly resumes. Source changes discard old access
reasons, and late callbacks from a previous scene cannot contaminate the new one.
Renderer failure/context recovery also receive explicit status instead of being
reported as initial model preparation. Exit remains available.

Verification uses the actual tour component with controlled scene callbacks:
all three failure categories, irrelevant failures, source changes, stale
callbacks, retry/recovery and no automatic playback. Existing tests cover
cache/import failure, focus recovery, reduced motion, camera transitions and
source-bound tour steps. This is not a claim of authenticated browser/GPU
acceptance, repaired authentication or resolution of every possible loading
stall. The root scene/access classifier and protected model delivery are unchanged.

No teaching, geometry, scans, clinical approval, external assets or dependencies
are added. The change must reach the website through the generated regional
learner and matching protected Clinical Review import; source completion alone
does not update the running website.

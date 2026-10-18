# Guided-tour load recovery: local website integration

The generated regional learner and protected Clinical Review are bound together
to Atlas `244eee4d67de393579ce381557654584ac6b4ccf`.

Regional/whole-body Guided learning distinguishes sign-in-required model loads,
refused access and unknown load failures. The access recheck preserves the stop,
caption and framing. Playback requires ready anatomy and an explicit learner
action. Source changes discard old access reasons. Renderer failure/recovery
receives a specific status instead of initial preparation wording.

This reuses the protected loader and existing recovery controls; it neither signs
anyone in nor grants access. The import changes no models, teaching, CT/MRI masks,
desktop PACS or independent entitlements. No public deployment is authorized.

Verification/recovery evidence is recorded under
`E:/VisibleMedicine-LocalStaging/20261009-tour-access-integration/`.
The exact-source import test now covers the guided player as well as the shared
access classifier and confirms matching generated learner/Review messages.
Atlas-side checks exercise actual component callbacks for failure, explicit
retry, source replacement, stale callbacks and no automatic playback.

These checks are not signed-in GPU acceptance or proof that every loading stall
is fixed. Clinical sign-off remains revision-bound and independent of this UI
change. The local Sites build/import workflow preserves the generated-module
boundary and the pending shared-plan tail; E recovery is not off-device backup.

The 42 integration tests, 37 head-link regressions, fresh types and 1,181-input
combined Review verification pass. The initial import correctly refused a stale
importer revision, and the reading-focus regression caught its old exact source
hash. Both were updated to the reviewed player revision, not relaxed. A later
test run exhausted a local compiler's memory; bounded serial test execution
passes the same assertions. Original logs are retained with the recovery evidence.

Actual signed-out desktop browser QA on the rebuilt local preview confirmed the
sign-in notice, enabled Check access again and Exit controls, and disabled Start.
Explicit access recheck returned to the same notice and preserved the chosen
tour without playback or permission changes. The screenshot is
`guided-access.jpg` in the evidence directory. Authenticated model/GPU recovery
was not exercised and is not claimed by this checkpoint.

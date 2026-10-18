# Keep the active native MRI practice activity stable

Selecting the already active **Name annotation** or **Find on image** activity is
a no-op. It does not restart the question, hide a correctly answered/revealed
overlay, clear the location pointer or close an explicitly opened answer reference.

A real change between naming and location still retires the prior question state,
closes the answer reference, clears old picks and starts location with its answer
overlay hidden. Source/annotation changes, cancelled loads, retired source and
unsaved correction protections retain their existing behavior. No new reset button,
score, assessment API, geometry or approval is introduced.

The reproduced defect was a parent/child lifecycle mismatch: the parent cleared
`answerVisible` and the reference even on the same activity, but the unchanged
question key correctly kept the child's completed feedback. This could leave a
completed location question with its answer hidden and no further attempts allowed.
The parent now refuses a redundant activity change before mutating either state.

This affects private formative practice only; it does not approve a question,
teaching content, anatomical correspondence or learner release. Existing reference
models are independent subjects, not registered patient-space overlays.

Focused regressions reproduce the pre-fix failure, check preserved overlay/pick/
question/reference on repeated activity choice, and retain actual mode-change
retirement and hidden-answer behavior. Full applicable checks and scoped recovery
require actual passing evidence under:

`F:/VisibleMedicine/staging/20261014-mri-activity-continuity/`

`F:/VisibleMedicine/recovery/checkpoints/20261014-mri-activity-continuity/`

Local-only Sites workflow; no publication or broad UI redesign. Browser/keyboard/
visual and clinical acceptance remain separate from source test evidence.

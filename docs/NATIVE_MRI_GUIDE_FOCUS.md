# Keyboard focus in native MRI Guided learning

The private Regional MRI Review viewer keeps the current guided step heading
keyboard-focusable. Starting a guide, moving to another step or explicitly
verifying a source variant requests focus once, without scrolling the page.

For a loaded step, focus waits for the current source-owned annotation load and
the native canvas paint to commit. Missing, ambiguous or withheld steps focus
their own explanatory heading after commit; no alternative geometry is selected.
Failed, cancelled, replaced, retired or unmounted loads cannot focus later.

Ordinary slice/plane/window/search/overlay interactions, closing or opening a
reference, and moving keyboard focus to another target cancel pending focus.
They never request a fresh tour announcement. Explicit guide activation is
required to start another request. This preserves independent MRI/3D reference
inspection and does not add new panels or controls.

Use: open the private Regional MRI Review area, verify the complete source-bound
local package, choose a source sequence, expand **Guided learning**, and choose
one of that sequence's paths. Previous/Next retain canonical missing steps.
Multiple variants still require explicit selection. Existing unsaved-correction
protection remains in place.

This is accessibility behavior, not clinical acceptance, learner release,
completion tracking, scoring or patient-space registration. No source scan,
mask, annotation review status, model, access entitlement or approval is changed.
Synthetic component tests establish guarded ref/commit behavior, not actual
browser, keyboard hardware, screen-reader, GPU or real-package acceptance.

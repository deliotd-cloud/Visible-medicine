# Compact comparison recovery

9 October 2026. Local-only host UI change; Atlas source and generated models are unchanged.

Desktop inspection of the head/neck Atlas found a disabled anatomy picker still occupying the comparison strip when model access was unavailable, plus an unstyled retry action. The host now:

- Hides the picker in connecting, unavailable, practice and guided states; ready/static navigation retains all exact source-bound choices.
- Gives Retry comparison the existing outlined button treatment, hover and visible keyboard focus.
- Explains that retry reconnects without reloading the model, and sign-in is needed first if the model requests it.

Retry still focuses the persistent comparison section and uses the existing session/revision guards. No iframe reload, authentication changes, access bypass, new registration claim or clinical approval is introduced. CT/MRI comparisons remain separate, unregistered subjects.

Evidence: `E:/VisibleMedicine-LocalStaging/20261009-comparison-layout/`. Focused tests cover blocked-state omission, retained ready/static choices, scope restrictions and retry focus. The first test run caught an overbroad test regex matching the section's accessible name; it was narrowed to the actual picker label. The original failure log is retained. Final test, type, Review, build, route and desktop-browser results are recorded in the saved-state checkpoint.

Browser at 1280x720 confirms zero unavailable pickers, a visibly outlined retry button in a 60.6px strip, retry restoring the picker and focusing the persistent section, and Practice hiding comparisons. Handshake readiness can return before protected geometry loads; it does not grant model access. Full signed-in model loading, camera/GPU interactions and clinical acceptance remain separate. Existing scan/model tabs are not reloaded. No public deployment or verified GitHub/off-device backup is claimed.

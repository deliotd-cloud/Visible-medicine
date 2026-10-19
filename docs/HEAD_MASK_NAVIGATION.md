# Native saved-mask navigation

Local implementation, 9 October 2026. Parent website revision: `8262cd2367dd817529ec01adab64fc4f7a87c42e`. Atlas remains `574ca99c6119c25d0dce88c21dd77cbab74264cc`.

## Behavior

CT/MRI native Image tools now offer **Show nearest mask slice** alongside **Fit selected mask**. The new explicit action finds the nearest occupied native slice of the selected saved binary mask, then frames that slice with the existing bounded 1–4x zoom and physical-spacing-aware pan. Equal-distance ties choose the lower native index. If already on an occupied slice it frames without changing the cursor.

Only actual mask bytes equal to one count as occupied. Crop bounds alone do not establish anatomy. Empty, malformed or out-of-volume crops fail without moving the image. The action changes only the active plane's cursor coordinate, not the selected structure or source. Fit selected mask retains its current-slice-only behavior. Neither action is available for point/curve annotations or concealed/unanswered quiz targets.

Feedback is bound to the exact study, selection, plane and target slice. Manual navigation, source/selection changes, quiz concealment and Fit image clear stale feedback. There is no new always-visible toolbar or automatic slice jump.

## Verification and recovery

Evidence: `E:/VisibleMedicine-LocalStaging/20261009-mask-navigation/`.

- 115 focused tests pass, including all three planes, reversed/oblique/permuted affines, deterministic ties, invalid/empty masks, source immutability, real NativeSlice controls, feedback lifecycle and quiz concealment.
- Fresh non-incremental TypeScript and unchanged Clinical Review source verification pass (`verification-first.json`).
- Browser fixture extracts the actual production NativeSlice body and imports the actual helpers; `fixture-source.json` pins their source identity. Synthetic-only checkerboard and cubic mask, no patient data. From blank first slices, axial reaches 7/16 at 400%, coronal 26/64 at 320%, sagittal 21/64 at 320%; manual/plane navigation clears feedback and question concealment removes both mask actions and feedback.
- Browser screenshot and observations: `nearest-axial.jpg`, `browser.json`. This is interaction evidence, not native patient-image or clinical acceptance.
- Final isolated E build, exact served client-byte/route readbacks and scoped source-only recovery are recorded in `saved-state.json` after completion. Incremental bundle requires the parent revision above.

No new dependency or asset; no source mask/boundary, generated model, clinical approval, authentication, entitlement or desktop PACS changes. Semantic 3D links remain distinct from validated patient-space registration. No public deployment, scan upload or verified GitHub/off-device backup is implied.

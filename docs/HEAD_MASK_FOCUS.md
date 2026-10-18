# Native selected-mask focus

9 October 2026. CT and MRI share **Image tools → Fit selected mask** in each native plane. It frames only occupied saved-mask voxels on the current slice, using the existing physical pixel spacing and 1–4× zoom/no-blank-edge pan limits. It does not change slice, voxel cursor, source mask, image values, selection or anatomical links. Near image edges, those pan limits may prevent exact centring.

Empty slices retain the current view and explain how to proceed. Points and curves do not gain inferred extents. Fit image restores the full image; manual zoom/reset clears prior framing feedback. The control and feedback are hidden when names are concealed or a Find-it answer callback is active, preventing this inspection shortcut from revealing quiz targets. No extra always-visible toolbar clutter is added.

Evidence: `E:/VisibleMedicine-LocalStaging/20261009-mask-focus/`.

- 112 focused checks pass, including all native planes, reversed/anisotropic/oblique geometry, pixel-to-voxel identity, empty/malformed crop refusal, source-byte preservation, image-edge limits, reset, raster reuse and both quiz concealment paths.
- Fresh types and unchanged Clinical Review verification pass. Final isolated website build and route/exact-client receipts are recorded in saved-state.json.
- Real-browser synthetic-only QA renders the production NativeSlice body, mechanically extracted with a recorded source/body hash and real helper imports. Axial framing reaches 400%; coronal/sagittal framing reaches 320%; slice values stay unchanged. Reset returns to 100%; empty slices retain their viewport and report no mask; question concealment hides control/feedback. Screenshots are retained locally. The fixture is not a product route or an anatomical model.
- Initial regression assumed exact centring even when existing no-blank-edge limits prevent it. The corrected assertion requires the target remain visible and permits off-centre placement only at that exact pan limit. Original failure/debug evidence is retained. Browser QA also prompted clearing stale framing feedback after reset.

This is display navigation, not registration or clinical validation. No patient data was used for browser QA. Protected images, accepted masks, desktop PACS, generated 3D modules, independent entitlements and unrelated specialist work are unchanged. Local-only; no public deployment or verified GitHub/off-device backup is claimed.

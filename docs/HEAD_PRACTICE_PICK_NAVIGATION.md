# Pending answer and native image navigation

CT and MRI Find-it practice now clears an **unsubmitted** answer point when native image navigation moves to a different voxel. Previously, moving to another slice could hide the gold point while Check answer still graded that old voxel.

- Wheel, slice slider, Page Up/Down, Home/End and crosshair movement share the native cursor callback.
- Navigating to the same voxel preserves the pending answer. Zoom/pan changes presentation only and does not clear it.
- Clicking a new point navigates first and then places the new answer in the same event; the fresh point wins.
- With no point, Check answer is disabled and submitting cannot record an attempt.
- Submitted feedback and first-attempt scores are preserved while browsing the scan. Label questions are unchanged.
- The stable cursor callback reads the current practice state without reinstalling wheel listeners on every render.

Regression tests execute the practice hook, rendered button state and the CT/MRI viewer callback. Existing native-slice keyboard and coordinate tests remain in place. These synthetic executable checks do not establish new real-browser/native-image, GPU or clinical acceptance.

Local evidence and scoped source recovery: `E:/VisibleMedicine-LocalStaging/20261009-practice-pick-navigation/`. The saved-state receipt identifies the exact website checkpoint, build and recovery. Original source geometry, masks, teaching/review packets and the desktop PACS are unchanged. No dependencies, fees, access changes, public deployment or verified off-device backup. The Sites/Wrangler workflows are used only for the existing local preview.

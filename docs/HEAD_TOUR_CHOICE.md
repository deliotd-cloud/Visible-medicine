# Recoverable guided sequence choices

The native CT/MRI viewer now preserves an explicitly chosen sequence before
Start and after Finish. Previously, a null-step choice became a bare route;
refresh and Back could silently return the panel to the Brainstem default.

A chooser URL contains only `headTour` and `headRevision`. It restores Guided
learning and its sequence selector without selecting a structure, importing a
folder, starting practice or recording completion. Existing step URLs remain
unchanged. CT rejects MRI-only sequences; the modality header retains its
existing explicit browse fallback when a sequence is unavailable there.

Exactly two unique chooser keys are accepted. Unknown sequences, stale
revisions, duplicate keys, partial step links and extra private/quiz fields
remain invalid. The 3D handoff parser is unchanged: it still requires an exact
concept and source binding. No persistent storage, scans, masks, entitlements,
clinical approvals, teaching content or generated Atlas modules change.

## Evidence

`E:/VisibleMedicine-LocalStaging/20261009-tour-choice/` contains the scoped
checks and recovery. Navigation tests cover canonical choices, negative URLs
and MRI-only refusal. Actual viewer callback tests cover CT/MRI selection,
Back/Forward, duplicate suppression, unloaded and newly loaded viewer restore,
empty selection and the other-modality link. These use synthetic data, not
patient scans or actual browser reloads. The focused suite contains 101 tests.

The first check caught an old bare-route expectation; that assertion was
updated to the explicit chooser URL and the original failed log retained.
Build, fresh types, unchanged Review verification and local HTTP/client
readbacks are recorded separately. Signed-in/native-folder and radiologist
acceptance remain independent gates. Local recovery is not an off-device or
GitHub backup; nothing is publicly deployed by this change.

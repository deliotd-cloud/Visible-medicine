# Retry a native CT/MRI structure — 8 October 2026

A failed selected-structure read now exposes **Retry opening structure** alongside the error. It retries the same source entry without reopening the package, changing the selected tour step or adding browser history. The control is absent while loading, after success, and during practice. Closing, clearing, choosing another entry or entering practice aborts the attempt; late results cannot restore stale anatomy. No source files, masks, image values, entitlements or review approvals are changed.

The regression was reproduced before the fix: selecting the same entry again did not change the load effect dependencies. An explicit attempt counter now retriggers only the selected-entry loader. Practice retains its independent recovery controls.

## Evidence and limits

- 45 focused tests cover actual component callbacks, CT/MRI selection retry, guided position/history preservation, success and cancellation, plus existing practice/guided safeguards and pelvic source bindings.
- Full canonical TypeScript passes. This check exposed a typing defect in the previous pelvic quiz test: its byte decoder now uses `TextDecoder`, with unchanged hash assertions. The prior checkpoint's TypeScript claim is superseded by this fresh verified result.
- Sanitized website build and loopback served-client/access checks are recorded with the checkpoint. The first build attempt was stopped before completion because type verification had failed and the preview source had not yet been synced; it is not acceptance evidence.
- Lifecycle tests use synthetic data and a deterministic hook harness. They do not prove real-file recovery, signed-in persistence, concurrent React behavior or clinical accuracy. No patient material was used or uploaded.

Recovery and logs: `E:/VisibleMedicine-LocalStaging/20261008-native-entry-retry`. Source-only same-machine recovery; no GitHub/off-device backup or public deployment claim. Full roadmap stays active; continue substantive regional coverage and linked learning.

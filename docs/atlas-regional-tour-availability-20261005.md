# Regional tour availability checkpoint — 5 October 2026

Canonical Atlas source: `420f4025b156ecc8f8cf5a864f60876c1fd0c56b`.
This is an integrated local education checkpoint, not public or clinical acceptance.

Regional guided tours now revoke the playback epoch immediately when a current
required model bundle fails or renderer health becomes non-ready. Camera motion
pauses, outgoing imaging consent is suspended, and an already-queued timeout
cannot advance to another structure/caption before React renders the failure.
Hidden-page/pagehide pauses use the same immediate revocation. Existing source
scope and imaging-access guards remain intact.

The selected stop and framing are retained. Missing-anatomy retry or renderer
recovery never restarts autoplay automatically. Once ready, the learner may choose
Next or Play; Exit tour remains available. No anatomical geometry, source teaching,
scan registration or entitlement has been added or inferred.

The canonical production-handler suite passes 49 regional cases, including a
new captured-timeout-before-rerender test for bundle failure and renderer loss.
That regression fails against the preserved original component, demonstrating
that it detects the actual defect. Nineteen selected source phases pass. Generated
imports, current website tests and targeted desktop browser evidence are recorded
separately under:

- `E:/VisibleMedicine-LocalStaging/20261005-regional-tour-availability/`
- `E:/VisibleMedicine-LocalStaging/20261005-regional-tour-availability-website/`
- `E:/VisibleMedicine-LocalStaging/20261005-regional-readiness-draft/`

Only live regional-player hash pins are refreshed in website tests. Immutable
historical source assertions and behavioral assertions remain unchanged. Display
contexts are rebound to the current renderer; old geometry decisions are not
migrated. Exact-source teaching packets, model payloads, dependencies and notices
remain unchanged. No owner approval, patient scan, accepted CT-head mask, private
candidate admission or desktop clinical PACS/native MRI application change occurs.

# Linked 3D comparison recovery

9 October 2026. Local website parent: `1ad7cb684e894c08d4f29dbd546a96ba16ec7b40`.

## User-facing change

The existing head/neck 3D Atlas comparison no longer waits indefinitely for a
selection handshake. After fifteen seconds without a valid response, the host
shows an error-only **Retry comparison** action. It requests a new selection
session without reloading the iframe or changing the camera/model view. Keyboard
focus moves to the persistent comparison section while its live region announces
the new connection state. Healthy navigation has no additional controls.

Failed sessions are revoked. Late replies from a timed-out or failed frame
cannot restore stale CT/MRI links or teaching. Retry uses a fresh session and
accepts only the current frame, origin, source revision and increasing sequence.
A second retry before a response does not dispatch another request. Exact current
readiness notifications may recover a model that finishes loading late.

Timers are cleared on accepted replies, explicit failure, source changes and
unmount. An epoch guard also rejects callbacks already queued before cancellation.
Practice and guided-mode restrictions remain in force; recovery does not grant
access, map new structures, register subjects or open a lecture.

## Evidence

- Two focused regressions fail before implementation: missing recovery control
  and missing bounded handshake wait. Failure output is retained on E.
- All 36 focused linking/component checks pass after implementation, including
  repeated failure, stale messages/callbacks, double retry, unchanged iframe URL,
  blocked practice, reported failure, focus and unmount cleanup.
- Fresh TypeScript and unchanged Clinical Review verification pass. An initial
  test-only React props type diagnostic was corrected; the failed log is retained.
- The isolated E build and four route/exact-client-byte checks pass and are
  recorded in the checkpoint. Synthetic component coverage is not actual signed-in keyboard,
  native-image/GPU or clinical acceptance.

## Recovery and exclusions

`E:/VisibleMedicine-LocalStaging/20261009-comparison-retry/saved-state.json`
records the committed sources, local preview, checks and verified incremental
bundle. The bundle requires the parent above. This is scoped same-machine E
recovery, not verified GitHub or off-device backup.

Atlas `59c40bbb213627c3fc423a0b826f6f3063ea605d`, generated learner modules,
Clinical Review, scans, masks, anatomy, access policies and specialist files are
unchanged. No public deployment, new dependency, asset, fee or clinical approval.
The full goal remains active.

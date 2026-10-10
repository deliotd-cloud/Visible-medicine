# Head comparison recovery — 9 October 2026

Browser checks of website 6b8a6f1 repeatedly required Retry comparison after initial model loading and navigation. The host correctly revokes a session after an exact unavailable packet, but the source channel previously continued publishing the recovered state on that revoked session.

The channel now announces recovery with the existing exact same-origin, revision-bound ready packet. It clears the old session and waits for a fresh host request before transmitting state. The host still validates frame, origin, revision, session, increasing sequence and exact source identity. No timer extension, polling loop, reload, access bypass or permissive stale-session acceptance is introduced.

The transition uses the final state within the existing layout-effect microtask. Transient root/nested cleanup is coalesced, repeated unavailable states do not cause repeated ready packets, and a queued recovery cannot send after close. Recovery into Practice or Guided learning sends only its blocked state after the new handshake; returning from those modes does not trigger unnecessary reconnection.

The focused regression reproduced the old-session selection failure before implementation, then passed selected, empty, practice and guided recovery, no unsolicited selection, sequence reset, coalescing and close cases. Existing invalid origin/source/request/revision checks remain. Independent read-only risk review found no concrete remaining race or gate defect. Source verification evidence is under E:/VisibleMedicine-LocalStaging/20261009-head-channel-recovery.

This is a source checkpoint pending matching learner and Clinical Review import and actual-browser slow-load/recovery verification. Do not claim it is already present in website preview 47683/3000 or hosted content. No teaching, anatomy geometry, scan, mask, registration, clinical approval, entitlement, dependency, licence or desktop PACS changes. Retain the full existing goal and proceed directly to the source-bound website integration.

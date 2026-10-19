# Inline model handshake and recovery

Local-only candidate, 17 October 2026. This changes the CT/MRI comparison UI,
not native packages, accepted masks, anatomical geometry, desktop PACS or access.

An iframe document load no longer says the 3D model is loaded. The pane distinguishes
loading, connecting and waiting for exact structure confirmation. Connecting is
reported to guided playback as waiting, not success or failure. A model selection
still requires the existing origin, source-frame, revision, session and sequence
checks; changed-target focus retains its ACK plus fresh matching snapshot rule.
Timers, retirement guards and explicit retry remain; no reload loop is added.

When comparison is unavailable, its focus command is refused, or its optional
component import/render fails, one contextual
native link opens the exact authored full-Atlas destination in a protected new
tab. The scan stays open. No file, scan bytes, patient position or image identifier
is transferred. Loading, matched, quiz/guide-blocked and unready-annotation states
do not acquire this extra control. Unsupported or stale mappings still have none.

The destination-derivation module is now included explicitly in the website Review
input closure: current inputs increase from1,647 to1,648. Historical41–45 closures,
their original bodies and source hashes remain fixed at their respective epochs.
Current delivery is checked independently; approvals are not migrated.

Focused CT/MRI tests were red against the original premature status/missing link,
then green after integration. Browser baseline: canonical MRI and CT Pons inline
comparison both succeeded first try. The prior intermittent empty frame was not
reproduced here; neither its cause nor the in-app CT crash is declared resolved.
Failure/refusal branches are exercised with controlled protocol messages, without
damaging or substituting real source files. No real-scan screenshots are saved.

For this UI-only milestone, run the affected inline/guided/native history/access
and current-binding tests, types/build/Review/model/coverage/checklist checks.
The earlier expensive immutable shoulder Git-history replay remains retained,
not claimed as rerun. Its current helper must differ only by the single current
Review pin, separately checked alongside the complete current source closure.
No whole-suite, clinical, production-role, registration or public release claim.

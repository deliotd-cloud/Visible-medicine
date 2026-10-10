# Live head selection for semantic comparisons

The same-origin regional website export can publish the current committed
head/neck selection to its host. Other regions and top-level standalone viewers
do not publish. This is a one-way navigation snapshot, not patient-space
registration, an imaging command, clinical approval or an access grant.

The host starts a session after iframe load or a revision-matching ready signal.
Messages bind exact origin, parent/frame, build Git revision, random session and
monotonic sequence. Root selections carry canonical ID, bundle digest and side;
nested selections also carry canonical parent, parent digest and study. The
website resolves only existing exact-source comparison entries. Unknown matches
clear old comparison links instead of guessing by name.

Root practice, guided learning and unavailable rendering override nested state.
Nested practice/guide state is withheld; no answer, coordinate, image or patient
identifier is sent. React layout changes coalesce before publication; child
unmount and provider cleanup clear stale context. Only the active inline nested
view can replace the root selection. Ambiguous nested owners fail closed.

Build after committing source. `selection-channel.json` records the revision
compiled into the listener; the export refuses a different current Git revision.
Import the generated regional learner and protected Review together with the
website adapter. A host-only change cannot connect to an older runtime.

Checks: `node scripts/test-head-selection-channel.mjs`, affected eye/ventricular
and practice component checks, renderer/content/Review bindings and source types.
Website parser/lifecycle checks independently test all existing authored concepts
and stale/foreign/replayed messages. Software tests do not replace actual
signed-in browser acceptance or radiologist review of cross-source mappings.

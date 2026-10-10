# Regional guided-tour motion safeguards

Regional tours share one player. When the operating-system reduced-motion
preference becomes active, automatic playback and camera movement pause at the
current stop. The pending automatic-step timer is cancelled and optional imaging
navigation consent is suspended. Back, Next and the step picker remain available;
reduced-motion camera transitions are instantaneous.

Clearing the preference does not restart playback. A learner must explicitly
choose Play again. Explicit playback with reduced motion remains an intentional
choice to advance captions and stops without animated camera sweeps.

Run `node scripts/test-regional-tour-player.mjs` and
`node scripts/test-tour-step-picker.mjs` for software regression checks. Regenerate
the renderer revision and generated website modules after changing the player;
earlier display/material approvals must not be carried to a changed renderer.
This does not replace desktop keyboard, assistive-technology or clinical review.

## Shoulder playback

The shoulder player also pauses autoplay and camera movement immediately when
reduced motion activates. A playback epoch revokes already queued callbacks,
including the interval before effect cleanup runs; cleanup cancels the timer
and rejects callbacks from a superseded step. Clearing the preference never
resumes playback. Manual navigation remains available with instant camera steps.

Run `node scripts/test-shoulder-tour-session.mjs` for queued-callback, explicit
playback, manual stepping and exact exit-restoration regression checks.

Deliberate Pause and reading controls also revoke the shoulder playback epoch
before React rerenders. Opening the step picker uses that same pause path.
Valid manual Back/Next revoke the old timer without changing intentional Play;
invalid or same-stop callbacks leave a live timer intact. Autoplay still uses its
original step operation. The synchronous active-session Exit guard is retained.
Captured production callbacks cover Pause, reading, direct picking, manual
navigation, invalid/no-op calls and Exit; native browser/device review is separate.

The actual shoulder renderer/model reporting callbacks also synchronously revoke
queued tour playback when combined readiness is lost. The current stop, selected
structure and captured frame remain unchanged before rerender/effect cleanup.
Recovery restores availability, not autoplay; it requires explicit Play. Exit
remains available during loss. Immediate exam-readiness updates and stable callback
identity are preserved; no question, geometry, teaching or approval is changed.

## Independent specimen controls

Source-bound specimen walkthroughs explicitly disable custom motor selectors
and their action buttons in addition to the inert native fieldset. Their
mutation callbacks, and manual source-view controls, reject changes during an
active guide; teaching remains available outside the locked controls. Exit
restores the previously captured dissection, display choices and camera.

Run `node scripts/test-specimen-guided-player.mjs` for forced-handler and
restoration checks across admitted guide stops. These safeguards do not add
nerve geometry, assign unsegmented territories or confer clinical approval.

## Eye walkthrough manual controls

The manual eye-control fieldset is inert and disabled during an active walkthrough.
Directly declared Base UI selectors, switches and sliders are explicitly disabled,
and their change callbacks refuse updates while a source-bound guide step is active.
The shared cutaway controls remain inside the inert subtree; the eye view guards
their change callback without changing the shared component used by other studies.
Source-selected structures, camera, manual layer choices and history are preserved
until the walkthrough ends. Normal study controls then become available again.
The selected structure's teaching and source/limitations disclosures stay outside
the inert controls and remain readable throughout the walkthrough.
The locked manual fieldset is hidden during guidance to reduce vertical clutter;
it stays mounted with its state intact and becomes visible again on exit.
Eye and ventricular guidance retain a compact, always-visible scope warning.
The full, unchanged guide limitation is available in a closed Tour scope &
limitations disclosure. Reading it must not toggle the enclosing guide, restart
playback, navigate a step or alter manual settings.

`node scripts/test-eye-layer-guide-component.mjs` checks both admitted eye parents,
every guide stop, forced control callbacks and manual restoration.

## Regional tour availability and queued playback

Current-scope required-bundle failure or non-ready renderer health immediately
revokes the regional playback epoch, pauses the camera and suspends outgoing
imaging consent. An already-queued autoplay timeout cannot advance the selected
stop before React renders the failure. The same epoch revocation protects
hidden-page and pagehide pauses. Existing scope guards reject stale source callbacks.

The current stop and framing are retained; asset retry or renderer recovery never
resumes autoplay automatically. A ready learner can continue manually or press Play.
`node --test scripts/test-regional-tour-player.mjs` exercises captured timeouts
before rerender for required-bundle and renderer loss, alongside existing imaging,
motion-preference, retry, source-change and exit guards. No new anatomy, acquired
image registration, imaging access rights or clinical approval is introduced.

## Regional deliberate pause and manual navigation

Explicit Pause, opening the step picker and opening references, imaging or quick
check notes revoke the regional autoplay epoch immediately. A callback already
queued before React rerenders must not advance the stop while a learner reads.
Closing a reading panel does not resume playback; Play remains an explicit choice.

Manual Back/Next revoke the outgoing stop's timer while retaining intentional
playback. The committed destination then gets a fresh full-duration timer. Direct
step picking pauses first, and Exit revokes queued playback before unmount.
The exact tour stops, camera frames, source pins, teaching and access rules remain
unchanged. Production-handler tests invoke captured timers before rerender;
browser and clinical acceptance remain separate gates.

## Shoulder identification keyboard alternative

The dedicated shoulder exam retains spatial 3D selection and also presents the
existing question's exact authored structure names as compact native answer
buttons. No option is marked correct before submission. The existing answer-once
session reducer continues to control scoring, old-question/old-round refusal and
Next/Restart; no new assessment-validity claim is made.

Stable renderer/model callbacks update an immediate readiness guard. Both visible
button disabling and captured-callback refusal prevent an answer on loss before
React rerenders. The original answers and dissection state remain intact.
`node scripts/test-shoulder-keyboard-exam.mjs` checks exact source options, score,
pointer/keyboard answer-once behavior, renderer/model loss, recovery and stale
round callbacks. Actual keyboard/browser and representative screen-reader/device
acceptance remain separate requirements.

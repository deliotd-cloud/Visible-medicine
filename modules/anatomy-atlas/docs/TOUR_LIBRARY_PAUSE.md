# Tour library attention pauses playback

The regional tour player now pauses when a learner focuses or presses within
the library controls, or opens whole-body tour discovery. This includes the
native tour chooser, search and region filter. Browsing no longer competes with
an advancing caption or camera.

The request preserves the player instance, selected stop, current camera pose,
source membership and filters. Closing discovery or leaving the controls does
not resume playback; Play is explicit. Changing the selected tour retains its
existing new-source loading gate and Start action. Programmatic filter changes
alone do not change playback or imaging consent. An actual attention request
invalidates the previous timer and suspends the previous imaging stop before
the player settles. No scan navigation is triggered.

The change adds no controls, anatomy, teaching claims, licences, dependencies or
approvals. Nested eye/ventricular walkthroughs remain manually stepped, with no
autoplay timer introduced. The dedicated shoulder player is unchanged.

## Verification

`npm run tour-library-pause:test` exercises the real composed parent/player
across focus, pointer and disclosure interaction, a noninitial stop, stale timers,
explicit resume, source changes and unmount. The same composed regression fails
against exact pre-fix source d9edc899c563eca055bf75ae4e5be8147f10ceb9 with
`node scripts/test-tour-library-pause.mjs --baseline`.

Existing step-picker tests still check every stop and invalid/unavailable input;
their outdated total was corrected to the current 38 regional tours/223 stops.
Camera interpolation/interruption and paused-imaging regressions are separate.
Controlled-component tests are not actual browser/GPU or clinical acceptance.

Evidence and scoped same-machine recovery:
`E:/VisibleMedicine-LocalStaging/20261009-tour-library-pause/`.
Import the matching generated learner and protected Review modules together
before claiming this source change is available in the website preview.

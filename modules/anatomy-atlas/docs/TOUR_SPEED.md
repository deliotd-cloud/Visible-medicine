# Automatic 3D tour speed

The compact **Tour speed** selector is available before and during automatic
playback in every existing 3D player family: regional/whole-body, shoulder,
independent specimen guides, eye layers, ventricular and cardiac cavity guides.
The shared player/control gives future guides the same options.

Choose 0.5x, 1x, 1.5x, 2x or 3x. The default remains the original 1x policy.
Both the caption/stop duration and the smooth camera arrival are divided by
the selected rate. For a short stop, 1x is at least 24 seconds with an 8-second
sweep; 2x is at least 12 seconds with a 4-second sweep; 3x is at least 8 seconds
with an approximately 2.67-second sweep. Longer authored stops/captions retain
their proportionately longer duration. This changes pace, not anatomical order.

Changing speed replaces the current automatic stop's timer with a full interval
at the new rate. It does not jump to another stop, start or resume a paused tour,
grant a score, loop after the final stop, or change any source anatomy/caption.
Already-queued old-speed callbacks are retired immediately. Back/Next navigation
and manual camera transitions are unchanged; opting into Play after a manual
start also uses the selected rate for automatic stop timing. This is a current-view preference, not
persisted browser storage or a URL/clinical/assessment setting.

Hidden pages, unavailable renderers, reading controls, source changes and exit
retain the existing pause/recovery rules. Reduced motion still disables camera
sweeps; its existing explicit Resume option for timed captions is preserved.
Changing speed or restoring readiness never silently resumes playback.

`guidedPlaybackEvidence` remains the exact authored 1x baseline; speed is a
runtime viewer preference. The renderer/source revision includes the shared
control, CSS and timing helper, so older visual acceptance does not transfer.
No scan timing, patient-space registration or clinical approval is implied.

Focused checks:

```sh
node scripts/test-guided-playback.mjs
node scripts/test-tour-speed-control.mjs
node --test scripts/test-regional-tour-player.mjs
node --test scripts/test-specimen-tour-speed.mjs
node scripts/test-nested-tour-speed.mjs
```

Existing shoulder/specimen/nested player and camera interruption checks remain
required for changes to these hosts. Actual browser/GPU, keyboard/screen-reader
and radiologist acceptance remain separate from controlled component tests.

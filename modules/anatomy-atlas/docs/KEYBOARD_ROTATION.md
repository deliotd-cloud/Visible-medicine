# Keyboard rotation without a new toolbar

Free-orbit viewers using the shared fitted camera now expose a focusable
**Rotate 3D model** canvas. Tab to the model, then use arrow keys to rotate in
10-degree steps; hold Shift for 2-degree steps. A focus-only hint and contrasting
focus outline appear inside the existing model area. Existing zoom buttons,
view presets, reset, mouse and touch gestures remain unchanged.

The handler belongs to the physical canvas, not the document/window. It ignores
events targeted at other controls, unfocused canvases, composition, already
handled events and Alt/Ctrl/Meta shortcuts. Tab and Escape are not intercepted.
Locked illustration and planar tray views do not install the rotation handler.
This does not reveal anatomy or alter selection, dissection, geometry or exams.

Camera steps use installed OrbitControls APIs, preserve target/distance/zoom and
respect angular limits. Pole guards avoid singular up/down views. Keyboard
steps are immediate without damping animation; pointer damping settings are
restored. The existing camera capture and demand-render invalidation run after
rotation, so saved views retain the new orientation. Cleanup removes handlers
and restores owned accessibility attributes on unmount or mode changes.

`npm run camera-keyboard:test` checks real perspective and orthographic cameras,
two up axes, limits, reverse/fine steps, modifiers, focus, lifecycle cleanup and
the actual FittedCamera effect/capture integration. Existing camera/renderer,
saved-view and browser checks are recorded in the dated coordination checkpoint.
These are not screen-reader or physical-device certification. Anatomy content,
assets and licences are unchanged; renderer fingerprints advance conservatively
and no previous clinical approval is transferred.

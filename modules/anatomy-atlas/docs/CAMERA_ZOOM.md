# Consistent anatomy zoom

Regional dissection and identification-practice buttons previously increased
camera distance for “Zoom in” and decreased it for “Zoom out”. Shoulder and
whole-body labels were correct, but their absolute toolbar values could jump
after a wheel/pinch gesture because the camera and toolbar no longer shared
the same current scale.

All four surfaces now send signed step intent to the shared FittedCamera.
Positive steps enlarge the anatomy by reducing the *live* relative viewing
scale; negative steps undo that change. One inward step multiplies scale by
0.85; the inverse outward step divides by 0.85. This works for both perspective
distance and orthographic tray extent, while preserving the orbit and pan.

The counter is an ephemeral command, not a saved-view field or anatomy identity.
Existing zoom/StudyCamera formats keep their meanings. Reset, frame, camera
preset and an explicit saved-view restoration take precedence and consume the
counter so an old press is not replayed. Subsequent presses act on the new view.
Button scale is bounded from 0.05 to 20; an already more-extreme gesture does not
cause a button to reverse direction, and opposite-direction movement remains
available. User zoom can intentionally crop anatomy; Reset/Frame restores fit.
Default anatomical bounds, coordinate systems and source geometry are unchanged.

Run `node scripts/validate-camera-zoom.mjs`. This executes the actual camera
effect with real Three.js perspective/orthographic cameras and simulated
React/OrbitControls lifecycle. It checks gesture composition, re-render,
batched presses, pan, resize, reset/frame and saved-view restoration. It is not
WebGL, physical-device, anatomy or clinical acceptance. Existing study-view and
renderer-recovery checks must also pass. Actual browser evidence and release
hashes belong in the coordinating checkpoint.

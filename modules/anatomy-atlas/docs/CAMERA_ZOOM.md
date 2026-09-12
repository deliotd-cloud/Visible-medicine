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

## Free-orbit continuity correction

A subsequent asymmetric-bounds regression reproduced an uncovered defect:
rotating from a narrow projection to a broad one left the previous fit distance
cached in the old direction. The next inward step produced distance 8.4666
instead of 4.3283, moving away instead of closer. An unrelated fit effect could
also change magnification after free orbit. The earlier fixed-direction tests
did not cover this sequence.

The camera now snapshots the preceding bounds, aspect and field of view and
recomputes that previous framing in the live orbit direction. A rotation alone
therefore does not become a zoom command. A changed viewport or genuine
dissection/explode bounds still adapts the relative fit, retaining pan. Stored
bounds are cloned so in-place updates cannot corrupt the previous reference.
Orthographic camera distance also stays stable when only the orbit changes;
its visible extent still handles zoom independently.

The expanded 96-check camera regression runs the actual effect against real
perspective/orthographic cameras, including asymmetric free orbit, +/- direction,
unchanged re-render, in-place growing/translated bounds, phone-sized resize,
pan, reset and existing saved-view precedence. The 18,990 study-view checks and
704 scene-recovery checks also pass. Current material fingerprints are rebuilt
without creating approvals. No source mesh, teaching note, saved format,
entitlement, dependency or new interface control changes.

Browser sampling on the head/neck route exercised oblique rotation, two inward
and inverse outward steps, resize to 390×844 and 35% separation with the view
direction preserved. These observations do not certify all anatomy, physical
touch devices, every GPU, enlarged text or assistive technology.

The same browser check exposed repeated reference links in composed regional
dissection profiles, producing duplicate React keys. Coverage links now display
each distinct URL once, preserving order and every unique source; source
profiles and teaching data remain unchanged.

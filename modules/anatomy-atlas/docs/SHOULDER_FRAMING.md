# Shoulder model framing — 13 September 2026

The shoulder workspace now reserves side-label clearance independently of
vertical clearance. Its initial/preset/reset fit permits the geometry's bounds
to occupy 70% of the width and 86% of the height, instead of 70% on both axes.
The heading, camera/layer selectors and zoom controls are already outside the
canvas; keeping their former vertical allowance made the anatomy unnecessarily
small. The fit still considers depth and all eight bounding-box corners, not
just a flat rectangle or an arbitrary closer camera distance.

This is a presentation change, not a geometry correction. Source meshes,
registration, crop, labels, dissection offsets and teaching are unchanged.
Explode, extract, tray and source-origin bounds continue through the same fit
calculation. All other viewers retain their previous default occupancy. No
additional controls, dependencies, assets, entitlements or patient data are
introduced.

## Camera compatibility

`fitBounds` retains the legacy 70% default used by saved-camera capture and
restore. The shoulder opts into separate presentation margins in `FittedCamera`.
The previous fit stores its occupancy alongside its bounds, aspect and FOV, so
wheel/button/free-orbit composition still measures the previous viewport in the
current orbit. A restored camera wins over a default fit and is not re-fitted on
the next render. Orthographic saves preserve visible magnification and pan, not
an optically irrelevant camera-to-target distance. Reset deliberately restores
the new default presentation.

## Evidence and limits

- 372 focused checks exercise the actual `FittedCamera` effect with real Three.js
  perspective/orthographic cameras, legacy and new margins, button/gesture/free
  orbit composition, saved screen positions, resets and projected corner
  containment at phone, square and short embedded aspect ratios.
- The existing shoulder workspace suite passes 1,350 assertions across 108
  markup and 288 handler cases; its model is a test double, not WebGL evidence.
- Actual local browser: posterior cuff at 1280×720, anterior surface at 100%
  spread, reset at 390×844, and posterior cuff at 1280×554 render the anatomy
  without cropping it at the default fit. The phone sample has document width
  390 and a 376×377 canvas, with no horizontal page overflow. The model is
  visibly larger in the desktop before/after sample while side labels remain
  separate from heading controls.

These checks do not establish anatomical, clinical, real-touch, screen-reader,
200%-text or all-GPU acceptance. A user can intentionally zoom beyond the fit;
this change does not restrict that interaction. Radiologist sign-off remains
revision-bound. The generated website shoulder module must be refreshed and
verified before claiming this source change is available on the website;
consult the main task's dated framing checkpoint for publication and recovery.

# Consistent anatomy zoom — 12 September 2026

The shoulder, female-pelvis and lower-limb runtime exports now share Atlas
source `e2b3ff0e5c9d310455c7caf7ba5726a5af5b2f3f`. Every export includes its
source/asset hashes and retained commercial-compatible notices. No dependency,
model, texture, font, teaching content or private imaging data was added.

## Corrected behaviour

Regional dissection and identification practice had reversed +/- distance
changes. All four Atlas control surfaces now send signed, ephemeral zoom steps
to the shared camera. An inward step multiplies the live viewing scale by 0.85;
an outward step uses its inverse. Buttons compose with the current orbit/pan
and gesture scale rather than an obsolete toolbar value. This supports both
perspective cameras and orthographic trays without adding UI controls.

Reset, frame, camera preset and explicit saved-view restoration win over old
button commands. Saved-view formats are unchanged. Button limits do not reverse
the requested direction when a gesture is already beyond them. Intentional
zoom may crop anatomy; use Reset or Frame to recover a fitted view.

Default fit bounds and all source geometry remain unchanged. This fixes zoom
control, not every regional default framing choice or missing anatomical detail.

## Evidence and remaining gates

- Atlas camera regression: 96 checks executing the real camera effect with
  Three.js cameras and simulated React/OrbitControls lifecycle. Covers both
  projections, gesture-scale composition, pan, resize, batched presses, bounds,
  rerender, reset/frame, explicit restoration and legacy saved-camera meaning.
- Existing study-view, body-arrangement, scene-recovery, limb-learning,
  TypeScript and production-build checks pass. All 132 source GLBs were decoded
  and their unchanged geometry verified by the existing build validation.
- Actual local browser: knee +/- visibly enlarge/reduce; tray enlargement;
  reset and identification reveal/return; phone-sized (390×844) foot Frame,
  inward zoom and reset; shoulder and female-pelvis +/- and reset. These are browser viewport
  checks, not physical touchscreen acceptance.
- Website: 65 tests pass, TypeScript passes and the production build completes.
  All three export inventory/hash/notice checks pass against the new assets.

Real wheel/pinch-to-button transitions are simulated in the regression harness,
not asserted as physically exercised. Broader regional default framing,
physical-device touch, full keyboard/screen-reader acceptance and actual saved
view workflows remain review items. This release adds no real CT/MRI/X-ray/US
connection and no clinical approval. Radiologist sign-off stays revision-bound.

The main task's `work/CAMERA-ZOOM-CHECKPOINT-20260912.md` records exact website,
GitHub, D-drive and private-publication state. Source backup does not imply that
the older standalone Atlas deployment has been updated.

## Subsequent free-orbit correction

Asymmetric anatomy exposed a missed case: changing the orbit left the old fit
distance cached, so an inward press could move away instead. The shared camera
now recomputes the preceding bounds/viewport in the live direction, preserving
actual zoom and pan through rotation while still adapting to genuine dissection
bounds and viewport changes. Orthographic distance is stable as well. The
expanded tests exercise both cameras, free orbit, in-place bounds changes and
mobile-sized resize. Head/neck browser sampling confirmed oblique +/- changes,
390×844 resize, 35% separation and reset. Repeated regional coverage URLs also
now appear once, without dropping any distinct reference.

All three module exports were rebuilt and their source-input hashes verified;
prior compiled modules are preserved outside the public site. This changes no
source anatomy, clinical text, scan/lecture access or saved-camera format.
Use the newer `work/ORBIT-CONTINUITY-CHECKPOINT-20260912.md` in the main task for
exact verification, backup and publication state. Older browser observations
above retain their original scope and do not prove universal device acceptance.

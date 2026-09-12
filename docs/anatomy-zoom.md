# Consistent anatomy zoom — 12 September 2026

The shoulder, female-pelvis and lower-limb runtime exports now share Atlas
source `720e44a10b96b10aaa600451dd5a491a79c26c31`. Every export includes its
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

- Atlas camera regression: 72 checks executing the real camera effect with
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

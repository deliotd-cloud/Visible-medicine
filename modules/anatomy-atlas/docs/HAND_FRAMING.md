# Hand framing — 13 September 2026

The hand region now starts on the right side with the wrist, fingers and
regional tissues enlarged. The existing laterality menu still offers Left
side and Both sides, with all 124 existing selections available across them
(63 right, 61 left). Explicit study links and restored bookmarks retain their
chosen side. Other regions keep their former bilateral default.

## Clear close-up versus full source view

The short caption identifies a close-up and warns that proximal vessels
extend off-screen. **View → Fit all sources** returns the full regional source
extent; **View → Frame hand** returns to the close-up. These actions share the
existing direction menu, with no extra permanent toolbar. Choosing Frame hand
clears a previous selection; fitting all sources does not remove tissue.

The preset is derived from actual visible hand-primary source bounds, not an
invented centre or cropped/remeshed anatomy. Long radial, ulnar and anterior
interosseous artery sources remain loaded at their original coordinates.
Selecting one uses the full-source fit. Both-side comparison, separation,
tray/extract, isolation, ghosted/source-origin views, cutaway and active exams
do not use the regional preset. Existing explicit knee/elbow close-ups are
unchanged. Reset restores the hand preset when eligible, retaining the side.

This is a presentation change, not new segmentation or clinical correction.
All original meshes, source hashes, inspection frames, dissection centres and
offsets, lessons, identities, missing structures and source holds are preserved.

## Camera and saved-view compatibility

`FittedCamera.presetBounds` sets only an initial/reset/recentre camera target.
The original full bounds remain the reference for capture, restore, relative
zoom, pan and resize. The initial close-up is approximately half the full-source
camera distance for either hand in the checked anterior view; this is not a
claim of identical screen magnification in every orientation or viewport.

Restoring a saved pose takes precedence over the new preset. Old full-source
views and newly saved close-ups therefore retain their framing without a
bookmark-format migration. No private approvals are transferred. The actual
browser check also exposed narrow saved-view names; the existing stacked
name/actions styling now covers the root-body control rail as well as the
shoulder rail. No saved data was changed by that CSS correction.

## Verification and remaining limits

- `node scripts/validate-hand-framing.mjs`: current 1,101-selection catalogue,
  both hand sides, complete hand-primary bounds, proximal-source selection,
  disabled/empty/other-region cases, four aspect ratios and source immutability.
- `node scripts/validate-camera-zoom.mjs`: 398 checks of the actual camera
  effect with real Three.js perspective/orthographic cameras, including
  preset/zoom composition, full-reference pan, old/new bookmark restore and
  full-source reset. Existing camera behavior remains covered.
- `npm run study:test`: 18,990 saved-view/source checks. TypeScript, production
  build, current body SQLite/review safeguards and shoulder review checks pass.
- Actual browser: initial enlarged right hand; full-source action and return;
  both-side comparison; left hand at 100% separation and return to zero;
  390 x 844 close-up/caption; selecting the left radial artery shows its full
  extent; saving a temporary left-hand close-up, fitting all sources and
  restoring the saved close-up. Saved-name wrapping is visually corrected.
  The temporary QA bookmark was removed through its confirmation dialog;
  no user bookmark was removed.

These samples are not full physical-device, screen-reader, 200%-text,
performance or anatomical/clinical acceptance. Shared display fingerprints
advance conservatively; draft shoulder export revision fields are refreshed
without changing shoulder teaching. Exact source, recovery and publication
outcomes belong in the main task's dated hand-framing checkpoint. The website's
three separate runtime exports are not automatically updated by this change.

No new model, font, texture, dataset, package, paid API or mandatory service is
added. Existing MIT and BodyParts3D CC BY 4.0 notices remain. Original scans,
masks and specialist CT-head boundaries are untouched. Didanix Education/light
and independent Atlas/case/lecture access remain the integration path; this
preset is not a patient coordinate mapping. Full Atlas development continues.

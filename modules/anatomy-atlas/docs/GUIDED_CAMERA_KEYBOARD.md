# Guided camera: preserve keyboard inspection

## Defect and scope

During a perspective Guided learning transition, an accepted arrow-key rotation
changed the actual OrbitControls pose, but the next animation frame overwrote it.
Pointer orbit already interrupted the transition. The shared FittedCamera now
clears the active sweep only after the keyboard binding consumes a valid rotation,
then captures that live pose. This also preserves an adjustment made while paused
when playback resumes. A subsequent tour preset can still animate normally.

The planar branch, default fitting, zoom, reduced motion, tour captions, source
surfaces and saved-camera format are unchanged. This is the integrated Atlas
renderer, not the desktop Didanix application. No new dependency or licensed asset.

## Reproducible source evidence

- `node scripts/test-guided-camera-interruption.mjs --baseline` bundles immutable
  `952d758104102f5853e00e846cb3448511daa960:app/fitted-camera.tsx` and confirms the
  original overwrite. It expects the known baseline defect, not a corrected pose.
- `npm run camera-keyboard:test` includes the actual bundled FittedCamera, its
  registered key handler and installed Three.js/three-stdlib OrbitControls.
  Controlled React hooks preserve callback identities, effect dependencies and
  cleanup; the actual frame callback advances the sweep. Normal/Shift rotations,
  paused resume, non-arrow and locked rejection, captured target/radius/zoom,
  subsequent preset arrival and demand-frame termination are checked.
- `npm run renderer-review-scope:test` substitutes only a renderer fingerprint in
  the actual public review modules. All 1,104 root, 108 nested and 356 independent
  review contexts must change geometry/display revisions while preserving source
  and teaching revisions. Independent scopes overlap; these are not unique anatomy
  counts. Root public worksheets stay unchanged; nested/independent material hashes
  explicitly bind the renderer. Imaging remains unavailable. No private decisions
  are loaded, created or migrated.

Shoulder display revisions also bind FittedCamera. Regenerating their revision
metadata invalidates old geometry/display sign-off, not teaching sign-off. The
source checkpoint records exact baseline comparison and verification logs.

These controlled checks do not prove GPU rendering, physical keyboard/device
coverage or clinical accuracy. Fresh signed-in desktop review remains necessary.
Source changes require the existing generated website import pipeline; saving this
source alone does not change the website, publish it or confer clinical approval.

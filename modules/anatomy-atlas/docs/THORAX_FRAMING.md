# Thorax camera framing

The default thorax view frames complete primary thorax sources and all visible
nonvascular context. This retains the thoracic spine, discs and posterior muscles
alongside the chest wall, diaphragm, lungs, heart and supplied trachea. Shared
neck, abdominal and shoulder vessels no longer determine the initial camera fit.
No source is removed, cropped, renamed or repositioned. Some shared vessels may
extend off-screen; the model caption says so.

The existing View menu offers **Fit all sources** and **Frame thorax**. Selecting
a shared vessel restores the full visible-source frame automatically. Hidden,
unknown or contralateral selections also fall back to full-source framing.
Midline, unpaired and unspecified sources remain available in either side view.
If no core source is visible, there is no regional preset.

This reuses the current camera mechanism and adds no control panel. Explode,
nonspatial layouts, cutaway, practice, focus/isolation, ghosts and original-position
guides suspend the preset through the existing guards. Saved camera poses take
precedence. Unrelated rerenders do not snap the camera back to the preset.

The improvement is strongest on wider displays. Narrow mobile views are limited
by chest width; the camera does not crop the chest to force a larger image.

Verification:

- `npm run thorax-framing:test`: actual 1,102-selection catalog, 157 thorax
  members, all side/system filters, complete source bounds, 364 selection cases,
  hidden/stale/outside/contralateral fallbacks, and 72 camera projection fits.
- `node scripts/validate-camera-zoom.mjs`: actual FittedCamera effect with real
  perspective and orthographic cameras, key-only regional/full transitions,
  unchanged save/restore semantics, gesture/zoom/pan behavior.
- Browser evidence in the main coordination checkpoint covers desktop/mobile
  framing, side and explode transitions, shared-vessel deep links and desktop
  system, cutaway, orthographic, origin-guide and practice transitions.

This is presentation work, not new anatomy, clinical validation, registered CT/MRI
or physical-device acceptance. Existing release/sign-off gates remain unchanged.

# Regional viewport and nested-panel layout

## Reproduced issue and repair — 13 September 2026

The production website at 1280 x 720 left only 136.20 CSS pixels for the
head/neck WebGL canvas inside a 329.17-pixel model card. A duplicated heading,
fixed 75/90-pixel scene insets and separate orientation row consumed the space.
This was a layout problem, not evidence that source anatomy should be cropped.

The root model card now uses content-sized control/caption rows around a flexible
scene. Zoom sits with the existing view controls, outside the label drawing area.
The contained presentation retains its title, status, description and count in a
smaller heading block. Other regional routes share the content-driven canvas;
camera bounds, source coordinates, zoom semantics and saved views are unchanged.

The root scene rules are restricted to the root card. They previously overrode
the nested dissection viewport with `!important` insets. Nested brain/eye panels
now retain their own scene layout. A measured 260-pixel brain inspector overflowed
to 289 pixels: long names expanded implicit grid tracks and switches had no
space for their extended hit targets. Explicit shrinkable tracks, wrapping names
and internal padding retain complete names, switches and focus outlines.
Nested view/label controls and cutaway warnings also receive content-sized rows,
so they cannot obscure the live orientation text when controls wrap on a phone.

## Evidence and limits

- TypeScript and the complete Atlas production build pass.
- The existing 336 actual-source head fits, 12 scene-prop cases and 398 shared
  camera-effect checks pass unchanged; all 290 regional source bounds remain.
- Revision-bound review checks pass (235 shoulder checks; 1,101 body contexts).
  Display fingerprints advance; no clinical decisions are migrated.
- Actual browser samples, refreshed website export, exact GitHub/D recovery and
  publication outcome are recorded in the coordinating task's
  `work/REGIONAL-LAYOUT-CHECKPOINT-20260913.md`. Do not infer them from a build.

No dependency, media asset, licence, patient scan/mask, teaching statement,
entitlement, splash behaviour or source-admission decision changes. Physical
device, wider accessibility and radiologist acceptance remain separate gates.

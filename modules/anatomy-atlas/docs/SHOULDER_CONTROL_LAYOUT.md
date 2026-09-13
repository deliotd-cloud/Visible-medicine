# Shoulder controls outside the anatomy

13 September 2026. The preceding website browser check reproduced a collision
between the right proximal-humerus label and the floating zoom buttons in the
short embedded shoulder viewport.

The existing plus/minus buttons now sit beside the shoulder heading and Details
button, outside the model/label layer. There are still exactly two zoom buttons;
no toolbar, permanent panel or additional action is introduced. The heading
wraps when necessary. Buttons are 40 CSS pixels, increasing to 44 for a coarse
pointer. Labels retain their projected screen side and source anchors.

Camera calculations, default fitting, saved-view scale, reset, free rotation,
separation and mesh coordinates are unchanged. This fixes control obstruction,
not the separately noted conservative camera framing. It does not claim more
anatomical detail or new teaching content.

## Verification

- `node scripts/validate-shoulder-workspace.mjs`: 1,350 checks, 108 markup cases
  and 288 actual handler cases. The added checks require the named zoom group
  to be in the heading rather than the scene for every workspace mode. These
  are server renders with the existing scene double, not GPU/browser proof.
- `node scripts/validate-camera-zoom.mjs`: 96 real-Three-camera/effect checks
  pass; live-gesture composition, free-orbit continuity and saved views remain.
- TypeScript, full Atlas production build, all 235 shoulder review checks plus
  16 negative display-history cases, and the SQLite body-decision workflow
  (1,101 contexts / 3,303 tracks) pass.
- Actual standalone `/shoulder` browser: model rendering, keyboard plus/minus,
  proximal-humerus label selection, 100% separation and Reset were sampled.
  At 390 x 844 there is no horizontal document overflow and both zoom buttons
  remain above the model. A 1280 x 554 DOM check confirms the same separation.
  This is not physical touch-device, screen-reader or 200%-text acceptance.
- The source `/integration/shoulder` development URL collides with Vite's
  integration-directory HTML entry and cannot serve that entry's exported
  model path; it is not used as evidence of a working website embed. Verify the
  generated module inside the website through the established exporter.

The display fingerprints are regenerated conservatively. The nine draft
shoulder export revision fields follow their current fingerprints; original
teaching is unchanged. Private reviews/approvals are neither read nor migrated.

No models, dependencies, fonts, textures, private scans/masks, licences,
entitlements, imaging registrations or splash-screen settings changed.
Source/recovery, actual website-export testing and private publication are
recorded separately in the main task's dated shoulder-control checkpoint.

## Remaining work

Assess framing using projected geometry and actual space rather than a blanket
zoom change that could crop exploded views. Continue source-led regional
anatomy and the still-pending modality-specific teaching; the full-body coverage
document contains historical counts and must not be treated as current clinical
completion. Retain specialist CT-head boundaries, independent Education/case/
lecture permissions and revision-bound radiologist sign-off.

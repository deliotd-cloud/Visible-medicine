# Head and neck: clearer full-source presentation

13 September 2026. The head/neck regional route now gives the existing camera
fit 86% vertical occupancy while retaining its 70% horizontal occupancy for side
labels. Other regional, whole-body, shoulder and specimen routes retain their
existing settings. No control, anatomical crop, new model or new dependency is
introduced. Every visible source still contributes its complete bounds.

The source audit found 290 loaded head/neck selections, 261 with primary
head/neck membership. Excluding the neighbouring-source records would retain
over 98% of the original height, giving little useful enlargement. The change
therefore preserves those neighbours and reduces vertical presentation margin
instead. This does not relabel any source or approve an anatomical boundary.

At a tested wide-canvas aspect ratio of 1.58, the initial anterior camera distance
is 84.16% of the preceding distance. That is a camera measurement, not a uniform
percentage change in every projected structure. Narrow views can remain
width-limited and retain the previous fit. No fixed pixel zoom is imposed.

## Verification

- `node scripts/validate-head-framing.mjs`: 336 camera fits against complete
  bounds of all 290 selections and six separate system groups, six anatomical
  viewing directions, four viewport ratios, and perspective/orthographic cameras.
  Every tested source-box corner remains inside the specified occupancy limits.
  Twelve actual BodyScene element cases verify camera-prop forwarding in spatial,
  extract and tray modes with and without examination mode. Hooks/WebGL are
  controlled in this component test; it is not browser/GPU evidence.
- `node scripts/validate-camera-zoom.mjs`: all 398 existing actual camera-effect
  checks pass, including the same tighter occupancy, saved-camera convention,
  restore precedence, live gesture/orbit composition, resizing and reset.
- TypeScript passes. Source catalogue JSON is unchanged by the bound tests.
- Production build passes, including all 133 lossless model-delivery checks
  (1,504 meshes). Existing hand/foot framing, camera orientation and review
  safeguards pass. Actual SQLite body-decision checks cover 1,101 contexts /
  3,303 tracks with synthetic fixtures only. Root-body display evidence advances
  to `3611058dabac0a28221e4a6d393a3714044aa27d9bc46d1927c82966957316ac`
  (477 inputs); the shoulder display and teaching revisions stay unchanged.
- Actual local browser: initial anterior head/neck before and after; posterior
  at 100% Spread; reset to assembled posterior; 390×844 phone-width rendering.
  The phone sample has document width and scroll width both 390 pixels. The
  desktop model is visibly larger and remains clear of the controls; the phone
  sample has no horizontal page overflow. No private bookmarks, answers or
  clinical review records were submitted.

Anatomy, teaching, coordinate frames, separation mathematics, label placement,
private scans/masks, licences, splash behaviour and independent entitlements are
unchanged. This is presentation work, not anatomical/clinical acceptance.
Full device, touch, screen-reader and 200%-text acceptance remain open.
Source/review fingerprints and exact GitHub/D/hosting results are recorded in
the coordinating task's dated checkpoint. The website's separate runtime pilots
do not use this head/neck route, so their current exports are not regenerated.

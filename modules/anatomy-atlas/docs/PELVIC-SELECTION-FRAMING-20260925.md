# Pelvic muscle selection without unnecessary zoom-out

## User-visible change

Selecting a shared hip muscle previously abandoned the pelvic close-up solely
because its primary catalogue region was thigh. The camera now keeps exactly
the existing regional bounds when the complete visible, side-compatible muscle
envelope fits inside them. The framing set itself does not change. No mesh is
cropped, repositioned, removed, generated or reclassified.

In current source data this benefits fourteen muscles: paired gemellus superior,
gemellus inferior, iliacus, obturator internus, obturator externus, piriformis and
quadratus femoris. Gluteus maximus/medius/minimus, femora, long vessels and other
non-contained selections still restore the full-source camera. Organ/vessel
framing policy is unchanged even if a small source happens to fit. Hidden,
missing and opposite-side selections retain the fallback. Invalid/inverted or
non-finite shared-muscle bounds are rejected.

The existing View menu still offers Fit all sources / Frame pelvis. Explicit
full-source choice is respected. Explosion, extraction/tray, cutaway, focus,
isolation, ghosted tissue, origin markers, dedicated studies and exam guards
continue to own their camera states. A close-up may put parts of unselected
long contextual structures beyond the viewport; the complete sources remain
loaded and the caption offers full extent. It is not anatomical cropping.

## Evidence

- Exact current augmented display catalogue: 1,104 records, 82 pelvic members.
  An older 1,102 total preceded the separately audited short-ciliary/anterior
  cardiac admissions; only that stale test count was refreshed.
- 28 contained-muscle selections across both/right/left conditions retain
  unchanged bounds. Each source is tested for hiding, side errors, all six
  envelope overflows and invalid data; exactly seven paired families qualify.
- 72 projected camera fits cover six directions and four aspect ratios on
  both/right/left; 18 long-source fallbacks retained.
- 3,456 hand/foot/thorax/leg/forearm cases compare directly against immutable
  pre-change regional-framing implementation at e2ce70e and are unchanged.
- Separate pelvis, foot, forearm, thorax and leg framing checks pass. Thorax's
  stale 157 count is corrected to 158 (existing anterior cardiac vein). The leg
  VM fixture now supplies the existing popliteal study referenced by the actual
  component expression, and tests its camera key/dedicated guard. No production
  thoracic, leg or popliteal behavior is changed by these fixture repairs.
- Renderer, selection visibility, body-review and TypeScript pass. Changed
  helper/validators pass targeted lint. Shared production module builds with
  the existing large-chunk warning. Renderer review binding regenerated.

Local logs (not public artifacts):

- .local/test-logs/2026-09-25T14-11-21.263Z-46320-49648dc4.log
- .local/test-logs/2026-09-25T14-13-46.875Z-34520-b4d3afb5.log
- Earlier failed fixture evidence: .local/test-logs/2026-09-25T14-10-11.771Z-54224-08f76dce.log

## Actual local browser samples

At localhost:3191/regions/pelvis, stage 3 (78 enabled), posterior view:

- Desktop 1280 × 720: Right obturator internus selection retains enlarged pelvic
  framing and paired screen-side labels. Previously it zoomed out to full limbs
  and long vessels. Existing Behind tissue warning remains.
- Fit all sources preserves the selected structure and stage; Frame pelvis
  returns to the close-up using existing selection-clear behavior.
- 390 × 844: Left obturator internus selection retains a readable pelvic view,
  selected label and visible controls. Spread 100 shows the exploded teaching
  warning; returning to 0 restores the pelvic close-up. Viewport override reset.

These are sampled pointer/keyboard and emulated-viewport checks, not clinical,
screen-reader, all-device or whole-atlas certification. Owner radiologist
sign-off remains revision-bound and pending. No teaching, imaging links,
entitlements, licence terms, scans or masks change. The full goal remains active.

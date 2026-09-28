# Enlarged anatomical labels

28 September 2026. Source presentation correction, not new anatomy, source
identity, teaching, approval, access or licensing material.

## Evidence and implementation

The website shoulder at 375px and 200% root font split each of “Scapula”,
“Proximal” and “humerus” across two lines. The corresponding boxes were 153px
and 147px tall in a roughly 200px drawing area. This was confirmed using browser
text ranges, not inferred from the font size alone.

Label widths now grow with their actual font (`em`) within hard screen-side
bounds. The default width budget is retained, with bounded extra space for larger
text. Neither column crosses the centre, and selection priority, anatomical IDs,
projection, leader lines and depth disclosures remain unchanged. Existing resize
observation requests layout when font wrapping changes; no new per-frame style
reads or listeners are introduced. Text is not reduced, abbreviated or ellipsised.

Wider boxes alone obscured too much anatomy in the visual trial. Short embedded
panels therefore also reserve drawing height in `rem`: approximately200px at
ordinary text and400px at doubled text for the shoulder. This gives the existing
packing algorithm room to move labels clear of anchors. Enlarged text intentionally
requires more vertical scrolling; ordinary phone and desktop layouts remain compact.

## Acceptance

- Six production shoulder browser cases:320,375,1024px widths, each at normal
  and doubled root font. The two initial landmarks remain visible and selectable,
  their individual words stay on one line, their labels stay on the correct side
  and do not cover their own anchor dots. At375px enlarged text, boxes measure
  about118px (selected Scapula including “Behind tissue”) and77px (Proximal humerus).
- Fifteen production regional cases across Thorax, Head/neck, Foot, Spine and
  Whole body:normal/enlarged phone and desktop. Canvas reachability, mode keyboard
  navigation, sheets/focus restoration and reversible system toggles pass.
- Pure layout/projection and actual component-frame tests cover side containment,
  density, ordering, selection priority, invalid scale bounds and oversized boxes.
  Label focus and depth-probe suites pass. Broader renderer/model-first checks are
  recorded with the final source checkpoint, not assumed from these samples.
- Visible Windows browser inspection confirms the larger model and shorter labels.
  Temporary root-font changes were restored. Earlier trial reports remain retained.

`scripts/test-enlarged-label-readability.mjs` takes a loopback shoulder module URL
and local JSON report destination, with `VM_PLAYWRIGHT_MODULE` pointing at an
already installed Playwright module. It verifies the served source fingerprints
for the label component, layout function and panel stylesheet before testing.
No added runtime dependency or paid service. Browser evidence stays outside the
hosted module; setup mirrors `test-embedded-model-readability.mjs`.

This is not proof that every long anatomical name fits unbroken at every font or
viewport, nor that labels never obscure any part of a projected tissue. Bounds
and density remain necessary; full names are also available through Structure
info/search. Physical-device, screen-reader, native-zoom and clinical acceptance
remain separate. No source geometry or saved review decisions were changed.

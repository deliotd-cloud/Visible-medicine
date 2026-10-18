# Modality-first Atlas navigation

13 September 2026. The owner's requested path is now:
Atlas overview → 3D / CT / MRI / Ultrasound / X-ray → anatomical region.

The Atlas label remains a link to the five-tile overview. Its adjacent caret
opens the modality dropdown; label hover and keyboard focus also disclose it.
The mobile menu includes both Atlas overview and all five modalities.

Existing region and study links are retained. /atlas/3d opens the shoulder;
/atlas/ct opens the illustrative head demonstration. The eight currently hosted
3D routes share a compact region strip directly below their title. At phone
widths it becomes a labelled native select. Region links use page-navigation
semantics (aria-current), not misleading in-page tab roles.

MRI, ultrasound and X-ray have dedicated sections and region-specific preparation
states. CT's other regions are explicitly pending. No private dataset, registered
crosshair, additional image set, paid lecture access or clinical approval is
implied. Existing catalogue-filter bookmarks map through an allowlist.

## Preview images

The 3D tile shows the actual source-based shoulder viewer. The other tiles use
independently sourced representative images, not images attached to the product
demonstration. MRI is explicitly an ex vivo research specimen; the ultrasound
image is a diastasis-recti abdominal-wall case, not a normal-anatomy assertion.
Original bytes, credits and licence links are under public/media/atlas.
No generated medical image, new dependency, fee, patient file or authentication
change was introduced. All generated model runtimes and the 94-object / 100-path
delivery inventory remain unchanged.

## Verification

All 96 website tests and TypeScript pass; production build passes.
Actual local browser checks: all five tile images load, desktop caret opens once,
Escape closes and returns focus, a 3D tile reaches the shoulder, region links
reach head/neck, and a 390×844 region select reaches spine. MRI selection updates
both URL and displayed region; browser Back restores the prior choice. Mobile
Atlas menu exposes five modalities and dismisses after navigation. No horizontal
overflow was observed at the checked desktop or phone viewport. Broad
accessibility, touch-device, other-account and clinical acceptance are not claimed.

## Next integration

The in-progress Atlas-source whole-body/limb expansion remains separate and is
not activated by this navigation release. Once its source-bound export and
staged geometry delivery pass, extend the same 3D region catalogue rather than
adding a second permanent region selector inside the viewer. Real imaging should
replace preparation states only after Didanix Education, privacy/rights,
registration where applicable and revision-bound radiologist release checks.
The full Atlas goal remains active.

Source, recovery and publication evidence is recorded in the coordinating task's
work/ATLAS-MODALITY-NAVIGATION-CHECKPOINT-20260913.md.

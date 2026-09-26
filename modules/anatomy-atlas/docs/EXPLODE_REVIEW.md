# Explode mechanism review

## Current catalogue verification — 26 September 2026

The spatial centroid/framing regression now consumes `bodyDisplayCatalog` and
the same side filtering and compound-part projection used by the viewer, rather
than testing only the archived 1,022-entry importer catalogue. It covers all
1,104 current root representations in 36 region/side scopes (whole body plus
11 regions, each both/left/right), with 1,184,284 centroid-pair checks, 20,720
perspective/orthographic fits and the retained 88 dedicated-shoulder crop checks.
The report binds both catalogue hashes and records each tested scope.

Run `node scripts/validate-explode.mjs`; evidence is in
`explode-validation.json`. Source metadata is checked unchanged. These are
numerical checks of source-relative display translations and conservative
framing, not proof of tissue clearance, attachment correctness, browser pixels
or clinical approval. No runtime transform or anatomical mesh was changed.
Tray repacking after system/removal changes remains the deliberate behaviour
documented in `BODY_ARRANGEMENT.md`; selection/focus alone does not repack it.

`npm run rendered-bounds:test` additionally verifies the actual GLTFLoader
position buffers against these catalogue bounds: 109 bundles, 1,104 canonical
entries and two side-specific component presentations, covering 2,635,161
vertices. Maximum excursion is zero. Expected source world transforms are
identity, matching the renderer's raw-geometry reuse. Exact bundle bytes/hashes
and geometry/transform immutability are checked; the detailed report is
`rendered-bounds-validation.json`. Negative fixtures reject nonfinite positions,
invalid bounds, discarded transforms and out-of-box geometry. No smoothing,
scaling, mesh repair, new asset or anatomical approval follows from this check.

## Separate arranged study mode

The newer [whole-body/regional tray](BODY_ARRANGEMENT.md) complements, rather than replaces, the spatial mechanism below. At 100%, its aligned orthographic layout gives each catalogue entry a separate projected bounding rectangle without rescaling or editing source geometry. Intermediate arrangements and compound source interiors can still overlap. The original spatial mode retains the 2.6× centroid separation and anchored-skeleton options described below.

## Implemented correction — 6 September 2026

The approved changes are now implemented. The review below is retained as the historical pre-change baseline; `scripts/review-explode.mjs` deliberately reproduces that old formula, not current runtime behaviour.

- Body/region views use a stable full regional frame and centroid-proportional translation. At 100%, every unanchored centroid-pair distance is 2.6 times its assembled distance; objects themselves are not enlarged. This does not guarantee surface clearance for overlapping or long meshes.
- Shoulder authored directions now use a stronger 0.026-per-percent offset. Its crop is attached to original anatomical coordinates, so separation no longer cuts a different local portion of humerus/muscle.
- Both viewers fit the actual translated bounds with a common perspective/orthographic fitting helper. Slider changes preserve orbit direction; preset/reset changes deliberately restore a standard view. User zoom remains intentional and can crop a close-up.
- Optional **Keep bones assembled** maintains skeletal context. **Original positions** shows faint references. In large scopes only the selected structure gets an original-position reference, avoiding hundreds of overlaid meshes.
- Four shoulder orthographic presets share the model, selection and labels. They are parallel projections, not acquired imaging or physical-scale prints.

Current numerical regression: `node scripts/validate-explode.mjs` tests 391,870 centroid pairs, 7,280 perspective/orthographic fits and 88 shoulder crop cases. `node scripts/validate-dissection.mjs` now imports the runtime fitting and displacement helpers for its additional 6,192 stage/view fits. See `BROWSER_QA.md` for actual interaction checks; numerical tests alone are not browser or clinical validation.

## Historical review (before implementation)

Reviewed 2026-09-06 through source inspection and numerical geometry checks. This is a review, **not a mechanism change or browser/visual test**. Reproduce with `node scripts/review-explode.mjs`; detailed measurements are in `explode-review.json`.

## Should structures move farther apart?

Yes, some neighbours need greater **relative** separation. In the bilateral hand scope at maximum explode, right trapezoid/triquetral centroid spacing increases from 30.973 to only 31.101 source-equivalent mm. Forty-nine nearby same-system/side pairs in the spine scope gain less than 10% centroid separation. Centroid spacing is a diagnostic proxy, not actual surface clearance or a clinical measurement.

The regional mechanism gives each object an equal-magnitude outward translation. Objects on similar rays therefore move together. Increasing only the scalar exaggerates the global spread without reliably resolving crowding. Its origin also depends on visible/focused bounds, so hiding or framing an object changes the translations. Camera padding increases and resets the viewing direction on slider changes, which can visually counteract the additional spread.

The dedicated shoulder uses authored directions but a fixed camera fit unrelated to explode. Conservative projected bounding-box checks at full separation put some bounds outside all three camera views at tested portrait/square/landscape aspects. This establishes a framing risk, not proof that every flagged bound contains a clipped visible triangle. Its world-fixed clipping plane also changes which local portion of a translated mesh is cut.

## Recommended implementation, pending approval

1. Use a stable regional frame independent of selection/hide state, with a smooth centre-distance component so near-collinear neighbours separate relatively rather than receiving equal translations.
2. Keep assembled geometry exactly unchanged at zero. Store all offsets as reversible presentation state, never change source coordinates, anatomical IDs or future scan-registration transforms.
3. Bound stronger separation by actual moved geometry; fit the shoulder as well as regional views. Preserve the user's orbit during slider adjustments and reserve preset resets for explicit view/reset actions.
4. Make the shoulder's display crop move with its structure; labels must follow their own mesh. Clarify that explode is diagrammatic, not physical displacement or dissection depth.
5. Test monotonically increasing pair separation, repeatable reset, focus/hide stability, camera limits, both sides and narrow/mobile viewports. Follow with authorised visual/browser testing and clinical review of teaching usefulness.

At this release the existing mechanism and 0–100 range remain unchanged; the user was offered implementation separately from the requested review.

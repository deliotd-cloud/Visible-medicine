# Deep inspection and regional illustration views

## Delivered scope — 6 September 2026

The dedicated shoulder, all 11 regional explorers and whole-body viewer share non-destructive surface cutaways and per-system transparency. Regional and whole-body views now also offer orthographic illustration mode. This is an interaction/detail-inspection milestone, not an anatomical coverage expansion: the catalogue still contains 823 source representations and the dedicated shoulder still binds nine structures to 11 meshes. No source mesh, anatomical ID, source transform or licence has changed.

## How to inspect anatomy

1. Choose a region, dissection stage or structure. Open **Inspect deeper**.
2. Choose an axial, coronal or sagittal cutaway. Move its position from 0–100% of the region's complete, assembled bounds. **Keep … side · reverse** changes which half is retained. The shoulder frame includes its existing lower-arm display crop.
3. Reduce a system's opacity to see surfaces behind it. Below 20%, its surfaces stop intercepting clicks. Search remains available. **Keep selection solid** overrides opacity for the selected structure, but does not override a cutaway or restore hidden systems.
4. Combine inspection with **Explode**, **Keep bones assembled**, isolation and original-position references. Each cut follows its displaced structure: explosion does not change which part of that structure is retained.
5. Enable **Orthographic illustration** for a perspective-free plate of the same source surfaces. Use the directional buttons and + / − zoom controls. Plate mode deliberately locks free rotation/pan; switch it off to resume orbit and touch gestures. The shoulder's four composed illustration presets remain available.
6. If a selected structure is cut away, choose **Reveal uncut** (or **Reveal uncut structure** in the shoulder) to clear the cut and restore its system opacity. **Reset inspection** clears cuts/transparency and returns to perspective. The main view reset also clears inspection.

Controls stack at narrow widths and are keyboard-operable through the existing UI components. Structure lists/search remain alternatives to precise canvas picking. New controls still require hands-on browser, keyboard, assistive-technology and physical-device acceptance checks; automated geometry checks alone do not establish usability.

## What the cutaway does not show

- This clips existing exterior triangles; it does not generate tissue interiors or capped section surfaces. An open edge is an exposed surface-model boundary, not a segmented internal tissue interface.
- It is **not CT, MRI, ultrasound, a patient reconstruction or DICOM synchronisation**. Percent positions are model-relative display controls, not radiological slice indices. The existing imaging event bridge remains a separate future integration contract.
- Unavailable peripheral nerves, plexuses, joint soft tissues and other held source candidates remain absent. Transparency cannot reveal anatomy that has not been imported and validated. See [coverage](FULL_BODY_COVERAGE.md) and [gap register](GAP_FILLING.md).
- Source surfaces and teaching material remain unvalidated. Hatching is illustrative shading, not fibre orientation. Exploded positions are pedagogical, not anatomical.
- Labels whose source anchor is clipped are hidden; labels are not automatically relocated onto new cut edges. Selection information remains available in the panel.
- Transparency is approximate WebGL surface blending and can show sorting artefacts with overlapping surfaces. Use removal/isolation for an unambiguous exposed structure. No volumetric renderer is claimed.

## Practice sessions

The following describes the initial practice milestone. Current naming/sampling, focus-target selection, skip/reveal, retry-missed and shared answer-once behaviour are documented in [targeted practice](PRACTICE.md). The shoulder retains its existing three prompts with the shared answer reducer. Anatomical coverage is now 892 body entries; the 823-entry count above is historical.

Whole-body and regional **Identify** sessions offer 5, 10 or 20 questions, limited by the loaded structures in the current visible scope. The candidate pool uses up to three times the requested number of largest bounding-volume landmarks and shuffles it before selection. This varies sessions without deliberately preferring tiny, inaccessible surfaces; it is not exhaustive or weighted curriculum coverage.

Only loaded source bundles are eligible. Labels, reference ghosts, cutaways, opacity overrides and orthographic mode are suspended during the exercise. Other anatomy is removed to expose candidate surfaces. Feedback identifies the correct target after an answer. Completed sessions show a score and links to re-study each target. Changing side clears the previous result. Results are local to the open explorer and are not persisted in the clinical review database. The shoulder's existing quiz remains separate.

This is formative identification practice, not a validated high-stakes examination. Specialist review of prompts, surface accessibility, laterality and scoring validity remains required.

## Implementation and review provenance

`lib/inspection-state.ts` defines plane/opacity state and scene-axis labels. `lib/inspection-geometry.ts` supplies world-space plane construction, translated clipping, shared opacity updates and picking rules. `app/inspection-controls.tsx` is used by both viewer families. Both surface materials retain their existing illustrative shading and source geometry.

Three.js clips the negative half-space of world-space material planes when local clipping is enabled. Changes to plane position reuse the shader; adding/removing a plane or changing the transparency mode updates the material program. See the official [Three.js material documentation](https://threejs.org/docs/pages/Material.html). Ray intersections are tested separately against these planes because geometric picking is independent of shader visibility; see [Raycaster documentation](https://threejs.org/docs/pages/Raycaster.html).

The same translated planes gate labels and geometric hit testing. Faint (<20%) and removed/isolated ghost surfaces do not intercept clicks. Original-position wireframes use assembled clipping planes and remain non-interactive. Source bounds continue to drive framing; changing the cut slider deliberately does not recentre the view.

Shared inspection code and controls are included in `scripts/review-revisions.mjs`. A production build regenerates shoulder display fingerprints so previous geometry reviews cannot silently remain current after this display change. No reviewer approval is generated by this process.

Text inputs are normalised to LF before hashing so a Windows versus Linux checkout does not itself expire a review. Binary model hashes are unchanged and are still verified against the provenance manifest.

## Reproducible verification

Run `npm run inspection:test`. The test bundles and executes the exact runtime helpers and checks:

- all 12 body scopes, three planes, five cut positions, both retained sides and multiple explode values;
- unchanged signed distances for assembled versus translated structures, including the shoulder's displacement;
- real Three.js ray intersections through clipped geometry and the 20% click-through boundary;
- opacity clamps, selected-structure override, depth writing and shader update behaviour;
- loaded-only, distinct, bounded and varied practice target selection.

The initial run passed **984,199 assertions**. This is deterministic software evidence, not 984,199 clinical checks. Existing anatomy, catalogue, dissection and explode validators also pass with unchanged source hashes. Review tests, dependency audit and production build are separate release checks. No new dependency, font, texture, scan, anatomy dataset or paid API is introduced.

Remaining gates: visual/interactive QA of the new controls, target-device performance and transparency behaviour, keyboard/screen-reader checks, and independent anatomical, radiological and educational review. See [clinical validation](CLINICAL_VALIDATION.md) and [delivery plan](DELIVERY_PLAN.md).

# User-selectable explosion styles

## Use

The selector beside the existing separation slider offers **Spread**, **Extract selected**, and **Tray** in every region, whole body and the dedicated shoulder 3D viewer. It replaces the old Explode label and the regional sidebar's duplicate arrangement buttons; it does not add a permanent panel. Keyboard-accessible Base UI Select uses the already installed component. Coarse-pointer targets are at least 44 CSS pixels high. Small shoulder toolbars wrap the slider row instead of squeezing it out.

- **Spread** retains the previous offsets exactly, including the optional assembled skeleton. Switching back opens assembled at 0%.
- **Extract selected** opens at 100% and moves only the selected visible catalogue entry. Choose another structure to extract that one instead. Other entries return to their original positions. No selection, a removed selection or no remaining context produces no extraction. Bone anchoring is disabled in this mode because a selected bone must be movable.
- **Tray** opens at 100% in a same-scale orthographic arrangement, grouped by system. Drag pans; pinch/wheel and the existing zoom buttons zoom. Choose a standard direction to rearrange the projection. Bone anchoring and original-position overlays are disabled here. The dedicated shoulder now shares the regional tray algorithm.

The same slider controls all modes. **0% always restores source positions**; intermediate translations are reversible but may overlap. Switching styles restores context, normal zoom and preset camera orientation. Re-selecting the current style is a no-op. Saved views retain the style; older bookmarks without it still load as Spread. Starting an exam restores assembled spatial anatomy and disables the style and separation controls. Renderer restart preserves the parent study state.

## Geometry and camera contract

`lib/body-arrangement.ts` exposes shared bounds-only packing and selected extraction. Its `ArrangementItem` accepts source-registered body and shoulder bounds without pretending a shoulder entry is a body catalogue record. Extraction chooses the selected entry's nearer horizontal side in the current standard projection, then moves its conservative source box beyond the remaining visible entries with a size-relative gap. Only the selected ID receives a target. Amounts clamp to 0–100; non-finite values yield zero.

`lib/shoulder-arrangement.ts` unions existing parts by their unchanged structure IDs, retaining the existing inferior crop at y = −3.15. Shoulder Spread retains the original per-structure directions. Tray uses the same two-phase schedule as the body: 0–40 spatial spread, then 40–100 interpolation to the packed target. Compound source groups remain one entry. Geometry is neither scaled, rotated, split, reconstructed nor edited.

Both scenes calculate one offset map and use it for the mesh parent, source-coordinate clipping and camera bounds. The shared label layer obtains the actual world anchor after that translation. Original-position overlays draw only for moved structures and are absent in Tray. In the body, removed ghosts cannot become extraction targets. Faded context remains assembled. Source coordinates, anatomical laterality and future imaging-reference transforms remain unchanged; no display translation is a patient registration.

Only the 100% endpoint guarantees conservative projected entry clearance in its **aligned standard projection**. Intermediate steps, arbitrary orbit angles and surfaces within compound entries can overlap. Extraction is a teaching presentation, not a feasible surgical route, attachment-preserving deformation or biomechanical simulation. Tray is not anatomical positioning. Layer peeling and hinged-opening demonstrations remain separate unvalidated examples and are not accepted production style/bookmark values.

## Evidence and release gates

`npm run explode-styles:test` executes exact helpers, selector value handlers, both explorer transition handlers and both scene entry points using injected React hooks/graphics boundaries and installed Three mathematics. It checks all 1,022 body entries in six regional directions, all nine shoulder entries in three directions, slider bounds, nonselected immobility, source-coordinate cutaways, shoulder tray pair clearance, camera/model offset agreement, saved-view validation, no-selection behaviour and exam guards. Current report: `explode-styles-validation.json` — 375,454 checks, 6,159 extraction cases and 12 scene cases.

Existing arrangement, inspection, labels, study, practice, loading, imaging-contract, renderer/root and isolated review regressions remain applicable. Review fingerprints include the new shared selector, stylesheet and geometry helpers; changing this presentation expires all nine shoulder display reviews without modifying teaching or acquiring imaging approval.

This is CPU/component evidence, not browser pixels, real font metrics, touch, assistive-technology, WebGL/GPU or clinical acceptance. Those checks remain outstanding. Full-repository lint also reports existing vendored component/hook findings; changed application files pass focused lint and type checks. The local route responds successfully. No new model, dataset, texture, font, dependency, fee-bearing API or licence obligation is introduced. Existing DBCLS / BodyParts3D CC BY 4.0 attribution and change notices remain.

Next planned work returns to bounded tendon-parent/thumb-head source adjudication, followed by dedicated-shoulder navigation consistency. The six supporting-source candidates remain withheld; no clinical sign-off is inferred from this display milestone.

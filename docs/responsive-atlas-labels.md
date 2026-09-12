# Responsive Atlas labels — 12 September 2026

Both contained Atlas modules now derive from clean Atlas source `3e1c297abae999015f18c286847dd070d2fe86f6`. Their manifests bind the exact compiled bytes and unchanged source models. The shared implementation also serves standalone regional/full-body viewers in source; it is not evidence that the separate standalone Site has been redeployed.

Labels use the measured canvas rather than the page width. Narrow canvases reserve the centre for anatomy: columns are at most 30% wide, with one name per occupied side on a short canvas and two on a taller canvas. Wider views restore the existing landmark density. The selected name has priority; omitted names remain accessible through tissue selection and search. Text is not shrunk, no extra controls are added, and labels never move to the opposite side merely to fill available space.

Integral width caps match browser box measurements. Names, anatomical IDs, source geometry, explode offsets and clinical content are unchanged. The label group and selected button state now have explicit accessible semantics. Existing exam/fade/cut guards are retained; source review fingerprints update to bind the revised renderer.

## Actual browser sample

- Female pelvis at 390×844: two compact labels replace the previous crowded overlay, visibly leaving the uterine body and tubes unobstructed between them. Selecting the initially omitted cervicovaginal junction through search reveals its full wrapped name. Posterior view moves it to screen-left and the right-tube label to screen-right, following the actual anchors.
- Returning to 1280×720 restores eight pelvic labels without resetting selection. Pressing Enter on the visible ampulla label selects the matching anatomy panel.
- Shoulder at 390×844: Scapula and Proximal humerus fit in compact side columns. At 100% separation their leaders remain attached to the displaced structures. Reset returns to 0%.
- Shoulder identification exam hides the labels. Escape dismisses the practice drawer; Exit exam restores the names and dissection controls. No clinical record, real patient or scored credential was created.

These are actual local browser/GPU checks, not screenshots generated from an interface mockup. Numeric tests additionally cover 98,112 camera projections, 12,871 layouts and exact component frame/DOM wiring with injected hooks; these counts do not imply equivalent physical-device or clinical testing. Atlas and website build/type checks and exact exported-file tests are recorded in the dated coordinating checkpoint.

## Still open

Physical touch-device and assistive-technology coverage, 200% text testing with real fonts, cross-browser performance and radiologist review remain required. Extremely long/enlarged names can still exceed a tiny canvas; fit limits and offscreen-anchor checks remain honest. The prior unattributed MutationObserver console error and Three.Clock deprecation were not resolved by this label change. Independent Didanix case/lecture access and public-media release gates are unchanged. No package, font, model, texture, paid provider or patient file was added.

Exact source/GitHub/D/private-deployment evidence: main coordinating task `work/RESPONSIVE-LABEL-CHECKPOINT-20260912.md`. Keep the preceding incremental recovery chain.

# Hepatobiliary surface orientation — draft Guided learning

Four stops use only the existing liver, gallbladder, cystic duct and source-labelled common hepatic duct selections. The gallbladder keeps its historical `pelvis` ID and `pelvis-organs` bundle; its authoritative catalogue `regions` membership is abdomen. No geometry, source identity, control, image or new selectable structure is introduced.

The sequence begins with a liver overview, turns to the gallbladder beneath it, then frames the two small duct surfaces closely for comparison. Every stop supplies an explicit camera frame containing its selected target. The existing player supplies the 1,800 ms quintic-orbit transition and zero separation; each stop lasts 14,000 ms and fades other surfaces.

The short captions are original teaching prose based on factual anatomy in [TTUHSC El Paso's liver tables](https://anatomy.ttuhscep.edu/schemes/liver_tables.html). No table text, diagram or other media is copied. The right and left hepatic ducts, common bile duct, ampulla and duodenal papilla are not separately selectable in this tour. These exterior source segments do not establish a complete tree, exact junctions, patent lumen, continuity, duct diameter, stones, flow, operative safety plane or patient registration. The source-labelled common hepatic duct retains its full unsplit extent pending boundary review.

This remains draft teaching requiring revision-bound radiologist sign-off. Atlas, cases and lectures retain independent access. The local regression is `node scripts/test-hepatobiliary-tour.mjs`; run it after registering the tour in `lib/regional-tours.ts` and integrating shared Review pins and renderer revision. It checks the exact prior tour epoch and source integrity, then compares live Review material and refuses stale synthetic decisions before storage. Its pass is source/transport evidence, not visual or clinical approval.

## Review and verification boundaries

Review the compound liver extent, gallbladder position, full unsplit common-hepatic-duct source boundary, selected duct identities and all four captions/frames. Confirm visibility and framing on the actual desktop learner, including the inferior view and small duct close-ups. Test camera flow separately: a controlled player test verifies the existing 1,800 ms transition contract, not perceived smoothness or GPU rendering. No clinical sign-off is inferred from these tests.

Ten older tour validators retain their original counts/goldens by replaying the three shared tour/Review data files from pre-batch commit `aa290176f8bfdb02157f7197e4647508c9c41d87`. This is historical data replay, not a full old application or current acceptance. The new tour test independently preserves all 25 prior tour definitions, 146 stops and 9,936 topic placements against that checkpoint. The current player/library/Review tests exercise the new 26-tour state.

At this milestone, eight historical validators passed. Pelvic-ring and Circle of Willis retained non-passing byte comparisons for an earlier `app/fitted-camera.tsx` golden. The original failed logs remain in the milestone evidence; that historical run must not be reported as entirely passing.

## Historical camera comparison correction — 3 October

Both older camera goldens predate the independently saved keyboard-interruption
fix `5ee900136898121566377a4d0abd3e509d5699d0`. Its only three added lines cancel
an active guided sweep before capturing manual keyboard rotation. Current camera
bytes match that saved fix exactly. The test-only transition helper preserves
the original baseline/hash, proves this precise diff and refuses every other
camera change, rollback or foreign baseline. Current camera behaviour tests remain
separate; historical teaching replay does not establish live GPU acceptance.

The Circle of Willis package golden also predates 14 test-only aliases and the
keyboard-interruption test extension. Its original complete package/hash remains
checked. Only the exact saved `182a60bd` package epoch is admitted; all dependencies,
engines, other fields and original commands are preserved. No production source,
camera, package, model, teaching, licence, review pin or patient data is changed
by this validator correction. Original failures remain retained; current rerun
evidence is separate from the earlier milestone.

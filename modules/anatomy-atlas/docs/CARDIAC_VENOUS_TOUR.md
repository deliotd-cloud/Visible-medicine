# Cardiac veins: around the heart

Source-bound guided-learning draft, 8 October 2026. Four stops extend the existing Thorax and Whole-body Guided learning selectors without a new toolbar or pop-out. Exact source baseline: `ee6647564d871ebc86fa81c44c87718feb178567`.

## Sequence and scope

1. Anterior cardiac vein group, anterior view.
2. Great cardiac vein, left view.
3. Middle cardiac vein, posterior view.
4. Anterior overview comparing the three source selections.

The existing root heart stays faded context. The first three stops frame the selected vein tightly, not the whole heart; the overview restores the four-structure frame. Existing quintic-orbit 1,800 ms camera transitions, pause, readiness, reduced-motion and exit/restore behaviour are reused. Durations are 14 seconds per stop. This is an orientation sequence, not venous flow or a procedural path.

The four full catalogue records, original frame, source hashes and three bundles are pinned in `content/cardiac-venous-tour-pins.json`. All bundle bytes remain unchanged. The anterior selection has two source files and the middle selection fourteen; neither count identifies individual tributaries. Root IDs are used, not nested coronary-sinus or small-vein children. Those structures, atrial openings and continuous lumens are not demonstrated by this sequence. Faded exterior heart context is not a chamber segmentation.

## References and rights

The [TTUHSC El Paso thoracic-vein anatomy table](https://anatomy.ttuhscep.edu/anatomytables/veins_thorax.html), accessed 8 October 2026, supports the usual anterior/direct-atrial versus coronary-sinus drainage distinction and great/middle-vein orientation. Captions are brief original factual summaries; the protected table, wording, images and diagrams are not copied. Publication access is not redistribution permission. Existing BodyParts3D CC BY 4.0 attribution, modification notices, geometry holds and source licences remain unchanged. No assets, dependencies, fonts, textures, services or fees are added.

The common source frame and source identity do not establish clinical accuracy, patient registration, patency, drainage territory or a safe catheter route. These drafts require the owner's exact-revision anatomical/clinical review. No earlier arterial tour approval applies to this sequence.

## Validation and handoff

`node scripts/pin-cardiac-venous-tour.mjs --check` verifies four full identities and exact bundle bytes. `node scripts/test-cardiac-venous-tour.mjs` compares the unchanged earlier 33 tours against the actual parent registry and tests current admission, frames, all 9,936 unchanged topic placements, four updated review worksheets, 1,100 preserved worksheets and altered/stale packet refusal. Its prior-registry comparison retains the current renderer fingerprint deliberately; it is not a claim that a new renderer has the historical renderer identity.

The real React tour-player harness covers four targets/views, exact captions, readiness, pause, reduced motion and exit. The Whole-body selector suite covers the new choice in both Whole body and Thorax. Existing lower-arterial and host restore checks retain their assertions; only total tour/stop counts advance to 34/202. Shared content, Review, decisions, renderer, inventory, TypeScript and current requirement audit are checked separately. Renderer fingerprints are regenerated conservatively; no model bytes or approval records change. A stale display-pin refusal before regeneration and the old three-tour Thorax expectation are retained in the E logs, not suppressed.

Final source checks pass: 53 source/tour refusals, 20 altered review-packet refusals, all 53 player cases, whole-body picker, camera transitions, existing lower-arterial compatibility, host restore, content/Review/decisions/renderer/inventory/types and the current requirement audit. The isolated regional build on E passes with the existing large-chunk warnings. The read-only worker found no material caption/admission problem; its fine-vessel framing concern led to the tighter first-three-stop bounds above. This is engineering review, not clinical sign-off.

Evidence and scoped source-only same-machine recovery: `E:/VisibleMedicine-LocalStaging/20261008-cardiac-venous-tour/saved-state.json`. The isolated E regional build is for the next generated website import; it is not public deployment. **The website learner and protected Clinical Review must be imported together next.** No hand edits to generated modules. Actual desktop visual framing/GPU acceptance and native-image/real-account/clinical review remain separate; software tests do not prove fine-vessel readability. Keep all source scans/masks and the desktop clinical PACS untouched. Main website preview29202/3000 and historical3001 remain unchanged in this source batch. The full roadmap stays active; next generated integration should not repeat the completed source work.

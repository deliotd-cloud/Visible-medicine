# Pharyngeal constrictor CT/MRI orientation

Eight draft topic placements cover the existing left/right superior and
inferior constrictor selections (FMA46631/46632/46635/46636). CT teaching
compares upper pterygoid/mandibular and lower laryngeal-cartilage levels;
MRI teaching relates the pharyngeal wall to lumen and neighbouring muscle
across acquired levels. These are notes in the existing modality tabs,
not new scan packages, automatic segmentation or extra viewer controls.

## Sources and clinical limits

- [TTUHSC El Paso larynx table](https://anatomy.ttuhscep.edu/schemes/larynx_tables.html): anatomical attachments.
- [Mazzola et al., CT constrictor definition](https://pmc.ncbi.nlm.nih.gov/articles/PMC4243212/): Table 2, cross-sectional landmarks.
- [Eisbruch et al., original MRI study](https://pmc.ncbi.nlm.nih.gov/articles/PMC2787803/): acquisition-specific T1/T2 constrictor delineation.

References checked on 8 October 2026. Direct PMC opens encountered a browser
challenge; indexed full-text sections were read instead. Original wording only;
no article media, patient images, tables or contours imported. The oncology
studies' contour conventions do not establish normal fine boundaries or signal
thresholds for routine scans. No dose/treatment recommendations are supplied.

The middle constrictor remains absent, and cricopharyngeus is not independently
segmented. Static exterior models do not establish swallowing, sphincter function,
fibre attachments or patient-space registration. The four changed teaching
packets require new revision-bound radiologist review, not inherited approval.

## Verification and handoff

Parent Atlas: `12ae0c258cdf64fb7449385b0a8cd7918e97edeb`.
Existing full-record pins are reused; similar names or FMA IDs cannot bypass
source identity checks. `npm run pharyngeal-constrictor-imaging:test` compares
all 9,936 topic placements with that parent, exercises eight actual note render
callbacks, rejects 64 modified source identities and rejects stale/altered Review
packets. Geometry, dissection recipes and unrelated topics must remain unchanged.

The earlier chest-wall transition retains non-target assertions at its completed
source epoch; its actual questions, rendering and Review rejection still exercise
current code. The new imaging suite separately checks all current non-target
placements. Initial stale generated Review pins and missing imaging-only render
test dependencies were corrected; original failed logs are retained as evidence.

Evidence and scoped source recovery:
`E:/VisibleMedicine-LocalStaging/20261008-pharyngeal-imaging`.
This is source-only until the generated regional learner and protected website
Review are imported together. Website preview and accepted CT/MRI masks are
unchanged. No new browser/GPU/native-image, signed-in or clinical acceptance is
claimed. Next: paired website import; full roadmap remains active.

# Shoulder arterial CT/CTA orientation drafts

27 September 2026. Eight existing right/left surface selections receive CT-only
teaching: anterior and posterior circumflex humeral, circumflex scapular and
thoracodorsal arteries. This is reference-anatomy teaching, not an imaging dataset
or a segmentation/registration change. All material remains unapproved draft.

## Evidence and scope

- [TTUHSC El Paso upper-limb arteries](https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html): anatomical origin/course facts.
- [ACR/RSNA CTA explanation](https://www.radiologyinfo.org/en/info/angioct): contrast-acquisition context.
- [Barrett et al., 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC8926423/): CTA study of subscapular-system branching, including observed variants and distal measurement limitations. Its results are not extended to diagnostic accuracy of the humeral branches.

Copyrighted references are used for concise original factual summaries only;
no article/table/figure/scan/dataset is copied or relicensed. No new dependency,
font, texture, service or asset. Existing model licences and source holds remain.

## Identity and regression gates

`content/shoulder-arterial-ct-pins.json` records complete source identities,
bundle bytes/hashes, coordinates and prior lessons from Atlas `b3995e7`.
The runtime matcher fails closed on altered identity, components, metadata or
wrong topics. Paired sides remain distinct; multi-component arteries remain
single selections. Neither geometry nor other teaching tabs are changed.

`node scripts/test-shoulder-arterial-ct.mjs` verifies the eight placements, all
other topics, actual teaching renderer, review packets and immutable historical
replay. `--record` is a one-time transition authoring command, not a test bypass.

## Radiologist review still required

Confirm each side, source extent and named relationship in the assembled model;
review the educational wording and acquisition limits. Match approved patient
studies separately before any imaging correlation is released. A mesh does not
prove lumen continuity, perfusion, positional compression or flap suitability.
No patient-specific measurements, diagnostic performance claims, surgical
recommendations or clinical approvals are supplied. Atlas, case and lecture
entitlements remain independent. Desktop PACS and CT-head masks are untouched.

## Verification at this checkpoint

- Focused suite: eight CT placements, 9,928 untouched topic snapshots, 706
  malformed-identity rejections and eight actual teaching-callback SSR renders.
- Historical replay: seven prior thoracic questions restored, 9,929 other
  historical topics unchanged; 29 unrecorded/mixed edits rejected.
- Broad content contract: 33,460 checks passed. Clinical Review: 1,104
  selections, 9,936 topic snapshots and 283 rendered states passed.
- TypeScript and regional production build passed; existing large-chunk warning
  remains. Review and renderer fingerprints regenerated through their scripts.
- Actual 375px touch preview: search-selected right posterior circumflex humeral
  and left thoracodorsal arteries; new CT notes/references display, CT/MRI
  switching works, absent thoracodorsal MRI remains pending, no page-width overflow.

These are source/local-preview results, not website import, deployment or clinical
approval. Next deliver the same revision to website learner and protected review.

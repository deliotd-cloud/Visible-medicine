# Thoraco-acromial question coverage

Four original question groups replace identification-only Quiz notes for eight
existing left/right source selections: thoraco-acromial trunks and pectoral,
acromial and deltoid branches. The questions concern typical anatomy, not
measured perfusion, patency, complete branching or patient-specific findings.
The source lacks a separately admitted clavicular branch here; this batch does
not create one or imply the arterial tree is complete.

## Factual references and rights

- [TTUHSC upper-limb arteries](https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html): usual axillary second-part origin.
- [Pandey et al., 1991](https://pubmed.ncbi.nlm.nih.gov/1746231/): pectoral branch contribution to pectoralis major; other arterial supplies also exist.
- [Elsevier acromial branch reference](https://www.elsevier.com/resources/anatomy/cardiovascular-system/arteries/acromial-branch-of-thoracoacromial-artery/23364): described course near the coracoid, deep to deltoid.
- [Hue et al., 1998](https://pubmed.ncbi.nlm.nih.gov/9706673/): deltoid-branch supply to the anterior deltoid in a cadaveric anatomical study.

References were inspected on 9 October 2026. Questions, distractors and
explanations use original wording. No publisher prose, illustrations, tables,
exam items or model assets are imported. Citations support facts, not commercial
redistribution of the referenced publications or images. Existing model licences
and attribution stay in force. These drafts need radiologist review.

## Source and verification contract

Baseline: `894c899f194b143c3ef6260f88e017296917649f`. New independent pins
retain complete source identities, previous lessons, bundle byte lengths and
SHA-256 values. Existing quiz and imaging pin files are not changed. Only the
eight Quiz-note placements may differ from that baseline; geometry, all other
topics, guided sequences and independent access rules must remain unchanged.

Run `node scripts/body-renderer-revisions.mjs`, then
`node scripts/generate-body-review-display-pins.mjs` before
`npm run thoracoacromial-quiz:test`. Both renderer and displayed-teaching
evidence must be current. The focused test covers learner component rendering and answer
interactions, source refusals, unchanged non-target content, and stale Review
packet rejection. Automated success is not clinical approval or browser/GPU
acceptance. Source completion alone does not update the website; regenerate and
import the learner module and corresponding protected Review together.

Evidence and scoped same-machine source recovery:
`E:/VisibleMedicine-LocalStaging/20261009-thoracoacromial-quiz/`.

The focused integrated validator passes: eight changed placements, 9,928
preserved placements, 96 altered-source refusals and four correct/wrong/reset
component interaction cycles. Current Review packets parse; predecessor and
tampered packets do not. All four answer positions are used. The first
integrated run correctly refused stale display evidence; regenerating the
eight affected display pins resolved that refusal without weakening the gate.
The immutable pin-record hash is
`c19b618353c81b3c620f43ea7e527f059e6b30070b2cfb0ffed318c31d9396fd`.

This checkpoint is source-only. The existing website preview does not yet
contain this batch. Next, deliver the generated learner module and protected
Review together, then verify the displayed questions in the local browser.
Clinical acceptance, browser/GPU acceptance, public publication and off-device
backup are not established by these source checks.

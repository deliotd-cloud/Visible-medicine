# Shoulder and upper-arm muscle X-ray orientation

Sixteen existing root-body selections gain concise X-ray drafts in Shoulder/arm
and Whole body: bilateral clavicular, acromial and spinal deltoid parts, both
biceps heads and all three triceps heads. These are teaching about projection
and bony relationships, not reconstructed radiographs or routine visibility of
individual muscle borders. The separate nine-structure shoulder pilot is not
relabelled or expanded by this batch.

Complete source identities are retained from two existing pin sets. Twelve come
from `content/shoulder-arm-muscle-imaging-pins.json`; the three right deltoid parts
and right long-head biceps use `content/upper-limb-motor-pins.json`. The source
files, sides and original geometry are unchanged. This does not infer a missing
contralateral surface or accept a new source. `shoulderMuscleXrayLesson` rejects
other topics and complete-record drift, rather than binding a similar name.

The notes distinguish deltoid origins, coracoid versus superior-glenoid biceps
origins, radial biceps attachment and the ulnar triceps extensor apparatus.
Plain-film findings cannot establish head-specific tendon continuity. Deltoid
insertion-variant evidence cannot classify a lesion merely by location; triceps
case/cohort observations are not a normal-population detection rate or a
plain-film head/depth classification. No diagnosis or treatment advice is added.

## Factual reading references

- [Texas Tech upper-limb muscle table](https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html): anatomical facts; no table or illustrations copied.
- [Morgan et al., 2001](https://pubmed.ncbi.nlm.nih.gov/11587519/): five selected patients with deltoid-insertion cortical variants, not a rule for all cortical abnormalities.
- [Weber et al., 2021](https://pubmed.ncbi.nlm.nih.gov/33815751/), [full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC8007176/): three traumatic triceps cases; radiographic appearances do not establish absence of tendon injury.
- [Lee et al., 2021](https://pubmed.ncbi.nlm.nih.gov/33181575/): selected traumatic distal-triceps cohort with MRI and operative comparison, not plain-film diagnosis of the individual selected head.
- [ACR chronic shoulder pain update](https://pubmed.ncbi.nlm.nih.gov/37236752/): contextual initial-radiograph/further-imaging distinction, not an acquisition prescription for a learner.

All prose is original project teaching. No publication figure, image, table,
scan, measurement dataset or media is imported or relicensed. Existing
BodyParts3D credits/CC BY 4.0 obligations remain; no new package, font, service,
mandatory fee, model, mask or patient data is introduced.

## Validation and delivery

`npm run shoulder-muscle-xray:test` replays the immutable introduction against
its baseline, with exact identities, unchanged topics/tours/geometry and
synthetic stale/forged Review submission checks. Before the introduction is
committed, the coordinator uses the explicit `--working-transition` mode.
Normal regional teaching, renderer/display binding and website import pipelines
must regenerate delivery. Generated website copies must not be edited by hand.

Draft teaching requires the radiologist's source- and revision-bound review.
Passing synthetic tests does not establish anatomical, browser/device, clinical,
privacy or publication acceptance. No approval is transferred, no scan is
spatially registered, and Atlas/case/paid-lecture entitlements remain independent.

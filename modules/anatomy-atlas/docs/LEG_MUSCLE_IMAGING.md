# Lower-leg muscle imaging drafts

13 September 2026. Fourteen concepts across 28 existing bilateral BodyParts3D
selections receive 112 previously pending CT, MRI, ultrasound and X-ray topic
placements. This is introductory, structure-specific imaging orientation, not
complete imaging teaching or clinical acceptance. The regional and whole-body
explorers use their existing contextual panels; no new navigation is added.

## Coverage and use

Tibialis anterior/posterior; extensor hallucis/digitorum longus; fibularis longus,
brevis and tertius; flexor hallucis/digitorum longus; popliteus; plantaris; soleus;
and the medial/lateral gastrocnemius heads. Select these in `/regions/leg` or
the root-body explorer and open the relevant imaging tab. Prior Anatomy,
Function, Clinical, Pathology and Quiz content remains unchanged.

The notes distinguish distal toe targets, anterior versus retromalleolar tendon
courses, fibularis tertius versus the lateral pair, the popliteus femoral groove,
the gastrocnemius bursal/fabella landmarks and separate calf-muscle assessment.
CT/X-ray teaching deliberately uses bone landmarks without inventing muscle
signal or detailed plain-film tendon visibility. MRI orientation derived from
anatomical/ultrasound landmarks is a cross-modality teaching synthesis, not
patient registration or an acquired MRI finding.

`content/leg-muscle-imaging.ts` contains the original notes and seven reading
references. `lib/leg-muscle-imaging.ts` accepts the exact pinned source record,
including side, source hashes, name, bounds and bundle; an FMA/name match alone
cannot bind these lessons to another specimen. Every new lesson remains
`draft`, with the existing **No imaging study loaded** state and a review note.

The website's `/atlas/lower-limb-3d` is a different Universiti Malaya CC0
specimen. It has not automatically received these BodyParts3D notes. Any reuse
needs explicit source-specific binding and review, not a donor-equivalence
claim. The shared website plan is updated without regenerating its three pilots.

## Verified scope

Baseline source: `f26c886ce1fec191d5fff7b5a42001ce9813c747`.

- `node scripts/validate-leg-muscle-imaging.mjs`: 112 actual React note-callback
  server renders, including all bullets and citation links; 1,680 altered-source
  topic rejections; 1,101 current schema records; two unchanged GLB byte hashes;
  all 9,797 other body topic placements, shoulder teaching and recipes preserved.
- `node scripts/validate-thigh-muscle-imaging.mjs`: the previous thigh milestone
  still passes after exact offline removal of this newer addition.
- `node scripts/validate-content-contract.mjs`: 33,444 historical contract
  checks pass; these historical counts are not the current catalogue size.
- TypeScript and the production build pass. All 133 existing compressed model
  deliveries retain their source bytes and decoded scenes. Large-chunk warnings
  remain; this is not a performance acceptance claim.
- Shoulder review safeguards: 235 checks and 16 display-history negative cases.
  Current body decisions: 1,101 contexts and 3,303 tracks using actual SQLite
  test fixtures; no production review database was changed.

The new pins save all prior pending lessons before the resolver is installed.
The transition hashes and offline history reconstruction reject unrecorded
teaching changes; historical golden hashes are not replaced. The current body
renderer fingerprint advances to
`255ae0522bba380f441855f75a15027113ce2b0e0386d1441d3700ad8220f873`
(462 input files). Old approvals are not migrated.

This milestone does not claim browser/device acceptance: the panel evidence is
actual source-callback server rendering, not a WebGL interaction test. Findings
and source-word accounting are retained in `leg-muscle-imaging-validation.json`.

## References and commercial-use boundary

References checked 13 September 2026:

- [TTUHSC lower-limb anatomy](https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html)
- [ESSR ankle ultrasound](https://essr.org/content-essr/uploads/2016/10/ankle.pdf)
- [ESSR knee ultrasound](https://essr.org/content-essr/uploads/2016/10/knee.pdf)
- [Gopinath et al., plantaris MRI cases (2012)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3352606/)
- [RSNA/ACR musculoskeletal MRI](https://www.radiologyinfo.org/en/info/muscmr)
- [RSNA/ACR musculoskeletal ultrasound](https://www.radiologyinfo.org/en/info/musculous)
- [RSNA/ACR bone radiography](https://www.radiologyinfo.org/en/info/bonerad)

These are links supporting short original factual synthesis, not imported
articles, diagrams, images, tables or clinical datasets. No new model, texture,
font, package, API or mandatory service is added. Source rights remain separate
from the original MIT notes/code and existing BodyParts3D CC BY 4.0 notices.
The plantaris paper is a two-case report, not population-level diagnostic
performance evidence. No percentages, grading rule or treatment protocol are
imported. Reference access does not authorize future image redistribution.

## Remaining radiologist and integration review

Confirm each exact source selection, side and anatomical landmark; check the
retromalleolar courses, digit targets, proximal popliteus and calf relationships.
Review the modality synthesis and pitfalls against appropriate acquired cases.
Assess actual panel readability and field-of-view coverage. The muscle meshes
do not segment all tendon slips, sheaths, retinacula or internal aponeuroses;
source presence is not evidence of universal patient anatomy.

Clinical approval must name the reviewed source/content revision and scope.
Keep original scans/masks local. Link only cleared, versioned Didanix Education
resources, with independent case/Atlas/lecture rights and validated spatial
mapping where required. Foot imaging and other regional gaps remain next;
neither this regional milestone nor the passing tests completes the Atlas.

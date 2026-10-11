# Abdominal arterial X-ray orientation

Four existing abdomen selections gain original angiographic-orientation drafts:
abdominal aorta (FMA3789), coeliac trunk (FMA50737), superior mesenteric artery
(FMA14749), and inferior mesenteric artery (FMA14750).

The resolver reuses the unchanged central-vessel identity pins, checks the entire
source identity, and respects the exact audited coeliac display correction.
Only the X-ray tab changes. These are educational drafts, not acquired images,
diagnostic guidance, validated patient-space relationships or clinical approval.
Plain radiographs, catheter angiography, CT angiography and MR angiography are
explicitly distinguished. Existing source limitations and independent case,
Atlas and lecture entitlements remain intact.

## Reference and licensing scope

- [ACR/RSNA catheter angiography overview](https://www.radiologyinfo.org/en/info/angiocath): modality distinction.
- [UAMS abdominal artery table](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-abdomen/): broad origins and named branches, paraphrased briefly.
- [Glück et al., 1983](https://pubmed.ncbi.nlm.nih.gov/6407931/): aortographic origin/course variation; no procedural recommendations or numerical thresholds imported.
- [Mesenteric MR/conventional angiography comparison](https://pubmed.ncbi.nlm.nih.gov/11724043/): conventional depiction in the study cohort, not a universal visibility or performance claim.

Reading links do not grant reuse rights to source publications. No article text,
figures, scans, datasets, fonts, geometry, textures or dependencies are imported.
The new prose is original; existing model attribution and licence notices remain
unchanged. No new service or mandatory fee is introduced.

## Verification and review

`npm run abdominal-arterial-xray:test` compares all 9,936 root-body lesson
placements and all 1,104 Review packets with source commit
`ba8008b6d1ac8c49aa551c2bf9995e80cc52997f`. It requires exactly four pending-to-draft
transitions, preservation of every other topic and source identity, rejection of
altered identity fields and stale teaching decisions, and defensive result copies.
Regenerate display pins through the existing generator before this check.

Clinical review must evaluate the exact new lesson revision and its cited scope;
old teaching decisions cannot approve it. Actual acquired-image acceptance,
patient registration and publication clearance remain separate. Source completion
alone does not establish that the generated website runtime has been updated.

The accompanying normal fingerprint regeneration also repairs the shoulder
display fingerprint for already-committed `app/imaging-link.tsx` (commit
`36dc97d2`), which still carried an older hash. Its normalized working and Git
bytes are identical. The shoulder export is regenerated to match that fingerprint;
no shoulder source, mesh or teaching text is changed. This conservative metadata
refresh does not migrate or create approval decisions.

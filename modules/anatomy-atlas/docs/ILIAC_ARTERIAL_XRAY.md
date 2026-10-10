# Iliac arterial X-ray orientation drafts

10 October 2026. Six existing root selections receive three paired-artery teaching
texts in their X-ray tab. These are angiographic orientation drafts, not added
angiograms, procedural guidance or a patient-specific vascular reconstruction.

## Exact source scope

Reuse `content/iliac-arterial-imaging-pins.json` without modification: common iliac
FMA14765/14766 (FJ3565/3464), external iliac FMA18806/18807 (FJ3567/3466), internal
iliac FMA18809/18810 (FJ3569/3468). Complete identities, laterality, source files,
frame and existing pelvis-vessels-recovery bundle must match. No new geometry.
Only six previously pending X-ray topics change; existing CT/MRI/Ultrasound and
all other teaching remain intact. The dated original iliac imaging milestone's
pending-X-ray statement is superseded for these six selections only.

## Evidence and reuse

- [TTUHSC thigh anatomy](https://anatomy.ttuhscep.edu/musculoskeletal_system/thigh_tables.html): common/external iliac course and femoral continuation; original summaries, no table reproduction.
- [ACR/RSNA catheter angiography](https://www.radiologyinfo.org/en/info/angiocath): contrast X-ray depiction of vessels, including the pelvis; distinguish CT/MR angiography and routine radiography. No technique or preparation instructions reproduced.
- [Takahashi et al., 1984](https://pubmed.ncbi.nlm.nih.gov/6362766/): historical iliac/subclavian DSA research. Supports imaging use only, not present-day performance or diagnostic thresholds.
- [Bilhim et al., 2011](https://pubmed.ncbi.nlm.nih.gov/20798937/): male pelvic branching study using angiographic modalities. Cohort and variation limits retained; no universal branch map or procedural target asserted.

Primary abstracts were retrieved through indexed PubMed records after direct
pages returned a challenge/empty extraction; no challenge bypass. Factual reading
does not grant media rights. No publisher text, image or dataset is bundled.
Existing geometry licences/attribution remain unchanged; original code/prose MIT.

## Validation and clinical review

`npm run iliac-arterial-xray:test` covers exact selected identities, defensive
copies, six pending-to-draft transitions, unrelated topic/source preservation and
rejection of stale/forged Review material. Default content/Review/display and
renderer checks remain required. Source tests do not prove browser acceptance.

The radiologist must review course, side labelling, variants, teaching usefulness
and imaging applicability against this revision. Model surface, lumen, branches,
patency and patient projection are distinct. No clinical approval, acquired
study, registration or independent case/lecture access grant is created.

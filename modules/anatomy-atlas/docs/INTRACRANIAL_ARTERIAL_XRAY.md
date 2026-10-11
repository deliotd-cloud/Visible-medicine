# Intracranial catheter angiography teaching draft

Twelve existing Head and neck selections now have original X-ray teaching for
catheter angiography. Open a selection in Whole body or Head and neck, then
choose X-ray. These are orientation drafts, not acquired angiograms, a change
to the approved CT/MRI head masks, or patient-space synchronization.

## Structures and source limits

| Selection | Retained source limit |
| --- | --- |
| Paired ACA | No separately selectable A1/A2, cortical or perforator segments or territories |
| ACom | No proven complete donor circle, collateral adequacy, patency or flow direction |
| Paired PCA | Nine original parts per selection; no assigned fetal-type configuration |
| Paired PCom | Surface appearance does not establish patency or collateral function |
| Right MCA | Three PART-OF files, six components; no inferred M1/M2 or mirrored left counterpart |
| Paired PICA | Thirteen files, fourteen components per side; disconnected pieces retained |
| Paired SCA | Original proximal midline crossing and named laterality retained without fitting |

The separately sourced left MCA and its teaching remain independent. The new
resolver reuses seven full identities from `cerebral-arterial-quiz-pins.json`
and five from the retained cranial-arteries catalogue. It refuses a changed ID,
side, region, source hash, bounds, provenance or other identity field. No model,
surface, source coordinate, camera path or branch is added or repositioned.

## Evidence and commercial use

Usual branch relationships are supported by UTHealth's
[internal carotid laboratory](https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p06_index.html)
and [vertebrobasilar laboratory](https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p07_index.html).
The [ACR and RSNA catheter angiography explanation](https://www.radiologyinfo.org/en/info/angiocath)
supports the distinction between catheter X-ray, CT and MR angiography.
The lessons distinguish these from plain skull radiography and from this
static reference model; they do not prescribe catheter routes or thresholds.

[Eaton et al. 2020](https://pubmed.ncbi.nlm.nih.gov/32166198/) retrospectively
assessed circle-of-Willis configuration in 274 patients undergoing cerebral
angiography. Its referred cohort and branch classification do not establish
normal-population prevalence or this donor's functional collateral circulation.
Only that bounded abstract-level finding is used; no results beyond the
accessible source are inferred.

All wording is original factual teaching with reading links. No figures,
angiograms, institutional prose, tables or datasets are imported or relicensed.
Publisher and institutional rights remain with their owners. RadiologyInfo
expressly encourages linking rather than copying. Existing BodyParts3D CC BY
4.0 attribution is retained; application code and original wording retain the
project MIT terms. No new asset, font, dependency, paid service or fee is added.

## Radiologist review

Review the twelve teaching packets in protected Clinical Review against the
exact integrated Atlas revision. Check laterality, parent relationships,
modality terminology, source limitations and the clinical wording. Drafts are
not approved by source citations or passing tests. An earlier teaching decision
must not be applied to the changed packet; source/geometry decisions keep their
separate scope. Atlas, imaging-case and paid-lecture access remain independent.

Actual representative angiograms, cleared imaging links, patient registration,
signed-in acceptance and final clinical/release decisions remain separate gates.
No scans, masks, private data or desktop clinical PACS files are changed.

## Focused verification

Run `npm run intracranial-arterial-xray:test`. Its whole-catalogue comparison
uses baseline `aa7437abd793a0c2dac7260555097204864cf45c`, then replays the exact
feature commit once committed. The intended transition is twelve pending X-ray
placements to draft, with every other placement, source bundle and unrelated
Review packet preserved. Identity mutations and stale or forged decisions must
be refused before storage. This is source and Review evidence, not browser,
angiographic visibility or clinical acceptance.

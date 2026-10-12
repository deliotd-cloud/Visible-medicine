# Pancreatic arterial X-ray teaching

Nine retained abdominal arterial selections now have draft orientation notes
for comparison with contrast angiography. They appear through the existing
regional and whole-body teaching panel and protected Review, without new
toolbar controls. They do not supply angiograms, acquired-image mappings or
patient-space registration. Other teaching tabs, tours, questions, meshes and
source labels remain unchanged.

## Retained selections

| Selection | FMA | Source object |
| --- | --- | --- |
| Anterior superior pancreaticoduodenal artery | 14782 | FJ3409 |
| Posterior superior pancreaticoduodenal artery | 14784 | FJ3557 |
| Inferior pancreaticoduodenal artery | 14805 | FJ3446 |
| Anterior inferior pancreaticoduodenal artery | 70479 | FJ3401 |
| Posterior inferior pancreaticoduodenal artery | 70480 | FJ3546 |
| Dorsal pancreatic artery | 14787 | FJ3430 |
| Inferior pancreatic artery | 14790 | FJ3444 |
| Great pancreatic artery | 14792 | FJ3433 |
| Caudal pancreatic artery | 14793 | FJ3419 |

All nine retain unspecified source laterality and the
`abdomen-vessels-visceral-detail` bundle. The entire source identity in
`content/abdominal-arterial-pins.json` binds each lesson, including hashes,
bounds, anchors and validation status. Matching a name or FMA alone is
insufficient. Anatomical anterior/posterior directions and tail location do
not authorize changing these labels to patient-side annotations.

## Teaching and evidence

The [UAMS abdominal artery table](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-abdomen/)
provides usual branch relationships; the
[ACR/RSNA explanation](https://www.radiologyinfo.org/en/info/angiocath)
distinguishes catheter X-ray angiography from CT and MR angiography.

[Kulenović and Sarač-Hadžihalilović](https://pmc.ncbi.nlm.nih.gov/articles/PMC5596604/)
describe selective arteriography in 39 patients. Their examples and variable
visibility do not establish that every branch will be seen or that a model
surface proves a patent communication.
[Okahara et al.](https://pubmed.ncbi.nlm.nih.gov/19777288/)
describe 226 selective angiographic and CT-during-selective-arteriography
examinations. That acquisition must not be presented as routine intravenous
CTA validation; claims here stay within the accessible abstract.

The [dual-energy CT study](https://pmc.ncbi.nlm.nih.gov/articles/PMC8816990/)
assessed 100 patients without pancreatic disease, with exclusions for important
vascular or acquisition limitations. Its variant and visualization observations
are CT evidence, not catheter DSA detection rates. No percentages, acquisition
prescriptions, diagnostic cut-offs or treatment recommendations are transferred
to these lessons. Original prose and reading links are not publication-media
imports; see `LICENSES/THIRD_PARTY_NOTICES.md`.

## Clinical review

Review the nine exact revised worksheets for terminology, parent-versus-branch
distinctions, anterior/posterior arcade orientation, variable origins and
visibility caveats. In particular, inferior pancreatic and inferior
pancreaticoduodenal artery must remain distinct. Great pancreatic/pancreatica
magna is a naming comparison, not permission to merge surfaces. A transverse
pathway named in another publication must not silently rename FMA14790.

Assess the assembled meshes separately for fidelity and continuity. Reference
surface contact, an exploded gap or angiographic filling cannot establish a
complete vascular tree, perfusion, procedural safety or patient registration.
Prior decisions cannot approve revised teaching: the normal Review pipeline
binds the new wording, references and fingerprints. Drafts remain unapproved;
Atlas, Education case and paid-lecture access stay independent.

## Regeneration and verification

`npm run pancreatic-arterial-xray:test` checks exact identity refusal, admission
scope, unchanged non-target teaching and packets, stale or forged submissions
and canonical models. Regenerate regional snapshots, Review display and renderer
pins through the existing scripts, then run the content contract, Review and
fresh types. Integrate all four learner exports and protected Review through
their source-bound pipeline, not manual edits. These checks do not replace
visual or radiologist acceptance.

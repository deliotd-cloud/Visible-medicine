# Colic arterial X-ray teaching

Seven existing abdominal arteries now have draft X-ray orientation notes in the
regional and whole-body Atlas. These describe comparison with acquired contrast
angiography, not new images or validated patient-space links. All other teaching
tabs, geometry, source labels, guided tours and questions are unchanged.

## Retained selections

| Selection | FMA | Source laterality |
| --- | --- | --- |
| Ileocolic artery | 14815 | Unspecified |
| Right colic artery | 14811 | Right |
| Middle colic artery | 14810 | Midline |
| Left colic artery | 14826 | Left |
| Ascending branch of left colic artery | 14828 | Left |
| Descending branch of left colic artery | 14829 | Left |
| Marginal colic artery | 14824 | Midline |

The complete identities in `content/abdominal-arterial-pins.json`, including
source hashes, bounds, anchors and validation status, bind each lesson. A name,
FMA match or similar position is insufficient. Source midline and unspecified
classifications are preserved rather than converted to patient laterality.

## Teaching and evidence

The [UAMS abdominal artery table](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-abdomen/)
supports usual origins and branch relationships. The
[ACR/RSNA catheter angiography explanation](https://www.radiologyinfo.org/en/info/angiocath)
distinguishes catheter X-ray imaging from CT and MRI angiography.

[Zhang et al.](https://www.wjgnet.com/1007-9327/full/v26/i24/3484.htm)
supports left-colic and collateral orientation in a selected elderly DSA cohort,
not a normal-population visibility claim. Its inconsistent left-colic absence
percentages are not reused.
[Tachikawa et al.](https://pubmed.ncbi.nlm.nih.gov/33555389/)
supports the descending-branch definition using CT, not DSA validation. No
positional diagnostic thresholds are transferred between modalities.

All prose is independently written. References do not license their media for
commercial reuse; no article, figure, table, scan or other asset is imported.
See `LICENSES/THIRD_PARTY_NOTICES.md`. No runtime service or fee is introduced.

## Clinical review

The radiologist should review the seven exact revised teaching worksheets in
Review. Check terminology, parent versus branch distinctions, marginal versus
central collateral pathways, laterality and the limits of modality evidence.
Review the assembled surfaces separately for anatomical fidelity and continuity;
an exploded surface or angiographic filling cannot prove complete supply,
patency, tissue perfusion or a safe procedural route.

Prior teaching decisions cannot approve changed material. The existing Review
pipeline binds the revised prose, citations and teaching fingerprints. Drafts
remain unapproved; Atlas, Education case and paid-lecture access stay independent.

## Regeneration and verification

Run `npm run colic-arterial-xray:test` for complete-identity mutation checks,
unchanged non-target teaching and Review packets, stale/forged decision guards
and canonical model preservation. Regenerate regional teaching snapshots,
display and renderer pins through their existing scripts, then run the content
contract, source Review validation and fresh types. Integrate the four learner
exports and protected Review through the normal pipeline; do not edit their
generated copies by hand. These checks do not replace visual or clinical review.

# Tongue CT/MRI orientation

Ten draft placements cover the existing whole tongue and the separate left/right genioglossus and hyoglossus selections. Each lesson requires the exact complete source identity. Geometry, frames, holds, acquired scans, masks, enrolment and permissions are unchanged. New wording needs independent radiologist review; naming the same structure is not patient-space registration.

The short original descriptions use these reading references:

- [Sakamoto, 2017: extrinsic tongue muscle configuration](https://pubmed.ncbi.nlm.nih.gov/27830322/). Original investigation of 42 cadavers supports the fan from the mental spine, inferior genioglossus attachment to the hyoid, and hyoglossus ascending outside genioglossus. It does not establish image visibility or validate these meshes.
- [Lahiri and Daultrey, 2023: floor-of-mouth imaging](https://sajr.org.za/index.php/sajr/article/view/2677/3448). Anatomy section and CT/MR descriptions support axial/coronal orientation and the sublingual-space relationship to genioglossus/geniohyoid and mylohyoid. Imaging depends on the actual sequence and study.
- [Patel and Bhatt, 2018: sublingual/submandibular spaces](https://pmc.ncbi.nlm.nih.gov/articles/PMC5990998/). Anatomy discussion corroborates the surrounding compartment relationships.
- [Otonari-Yamamoto et al., 2010: mylohyoid imaging](https://doi.org/10.2214/AJR.09.3516). CT/MR examples and the accompanying text support using the adjacent muscles as orientation landmarks; reference figures are not Atlas assets.

Reading citations confer no figure, scan or dataset reuse rights. No article media or text blocks are imported. The draft introduces no diagnostic thresholds, treatment guidance, automated segmentation or spatial correspondence. These are six concise topic variants delivered to five pinned selections, not ten independently researched articles.

`node scripts/test-tongue-imaging.mjs` checks exact identity refusal, citations and resolver wiring against the original pending state. `node scripts/test-tongue-imaging-transition.mjs` compares all 9,936 root placements with the saved baseline and requires exactly ten pending-to-draft changes. Generate regional snapshots and review evidence using the existing stock scripts before export. Website import and owner review remain separate steps.

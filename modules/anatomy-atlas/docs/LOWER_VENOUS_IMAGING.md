# Lower-limb venous imaging drafts

17 September 2026. Fourteen existing source-bound selections receive CT, MRI and
ultrasound orientation: 42 placements using twelve modality texts and seven
anatomical landmark/source-limit pairs. These are introductory drafts, not a
complete vascular curriculum, patient imaging or radiologist approval.

## Exact scope

| Paired selection | Right / left FMA | Original source files, right / left |
| --- | --- | --- |
| Femoral vein | 21188 / 21189 | FJ2144 / FJ2102 |
| Deep femoral vein | 51042 / 51043 | FJ2135 / FJ2099 |
| Popliteal vein | 44328 / 44329 | FJ2171 / FJ2117 |
| Great saphenous vein | 21379 / 21380 | FJ2145 / FJ2103 |
| Small saphenous vein | 44334 / 44335 | FJ2176 / FJ2121 |
| Anterior tibial veins | 44336 / 44337 | FJ2132 + FJ2193 / FJ2097 + FJ2183 |
| Posterior tibial veins | 44338 / 44339 | FJ2173 / FJ2118 |

The full identities, ordered files, sides, three existing model bundles and frame
are pinned in `content/lower-venous-imaging-pins.json`. The adapter rejects any
identity change. It neither subdivides the femoral surface into new named segments
nor invents junctions, lumina, valves or missing calf channels. Iliac veins remain
a separate pelvic teaching task. X-ray and existing anatomy/function/clinical/
pathology/quiz material are unchanged.

## References and permitted use

All new prose is original short factual synthesis. Links are reading references,
not permissions to copy publisher illustrations, text, tables, scans or datasets.

- [TTUHSC lower-limb veins](https://anatomy.ttuhscep.edu/anatomytables/veins_lowerlimb.html): saphenous routes. Copyrighted teaching table; no table or artwork imported.
- [Korean Journal of Radiology, 2011](https://www.kjronline.org/DOIx.php?id=10.3348/kjr.2011.12.3.327): CT-based femoral/popliteal variation and relationships. CC BY-NC 3.0 publisher material is **not** admitted as commercial media; no figures, classifications or tables reproduced.
- [Tran et al., 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9668790/): acquisition timing affects venous enhancement. The study found no significant association of tested patient factors with time to peak enhancement; the draft does not assert otherwise or prescribe its scan delay. Full text was also checked at the [German National Library](https://d-nb.info/1262757118/34).
- [Shin et al., peripheral MRV](https://pubmed.ncbi.nlm.nih.gov/25824323/), DOI [10.1002/mrm.25623](https://doi.org/10.1002/mrm.25623): sequence-specific noncontrast venography feasibility, not routine MRI equivalence or guaranteed diagnostic performance.
- [Gallix et al., calf MRV](https://pubmed.ncbi.nlm.nih.gov/12655580/), DOI [10.1002/jmri.10273](https://doi.org/10.1002/jmri.10273): dedicated flow-independent calf venography feasibility. No parameters, figures or scans imported.
- [ACR/RSNA venous ultrasound](https://www.radiologyinfo.org/en/info/venousus): acquired imaging/Doppler and visibility limitations.
- [ACR vascular ultrasound requirements](https://accreditationsupport.acr.org/support/solutions/articles/11000084118-exam-requirements-vascular-ultrasound): distinct examination landmarks and compression/Doppler observations. This is not an accreditation protocol; future-effective requirements and numerical criteria are not reproduced.
- [RadioGraphics venous anatomy/US review, 2022](https://pubs.rsna.org/radiographics/doi/10.1148/rg.220057): deep/superficial distinction, calf pairing and variable superficial termination. No publisher media or tabular classification imported.

Existing BodyParts3D CC BY 4.0 notices remain unchanged. Original code/notes retain
the project's MIT terms. No font, texture, mesh, dependency, fee-bearing service
or externally hosted scan has been added.

## Verification and sign-off

`npm run lower-venous-imaging:test` verifies 42 pending-to-draft transitions,
9,885 unchanged topics, unchanged shoulder material/recipes, source bytes,
identity-mutation rejection, content schema and revision-bound review material.
The offline history adapter accepts only the complete recorded before/after
state; mixed or unrecorded edits fail. It does not migrate clinical approvals.
Generated results are in `lower-venous-imaging-validation.json`.

The extra legacy lower-arterial snapshot failure discovered during this batch
has an [exact history repair](LOWER_ARTERIAL_HISTORY_REPAIR.md): 24 later source
selections and 46 later pelvic lessons are projected out only for the old
comparison. The original fixture/assertion is unchanged and now passes.
Independent Git replay of this batch's parent (`2abd41c1`) also proves all prior
teaching and recipes exactly equal the restored baseline. These checks do not
claim that every legacy suite passes or replace clinical review.

The user-facing notes reuse the existing CT/MRI/Ultrasound panel and retain
separation-at-zero, no-registration and independent case/Atlas/lecture-access
cautions. Selection does not send an imaging event or grant an entitlement.

Owner radiologist review remains necessary for every draft and exact source
extent, with particular attention to femoral/profunda junction naming, variant
saphenous endpoints, grouped anterior tibial files and incomplete calf coverage.
Cleared acquired cases, modality-specific landmarks, registration validation and
lecture anchors are later work; smooth geometry never establishes flow,
compressibility, patency, reflux or absence of thrombosis. Production-browser
evidence and GitHub/D recovery are recorded in the coordinating checkpoint.
Hosted activation remains behind the existing authenticated model-upload gate.

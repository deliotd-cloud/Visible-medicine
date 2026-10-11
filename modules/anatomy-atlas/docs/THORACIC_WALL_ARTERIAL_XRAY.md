# Thoracic wall arterial angiography teaching

Six existing left and right internal thoracic, musculophrenic and superior
epigastric selections now have original X-ray orientation drafts. Select a vessel
in Whole body, Thorax or its supported regional view and open the X-ray topic.
The existing clinical Review queue exposes the changed teaching revision for each
selection; no new toolbar or modality image is added.

## Anatomy and imaging scope

The drafts distinguish the parasternal internal thoracic course, lateral
musculophrenic route and downward superior epigastric continuation. They explain
why contrast catheter angiography and digital subtraction angiography differ from
plain chest radiography, CT angiography and MR angiography. Native source surfaces
are not surgical grafts, contrast-filled lumens or validated patient projections.

[UAMS anatomy teaching](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-thorax/)
supports the course and branch distinctions. The
[50-donor dissection study](https://pmc.ncbi.nlm.nih.gov/articles/PMC4583587/)
documents variability rather than certifying this model. The
[97-patient angiography study](https://doi.org/10.1148/radiol.2423060220)
supports examples of pathological collateral supply, not a normal depiction rate.
[RadiologyInfo](https://www.radiologyinfo.org/en/info/angiocath) explains the contrast
X-ray examination. All prose is original; no article text, figure or scan is copied.
Reading links grant no image reuse rights. Existing model and software notices
continue unchanged; no asset, dependency, fee or external runtime service is added.

## Source binding and review

Teaching reuses the exact unchanged identities in
`content/thoracic-branch-imaging-pins.json`, including source components, hashes,
coordinates, laterality, provenance and validation status. A changed identity
cannot inherit these drafts. All other topics and unrelated Review packets must
remain identical to source c0025a9e; teaching revisions change only for the six
affected selections. Earlier teaching decisions cannot approve revised material.

The radiologist must review anatomical wording, source limitations, projection
and graft distinctions and disease-cohort interpretation at the actual revised
packet. No draft is clinically approved, registered to CT/MRI or authorised for
public imaging release. Accepted scans, masks and held anatomy are untouched.

## Verification

Run `npm run thoracic-wall-arterial-xray:test` from the Atlas checkout. The focused
test compares every root topic and Review packet to the exact preceding source,
tests altered source identities and stale or forged review requests, and confirms
that drafts do not grant approval or independent case and lecture access.
Use the established module exporters and website Review import; never edit their
generated copies by hand. Build and browser evidence are recorded separately in
the local checkpoint, not inferred from this document.

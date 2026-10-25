# Nasal-bone X-ray and ultrasound orientation proposal

This proposal adds two original teaching notes, shared by the exact right and left nasal-bone selections: four draft placements, not four independent lessons. The existing CT/MRI drafts, anatomical source records, models, licences, publication and access rules are outside this patch.

## Acquisition evidence and scope

[Lee et al. (2016; published online 2015)](https://pubmed.ncbi.nlm.nih.gov/25749616/) acquired radiography, ultrasound and CT in 41 patients with nasal-bone fracture and analyzed lateral walls separately from the midline. CT performed better at lateral-wall assessment than ultrasound or radiography in that cohort. [Ardeshirpour et al. (2013)](https://pubmed.ncbi.nlm.nih.gov/24170464/) imaged 12 adult fracture patients within two weeks and 12 controls; lateral ultrasound findings were more consistent than dorsal observations. These studies establish specific acquired-image examples, not routine visibility of each complete bone, a normal template, cohort-wide generalizability, diagnostic thresholds, or registration to the BodyParts3D donor surfaces. A midline view does not identify either individual source side. Published radiograph acquisition is not an examination-ordering recommendation; clinical guidance remains separate.

The sources are retained BodyParts3D 4.0 CC-BY-4.0 bones `FMA53647/FJ3378` and `FMA53648/FJ3272`. Their current anatomical validation status is `unvalidated`. The helper admits only their complete pinned identity records and only X-ray/ultrasound. It supplies no scan, mask, patient transform, measurement, clinical approval or protocol. Radiologist review is bound to the resulting exact teaching revision.

## Integration and focused verification

The proposal contains new files only. Main integration should insert the helper into the normal body-content resolver before the generic pending fallback, regenerate regional teaching and Website/Review exports from the same native source, and preserve all other topics. The focused test uses `workspace-test-build` to compare the actual application resolver with the helper on the raw and display source identities; it checks both sides and modalities, full-record mutation refusal, other-tab/source refusal, and pending clinical approval. The test is authored but has not been run in this proposal directory. Native and Website full-source inverses, generated artifacts, Review fingerprints, typecheck/build and browser checks remain for the integration owner.

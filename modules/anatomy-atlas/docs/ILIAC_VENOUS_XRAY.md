# Iliac venous X-ray teaching drafts

Six existing right and left common, external and internal iliac vein selections
now include original contrast-venography orientation in the X-ray tab. These are
educational drafts, not acquired images, procedural guidance or approved anatomy.
Plain pelvic radiographs, catheter venography, CT venography, MR venography and
intravascular ultrasound are distinguished explicitly.

## Source identities

The unchanged `content/iliac-venous-imaging-pins.json` binds each complete
catalogue identity, source component and bundle hash. Names or FMA identifiers
alone cannot resolve a lesson. No mesh, source hold or patient coordinate changes.

| Selection | Right FMA | Left FMA |
| --- | --- | --- |
| Common iliac vein | FMA21387 | FMA21388 |
| External iliac vein | FMA18885 | FMA18886 |
| Internal iliac vein | FMA18887 | FMA18888 |

## References and scope

- [Gagne et al., VIDIO, 2017](https://pubmed.ncbi.nlm.nih.gov/28818221/):
  venography compared with IVUS in a disease-selected cohort. The draft does not
  generalize diagnostic thresholds, normal visibility or treatment indications.
- [Shin et al., 2015](https://pubmed.ncbi.nlm.nih.gov/24874031/): retrospective
  CT observations of iliac venous variation, not catheter-venography sensitivity
  or validation of junctions in this donor model.
- [Bhatt et al., 2026](https://pubmed.ncbi.nlm.nih.gov/40537052/): duplex and
  catheter-venography comparison in women with suspected pelvic vein incompetence,
  not evidence of reflux or normal visibility in this male-donor atlas.

Only original factual summaries and reference links are included. No publisher
figure, patient scan, texture, font, third-party passage or new dependency is
added. Citation access does not grant media redistribution rights; existing model
credits and licence notices remain intact. No paid service is required.

## Verification and clinical review

Run `npm run iliac-venous-xray:test` after normal display-pin and revision
generation. The suite compares all 9,936 teaching placements and 1,104 Review
packets with the preceding source revision, exercises complete-identity refusal
and checks stale or forged review submissions before storage. After committing,
it replays the exact feature revision for the historical transition comparison.

Review all six selections in protected Clinical Review at the recorded source
revision. Check drainage terminology, laterality, archived component limits,
study populations and distinction between projection, lumen and flow. A static
surface does not establish patency, reflux, thrombus, a safe catheter route or
patient-space registration. Atlas, imaging-case and lecture access remain
independent. Unit tests and saved corrections do not confer clinical approval.

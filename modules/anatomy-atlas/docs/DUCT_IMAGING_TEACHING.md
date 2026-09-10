# Pancreatic and biliary imaging teaching

## Delivered scope

In **Pancreas → Explore pancreatic ducts → Learn more → Imaging**, both source selections now have introductory CT, MRI/MRCP and ultrasound notes. In **Liver → Explore liver branches**, either intrahepatic bile-duct group now also has a CT note alongside its existing MRI and ultrasound teaching. These are four shared authored sections serving four existing representations, not eight independent lessons or imported scans.

| Source-bound concept | Representations | Added topics | Existing content retained |
| --- | --- | --- | --- |
| Pancreatic ductal system | FMA10419, FMA63103 | CT, MRI, Ultrasound | Anatomy, Function, Clinical, Pathology, model limits, recall |
| Intrahepatic biliary branches | FMA71857, FMA71858 | CT | MRI, Ultrasound and every core topic |

The existing collapsed panel, source notes, geometry and dissection controls are unchanged. A missing topic for any other structure stays pending; no generic paragraph is silently substituted. Each new note is marked draft, displays its references and distinguishes modality information from source-model limitations.

## Primary evidence

The following public pages were read on 10 September 2026. Only original short factual paraphrases and reference links are included; no page, image, illustration, report, case, table, scan or question bank is copied or relicensed.

- [NIDDK: Diagnosis of pancreatitis](https://www.niddk.nih.gov/health-information/digestive-diseases/pancreatitis/diagnosis), Imaging tests — CT examination scope and ultrasound's role in identifying gallstones. The teaching does not prescribe an examination or reproduce diagnostic laboratory criteria.
- [ACR/RSNA RadiologyInfo: MRCP](https://www.radiologyinfo.org/en/info/mrcp), What is MRCP / Common uses — pancreatic and biliary imaging and distinction from ERCP. The HTML page displayed a June 15, 2026 review date; the older indexed PDF was not used as the current reference. No safety or contrast-administration advice is reproduced.
- [ACR/RSNA RadiologyInfo: Abdominal ultrasound](https://www.radiologyinfo.org/en/info/abdominus), Limitations — bowel-gas obstruction of acoustic access. No universal visibility or normal-calibre claim is made for the selected source meshes.
- [ACR/RSNA RadiologyInfo: Gallstones](https://www.radiologyinfo.org/en/info/gallstones), Imaging evaluation — CT assessment for inflammatory/obstructive findings. The new CT note is orientation teaching, not a claim that every stone is detectable or that a model gap is a stricture.

References support clinical facts, not mesh identity, tissue segmentation, source licensing or a patient's anatomy. The model-bound caveats describe this atlas implementation. No approval of Visible Medicine by NIH, ACR or RSNA is implied.

## Coverage and verification

Nested totals remain 65 representations, 40 concepts and ten unique parents. Reference links increase from 74 to 78. CT coverage becomes 35 draft / 30 pending; MRI 35 / 30; ultrasound 28 / 37. Core-topic readiness remains draft for all 65; these are introductory sections, not comprehensive clinical chapters. Root-body coverage is unchanged. See the generated [current status](CURRENT_STATUS.md).

`npm run nested-teaching:test` checks exact source bindings, wrong-parent/side/study/hash rejection, detached data, citations in the real teaching markup, collapsed disclosures and pending fallbacks. This extension also fingerprints the entire previous concept/reference collection: only three pancreatic imaging fields, one biliary CT field and four new reference keys may differ. Every existing lesson, quiz, model limitation and source binding is preserved. No teaching pins are regenerated for prose. Type checking and the production build are separate software gates; browser/device/clinical acceptance is not claimed.

## Publication and future imaging connection

Specialist editorial review must confirm wording, relevance to the displayed source extent, useful learning depth and the risk of confusing source surfaces with imaging findings. Normal variants, duct communication, calibre, lesion location and technique-dependent appearances need validated examples before they can be taught as model-linked findings.

The 3D surfaces have no attenuation, MR signal, sonographic texture, probe pose or patient-space registration. A future viewer must resolve exact source identities to approved resources and independently authorize each CT/MRI/X-ray/US atlas or lecture. Anatomy subscription, lecture purchase and resource rights remain separate. The production learning registry stays empty, so these notes do not open a scan or unlock paid teaching. No patient data, external viewer, authentication change, new dependency, font, texture or paid service is introduced.

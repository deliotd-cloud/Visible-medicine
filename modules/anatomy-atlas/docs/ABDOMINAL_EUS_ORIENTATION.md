# Abdominal vascular EUS orientation

Three original Ultrasound-tab drafts, bound to complete current source identities:

| Selection | Identity | Retained source | Teaching scope |
| --- | --- | --- | --- |
| Gastroduodenal arterial trunk | FMA76574 | FJ3432 | Anterior pancreatic head–neck landmark in the described duodenal EUS view |
| Left gastric artery | FMA14768 | FJ3499 | Adjacent artery/vein distinction and Doppler context |
| Inferior mesenteric vein | FMA15391 | FJ3443 | Variable drainage and its effect on EUS orientation |

The resolver reuses exact identities from `abdominal-branch-imaging-pins.json`
and `central-vessel-imaging-pins.json`; matching names/FMA labels alone never
admit a changed source. Other topics, representations and models are unchanged.

## Factual references and limits

- [Imaging of the pancreatic duct by linear endoscopic ultrasound](https://pmc.ncbi.nlm.nih.gov/articles/PMC4568631/): the described pancreatic neck view distinguishes anterior GDA and posterior portal-vein landmarks. No duct visibility rate, measurement, acquisition instruction or image is imported.
- [Standard imaging techniques for assessment of portal venous system and its tributaries by linear EUS](https://pmc.ncbi.nlm.nih.gov/articles/PMC4062237/): adjacent left gastric vessels and Doppler distinction; different IMV drainage sites and corresponding gastric/duodenal views. No drainage frequency is generalized to the population.

These are authors' imaging/teaching accounts, not validation studies of this
atlas. EUS is explicitly separated from routine transabdominal ultrasound;
neither the donor mesh nor a selected article view guarantees complete visibility.
No patient-space link, registered boundary, exam protocol or treatment advice is
created. Existing imaging-case and paid-lecture entitlements are unchanged.

Only facts and reading links informed newly written prose. No article images,
tables, scans, wording or adapted assets are redistributed. In particular the
pancreatic-duct article's noncommercial licence is **not** used as an asset licence.
Original code/prose retain MIT terms; existing BodyParts3D derived identities and
geometry retain CC BY 4.0 attribution. No dependency, fee or licence change.

## Verification and review

`npm run abdominal-eus-orientation:test` compares all root-body topics and Review
packets against source `4233534fadb842b4d3c074b6881b28e29a6fdd06`, rejects
altered identities and stale/tampered teaching, and checks model preservation.
Renderer/display pins must be regenerated before current-revision checks.

Radiologist review remains required for the exact revised teaching packets:
confirm terminology, landmark descriptions, variation/visibility caveats and
appropriateness for the intended learner. Clinical approval, mesh acceptance and
patient registration remain separate; these notes do not unblock any of them.

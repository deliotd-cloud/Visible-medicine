# Shoulder soft-tissue X-ray teaching

28 September 2026. Six dedicated-shoulder X-ray tabs now contain short original
drafts: deltoid, supraspinatus, infraspinatus, subscapularis, long-head biceps and
teres minor. All nine shoulder selections now have introductory X-ray teaching;
this is not a complete radiographic curriculum or clinical sign-off.

Select the structure, then Imaging → X-ray. Each lesson distinguishes its bony
landmarks from direct soft-tissue assessment and explains model/projection limits.
The existing panel is reused; no extra controls, automatic scans or paid services.
Root-body/nested teaching and all meshes are unchanged. Do not transfer these
dedicated-shoulder notes or approvals to a different source representation.

## References and commercial-use boundary

Primary educational references inspected 28 September 2026:

- [Texas Tech upper-limb anatomy table](https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html): attachment facts used for orientation.
- [ACR/RSNA/ASRT RadiologyInfo](https://www.radiologyinfo.org/en/info/bonerad): limitations of bone radiography for soft tissues.
- [AAOS rotator cuff](https://www.orthoinfo.org/diseases--conditions/rotator-cuff-tears/): complementary MRI/ultrasound and X-ray limits.
- [AAOS shoulder biceps tendon](https://www.orthoinfo.org/diseases--conditions/biceps-tendon-tear-at-the-shoulder/): tendon versus bone imaging.

These are reading references, not licensed asset datasets. Original concise
wording communicates anatomical/imaging facts; no source text, figure, table,
scan, logo or model is copied. Their copyright remains with the owners; linking
does not grant image-reuse rights. Existing project code/asset licences remain.

## Verification and clinical handoff

`npm run shoulder-soft-tissue-xray:test` compares the full shoulder authoring to
Git parent `bc948b52e8f63c12305bda6eb3e902c5d74e18dc`: only six X-ray sections
change. It tests detached values, explicit draft status, references, immutable
history and unchanged geometry/imaging fingerprints. Only the six affected
teaching fingerprints change; no private decisions are read or migrated.
The offline inverse rejects mixed/unknown edits rather than changing old hashes.

Validation on this source: four focused tests, 33,460 content-contract assertions,
TypeScript and the production shoulder-module build pass. Twelve actual browser
cases cover all six selections at 375px and 1280px: exact body/bullets/references,
draft warning, no loaded study or X-ray reference-plane control, no horizontal
page overflow. The first browser probe matched an outgoing CT tab during its
transition; the final probe scopes to the selected X-ray lesson. No UI code was
changed to accommodate the test. This is not physical-device or clinical acceptance.

Radiologist review must confirm terminology, landmark relevance for actual
projections, clarity of the soft-tissue limitations and suitability for learners.
Source-model limitations, acquired-image privacy/rights, patient correspondence
and independent imaging/lecture entitlement remain separate gates. No CT-head
mask, patient data or clinical desktop PACS is touched.

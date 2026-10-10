# Facial-bone X-ray orientation drafts

Four previously pending X-ray placements now have original teaching drafts:
left/right maxilla and left/right zygomatic bone. These reuse the complete
identities in `content/cranial-bone-imaging-pins.json`; the resolver refuses
altered identities and never infers a side or mirrors a source. Existing CT/MRI
lessons, geometry, other topics and clinical approvals are not replaced.

## Evidence and scope

Primary references inspected on 10 October 2026:

- [UAMS head-and-neck bone table](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/bone-tables/bones-and-cartilages-of-the-head-and-neck/): maxilla and zygomatic entries support the anatomical relationships.
- [Dartmouth 2021 DX protocols](https://geiselmed.dartmouth.edu/radiology/wp-content/uploads/sites/47/2021/11/DX-Protocols-2021.pdf#page=12): PDF page 12, Facial Bones, and page 45, Zygomatic Arches, support the named projection context. This is a historical reference, not current acquisition guidance.
- [RadiologyInfo projection explanation](https://www.radiologyinfo.org/en/info/safety-hiw_04): conventional radiographs superimpose structures.

The mesh is a reference surface, not an image trace. In particular the selected
zygomatic bone is not the entire arch. No sinus-wall segmentation, individual
radiographic visibility, diagnosis or patient-space registration is established.
The drafts retain revision-bound radiologist sign-off and independent Atlas,
case and paid-lecture access. No scan, illustration, copied table or publisher
asset is distributed; references are links, not a licence to reuse those assets.

## Verification

`npm run facial-bone-xray:test` compares the live application against source
baseline `c3485ce80f2db471e0a12c678a9632f8ad7d3607`, including all body
topic placements, exact identities, source geometry and review security.
This automated evidence is not clinical or browser acceptance. Source changes
must go through the existing website generation pipeline before appearing there.

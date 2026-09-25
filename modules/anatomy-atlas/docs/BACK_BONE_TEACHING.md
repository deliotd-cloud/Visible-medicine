# Back dissection: skeletal-context teaching

12 September 2026. In **Back layers · separate specimen**, select a bone and
expand **Learn**. The former placeholder is replaced by Anatomy, Function,
Clinical and Imaging content in the existing collapsed panel; no toolbar, route
or additional scrolling section was added. The muscle-identification quiz is
unchanged. Bones now have functional recall and source-aware self-checks.

## Coverage added

All 34 source bones have Anatomy/Function drafts through 12 explicitly mapped
concepts: occipital, atlas, axis, C3–C6, C7, thoracic, lumbar, sacrum, clavicle,
scapula, hip bone and humerus. This is introductory teaching, not a complete
landmark database for every vertebral level. Landmarks are described but are not
separately selectable meshes.

| New bone topic | Selection placements |
| -------------- | -------------------: |
| Clinical       |                   33 |
| Pathology      |                   26 |
| CT             |                   33 |
| MRI            |                   27 |
| X-ray          |                   34 |
| Ultrasound     |                    0 |

The 153 extended placements reuse **22 short topic texts**, not 153 independent
lessons. Twelve self-checks are placed on the 34 bones. Occipital topics other
than X-ray, cervical Pathology, shoulder MRI and all bone Ultrasound topics
remain pending.
The prior 14 muscle lessons and 46 muscle extended placements are unchanged.

25 September addition: eight X-ray placements cover occipital, C1, C2, C3–C6
and C7 with five distinct orientation texts. Upper-cervical arches/lateral
masses/dens, subaxial body margins and the C7–T1 junction are distinguished.
These are draft projection-orientation notes, not simulated radiographs,
patient acquisition instructions, trauma-clearance rules or stability tests.

Primary references checked for this addition on 25 September:
[AO upper-cervical landmarks](https://surgeryreference.aofoundation.org/spine/trauma/occipitocervical/further-reading/patient-examination-radiological-evaluation-xr-ct-mri),
[RCH radiographic landmarks](https://www.rch.org.au/trauma-service/manual/Radiology/)
and the existing OpenStax vertebral anatomy reference. Only basic projection
landmarks are synthesised from AO/RCH, not their trauma pathways. RCH is a
paediatric resource: its age-specific variants and measurement thresholds are
not transferred to this adult reference. AO's blanket plain-film advice is not
adopted; the existing ACR/RSNA reference distinguishes indicated CT/MRI use.
No reference illustrations, images, prose or new meshes are redistributed.

## Evidence and rights

References checked 12 September 2026; original short factual synthesis only:

- [Texas Tech back anatomy](https://anatomy.ttuhscep.edu/anatomytables/bones_back.html),
  [OpenStax vertebral anatomy](https://openstax.org/books/anatomy-and-physiology-2e/pages/7-3-the-vertebral-column),
  [upper-limb bones](https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html)
  and [lower-limb bones](https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html):
  general landmarks and functional relationships, not proof of mesh accuracy.
- [ACR acute spinal trauma update](https://pubmed.ncbi.nlm.nih.gov/40409895/) and
  [ACR/RSNA spine-trauma teaching](https://www.radiologyinfo.org/en/info/acs-spine-trauma):
  distinct bony versus neural/ligament imaging questions. The ACR full narrative
  endpoint returned 403; its full text was not claimed reviewed. The accessible
  primary abstract and society teaching page support the limited statements used.
- [AAOS spinal compression fractures](https://www.orthoinfo.org/diseases--conditions/osteoporosis-and-spinal-fractures/),
  [pelvic fractures](https://www.orthoinfo.org/diseases--conditions/pelvic-fractures/)
  and [shoulder trauma](https://www.orthoinfo.org/diseases--conditions/shoulder-trauma-fractures-and-dislocations/):
  introductory fracture/imaging distinctions, not patient-specific examination
  requests, clearance rules, treatment protocols or fracture classification.

No figures, tables, screenshots, question banks, scans or source prose were
copied. No new asset, dependency, font, paid API or service is introduced. Linked
reference pages are not relicensed or bundled. New authored text uses the
application's existing licence; the unchanged v3 specimen assets and adaptations
retain their separate CC BY-SA 2.1 Japan terms and notices.

## Binding and verification

The existing full specimen/surface/source/frame checks run before the exact FMA
mapping. A matching name or FMA alone does not admit foreign data. Every returned
lesson detaches nested arrays and topic records; bone notes contain no muscle
motor-supply fields. The new source file is included in requirement and renderer
dependency fingerprints. Root-body teaching, counts, geometry, studies, privacy,
patient registration and lecture entitlements are unchanged.

Run `node scripts/validate-back-layers-teaching.mjs` for all bone and muscle
topic renders, pending states, source rejection and copy-isolation checks. Run
`node scripts/validate-back-layers.mjs` for retained source geometry and dissection
controls, including the unchanged muscle practice pools.

The teaching test also compares the 34 bone lessons against exact Git revision
`7a9cd07a2fe90e0b2871ce0f5a1ea51c4c138651`: only the eight previously absent
X-ray topics may differ. It retains original muscle/source/catalog files,
full-source rejection checks and all 384 actual bone/muscle topic renders.
The two back suites resolve `next/link` to the installed Vinext implementation,
as the application does. The retained navigation check now tolerates line breaks
and follows the existing shared linked-specimen route; no production navigation
was altered. Geometry verification still compares source face order/coordinates.

All notes remain drafts for the radiologist owner. Review anatomical landmarks,
source artefacts, clinical wording and modality scope before approval. Surface
rendering cannot measure density, marrow signal, ligament integrity, fracture
age, instability or patient anatomy. Browser/mobile/focus and GPU acceptance
are separate and were not performed in this background content pass.

# Projection and acoustic-window teaching draft

Source checkpoint: `c3bbeb492cd14cc0f01bc2a85e6303291aab5414` before this draft. The new lessons use existing exact BodyParts3D identities only. There are no imported images, meshes, scans, patient coordinates, registrations, acquisitions, approvals or entitlement changes.

## Added scope

- Eleven thoracoabdominal organ X-ray orientation notes: heart, paired lungs, oesophagus, trachea, thymus, stomach, small and large intestine, appendix and ileocaecal junction. They distinguish projection silhouettes from the 3D surfaces and plain films from separate fluoroscopic examinations. Appendix teaching explicitly states the ACR right-lower-quadrant appropriateness limitation.
- Fifteen spine ultrasound orientation notes: selected C1–C7, T1/T12, L1/L5, sacrum and three source-labelled discs. These are narrowly gated by exact ID and source identity. They explain adult bone shadowing and diagnostic limits, with neonatal/infant canal sonography clearly distinguished. Other spine ultrasound entries remain pending.

Primary reading links are attached to each lesson. Key scope references: [ACR right-lower-quadrant pain](https://acsearch.acr.org/docs/69357/Narrative/), [RSNA/ACR chest radiography](https://www.radiologyinfo.org/en/info/chestrad), [RSNA/ACR abdominal radiography](https://www.radiologyinfo.org/en/info/abdominrad), [AIUM adult spinal ultrasound statement](https://www.aium.org/resources/official-statements/view/nonoperative-spinal-paraspinal-ultrasound-in-adults), [RSNA/ACR musculoskeletal ultrasound limitations](https://www.radiologyinfo.org/en/info/musculous), and [ACR neonatal spine practice parameter](https://gravitas.acr.org/PPTS/GetDocumentView?docId=191+&releaseId=2). Links are reading references, not licensed media imports.

## Clinical review requested

The owner-radiologist should check anatomical wording, projection/orientation examples, whether the appendix appropriateness statement remains current in the target jurisdiction, ultrasound limitations and child/adult distinctions, and that every note is an educational draft rather than scan interpretation or an acquisition recommendation. Review must bind to the exact later published revision; this document is not sign-off.

## Test limitation

The focused X-ray and spine-ultrasound validators, spine historical suite, content contract, imaging-link, source-hold, source-geometry and TypeScript checks pass for this source package. The older `thoracoabdominal-organ-imaging:test` full historical snapshot has a **pre-existing** hash mismatch (`f3ae203e…` versus pinned `8df979c3…`), reproduced unchanged at the pre-change commit. It is not waived or updated to a new hash here. The new X-ray topics have an independent exact-source validator; this does not make the full historical gate green. Browser/device acceptance and radiologist sign-off remain pending.

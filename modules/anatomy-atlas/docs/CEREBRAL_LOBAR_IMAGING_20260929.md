# Cerebral-lobar CT/MRI teaching

Source baseline: `2c9d80ba1eaba9f520a7da9ac7fcb1201ca42a65`.
Four existing concepts (frontal/parietal/temporal/occipital), eight left/right
source selections receive two modality drafts each. No new UI, geometry,
patient data, registration, entitlements or clinical approval.

## Factual references checked 29 September 2026

- [Graham Lloyd-Jones, CT brain anatomy](https://www.radiologymasterclass.co.uk/tutorials/ct/ct_brain_anatomy/ct_brain_anatomy_lobes):
  primary author’s teaching on CT regional landmarks and imperfect lobar borders.
- [ESR / Laura Oleaga, CNS chapter](https://www.myesr.org/app/uploads/2026/08/ESR_Modern_eBook_09_v02.pdf):
  printed pages 11–14, MRI sulcal landmarks. Chapter found through ESR’s current
  catalogue; older PDF URLs redirect and were not used as proof of content.
- [UTHealth lobes and sulci](https://nba.uth.tmc.edu/neuroanatomy/L1/Lab01p06_index.html):
  corroborating general anatomy; existing reference retained unchanged.

Original short factual prose only, no quotations or copied media. ESR’s
CC BY-NC-ND notice does **not** license its illustrations for this commercial
product; neither its PDF nor Radiology Masterclass media is packaged.

## Review scope

Radiologist review remains required for phrasing, landmark localisation and
the source-model limitations, for each current content revision. These are
introductory orientation notes, not complete imaging/pathology curricula.
The model has partial grouped frontal/parietal surfaces, separate superior
temporal and hippocampal selections, and no retinotopic map. The notes do not
claim these are complete lobe masks or matched to a patient's examination.
X-ray and ultrasound stay pending. Acquired-image approval remains independent.

## Verification

Run `node scripts/validate-cerebral-lobar-imaging.mjs`,
`node scripts/validate-hippocampal-teaching.mjs`, and
`node scripts/validate-nested-teaching.mjs`.
The first checks all eight selections, learner rendering, review packet parity,
rejected stale source identities, unchanged 75 teaching pins/108 review identities
and unchanged prior concepts after removing only the exact pinned additions.
Historical regression fixtures remain frozen, not repinned to new prose.
Types, module builds and website/browser integration require separate evidence;
source tests do not establish publication or clinical sign-off.

Local acceptance on 29 September: all 16 CT/MRI placements traversed in the
375×812 browser through real lobe selection and teaching tabs; reference links
and pending-review notices present, no horizontal page overflow. Mobile MRI
panel screenshot inspected. This is emulation, not physical-device approval.
TypeScript, both module builds, 9,499 legacy teaching checks and hippocampal
regression checks passed. Website import remains the next delivery step.

# Pulmonary-hilar source studies

The existing Dissect study library offers separate right and left pulmonary-hilar
views in Thorax and Whole body. Each selects four existing catalogue entries:
the main bronchus, pulmonary artery and superior/inferior pulmonary veins of that
side. These are supplied exterior source surfaces, not newly generated anatomy.
The two left vein entries contain multiple source pieces; those pieces are not
presented as separately validated tributaries or a complete segmental map.

Use search, rotate, select, Remove, Undo/Redo and Reassemble in the normal viewer.
Exploded views separate objects for inspection; restore separation to 0% before
judging original relationships. An opposite-side filter makes a unilateral study
unavailable rather than silently substituting or mirroring its anatomy.

## Educational reference and limits

The study grouping is informed by Texas Tech University Health Sciences Center
El Paso's [Lungs and Mediastina dissector explanations](https://anatomy.ttuhscep.edu/schemes/lungs_ans.html),
especially objectives 5–6, accessed 24 September 2026. The reference describes
the bronchus and pulmonary vessels as components of the lung root. Conventionally
the right pulmonary artery is anterior to its bronchus, whereas the left artery
is superior to its bronchus. These are teaching expectations for review, not a
claim that this draft geometry has passed spatial or clinical validation.

All new interface wording is original. No external illustration, scan, table,
video, mesh or copied passage is imported. The eight admitted BodyParts3D
entries retain their existing CC BY 4.0 provenance, credits and source hashes.
No dependency, font, texture or recurring service is added.

The views do not establish airway or vessel lumina, ostia, joined continuity,
complete lobar anatomy, nerves/nodes/bronchial vessels, surgical planes or patient
registration. Clinical interpretation and any future CT/MRI correspondence need
revision-bound radiologist sign-off and separately cleared imaging mappings.

## Verification

`npm run thoracic-hilar-study:test` exercises exact source identities, side/region
availability, corruption rejection, study discovery and dissection history.
The historical recipe replay removes only the exact new additions; previous
recipe hashes remain unchanged. Source checks do not certify GPU visibility,
physical-device interaction or clinical accuracy. Record actual browser and
backup/publication evidence in the dated main-task checkpoint.

24 September 2026 verification: both studies rendered in the local Thorax viewer
at 1087 × 854. Each enabled exactly its four sided catalogue entries. Selecting
the right bronchus from Browse and directly picking the left pulmonary artery
in the canvas opened the corresponding panels. Remove reduced each study to
three enabled entries; Undo restored four. Changing laterality resets the custom
study to assembled anatomy; under Right side, the left study was absent from
global search. Both sides was restored after testing. Whole-body parity is
covered by source tests, not a fresh whole-body browser sample. No physical-device,
screen-reader or clinical acceptance is claimed.

The focused study, historical replay, library, navigation, source-hold/geometry,
review-binding and broad content-contract checks passed, as did the shared
regional production build (existing large-chunk warning remains). An independent
Sol Medium read-only diff review found no actionable correctness defect.
This is source-only until the normal generated website integration is verified.

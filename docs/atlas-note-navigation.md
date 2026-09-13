# Atlas teaching-tab continuity

13 September 2026. The shoulder module is regenerated from Atlas source
`97853ebe945d0ba1bc21fcf738133d0733fd3ad3` through the existing clean-source export
pipeline. The regional/whole-body source uses the same navigation correction.

The selected teaching group and each subsection now belong to the enclosing
workspace, preserving MRI, Ultrasound or Pathology when the information panel
moves between desktop and mobile/focus drawers. A new workspace starts from the
existing defaults. Nothing is saved to browser storage and no new UI is added.
Active exams reject note-navigation changes and suppress teaching callbacks.

Only shoulder uses this grouped-note component in the website. The independent
female-pelvis/lower-limb workbenches do not import it; their current website
exports are retained. Fresh candidate builds confirmed that source distinction
before installation. The preceding shoulder module was preserved for rollback.

All model bytes and bundled dependency notices are unchanged. Updated draft
display fingerprints do not migrate clinical approval. The homepage Glide splash,
private scans/masks, Didanix Education boundary and independent Atlas/case/lecture
rights are unchanged. This module does not acquire the root-body brain teaching
just because its build graph also includes shared content helpers.

Source evidence: Atlas `docs/NOTE_NAVIGATION.md`. Existing website tests (65),
TypeScript and production build pass. In the actual compiled shoulder module,
a fresh page defaulted to Anatomy / Overview independently of the regional
viewer; selecting Imaging / Ultrasound, resizing to 390×844 and opening Structure
info preserved Ultrasound and its existing scapula notes. The model loaded with
its source labels. This was a direct module-page sample, not a new host-iframe,
physical-device, clinical or real-DICOM acceptance.
See the coordinating task's `work/NOTE-NAVIGATION-CHECKPOINT-20260913.md` for exact
browser, build, recovery and deployment outcomes; do not infer live publication
from the source commit alone.

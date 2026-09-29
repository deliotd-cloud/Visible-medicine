# Subscapular tour delivery — 29 September 2026

Local integration of Atlas `6149a26a1fd1ae74782f93be77856a1c1de08b86`.
Website baseline `037fd32bafaebe2cea493b84eef7479b4d5a7f41`.

## Learner and clinical review

Shoulder & arm → Guided learning → Tour → **Right shoulder: subscapular branches**.
Also included in the whole-body tour library. The original upper-arm muscle tour
remains the default. Four stops use unchanged right axillary, subscapular,
circumflex scapular and thoracodorsal surfaces plus faded right scapula context.
The shared smooth camera, manual Start, reduced-motion support, reading pause,
anatomy readiness/retry and restoration on Exit remain in use. No extra toolbar.

Original concise captions cite the
[UAMS upper-limb artery table](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-upper-limb/).
Source references and explicit limits remain visible: no joined lumen,
complete collateral system, perfusion, nerve course or patient registration is
asserted. No new models, assets, dependencies or paid services. Existing
BodyParts3D attribution and all 137 model fingerprints are retained.

Clinical Review receives the complete sequence, context and camera frames for
all five affected selections. The shared scapula includes both the pre-existing
muscle and new arterial sequence. Missing or changed sequence/context fails
review parsing. There is no approval submission or automatic carry-forward.

## Evidence

- Source exact-ID, original model-hash, invalid-input and tour-frame checks pass.
- All 35 production-player behavior tests pass, including the new four-stop run.
- Full root review audit passes: 1,104 selections, 118 bound to tours.
- Historical deep-brain tour evidence remains intact; comparisons exclude only
  the new independently tested sequence, never an existing one.
- Website broad suite: 291/293 initially passed. Two stale expected counts were
  corrected for the added four stops, with explicit new shared-context and
  source-binding assertions. All four tests in those files then passed.
- Source/website TypeScript, both module builds, Clinical Review build and
  website production build pass.
- Actual local website: all four stops at desktop, phone and 200%-text phone;
  visible models, no horizontal overflow, source limits/references, Finish
  restoration and signed-in Clinical Review tour visibility pass.
  See [browser record](subscapular-tour-browser-20260929.json).
- Earlier test-harness failures are retained in coordination logs. The browser
  harness was corrected to click the visible radio label and test the boolean
  disclosure attribute properly; no product behavior was changed for the test.

Generated runtime and review files came from the committed Atlas pipeline.
Obsolete generated chunks were copied into the coordination recovery folder
before replacement. The separate fracture work remains untouched and unstaged.
Independent image/lecture access, private scans, source masks and desktop PACS
remain unchanged.

No hosted publication, patient-data release, clinical approval, physical-device
certification or full atlas completion is claimed. GitHub/C recovery is separate
from the still-pending D copy; the D drive is full.

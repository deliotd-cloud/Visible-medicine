# Hip abductor X-ray orientation drafts

Four retained BodyParts3D selections now have original, source-bound X-ray
orientation teaching: bilateral gluteus medius (FMA22330/22331) and gluteus
minimus (FMA22332/22333). Their exact identities reuse the existing hip imaging
pins; neither those pins nor the CT/MRI/ultrasound lessons are rewritten.

## Reading and reuse boundary

Primary reading checked 25 September 2026:

- [TTUHSC lower-limb muscle table](https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html):
  iliac origin regions and greater-trochanteric attachments.
- [ACR/RSNA RadiologyInfo bone radiography](https://www.radiologyinfo.org/en/info/bonerad):
  limited soft-tissue information from bone radiographs.

These links support short original factual paraphrases, not imported pictures,
tables or licensed image assets. No new asset, dependency, font or fee introduced.
Projection cautions distinguish actual radiographs from the rotatable model;
bone appearance is not a test of abductor tendon integrity.

## Review and verification

All four lessons are **draft**, not clinically approved. The owner radiologist
must review wording, attachment orientation and intended learning use against
the saved material revision before sign-off. No patient images, scan registration,
detector simulation, clinical diagnosis or paid-lecture entitlement is supplied.

`record-hip-abductor-xray.mjs` records the before/after transition without
overwriting evidence. The focused validator checks only four changes, exact
source identity rejection, other modalities/lessons preserved, existing panel
rendering and unapproved exports. An offline replay joins the existing historical
teaching checks without changing their earlier baselines. Main-task checkpoint
records actual test, build, backup and website-integration status.

Focused validation passed: 4 draft topics, 9,932 other topics unchanged, 152
source mutations rejected and 4 actual note-panel renders. The content contract,
body review (1,104 selections / 9,936 topic snapshots), TypeScript, targeted lint
and production build passed. Pelvic teaching replay/render tests pass after
replaying these four later topics and supplying the real SourceDisplayNotes
component to the existing renderer test; no previous baseline was rewritten.

Known historical-test debt: `hip-imaging:test` fails its old all-lessons hash.
Independent exact-Git reconstruction reproduced the same failure at parent
`885ea54`, with zero baseline/current differences after replay. Twelve later
lacrimal drainage CT/MRI drafts are missing from the older reconstruction chain.
The original hip snapshot matches its original Git source. Repair that explicit
history separately; do not change the expected hash or claim this suite passed.

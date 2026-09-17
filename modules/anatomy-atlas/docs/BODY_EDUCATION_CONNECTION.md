# Regional and whole-body Education connection

The compiled regional Atlas exposes `visibleMedicineBodyEducation` after its
trusted current catalogue loads. It follows the existing shoulder API:
`connect({document, policy, viewer, onStatus})`, then explicit host
`setEnabled(true)` and learner **Allow linked structure selection**. There is
no new toolbar, empty launch action or additional viewer. The source-controlled
learning document remains empty; no real case is connected by installation.

The API uses all current root-body source identities internally. A host cannot
substitute its own anatomy manifest or introduce a donor-to-patient transform.
Scope checks follow the active region/side. Source, resource, annotation and
material revisions and independent Atlas/case/lecture policies remain required.
CT, MRI, X-ray and ultrasound use the existing typed annotation anchors. Lecture
anchors are not sent to the imaging viewer. Exact concepts are not registration.

Changes to region, side, catalogue, Practice, or an active separate/nested
dissection pause linking and cancel pending reveals. Returning does not silently
resume: host and learner opt-in remain necessary. Root selection cannot act on
an unrelated specimen or hidden nested study. Nested imaging connections are
not implemented by this root port.

Page-hide, unmount and catalogue replacement dispose the old interface. A fresh
page-show installation starts paused; cached interfaces stay removed. The
shoulder and body installers share the tested lifecycle implementation, but
run in their own iframe/document and retain different anatomical scopes.
Only one adapter may own a document's bridge.

This is a same-origin, in-memory trusted-host API, not cross-origin messaging,
authentication or paywall enforcement. Actual media servers must independently
enforce entitlements. No credentials, patient UIDs, pixels or physical scan
coordinates are passed. No new dependencies/assets/licence obligations.

Verification: `npm run body-education:test`, existing adapter/learning/imaging
regressions, builds and separate compiled-browser evidence. Synthetic fixtures
do not establish real-DICOM, BFCache, physical-device or clinical acceptance.
Didanix Education readiness and a cleared real case/lecture remain release gates;
the local MRI import checker does not become the learner PACS.

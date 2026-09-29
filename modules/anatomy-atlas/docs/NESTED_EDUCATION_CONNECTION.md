# Nested Education connection

The website's shared nested workbench exposes `visibleMedicineNestedEducation`
while a trusted current parent/study is mounted. This covers the workbench's
brainstem, ventricular, cerebral, visual-pathway, cardiac, coronary-venous,
pulmonary, hepatic, pancreatic, renal and cricothyroid source structures.
Eye, femoral and cranial-artery component workbenches are not connected here.
The standalone Atlas does not install this website host interface.

The host calls `connect({document, policy, viewer, onStatus})`, using the existing
Didanix Education port and schema-version-2 nested correspondence records, then
explicitly enables the returned connection. The learner separately enables
**Allow linked structure selection**. The compact Imaging link disclosure only
appears after a host connects; no empty toolbar or automatic study launch.

Only exact current parent/child identities and source/bundle hashes can bind.
The host cannot replace the anatomy catalogue. Hidden, unloaded, failed or
context-only children are not selectable through the connection. Practice,
isolation, cutaway, partial pulmonary filtering and renderer failure pause it.
Changes to source, allowed children, study, page lifecycle or viewer context
cancel pending reveals; returning requires fresh opt-in. Ordinary child
selection does not pause. Incoming selection does not echo back as a new reveal.

Each mounted nested workbench owns a separate bridge. The root-body interface
remains installed but paused by the existing nested-study guard. Closing the
nested study removes its interface and invalidates cached handles, without
detaching the root receiver. No desktop Didanix application is modified.

This is a same-origin trusted-host integration seam, not authentication or
cross-origin messaging. Real image servers still enforce independent case,
Atlas and lecture access. Revision-bound material/correspondence clearance is
required; no records, scans or approvals are added to the empty production
learning registry. Selection correspondence is not patient-space registration.
The reference-model coordinates are never substituted for patient coordinates.

Validation: `node scripts/test-nested-education-link.mjs` exercises the actual
hooks with a deterministic lifecycle harness and synthetic CT/MRI records;
`node scripts/validate-didanix-adapter.mjs` covers the underlying adapter.
These checks are not browser, clinical, real-case or physical-device acceptance.
No additional dependencies, external assets or licence obligations are introduced.

## Source acceptance — 29 September 2026

TypeScript and both regional/shoulder module builds pass. Root Education (76),
Didanix adapter (233), nested learning (7,980), and nested practice component
(1,027) checks pass, as does the new isolated-hook test. Existing test fixtures
were corrected to include the already-present guided-learning pause guard and
two hippocampal records; no current anatomy was removed to meet old counts.

The actual compiled regional module was tested with synthetic MRI/brainstem
at 1440px and CT/ventricles at 390px: initial pause, explicit opt-in, incoming
selection without echo, actual child-button outgoing selection, Practice pause,
return still paused, nested close and unchanged root interface. Both pass with
no browser errors or document overflow. The mobile screenshot was inspected.
Evidence stays in the coordination workspace:
`work/check-nested-education-browser-20260929.mjs` and
`work/nested-education-browser-20260929.json`.

This checkpoint is source/compiled-module acceptance only. Importing into the
website, refreshing review bindings and checking the integrated website remain
the next delivery step. No hosted deployment, real-study connection or clinical
approval is claimed.

# Compact anatomy touch controls — local integration

Imported Atlas `0ede9422e6e9ce7e190cbe48d3cd3fe3714c7828` through the existing
regional/shoulder exporters and Clinical Review importer. No generated module
was hand-edited. The learner and review viewers now share larger camera action
tap areas on narrow screens and coarse pointers, while retaining compact system
switches and normal mouse-desktop density.

## Verification

- Source: six generated-viewer browser cases, including 320px phones, 200% text,
  touch tablets and mouse desktop; 21 existing control-state tests passed.
- Website: 272 tests, TypeScript and production build passed.
- Actual website learner at 375×812: zoom, labels and reset are 44×44px, camera
  selectors and zoom share one 44px row; label toggle changes state.
- Actual hip/thigh independent specimen: six camera controls meet the 44px
  minimum, model canvas is 206px high, no horizontal overflow, return works.
- Actual Clinical Review model: after returning from coronary venous detail,
  root camera controls measure 44×44px with a 44px row and no horizontal overflow.
- Actual 1440×820 mouse desktop retains 36×38px zoom and 30×32px toolbar actions;
  no horizontal overflow.
- All 137 model inventory entries and model bytes are unchanged. No teaching,
  source geometry, privacy gates, entitlements or review approvals changed.

Physical-device/full accessibility acceptance remains separate. Existing build
chunk-size warnings remain; this change does not claim to resolve them.
Separate fracture-exam work preserved. No patient upload or publication.
Sites workflow used only for local integration and verification.

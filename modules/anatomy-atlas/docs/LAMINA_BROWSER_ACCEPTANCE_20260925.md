# Lamina teaching browser acceptance — 25 September 2026

## Exact scope

Tested the unchanged production regional export from Atlas
`2b23603b4d7c9978d763b49053ae26eb2fa8b8c3`, embedded in website
`71f59ea51eb8979d5fc08113d78add558990f505` (private version 153).
Manifest SHA-256:
`7a9a7688193dbe83b990a3d1db62de486b629d8abbc71db73bc0bfa7986b6a8e`.
The loopback QA helper verified all 199 exported files against that manifest
before serving them. No HTML patches, model changes, patient data or simulated
imaging were used. This was direct-module testing, not authenticated hosted-site
acceptance.

## Observed browser results

- Selected the existing lamina terminalis through the module's exposed selection
  tool: `vm:anatomy:body:head-neck:midline:organ:lamina-terminalis` / FMA61975.
- Clinical notes displayed the existing patient-specific anterior ventricular
  boundary draft; the obsolete pathology-pending sentence was absent.
- Clinical → Pathology displayed “Displaced boundary, not the obstructing
  membrane”, its small-series limitations, source-geometry limitations and the
  Richetta reference link. Draft and pending-review status remained visible.
- At the normal 1280 × 720 desktop viewport, the model, compact systems rail and
  independent teaching-panel scroll area were visible together. The selected
  label correctly disclosed “Behind tissue”; this did not imply exposed anatomy.
- At a 390 × 844 viewport, the interface switched to model-first presentation.
  Structure info opened a readable drawer with the same selected Pathology tab,
  an accessible close control and a Return to model control.
- Document scroll width equalled viewport width (390 pixels): no horizontal
  page overflow in this sample. The long lesson scrolls within its drawer.
- Return to model dismissed the visible dialog, restored focus to Structure
  info, retained the lamina label and left separation at 0% in the rendered UI.
  Reopening the drawer retained Pathology (`aria-selected=true`).
- Closed the drawer, reset the temporary viewport override, closed the owned QA
  tab and stopped the loopback QA process after testing.

Screenshots were inspected in the browser-tool output, not saved as repository
assets. A raw DOM presence check also found hidden dialog markup after closing;
the accessible named dialog visibility check returned false. Presence alone was
not used as evidence that the drawer remained open.

## Limits and next work

This is a narrow functional/visual acceptance sample, not physical-touch,
screen-reader, 200% text, all-region, clinical or spatial-registration approval.
It does not establish correctness of the cited medical claims; revision-bound
radiologist review remains required. No release gate was changed.

The pending lamina panel acceptance is complete. Continue regional usability and
existing-feature reliability independently of final CT/MRI segmentation. Keep
the specialist CT-head masks and accepted boundaries unchanged; final imaging
overlays and patient-specific correspondence require their approved revisions.

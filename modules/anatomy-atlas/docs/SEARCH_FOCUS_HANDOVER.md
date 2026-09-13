# Search-to-panel keyboard handover

13 September 2026. Reproduced against Atlas source
`e81de24b1550cafbd342ae58c2fb957fc9b7fa0c` in the actual local browser at
`/regions/head-neck`, then retested after the source correction.

## Defect and correction

On a 390 × 844 viewport, activating a structure result with Enter opened
Structure info, but Search's closing focus restoration moved focus back to the
background Search button. Tab then reached the background Systems & tools
launcher while the info sheet was still open. The open dialog did not contain
the active element. This was an observed interaction defect, not inferred from
source inspection.

AtlasSearch now yields focus when the action opens a compact info/tools sheet,
including Focus view and container-measured embedded layouts. The destination
sheet's existing focus management takes over. Desktop inline panels and ordinary
Search dismissal retain the Search launcher as the return target. Reopening
Search clears the preceding handover. Nested-dissection handover and exam guards
are preserved. No timeout, new panel, global shortcut or dependency was added.

## Actual browser sample

| Scenario | Observed result after correction |
| --- | --- |
| Phone-sized Search → left sternocleidomastoid, Tab/Enter | Focus is Close structure info, inside the open dialog. |
| Shift+Tab from that close button, then Tab | Wraps to Return to model and back inside the dialog. |
| Escape from Structure info | Closes the sheet and focuses its Structure info launcher. |
| Search → Basal nuclei & thalami study window, explicit confirmation | Correct current recipe appears; focus is Close systems & tools inside the tools dialog. |
| Desktop 1280 × 720 Search dismissal and right sternocleidomastoid selection | Focus returns to Search; no modal remains open for inline details. |
| Desktop Focus view → Search → right sternocleidomastoid | Focus is Close structure info inside the newly opened sheet. |
| Phone/desktop page width | Document scroll width equals 390/1280 respectively; no horizontal page overflow in these sampled states. |

The sample also exercised Remove, the available Undo action, next layer and
study-reset confirmation. It did not independently measure restored mesh
coordinates, certify screen-reader behaviour or test a physical touch device.
The existing model, system counts, labels and teaching panels remained present.

## Automated evidence and limits

- The actual search-event regression covers select/window/focus across phone,
  tablet, desktop, Focus view and two embedded layouts, retaining the existing
  nested-study checks: `validate-nested-navigation.mjs`, 43,598 checks passed.
  These execute actual component closures with injected React hooks, not a DOM.
- Existing navigation checks pass (169,702) when bundled with the installed
  esbuild because direct Node resolution of extensionless TypeScript imports
  fails. Its old section expectation was updated to include the already-existing
  X-ray section; no product tab was removed or added by this fix.
- TypeScript, production build, 235 shoulder-review safeguards and the actual
  SQLite body-decision checks for 1,101 contexts pass.
- The separate legacy `validate-body-review.mjs` still fails its pre-existing
  1,060-record expectation against the 1,101-record catalogue. It has not been
  weakened or reported as passing. The unrelated current catalogue is unchanged.
- Full 200% text enlargement, physical touch devices, complete screen-reader
  acceptance and wider region/device coverage remain open. Browser viewport
  resizing is not proof of text-enlargement acceptance. The observed explosion
  slider's thumb also needs a focused accessible-name audit; the group is named,
  but the browser exposed its slider without an individual name.

The normal review-fingerprint generator conservatively advances root-body and
shoulder display identities because the shared source file changed. No model
bytes, teaching, private review record or clinical approval is changed or
transferred. AtlasSearch is rendered by the root-body explorer, not the existing
website shoulder/female-pelvis/lower-limb specimen pilots; those runtime exports
are not replaced by this change.

Source/recovery and hosted-version evidence are recorded separately in the main
task's dated search-focus checkpoint. A source push is not a deployed update.
Clinical sign-off and real Didanix/case/lecture integration remain open under the
shared master plan.

Implementation reference: [Base UI Dialog focus management](https://base-ui.com/react/components/dialog#custom-focus-management).

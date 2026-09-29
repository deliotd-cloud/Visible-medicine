# Expanded dissection reflow

Follow-up to `NESTED_MODEL_READABILITY_20260929.md`. Actual website QA found
overflow when every ventricular disclosure was open at 200% text, beyond the
previous check's closed-panel measurement. Reducing text back to normal also left
the canvas at its enlarged height. Neither behavior was clinically related.

## Correction

- Study controls and selected values wrap instead of inheriting single-line
  component styling. Values remain readable; nothing is hidden to pass the check.
- Structure rows use available-width, rem-based minimum columns: compact columns
  at normal phone text, one column when enlarged text needs the width.
- Study headings can wrap long words in constrained layouts.
- Short/mobile scene tracks have a definite scalable height, removing the
  intrinsic canvas-height feedback that prevented shrinking. Desktop layout is
  unchanged. Controls and source warnings remain in the scroll flow.

Only shared study CSS changes behavior. No meshes, teaching, licences, clinical
decisions, imaging links or entitlement logic change. No dependencies added.

## Evidence

`scripts/test-nested-expanded-layout.mjs` tests the actual generated module in a
same-origin iframe and verifies CSS source hashes before running. Three real
studies (ventricles, eye, femoral components), four viewports (320x480, 375x577,
700x812, 1440x820), and repeated 100%→200%→100% text produce 36 passing cases.
All disclosures are open before measuring. Checks cover root/study/control-panel
overflow, switch-thumb containment, drawing space, source warning presence,
reachable drawing area and final button, and restored original canvas height.

Phone canvas height is 206px→412px→206px; desktop is 601px→396px→601px.
Evidence: `docs/evidence/nested-expanded-reflow-20260929.json`. The original
18-case fixture also passes. Renderer, selection visibility, model-first and
study-navigation checks pass. TypeScript and export-build outcomes are recorded
in the coordination checkpoint once complete.

This is development-browser coverage, not physical-device, native-browser-zoom,
screen-reader or clinical certification. Website integration must regenerate from
this source, never patch generated files manually. No publication authorized.

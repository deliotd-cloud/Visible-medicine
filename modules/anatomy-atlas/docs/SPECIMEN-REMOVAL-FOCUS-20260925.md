# Specimen removal and history focus

The independent knee specimen reproduced a keyboard dead end: Set aside removed
its focused button, leaving focus on the document. The shared specimen viewer
now transfers focus to its existing Undo button after the removal commits.
Exhausting Undo or Redo likewise transfers focus to the enabled counterpart.
There are no extra controls or panels.

The request originates only from the focused action. Effects consume it once;
they do not intercept structure-list changes, presets, programmatic navigation
or another focused control. Null, disconnected, disabled and cross-document
targets are ignored. Scrolling is restricted to the existing controls panel,
with only enough adjustment to reveal the destination. Camera, geometry,
dissection history, teaching, source identities and access are unchanged.

## Verification

- `node --test scripts/test-specimen-removal-focus.mjs`: eight tests including
  actual extracted component handlers/effects, refs and real specimen reducer.
- TypeScript passes. Helper/test lint passes. The modified shared component has
  six existing findings on unchanged lines: three memoization diagnostics and
  three label associations. These also reproduce on the prior Git source;
  no whole-file lint-clean claim is made.
- Knee study validator: 238 checks; scene recovery: 710; body review: 1,104
  selections/source links and 9,936 unchanged topic snapshots.
- Shared production build passes (existing large-chunk warning). Renderer
  revision regenerated; no model bytes or source assets changed.
- Actual local browser: original knee cruciate Set aside lost focus; fixed
  keyboard Patella removal focuses Undo, Undo restores Patella and focuses Redo,
  Redo focuses Undo. At 390×844, knee and foot Talus removal/Undo retain focus
  and outer window scroll stays zero. Back to atlas restores launcher focus.
  Viewport override reset. No physical-device or screen-reader acceptance claimed.

This is source-only until generated website integration. Full clinical and
imaging release gates remain open.

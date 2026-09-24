# Contextual dissection Undo

The shared regional / whole-body explorer now puts an Undo action in its existing
selection notice after a single structure is hidden (Explore) or removed (Dissect).
No additional permanent toolbar or drawer is introduced. It invokes the same
history handler as Systems & tools; saved-view formats and reducer semantics do
not change.

The label is derived from the next reversible history transition, not a timer or
stale selection. It requires one exact, uniquely resolved structure in the current
region/side scope, with unchanged stage/focus and no unrelated removal/restoration
changes. Bulk/mixed edits retain the existing general history controls. Practice
and active exams suppress this contextual action and its removal label.

When newly removed tissue changes the notice, only an open information panel is
scrolled enough to reveal it. The outer page/model is not scrolled and focus is
not automatically stolen. Activating Undo focuses the persistent notice before
its button disappears, using preventScroll. The touch target is at least 44px.

## Verification — 24 September 2026

- `npm run contextual-undo:test`: nine focused tests using the actual reducer,
  component callbacks/layout effect and evaluated explorer gating expression.
  Checks include Undo/Redo, restored tissue, mixed/bulk edits, duplicate IDs,
  side scope, open/closed panels, no repeated scrolling and keyboard focus.
- Existing Search preview, practice-panel navigation and dissection-history
  regression suites pass; TypeScript passes. New helper/component/test lint passes.
  Targeted explorer lint still reports four existing effect/dependency findings
  outside the changed import and notice blocks; this is not a clean full lint claim.
- Shared regional production build passes with the existing large-chunk warning;
  source-bound review checks retain 1,104 selections and 9,936 topic snapshots.
- Actual local 1087 × 854 browser: left sartorius in the pes anserinus study,
  Remove → contextual Undo, visible model restoration/list re-enablement,
  keyboard activation, and Explore Hide wording. A scrolled-panel notice was
  initially hidden; the panel-only reveal correction was then visually verified.
- Actual local 390 × 844 viewport: information-sheet notice fits, keyboard Undo
  removes the action and retains focus in the notice. Normal viewport restored.
  This is not physical-touch-device or screen-reader acceptance.

No geometry, clinical teaching, dependency, font, asset licence, patient data,
imaging mapping or access entitlement is changed. Clinical validation remains
open. This is Atlas source work; generated website integration/publication is a
separate checkpoint and must not be inferred from local browser checks.

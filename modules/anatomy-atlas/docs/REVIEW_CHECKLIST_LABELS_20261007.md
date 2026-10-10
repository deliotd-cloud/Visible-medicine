# Shoulder review checklist accessibility — 7 October 2026

The actual local browser exposed duplicated checklist names, such as
“Inspect shape, landmarks and articular surfaces.” repeated twice. The checklist
wrapped a Base UI Checkbox and visible text in a label but also supplied the
same text through aria-label. Base UI's associated-label reference therefore
included both copies. Its aria-hidden, non-tabbable input is expected plumbing,
not a second exposed checkbox.

The source removes only that redundant aria-label. Wrapping label, htmlFor/id,
visible text, checked state, change handler, disabled state and review semantics
remain intact. No geometry, teaching, image, dependency, licence, authentication,
private record or clinical approval changes.

The added actual-component regression covers Geometry, Teaching and Imaging:
one associated label and checkbox per checklist item, matching IDs, one visible
span, and no competing accessible-name override. It fails before the source
correction and passes after; all five prior tests remain unchanged and pass.
Review-fingerprint check, review-safety validation and fresh nonincremental types
pass. This element-tree check does not compute Base UI accessible names; the
normal source-first website import must also receive an actual browser check.

Logs and current browser/integration evidence are maintained locally at
E:/VisibleMedicine-LocalStaging/20261007-review-labels. Nothing in this change
grants clinical, privacy, release or deployment approval. No generated website
module is edited by hand; no saved decision migrates to a new source binding.

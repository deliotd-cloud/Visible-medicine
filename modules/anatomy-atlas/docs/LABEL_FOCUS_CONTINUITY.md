# Label focus continuity — 26 September 2026

Rotating/panning or resizing the atlas can omit a label from projection or from
the compact screen-side layout. Previously the frame hid and disabled a focused
label without assigning a keyboard destination. The frame now returns current
label focus to its own model canvas before hiding/disabling it, using
`preventScroll`. This adds no control and does not change camera position,
selection, anatomical laterality, label placement or source geometry.

Focus moves only when that connected label is currently focused, its own
connected canvas is keyboard-focusable, both share a document, and the canvas
is not inside an inert/hidden/aria-hidden ancestor. It never takes focus from
search, another control or a modal; subsequent hidden frames do not refocus.
Visible labels retain focus. This change handles frame-driven omission, not
all React unmount or whole-route focus transitions.

`label-focus:test` exercises the helper and executes the actual production
frame callback with synthetic DOM controls and projected anchors. Six cases
cover ordering, off-screen and compact omission, visible retention, ownership,
inactive targets and no focus stealing. Existing screen-label tests use the
actual helper; no helper stub or placement assertion was substituted. Label
depth, camera keyboard, renderer and selection tests remain separate gates.
These checks are not browser, assistive-technology, mobile or clinical acceptance.
Review fingerprints must be refreshed because displayed runtime code changed.

# Direct CT/MRI native slice navigation

Each native image view has a compact editable slice number beside its slider.
Enter a one-based whole number, then press Enter or leave the field. Escape
cancels an edit. Invalid or out-of-range values show the available range without
silently clamping or moving the cursor. Existing wheel, slider and keyboard paging
remain available. External slice changes replace stale input, and study/plane
changes reset it. Slice numbering follows the loaded native volume; it is not
an anatomical level or a registered position in the generic 3D Atlas.

Only the current view's fixed native axis changes. In-plane coordinates, display
window, zoom, pan, source image and mask bytes are preserved. The same field works
during practice without submitting an answer or revealing a target name. It has
plane-specific accessible instructions, visible error feedback and keyboard focus.

Evidence and scoped E-drive recovery:
`E:/VisibleMedicine-LocalStaging/20261009-slice-number`.
Acceptance uses real component handlers, native geometry and a browser fixture
with synthetic-only voxels. It is not clinical/native patient-image acceptance.
No authentication, entitlements, anatomy geometry, accepted masks, desktop PACS,
dependencies or public deployment changes.

118 focused tests, fresh TypeScript and unchanged protected Review verification
pass. The first run exposed a test fixture recreating the study object on every
render; preserving the same loaded study fixes the fixture, with a separate
replacement-study assertion retaining the reset gate. The failed log is retained.
Actual browser checks verify axial Enter → 10/16, out-of-range 99 refusal and
Escape restoration, coronal blur → 12/64, and concealed sagittal → 64/64, with
visible keyboard focus. Synthetic screenshot and exact source hashes are saved.

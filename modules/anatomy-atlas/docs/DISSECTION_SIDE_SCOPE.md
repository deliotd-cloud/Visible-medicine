# Dissection focus when changing sides

Switching side rechecks whether the current focused study has supplied target
structures on that side. Context alone is insufficient. An unavailable focus
returns to assembled regional anatomy; compatible focuses and manual visibility
remain unchanged. No counterpart is mirrored or invented.

For example, the supplied left longus-colli study remains active on Both or Left.
Choosing Right returns to assembled anatomy. Undo/Redo retains compatible
snapshots but discards focused snapshots that have no targets in the new scope,
so history cannot reopen the invalid study. Side selection itself is not a tissue
edit and does not add a history entry. Returning to Left allows the study to be
opened again; it does not silently reapply the discarded focus.

This uses the existing laterality menu, source identities, target rules and
source-binding checks. It adds no control, geometry, teaching, imaging access,
dependency or licence obligation. It does not establish anatomical accuracy.

`node scripts/validate-dissection-scope.mjs` exercises every region/side focus,
no-op and history behavior, and the three longus-colli entry regions. The existing
side-isolation test executes the actual JSX callback and verifies its connection
to prospective-side reconciliation. Browser evidence is recorded separately in
the coordinating checkpoint; clinical and physical-device acceptance stay open.

# Revisit a guided scan step

**Show this step** now returns an already-loaded exact CT/MRI annotation to its
saved focus voxel. Previously, reselecting the same ID did not reload the entry
and left a learner on whatever slice they had scrolled to. Pan and zoom reset
to the fitted axial view, while contrast, source identity and tour position
remain unchanged. Returning to learning and reviewing a completed answer reuse
this focus action. Newly selected entries still use the existing verified loader;
missing focus data never invents a coordinate or borrows another entry's focus.

A refused individual guided Quick Check now leaves navigation and completed
results untouched, just like the sequence and selected-structure practice actions.

Tests in `head-image-history.test.ts` cover exact CT/MRI identities, no redundant
mask read, unchanged history/contrast, foreign-object refusal, and rejected or
accepted guided practice. `head-slice-zoom.test.ts` checks the actual slice
component resets pan/zoom without rerastering unchanged native pixels.

Local-only website behavior. No mask, scan, teaching revision, source-model,
PACS, entitlement or approval change; no new dependency or fee. This is native
study navigation, not spatial registration with the separate 3D reference Atlas.
Automated component evidence does not establish native-image clinical acceptance.

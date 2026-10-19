# Keep guided MRI anatomy in view across native planes

In the integrated private regional MRI viewer, changing axial/coronal/sagittal
plane during a loaded guided step now uses that exact annotation's saved focus
in the destination native view. Previously, the plane change always selected
the midpoint and could move away from the structure just loaded by the guide.

The annotation must still be the current guide's exact eligible candidate in
the current package and sequence, loaded for scoped display. Pending, missing,
provisional, retired or unrelated geometry cannot supply a guided focus. No
nearby annotation, different sequence or 3D coordinate is substituted. If no
valid saved focus exists, ordinary midpoint browsing remains available.

Choosing the already-active plane is a no-op: a deliberately scrolled slice
stays where the learner put it. Ordinary annotation browsing and active structure
checks retain their existing plane-change behavior; a location-check answer is
not automatically focused or revealed. Overlay visibility/opacity, grading,
camera/model selection, source bytes and annotation boundaries are unchanged.

A plane change is display navigation, not a source-selection change. It retains
unsaved correction edits without another confirmation; attempting to change the
annotation or sequence still requires the original consent. Existing committed
render, stale-callback and delayed-load guards are unchanged.

Tests reproduce the initial post-load sagittal midpoint failure with synthetic
annotations, then cover all native planes, same-plane slice retention, pending
loads, missing focus, ordinary browsing, quiz concealment and correction consent.
Real geometry/render helpers are tested separately with synthetic voxel grids.
These checks do not establish clinical approval, real-scan/browser acceptance,
MRI-to-3D correspondence or spatial registration. No scans, masks, private data,
dependencies, assets, fees, permissions or desktop PACS changes are introduced.

Evidence and scoped local recovery:
`F:/VisibleMedicine/staging/20261015-native-mri-plane-focus/` and
`F:/VisibleMedicine/recovery/checkpoints/20261015-native-mri-plane-focus/`.

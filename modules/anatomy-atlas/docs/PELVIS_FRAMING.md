# Pelvis camera framing

The root-body viewer now offers the existing reversible regional camera preset
for Pelvis in both, right and left views. This is a camera-only presentation
change: it does not crop, move, remove or rewrite any source mesh or catalog
record.

The close-up fits visible structures whose primary region is Pelvis, plus the
existing source-bound sacrum record (`vm:anatomy:body:spine:midline:bone:sacrum`,
FMA16202). Unilateral views retain visible midline, unpaired and unspecified
members alongside the requested side. The exact sacrum identity, skeleton
system, midline laterality and Pelvis membership are checked before it can join
the camera core.

If a non-null selection is missing, hidden, contralateral or outside that local
core, the helper returns no regional bounds. The viewer therefore uses the full
visible-source fit for long participating sources such as ureters, central or
femoral vessels, rather than implying that their source geometry was shortened.
All existing exam, focus/isolate, removed-ghost, origin, explode, layout and
cutaway guards remain in the viewer.

`npm run pelvis-framing:test` evaluates the augmented 1,102-record display
catalog without modifying it. It covers both unilateral views and the bilateral
view, visible neutral structures and sacrum, exact deep-link selection identity,
hidden/stale/contralateral/outside-core fallbacks, source bounds and perspective
fits across six orientations and four aspect ratios. Hand and foot validators
remain separate regressions.

These checks establish deterministic source-space camera behavior only. They do
not establish anatomical accuracy, registration, clinical acceptance, hosted
publication, or physical-device/browser acceptance.

Main integration verification additionally exercises the actual desktop/mobile
View menu, both side filters, explode suspension/resumption and a source-bound
right great-saphenous-vein link. The local view is closer while the full-source
view remains reversible. See the coordinating pelvis-framing checkpoint for
browser evidence, builds and recovery copies; this is not a hosted release.

The existing renderer regression had a stale string check against the small
review writer, after its path list moved to review-revision-evidence.mjs. It now
checks the actual exported path list and exactly one saved hash per recovery
file against current normalized source. No revision data or accepted baseline
was reset; all existing renderer behavior checks remain, with six extra binding
assertions. Original failing and passing logs remain separate.

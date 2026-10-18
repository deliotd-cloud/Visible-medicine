# Guided learning catalogue

The Atlas hub now links to `/atlas/guided-learning`. Learners can find the existing
linked head sequences without first loading the 3D model or expanding its coverage
notes. Search, modality filters, exact step previews and current source revisions
come from the existing library, not a second tour collection.

## Learner navigation

The catalogue offers twelve head sequences, with ten mapped starts in CT, ten in
MRI and eleven in the existing reference 3D Atlas. CT-only bones, MRI-only anatomy
and image-only cerebellar orientation retain their original limits. Links still
compare anatomical concepts across separate subjects; they are not patient-space
registration.

The CT/MRI Guided learning panel opens a modality-filtered catalogue in a new tab,
without prefetching or navigating the original scan tab. The catalogue does not
carry the loaded scan, folder handles, user access or assessment state. Imaging,
Atlas and paid-lecture access remain independent at their existing destinations.

A closed Regional and whole-body 3D tours disclosure links to all twelve existing
root-body region routes, with Whole body first. These links open the ordinary
region: the learner chooses Guided learning, a tour and Start. They do not select
a tour automatically or promise corresponding acquired images. Separately framed
specimen viewers are not presented as the same root-body source.

## Filters and source guards

Optional `view=all|3D|CT|MRI` and `q` parameters seed the existing library. Queries
are limited to 120 characters, reject control characters and normalize spacing.
Unknown fields, repeated/array-valued parameters and invalid views fail at the
route instead of becoming scan-transport fields. A validated-filter key remounts
the library when route filters change, so a replacement route cannot retain the
previous filter state. Live filter changes remain local to the current page;
they do not rewrite its URL or record learner progress.

The existing imaging-revision guard still hides stale head destinations. Every
start, matching structure and expanded step retains its canonical source and
sequence revision. No tour, teaching text, anatomy source, mask, camera transition,
question, protocol, entitlement or approval is altered.

## Verification and recovery

All 159 affected checks pass, including seven new parser, actual-component and
route cases. Fresh non-incremental TypeScript checks, protected Review verification
and the full website build pass. The worker's initial HTML-escaping fixture failure
and corrected passing run remain in the evidence log; no product assertion was
weakened. Existing non-fatal plugin-timing and large-chunk warnings remain.

All 1,155 protected unowned inputs, four learner module manifests and Review
integration `85df3e087602f44c8744ab245e06cc977df68e863b8ec7ece7d823da7063b40f`
are unchanged. Atlas source remains clean at
`813506f4edfb2cf8c6e4492dfedb4c1d589b4b9d`; the website remains a preserved dirty
checkout at `b953ff3f5f1891599cb6e91cb91311d9d6006270`.

Scoped source recovery and a hash-checked restore smoke test are saved under
`F:/VisibleMedicine/recovery/checkpoints/20261012-guided-discovery`. This is local
source recovery, not a complete website, private-data or off-device backup. No new
GitHub upload, clinical approval, browser/visual acceptance or deployment is
claimed. No third-party assets, packages, fees, scans, masks or desktop PACS changes
are introduced. The site-development and documentation skills were used for this
local-only delivery and its recovery record.

The full goal remains active. Continue substantive anatomy/teaching and linked
learning improvements; queued clinical review is not a development stall.

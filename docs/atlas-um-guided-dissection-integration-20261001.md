# Independent lower-limb guided learning — local integration

Atlas source: `43072a948beda597e7a62439e8c093aa76cb94a7`.
Website parent: `ebef136aa174d9b81329d917e4ef129430760ad2`.
This is local draft delivery, not publication, clinical approval or scan registration.

## Delivered scopes

Five source-bound sequences cover the admitted right-limb specimen:
hip/thigh9 stops, knee6, calf7, foot8, whole source limb16 (46 total).
The whole-limb specimen is independent of the whole-body atlas; regional selections
overlap the same67 source surfaces and must not be counted as new anatomy.

Both the regional learner module (`/atlas-runtime/head-neck/`) and the separate
`/atlas/lower-limb-3d` module (`/atlas-runtime/lower-limb/`) use this source revision.
The protected Clinical Review viewer and reproducible review import use it too.
The dedicated shoulder export also advances; the independent female-pelvis
export retains its recorded revision. No generated runtime was hand-edited.

Guides use the existing collapsed Guided learning controls, source-derived
regional framing, smooth camera transitions and reduced-motion behavior.
They change visibility and camera framing, not tissue boundaries or surgical
planes. Missing nerves, vessels, retinacula and individual grouped identities
are not reconstructed. Existing manual dissection controls remain available.

## Verification and review boundaries

The integration tests verify complete46-stop captions and identities in both
learner bundles and the protected review bundle, source/import hashes, preserved
model records, existing teaching and additive original source notices.
All356 independent source packets remain unchanged.154 lower-limb teaching
contexts acquire the guide/checklist;202 other teaching packets remain unchanged.
462 old-revision, old-material or foreign-frame requests stop before storage.
Four overlapping grouped review contexts retain their identity holds.

Guide review starts unchecked and unattested. Prior teaching approval does not
transfer to the new revision. Imaging approval stays unavailable; conceptual
teaching and camera bounds are not acquired-image registration.
Atlas, imaging-case and separately paid lecture rights remain independent.

The standalone lower-limb export also receives previously delivered modality
drafts that had only reached the regional learner/review module. Its five model
GLBs and two catalogues remain byte-identical to the preceding release.
All137 canonical website model entries are retained. No new dataset, model,
image, texture, font, dependency, paid service or mandatory fee is introduced.

Signed-in desktop/GPU/keyboard/zoom acceptance and revision-bound radiologist
sign-off remain required. Software evidence is not clinical or release clearance.
Existing lint debt and build chunk warnings are not resolved by this batch.
No CT-head masks, scans, private records or desktop Didanix files are changed.
The isolated desktop-layout branches remain unmerged and unpublished.

## Evidence and recovery

The main coordination workspace holds `work/um-guided-dissection-website-20261001-*`
logs, source/import inventories, fixtures, original failed checks and their
corrections, plus the dated checkpoint and recovery receipt. The final receipt
records the actual saved website HEAD, verified GitHub readback and C-only
incremental bundle prerequisite/hash. An incremental bundle is not a standalone
fresh restore. D-drive access is prohibited; historical `pending-d` filenames
on C do not imply a D backup. No new deployment is performed here.

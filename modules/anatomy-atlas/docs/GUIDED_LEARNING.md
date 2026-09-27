# Agent-authored guided learning

The owner requested agent-authored tours, grouped under **Guided learning**,
not an educator authoring dependency. The first local pilot is the existing
right-shoulder module: deltoid cover, infraspinatus, teres minor, supraspinatus,
subscapularis. Only supplied source-registered geometry is used.

## Learner behaviour

- Guided learning is an optional library surface alongside Explore, Dissect and
  Practice. The underlying Explore/Dissect session is retained, not overwritten.
- Start is manual. Back/Next move through captions, named source selections,
  layers and camera presets. Play advances every 12 seconds; Pause freezes
  playback and camera motion. The last step stays visible until Finish/Exit.
- Camera transitions use flowing 1.8-second orbital sweeps with quintic easing
  (zero endpoint velocity and acceleration), not a straight path through the model.
  Reduced
  motion uses immediate presets. Normal non-tour camera behaviour is unchanged.
- Exit restores the pre-tour camera, selection, systems, layers, separation,
  isolation, guides, inspection and zoom step. The capture is detached.
- Hidden tabs and unavailable/recovering WebGL pause without automatically
  resuming. Exit remains available if the model cannot render. Timers are cleaned
  up on pause, step, exit and unmount. No auto-start on entry.
- Conflicting controls are suspended during playback. Other workspaces retain
  their existing three-mode navigation until they have a supported tour library.

## Review and licensing

`lib/shoulder-tours.ts` separates teaching revision from the exact manifest mesh
revision; every selected structure must occur in the supplied manifest. Original
short captions cite the TTUHSC upper-limb anatomy table, not copied assets.
Existing BodyParts3D attribution remains visible, including during playback.
No new dependencies, paid service or third-party images.

The complete sequence appears in shoulder teaching-review evidence, including
captions, IDs, layers, camera directions, timing and references. Current teaching
fingerprints include the tour source; historical fingerprints are not migrated.
The checklist explicitly requires playing the sequence and checking framing.
No private decision is read or changed by the fingerprint scripts. All content
remains draft: the radiologist must check anatomy, omissions, views and teaching.

## Linking to CT/MRI (design, not delivered imaging)

Future steps can reference a stable anatomical ID plus an approved educational
case, series, image/frame or landmark and its revision. The integrated Didanix
Education/light viewer can present that scan beside the 3D tour. This does not
require changes to the separate clinical desktop application.

Two distinct capabilities must stay explicit:

1. **Semantic link:** show the same named structure in the 3D atlas and a reviewed
   CT/MRI image. This works without asserting that generic anatomy is registered
   to the individual scan. Multiple reviewed modality examples may be attached.
2. **Spatial link:** synchronized crosshair, slice plane or segmentation needs a
   verified coordinate transform/registration and matching scan revision. Patient
   DICOM orientation/spacing and laterality must be respected. No generic-mesh
   coordinates are to be passed off as patient-specific registration.

Teaching, atlas, case and lecture entitlements remain independent. A tour must
continue in 3D when an image is absent, uncleared or inaccessible; it may explain
the unavailable link but must not leak restricted previews or scan identifiers.
Resolve authorized case references server-side; don't embed private scans in
tour definitions, GitHub or public exports. The owner radiologist reviews
structure-to-image mapping; CT-head masks/boundaries remain in their specialist
task. No synthetic scan or unvalidated automatic overlay is a substitute.

## Next delivery

After source acceptance and recovery backup, regenerate/import the shoulder
learner and protected website review from this same commit. Shared camera and
navigation fingerprints also affect regional exports; synchronize those through
the established delivery checks. This document does not assert website delivery.
Then expand tours to source-supported regions. Defer "follow the brachial plexus"
until the relevant validated source geometry exists; do not invent nerves.

## Verification

Run `node scripts/test-shoulder-tours.mjs`,
`node scripts/test-shoulder-tour-session.mjs`, `node scripts/test-tour-camera.mjs`,
existing camera/shoulder/review tests, TypeScript and the shoulder module build.
Actual browser acceptance must cover desktop/mobile, all steps, pause/finish,
keyboard focus, text growth and entry/exit from altered camera/layer states.
Software acceptance is not clinical approval.

Source acceptance on 27 September 2026: 3 content/player tests, 6 actual host
session/navigation tests, orbit/pause/restore/reduced-motion/resize camera tests,
9-structure review transition test, 27 existing resize checks, 414 zoom checks,
14 keyboard tests, 235 review checks, 1,445 shoulder workspace checks, 18,990
saved-view checks, 169,949 navigation checks, 5 protected review queue tests and
4 review-hub rendering tests pass. TypeScript, targeted lint and production
shoulder build pass (existing large-chunk warning remains). Desktop and 375px
browser checks exercised library entry, all steps, actual autoplay to the last
step, Finish/Exit, restored surface layer, focus return and return to Explore.
The supraspinatus step now explicitly fades other structures for visibility.
No clinical decision, geometry, private scan, website deployment or desktop PACS
was changed. Website import and review integration are the next delivery step.

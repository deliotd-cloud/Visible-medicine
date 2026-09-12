# Viewer and CT integration direction — 11 September 2026

Status: design input for the active atlas goal, not a delivered CT viewer or clinical approval. The owner has identified themselves as the radiologist who will sign off the atlas. Approval still requires their explicit, revision-bound review; being the designated reviewer does not approve existing anatomy.

## References actually inspected

Additional 12 September reference: [hinumpy CT explorer: observed features, 30-minute claim and implementation notes](CT_EXPLORER_REEL_2026-09-12.md). This supplements the two demonstrations below and records separate evidence limits and a TotalSegmentator dataset lead; no third-party assets were admitted.

Both public Instagram pages and multiple playback frames were inspected in the browser. These observations concern the visible demonstrations, not independent verification of their code, anatomical accuracy, data licences, claimed AI workflow or registration quality.

- [Organ-focused viewer, posted by techinsixty](https://www.instagram.com/reel/DblSFPWtjLb/): a large central shaded organ, narrow organ-navigation rail, compact vertical tools and a right-hand information panel. Playback showed switching from the heart to the pancreas; contextual cards appear below the model. The caption credits thebuggeddev and describes on-demand model loading. We did not inspect that project's repository or verify its licence.
- [3D and cross-sectional demonstration, posted by darkvex.ai](https://www.instagram.com/reel/DdGfdchupq7/): a dark four-pane layout with a 3D organ view and three orthogonal image views, visible crosshairs and section planes. Other frames show a larger 3D/axial pair and several controls below it. The visual correspondence is useful inspiration; the reel does not establish the provenance or accuracy of any spatial registration.

No reel, screenshot, texture, model, scan, code or generated diagram from these demonstrations has been imported into the product. Retain their links as design references only. Independently audit any future candidate repository and every bundled asset before reuse; “open source” in a caption is not sufficient.

## Product direction

Use a compact **Explore / Dissect / Compare imaging** workflow, not another permanently expanded dashboard. CT is the first compare target; MRI follows the same volume-viewer contract. Keep the existing Visible Medicine brand, regional entry points, narrow system switches, source notices and separately entitled learning resources.

| Mode | Main workspace | Controls exposed by default |
| --- | --- | --- |
| Explore | Large regional or organ model | Search, compact anatomy rail, rotate/reset, selected-structure drawer |
| Dissect | Same model and orientation | Existing layer/focus choices, remove/undo and the chosen explode mechanism |
| Compare imaging | Model beside one image plane | Plane choice, one slice control, link state, overlay visibility and expand |

Advanced MPR opens a deliberate four-pane layout (3D plus axial/coronal/sagittal); it is not the default mobile layout. On narrow screens, switch between model and image while preserving selection and slice state. Avoid stacking every panel below the atlas. Put related cards/lectures in the selected-structure drawer, not in a permanent scrolling row.

### Presentation ideas to adapt

1. Make the selected anatomy visually dominant: restrained lighting, consistent materials, useful camera framing and quiet background context. Do not smooth away anatomical detail to mimic a promotional render.
2. Use a single shared structure selection and one information drawer across modes. Keep labels associated with projected screen side as already requested; show fewer labels until focused.
3. Use explicit, unobtrusive loading and unavailable states when moving between organ/region bundles. Selection must not claim success before a requested image mapping exists.
4. A small body/region locator can retain context when an isolated organ fills the view. It must not imply a precisely registered patient location.

## CT workflow and data boundaries

The existing code in `lib/imaging-sync.ts` and `app/imaging-link.tsx` implements opt-in **structure identity selection only**. It does not load CT, compute segmentations, register a scan or synchronize physical slice positions. Preserve that strict version-1 contract rather than adding unvalidated coordinates to it.

Implement two explicitly different kinds of comparison:

- **Teaching link, not registered:** atlas structure opens a reviewed example or labelled image location in the separate head/CT/MRI atlas. No precise slice plane is drawn through the generic 3D model. An example may be illustrative without representing the same person.
- **Spatially linked:** derive 3D surfaces from the same de-identified volume, or use an independently validated atlas-to-study transform. Only this state can drive a correctly positioned textured slice plane, synchronized crosshairs and spatial overlays.

Prefer the same-study reconstruction for the first spatial pilot. Label the scan-derived model separately from the generic reference atlas; never silently replace one with the other. The provisional Visible Medicine CT/MRI head atlas is the proposed first teaching-link integration, subject to inspection of its actual data and viewer interface. No interface compatibility is assumed.

Spatial work needs image position, orientation and pixel spacing in a defined patient frame. Row/column ordering, obliquity, per-frame geometry and unit conversions must be handled explicitly. A shared LPS convention alone does not align different subjects. [DICOM PS3.3 Image Plane Module](https://dicom.nema.org/medical/dicom/current/output/chtml/part03/sect_C.7.6.2.html).

Keep future spatial events separate from identity events. Bind them to the exact study/series, frame, transform revision, plane basis and millimetre coordinates, with message origin/replay protection. Reject missing, stale, ambiguous or mismatched mappings rather than guessing a slice from an atlas bounds centre. Product anatomy IDs map explicitly to reviewed segmentation IDs, including side and component/aggregate distinctions.

For linked slice inspection, use assembled anatomy at zero explode. Entering spatial compare should visibly restore the assembled pose; preserve the user's dissection state for returning to Dissect. Explode offsets, cutaway percentages and camera positions are presentation state, never patient coordinates.

Clicking a structure may select its reviewed segmentation and offer mapped image coverage. Clicking a labelled segmentation may select the matching atlas identity. Neither direction should automatically choose an arbitrary component or claim a precise anatomical point from a surface bounds centre. Keep window/level and overlay opacity under a compact disclosure.

X-ray teaching links remain projection-based, not an axial slice analogue. Untracked 2D ultrasound remains a labelled teaching link; spatial US needs its own calibration/tracking evidence. Do not infer a CT-like volume from an arbitrary ultrasound image.

## Implementation order and acceptance

1. Finish and verify the current source-preserving regional anatomy batch. Keep the private published atlas stable while new work is incomplete.
2. Inspect the actual CT/MRI head-atlas interface and rights-cleared data; define explicit identity mappings and separately entitled lecture links.
3. Build the compact compare shell and identity-only adapter against a clearly labelled fixture. Prove disconnected, missing mapping, wrong side, exam-pause and access-denied states without patient data.
4. Introduce one rights-cleared, de-identified teaching volume with its reviewed segmentation. Audit dependencies, codecs and assets individually; no paid runtime AI or mandatory service subscription.
5. Add same-study axial synchronization, then coronal/sagittal MPR, planes and overlays. Test asymmetric landmarks for left/right inversion, oblique planes, non-square spacing, frame changes, source revisions, reloads and return from explode. Define clinical tolerances with the owner before making accuracy claims.
6. Provide a bounded review packet to the owner/radiologist: exact image/model/content revisions, mapping evidence, orientation checks, known omissions and reproducible views. Record approval only after explicit sign-off.
7. Expand to other regions and modalities after that pilot passes. Review keyboard/touch control, small-screen layout and actual device performance. Keep imaging and lecture authorization independent of atlas subscription; never fetch protected lecture payloads merely to show a link.

No completion date for registered multimodal anatomy is implied by the earlier provisional 2–5 active-development-day estimate for a consolidated atlas review release. Real data readiness, integration and the owner's review determine the imaging schedule.

Related contracts: [Imaging link](IMAGING_LINK.md), [Clinical review and imaging gate](REVIEW_AND_IMAGING.md), [Website integration](WEBSITE_INTEGRATION.md).

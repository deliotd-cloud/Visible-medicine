# Prostate zonal teaching model

This is an original procedural illustration of the peripheral, transition and central zones and anterior fibromuscular stroma. It is opened from the verified outer-prostate entry, but is a separate reference diagram. Its shapes are not recovered BodyParts3D internal anatomy, an MRI segmentation, a patient mesh, or a registered replacement for the outer source surface.

The model uses normalized local coordinates: +X patient left, +Y superior and +Z anterior. The axial-section preset looks from the feet, with anterior up and patient right on the screen left. Larger axial edge markers are replaced by the camera-following compass during free rotation. The oblique cutaway is a 3D presentation, not an MRI plane. Section level and separation are illustrative controls, not distances or measurements.

The model canvas is keyboard-focusable. Arrow keys rotate, Shift gives finer rotation, and plus/equal or minus zoom within the viewer's limits. Tab leaves the canvas normally; browser shortcuts remain available. Manual keyboard movement cancels a running preset sweep and removes preset orientation markers. Zone selection, section level and source geometry do not change. Keyboard listeners and their owned accessibility attributes are removed when the scene unmounts.

`lib/prostate-zone-geometry.ts` defines mutually exclusive analytic compartments and generates their closed surfaces. The filled sections use the same fields. A small schematic urethral channel provides orientation; its course, dimensions and verumontanum are not clinically validated. No voxel arrays, source meshes, patient identifiers, external diagrams, or image textures were used to generate the illustration. The transition zone is paired; the central zone is separately tapered. The parameters are an author's illustrative choice and do not encode population volume fractions, disease severity, age or a particular patient.

Desktop embeds keep the study heading, zone choices and model tools together, with an independently scrolling teaching panel. Short or enlarged-text views remain scrollable. The canvas height is capped in tall embeds so preset framing is preserved. Entry focuses the study without moving the page; Escape or Back returns through the parent Atlas handler. Zone buttons retain their full accessible names at every width.

## MRI integration

### MRI recognition and practice

The selected-zone panel adds two closed disclosures: MRI recognition tips and a three-choice anatomy check. Answers use stable identifiers, not their displayed position. A new selection clears feedback; a different zone cannot inherit an answer. Escape closes the active disclosure and returns focus to its summary without closing the model. Nothing is scored persistently or sent to the imaging bridge.

The new original text and questions are draft teaching awaiting radiologist review. `lib/prostate-mri-teaching.ts` and `app/prostate-mri-teaching.tsx` are included in the model revision inputs. Changing teaching invalidates the package's prior identity; geometry bytes remain unchanged. Actual MRI pairing is still independent.

Reference reading was checked on 1 November 2026: ACR–ESUR–AdMeTech PI-RADS v2.1, normal-anatomy and CZ/AFS sections, and [Normal 3T MR Anatomy of the Prostate Gland and Surrounding Structures (2019)](https://pmc.ncbi.nlm.nih.gov/articles/PMC6558623/), peripheral/transition-zone anatomy. The latter's section 5.1 claims are not adopted: ACR's explicit zonal distinction governs the teaching. Sources support the referenced facts, not this procedural geometry. No source figure, table or scoring algorithm is reproduced.

The zonal study owns an isolated Didanix Education semantic connection. Zone buttons and mesh clicks publish the exact zone identity only after both the host and learner opt in. Incoming image selections highlight the matching zone without echoing back. These original entries have no reference point or patient coordinate. Their source identity is the versioned authored prostate package; the outer-prostate source is retained only as the explicit parent context.

The existing nested learning registry separately checks the exact parent bundle, original model revision, image resource, annotation, access and correspondence review. Missing or ambiguous mappings remain unavailable or require an explicit choice. Leaving the study, hiding the page, losing access or pausing the link cancels pending selection. No scan is connected by default; the MRI case must still be identified and cleared before an actual image link is enabled. The collapsed live-link control reports that state without adding a new viewer.

Each region has a stable Visible Medicine concept ID in `lib/prostate-zones.ts`. `prostateConceptSelection()` emits that ID, the model revision and a declared schematic coordinate frame. It deliberately supplies no voxel index, patient-space point, DICOM frame UID or transform. It is a concept selection contract, not an implemented patient registration.

To pair a local MRI:

1. Select an owner-approved prostate MRI and identify its study, series, image geometry and orientation locally. Preserve original scans and masks.
2. Segment or import separately reviewed PZ, TZ, CZ and anterior fibromuscular stroma where the images support those boundaries. Do not call a combined central-gland mask the central zone, and do not invent a CZ mask when it cannot be delineated.
3. Bind each segmentation's local label to the corresponding concept ID, with the exact source-series and segmentation revisions. Keep uncertainty or unavailable structures explicit.
4. Enable semantic selection in both directions through Didanix Education/light. Independent scan/Atlas permissions must be checked on each destination.
5. For spatial synchronization, use the actual DICOM image geometry and patient-derived segmentation. Test left/right, base/apex, origin, spacing, frame of reference and slice transforms. Do not affine-fit this idealized diagram to a patient and describe the result as validated registration.
6. Request radiologist approval against the exact model/segmentation/teaching revisions. Preserve the approval scope; geometry approval does not imply lesion or scoring approval.

No MRI data or MRI link has been supplied to this draft. No existing CT-head or prostate segmentation is changed by this feature. The desktop PACS is out of scope.

## Required clinical review

- Shape and relative extent of each compartment in assembled, isolated, basal, mid-gland and apical views.
- PZ anterior extent, paired TZ position, basal CZ taper, anterior stroma extent, and schematic urethral channel.
- Actual camera left/right and superior/inferior orientation; diagram captions and distinction from patient anatomy.
- Any future patient-derived masks, ambiguous boundaries, case rights, linked teaching and all image transforms independently.

The model remains a draft; automated topology tests establish closed surfaces and deterministic IDs, not anatomical correctness.

## Sources and rights

Anatomical reference: ACR–ESUR–AdMeTech, *PI-RADS v2.1* (2019), Section II and Figure 1, accessed 31 October 2026 via the [ACR reference page](https://www.acr.org/Clinical-Resources/Clinical-Tools-and-Reference/Reporting-and-Data-Systems/PI-RADS) and its [current document link](https://edge.sitecorecloud.io/americancoldf5f-acrorgf92a-productioncb02-3650/media/ACR/Files/RADS/PI-RADS/PIRADS-2019.pdf).

This work uses anatomical facts as reference. No ACR figure, sector map, photograph, scan, logo, scoring table or mesh is copied or bundled; no permission to redistribute those assets is implied. The model and implementation are original Visible Medicine code under the existing project MIT licence. Existing React/Three.js dependencies and their notices remain applicable; no new dependency, font, model dataset or paid service was introduced. The outer BodyParts3D prostate keeps its existing separate provenance and notices.

## Camera orientation

A compact anatomical compass follows the actual camera rotation during orbit, keyboard navigation and preset sweeps. It uses the existing schematic convention: X points left, Y points superior/base and Z points anterior. It carries no DICOM or patient-space coordinates. Near end-on and overlapping rear labels are suppressed for legibility. The settled axial preset retains its larger R/L/A/P edge markers; moving away from that preset brings back the rotating compass. The compass does not intercept mouse, touch or keyboard controls. Its visual description updates without a live announcement on every animation frame.

Both the orientation component and its pure projection helper belong in the prostate source-revision input list. Regenerate source/review bindings through the normal pipeline before integrating this change. No approval is inherited from the prior viewer revision.

# Prostate zonal teaching model

This is an original procedural illustration of the peripheral, transition and central zones and anterior fibromuscular stroma. It is opened from the verified outer-prostate entry, but is a separate reference diagram. Its shapes are not recovered BodyParts3D internal anatomy, an MRI segmentation, a patient mesh, or a registered replacement for the outer source surface.

The model uses normalized local coordinates: +X patient left, +Y superior and +Z anterior. The axial-section preset looks from the feet, with anterior up and patient right on the screen left. Orientation markers disappear during free rotation. The oblique cutaway is a 3D presentation, not an MRI plane. Section level and separation are illustrative controls, not distances or measurements.

`lib/prostate-zone-geometry.ts` defines mutually exclusive analytic compartments and generates their closed surfaces. The filled sections use the same fields. A small schematic urethral channel provides orientation; its course, dimensions and verumontanum are not clinically validated. No voxel arrays, source meshes, patient identifiers, external diagrams, or image textures were used to generate the illustration. The transition zone is paired; the central zone is separately tapered. The parameters are an author's illustrative choice and do not encode population volume fractions, disease severity, age or a particular patient.

## MRI integration

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

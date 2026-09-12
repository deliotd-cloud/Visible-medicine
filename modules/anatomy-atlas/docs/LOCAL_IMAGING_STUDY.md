# Local CT + same-study 3D review

## What is implemented

`/imaging/local` opens a user-selected `.vmatlas` file in browser memory. The Review workspace contains one link; no new permanently expanded atlas toolbar is added. A compact side rail contains search and accepted-mask selection. Image adjustments and correction controls are collapsed. Desktop shows 3D and three orthogonal reformats; smaller displays use view buttons. Rendering preserves aspect ratio within each pane.

- Source-derived surfaces, axial/coronal/sagittal reformats and crosshairs share LPS millimetres and one source CT grid.
- Select a structure in the list, image or 3D view. The list starts on an actual labelled voxel, not an empty centroid. A selected overlapping label retains priority; otherwise image picking chooses the smallest matching label.
- Isolate selection or retain faded context. Explicit source hierarchy prevents rendering an aggregate and its children on top of each other by default.
- Window/level, opacity, slice sliders, keyboard crosshair navigation, rotate/zoom and 3D plane guides. There is deliberately no explosion in this aligned view: displaced surfaces must not pretend to correspond to the CT.
- Include/exclude marks record structure ID, original mask hash and physical coordinate. Export is a local JSON download, **not a mask edit or an approval**. Closing/clearing warns about marks; leaving the page uses the browser's unsaved-work warning. Export does not clear the review set.
- File validation rejects corrupt bodies, mismatched block lengths, invalid grids, overlapping ranges, non-binary packing, invalid indices, cyclic included hierarchy, unaccepted mask claims and unsupported modalities. These are integrity checks, not authenticated clinical signatures.
- CT remains usable if the 3D renderer fails; images are cleared on failure rather than replaced by a misleading placeholder.

No fetch, upload endpoint, persistence, telemetry, DICOM decoder or hosted scan resource was added. Application code may be served by the website; this page does not transmit the selected study. Private files must not be placed in `public/`, this source tree, GitHub, or a deployment archive. `.gitignore` adds defence-in-depth for common imaging formats; it is not a privacy review or a complete leak prevention system.

## Reuse the existing CT Head Atlas

The pilot reads the CT project's saved state and accepted annotation revision. It does not rerun segmentation, alter the source NIfTI/masks, open the Slicer scene, change the workbook, or promote drafts. The prepared private checkpoint has **24 accepted binary masks**; it does not mean all masks in the scene are approved. Curves and pending posterior-fossa corrections are not included as approved surfaces.

Use the existing CT-head Python environment, with no new installation:

```powershell
& '<CT-project>\work\segmentation\.venv\Scripts\python.exe' scripts/export-local-ct-study.py --state '<CT-project>\work\segmentation\LATEST_ATLAS_STATE.json' --output '<private-directory>\new-study.vmatlas'
node scripts/validate-local-imaging.mjs --study '<private-directory>\new-study.vmatlas'
```

Substitute actual local paths; the output must not exist and must remain outside this repository and original-data directory. The exporter verifies the saved annotation hash, CT hash, mask hashes, mask affines and source dimensions, then rechecks originals after processing. It refuses non-integer/out-of-range HU narrowing. The binary conversion is exact for this source: no windowing, image resampling, mask smoothing or mesh simplification. Network connections are disabled in the exporter. A local `.export.json` companion records provenance and aggregate QA, not patient demographics.

The tested private export contains 24 masks / 514,840 surface triangles. Source voxels remain full resolution; displayed reformats are capped at 384 pixels per dimension for this initial review pilot. Package size is capped at 256 MiB, not total browser RAM. The current package is approximately 135 MiB and requires more memory for hashing, geometry, normals and graphics. Mobile layout support does not yet imply tested mobile performance. No local GPU/browser acceptance is claimed.

## Architecture and coordinate contract

| Layer | Responsibility |
| --- | --- |
| `scripts/export-local-ct-study.py` | Read-only checkpoint reuse, exact HU/mask encoding, unsmoothed 0.5 binary isosurfaces |
| `lib/local-imaging-study.ts` | Bounded parsing, integrity checks, nearest-label picking, crosshairs and source-bound review export |
| `lib/volume-reslice.ts` | Existing affine-aware scalar sampling, patient-plane grids, trilinear CT and DICOM LINEAR VOI |
| `app/local-imaging-workbench.tsx` | Explicit local file selection; shared review state; independent image/3D failure handling |

Binary layout: ASCII `VMATLAS1`, uint32-LE JSON length and body length at byte 8 and 12, UTF-8 manifest at byte 16, padding to the next 8-byte boundary, then 8-byte-aligned binary blocks. Offsets are relative to the body start. Manifest schema is `vm-local-study/1`; body SHA-256 covers binary content. Manifest fields are not signed. Only a trusted local exporter and independent source hashes establish provenance; changing a header cannot constitute an authenticated approval.

The CT uses signed int16 HU with i-fastest ordering. Each binary mask is bounding-box cropped, i-fastest, little-endian bit packed with zero padding bits. Surface positions are float32 native **LPS mm**, indices uint32. NIfTI RAS affine is converted using `diag(-1,-1,1,1)` exactly once. Voxel-centre positions and 0.5 isosurfaces use the same affine; zero padding closes masks at crop edges. Reflections adjust face winding. Do not apply the generic atlas display scale/rotation to these native coordinates.

Native anatomical IDs remain the source `cth.*` IDs. This is same-study spatial linkage, **not registration of the generic atlas to a patient**. A reviewed `cth.*` ↔ atlas-ID crosswalk and provenance/entitlement-aware resource resolver are still required before offering generic atlas → paid CT/MRI/lecture links. A 3D atlas subscription must not silently grant lecture access. This local-file review feature does not change subscription entitlements or expose protected resources.

## What the radiologist should do next

1. Open the prepared private file on a machine with the updated application. Select one easily recognisable accepted structure, such as a lateral ventricle, then a smaller structure such as a lens. Confirm left/right, superior/inferior, CT windowing and surface/overlay correspondence in all three views against the original Slicer scene.
2. Review a small batch of related structures. Use include/exclude marks where a boundary is suspect, then **Export review marks before closing**. Point marks locate review issues; they are not full boundary contours or permission for automatic volume changes.
3. For the outstanding midbrain review, retain the existing draft and provide representative axial, sagittal and coronal contours/landmarks together. That draft is deliberately not represented as accepted in this package. An explicit draft-review package and source-bound importer are the next engineering step; preserve accepted cerebellar boundaries and compare voxel-difference/contact maps before accepting any candidate.
4. Once you accept the coordinate/viewer pilot, move through the remaining CT structures in batches; add MRI using its own geometry and modality-specific contrast. Same-patient multimodal alignment requires a reviewed transform; a filename or matched structure name is insufficient. Other body-part dissections and source-audited anatomy remain a parallel workstream.

## Acceleration policy

Reuse existing accepted masks and installed outputs before inference. For remaining draft targets, evaluate existing SynthSeg CT results and commercially permitted TotalSegmentator tasks as **proposals**, then batch-correct in Slicer. Do not replace accepted masks or assume automated labels cover fine nuclei, cranial nerves or ambiguous CT soft-tissue boundaries. Seeded segmentation and interpolation may reduce drawing work but do not remove radiological review.

The audited official TotalSegmentator `brain_structures` task requires a commercial licence; nnInteractive's official weights have a non-commercial restriction. Neither is introduced here. Existing AMD hardware does not establish CUDA compatibility; no GPU software or paid runtime is installed. Precise correction time depends on target complexity and feedback, not on a claimed single-prompt generation time.

Primary references: [NiBabel coordinates](https://nipy.org/nibabel/coordinate_systems.html), [scikit-image marching cubes](https://scikit-image.org/docs/stable/api/skimage.measure.html#skimage.measure.marching_cubes), [Slicer Segment Editor](https://slicer.readthedocs.io/en/latest/user_guide/modules/segmenteditor.html), [SynthSeg](https://github.com/BBillot/SynthSeg), [TotalSegmentator subtask licences](https://github.com/wasserth/TotalSegmentator#subtasks), [nnInteractive licence split](https://github.com/MIC-DKFZ/nnInteractive#license).

## Release and validation still required

- Consultant sign-off of anatomical boundaries, laterality, completeness and pathology suitability; source-mask acceptance is not viewer approval.
- Independent original-DICOM/Slicer comparison of HU, source-series choice, obliquity, slice origin/spacing and labels. This exporter reuses the existing reviewed NIfTI grid rather than independently decoding each DICOM frame. Explicitly assess padding, reconstruction, partial volume and surface closure.
- Device/browser validation: layout, touch, selection, crosshair alignment, memory, context loss, resizing and review-mark export. CPU/SSR tests do not certify these.
- Privacy/rights release: metadata, private tags, structured reports, burned-in text and reconstructable facial features. User-stated anonymisation/approval is recorded, but intake metadata flags were not sufficient to certify all supplied cases for publication. No data is released through this feature.
- Reviewed import of correction marks into a **new draft**, complete source pin verification, before/after differences, rollback and explicit sign-off. This milestone exports marks only.
- MRI/X-ray/US ingest and model-specific registration, durable annotation access control, independent lecture entitlements and production security review. None is implied by an accepted local file.

Run `node scripts/validate-local-imaging.mjs` for synthetic parser, geometry, failure and initial-render tests; add `--study` only for a private local file. The actual-study check validates each surface vertex against source-grid half-voxel geometry and renders all three planes for every included structure without logging pixels. Also run TypeScript, `npm run volume-viewer:test`, and the normal production build.

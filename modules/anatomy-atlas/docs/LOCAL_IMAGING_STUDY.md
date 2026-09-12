# Local CT + same-study 3D review

## What is implemented

`/imaging/local` opens a user-selected `.vmatlas` file in browser memory. The Review workspace contains one link; no new permanently expanded atlas toolbar is added. A compact side rail contains search and mask selection; explicitly included drafts carry a visible Draft badge and a boundary-review warning. Image adjustments and correction controls are collapsed. Desktop shows 3D and three orthogonal reformats; smaller displays use view buttons. Rendering preserves aspect ratio within each pane.

- Source-derived surfaces, axial/coronal/sagittal reformats and crosshairs share LPS millimetres and one source CT grid.
- Select a structure in the list, image or 3D view. The list starts on an actual labelled voxel, not an empty centroid. A selected overlapping label retains priority; otherwise image picking chooses the smallest matching label.
- Isolate selection or retain faded context. Explicit source hierarchy prevents rendering an aggregate and its children on top of each other by default.
- Window/level, opacity, slice sliders, keyboard crosshair navigation, rotate/zoom and 3D plane guides. There is deliberately no explosion in this aligned view: displaced surfaces must not pretend to correspond to the CT.
- Include/exclude marks record structure ID, original mask hash and physical coordinate. Export is a local JSON download, **not a mask edit or an approval**. Closing/clearing warns about marks; leaving the page uses the browser's unsaved-work warning. Export does not clear the review set.
- File validation rejects corrupt bodies, mismatched block lengths, invalid grids, overlapping ranges, non-binary packing, invalid indices, cyclic included hierarchy, unlisted drafts and unsupported modalities. Accepted-only files cannot silently include drafts. These are integrity checks, not authenticated clinical signatures.
- CT remains usable if the 3D renderer fails; images are cleared on failure rather than replaced by a misleading placeholder.

No fetch, upload endpoint, persistence, telemetry, DICOM decoder or hosted scan resource was added. Application code may be served by the website; this page does not transmit the selected study. Private files must not be placed in `public/`, this source tree, GitHub, or a deployment archive. `.gitignore` adds defence-in-depth for common imaging formats; it is not a privacy review or a complete leak prevention system.

## Reuse the existing CT Head Atlas

The pilot reads the CT project's saved state and accepted annotation revision. It does not rerun segmentation, alter the source NIfTI/masks, open the Slicer scene, change the workbook, or promote drafts. The prepared private checkpoint has **24 accepted binary masks**; it does not mean all masks in the scene are approved. Curves and pending posterior-fossa corrections are not included as approved surfaces.

A separate posterior-fossa **draft review** export now includes those 24 accepted masks plus five unapproved masks: midbrain, pons, left/right cerebellar hemispheres and vermis (29 masks / 784,790 triangles). It opens on the first explicitly requested target, currently midbrain. This is an unchanged copy of the existing drafts for review, not a boundary correction. The original accepted-only package remains available and unchanged.

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

Binary layout: ASCII `VMATLAS1`, uint32-LE JSON length and body length at byte 8 and 12, UTF-8 manifest at byte 16, padding to the next 8-byte boundary, then 8-byte-aligned binary blocks. Offsets are relative to the body start. Manifest schema `vm-local-study/1` is accepted-only. Schema `vm-local-study/2` additionally requires `reviewMode: mixed-draft-review` and 1–16 explicit, unique `reviewTargetIds`; each must match a `draft-unapproved` structure. No other draft is admitted. Body SHA-256 covers binary content. Manifest fields are not signed. Only a trusted local exporter and independent source hashes establish provenance; changing a header cannot constitute an authenticated approval.

The CT uses signed int16 HU with i-fastest ordering. Each binary mask is bounding-box cropped, i-fastest, little-endian bit packed with zero padding bits. Surface positions are float32 native **LPS mm**, indices uint32. NIfTI RAS affine is converted using `diag(-1,-1,1,1)` exactly once. Voxel-centre positions and 0.5 isosurfaces use the same affine; zero padding closes masks at crop edges. Reflections adjust face winding. Do not apply the generic atlas display scale/rotation to these native coordinates.

Native anatomical IDs remain the source `cth.*` IDs. This is same-study spatial linkage, **not registration of the generic atlas to a patient**. A reviewed `cth.*` ↔ atlas-ID crosswalk and provenance/entitlement-aware resource resolver are still required before offering generic atlas → paid CT/MRI/lecture links. A 3D atlas subscription must not silently grant lecture access. This local-file review feature does not change subscription entitlements or expose protected resources.

## What the radiologist should do next

1. Open the prepared private file on a machine with the updated application. Select one easily recognisable accepted structure, such as a lateral ventricle, then a smaller structure such as a lens. Confirm left/right, superior/inferior, CT windowing and surface/overlay correspondence in all three views against the original Slicer scene.
2. Review a small batch of related structures. Use include/exclude marks where a boundary is suspect, then **Export review marks before closing**. Point marks locate review issues; they are not full boundary contours or permission for automatic volume changes.
3. For the outstanding midbrain review, open the separate draft review package and assess representative axial, sagittal and coronal boundaries together. Export review marks and use the source-checked Slicer conversion below. The midbrain remains unapproved. Marks are location hints, not complete contours: make any boundary changes in a separate draft, preserve previously accepted cerebellar edges, and compare voxel-difference/contact maps before accepting a candidate.
4. Once you accept the coordinate/viewer pilot, move through the remaining CT structures in batches; add MRI using its own geometry and modality-specific contrast. Same-patient multimodal alignment requires a reviewed transform; a filename or matched structure name is insufficient. Other body-part dissections and source-audited anatomy remain a parallel workstream.

## Acceleration policy

### Candidate correction comparison

The optional, collapsed **Compare candidate** section accepts a source-verified `.vmcompare` attachment with candidate/addition/removal/warning layers, without duplicating the CT volume or replacing the authoritative study. See [packaging, use and validation limits](LOCAL_MASK_COMPARISON.md#ct3d-comparison-attachment). [Candidate-specific feedback](LOCAL_CANDIDATE_REVIEW.md) now exports separately from baseline feedback and can return to Slicer as source-checked locked fiducials. This software change includes no real midbrain correction or accepted-boundary ROI.

[The private mask-comparison tool](LOCAL_MASK_COMPARISON.md) now checks an explicitly supplied candidate against its source-bound baseline, reporting exact added/removed voxels, physical extents, native-slice counts and overlaps with every other accepted binary mask. Optional reviewer-defined protected ROI masks test whether previously accepted boundary voxels retained their baseline state. It writes review-only difference maps to a new private directory, or nothing in check-only mode. No mask correction, source edit, automatic approval or upload is performed. Verbal midbrain feedback is already recorded in the CT task; precise boundary limits still need localisation, not invention.

### Draft export and Slicer return

Append `--review-draft cth.bst.midbrain` to the CT export command for an explicitly requested unfinished target; repeat the flag for other targets. Only source entries with `approved: false`, `status: IN_PROGRESS_PARTIAL`, binary masks and matching source hashes/geometry are eligible. The default remains accepted-only. A missing, duplicate, accepted or invalid draft request fails rather than silently changing scope.

After a real review in the atlas, export the marks locally, then run:

```powershell
& '<CT-project>\work\segmentation\.venv\Scripts\python.exe' scripts/import-local-review-marks.py --state '<CT-project>\work\segmentation\LATEST_ATLAS_STATE.json' --review '<private-directory>\visible-medicine-local-review.json' --output-dir '<private-directory>\new-slicer-review' --allow-draft cth.bst.midbrain
```

Repeat `--allow-draft` only for draft IDs actually present in the review; omit it for accepted-mask review. `--check-only` validates without creating files. Source annotation, CT, masks and review fingerprints must match. The converter rejects malformed/oversized JSON, duplicate keys, non-finite/out-of-bounds points, unknown IDs, stale source revisions, unrequested drafts and overwriting existing directories. It creates one locked `.mrk.json` fiducial list per structure/action, with unchanged LPS millimetre positions, and a `REVIEW_MANIFEST.json` containing hashes. Opposing include/exclude marks in the same voxel are retained and flagged for the radiologist; they are not automatically resolved. Missing manifest means incomplete output and must not be imported.

In the original CT-head Slicer scene, verify the source revision against the manifest, then add these files using **Add Data**. They are independent point lists, not segments. Do not manually flip LPS coordinates, attach an unrelated transform or overwrite the original scene. Keep marks locked, correct a separate draft segmentation, and save a new private scene. No script opens Slicer, changes a mask, invents user feedback or grants acceptance. Actual Slicer loading and radiological review remain to be checked by the owner. The implementation follows the [official Slicer Markups format and loading documentation](https://slicer.readthedocs.io/en/5.10/developer_guide/script_repository/markups.html) and [versioned schema](https://github.com/Slicer/Slicer/blob/main/Modules/Loadable/Markups/Resources/Schema/markups-schema-v1.0.3.json).

`scripts/local_ct_checkpoint.py` shares original-data verification between export and import. `scripts/validate-local-review-import.py` tests synthetic oblique-grid round trips and failure guards. Optional paired `--state` / `--study` arguments test read-only coordinate probes against the real saved source; these probes are not user feedback and no real review files are written. `validate-local-imaging.mjs --study <draft-file> --compare <accepted-file>` additionally proves the previous CT values and included accepted masks/surface buffers remain byte-identical.

Reuse existing accepted masks and installed outputs before inference. For remaining draft targets, evaluate existing SynthSeg CT results and commercially permitted TotalSegmentator tasks as **proposals**, then batch-correct in Slicer. Do not replace accepted masks or assume automated labels cover fine nuclei, cranial nerves or ambiguous CT soft-tissue boundaries. Seeded segmentation and interpolation may reduce drawing work but do not remove radiological review.

The audited official TotalSegmentator `brain_structures` task requires a commercial licence; nnInteractive's official weights have a non-commercial restriction. Neither is introduced here. Existing AMD hardware does not establish CUDA compatibility; no GPU software or paid runtime is installed. Precise correction time depends on target complexity and feedback, not on a claimed single-prompt generation time.

Primary references: [NiBabel coordinates](https://nipy.org/nibabel/coordinate_systems.html), [scikit-image marching cubes](https://scikit-image.org/docs/stable/api/skimage.measure.html#skimage.measure.marching_cubes), [Slicer Segment Editor](https://slicer.readthedocs.io/en/latest/user_guide/modules/segmenteditor.html), [SynthSeg](https://github.com/BBillot/SynthSeg), [TotalSegmentator subtask licences](https://github.com/wasserth/TotalSegmentator#subtasks), [nnInteractive licence split](https://github.com/MIC-DKFZ/nnInteractive#license).

## Release and validation still required

- Consultant sign-off of anatomical boundaries, laterality, completeness and pathology suitability; source-mask acceptance is not viewer approval.
- Independent original-DICOM/Slicer comparison of HU, source-series choice, obliquity, slice origin/spacing and labels. This exporter reuses the existing reviewed NIfTI grid rather than independently decoding each DICOM frame. Explicitly assess padding, reconstruction, partial volume and surface closure.
- Device/browser validation: layout, touch, selection, crosshair alignment, memory, context loss, resizing and review-mark export. CPU/SSR tests do not certify these.
- Privacy/rights release: metadata, private tags, structured reports, burned-in text and reconstructable facial features. User-stated anonymisation/approval is recorded, but intake metadata flags were not sufficient to certify all supplied cases for publication. No data is released through this feature.
- Actual Slicer loading of the source-checked review point lists, corrections in a **new draft**, before/after voxel differences, rollback and explicit sign-off. The converter creates review marks only; automatic mask editing is intentionally absent.
- MRI/X-ray/US ingest and model-specific registration, durable annotation access control, independent lecture entitlements and production security review. None is implied by an accepted local file.

Run `node scripts/validate-local-imaging.mjs` for synthetic parser, geometry, failure and initial-render tests; add `--study` only for a private local file. The actual-study check validates each surface vertex against source-grid half-voxel geometry and renders all three planes for every included structure without logging pixels. Also run TypeScript, `npm run volume-viewer:test`, and the normal production build.

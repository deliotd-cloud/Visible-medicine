# Private CT mask candidate comparison

This local tool makes a proposed correction easier to review. It does **not** create the candidate segmentation, change any source file, open Slicer, grant approval or upload a scan. It uses the existing CT-head Python environment and NumPy/NiBabel; no model download, GPU, paid API or additional dependency is required.

## What it produces

- Exact added and removed foreground counts and volumes in mm³.
- Counts on every original I/J/K slice, plus occupied-voxel-centre bounds and centroids in physical RAS millimetres. These are not automatically labelled axial/coronal/sagittal: an oblique acquisition can have different native axes.
- Baseline/candidate overlap and six-face adjacency counts against **every accepted binary mask**, excluding the target itself. Existing overlap is reported separately from added overlap; nested anatomy can legitimately overlap.
- Optional exact checks of reviewer-supplied protected ROI masks, including both included and excluded target voxels within an accepted boundary region.
- Two source-grid NIfTI label maps, a plain-language README and a hashed `COMPARISON_MANIFEST.json` written last as the completion marker.

No smoothing, interpolation, reorientation or resampling occurs. Dice is labelled **agreement between versions**, not anatomical accuracy; two empty masks receive no score. Empty targets and absent protected boundary ROIs are explicit review signals. A protected accepted mask that is empty, stale or malformed fails validation.

## Prepare a candidate

1. In the existing CT-head workflow, preserve the baseline and accepted masks. Make the intended correction in a **separate draft**, using all three planes. Export a binary NIfTI on the original CT grid to a fresh private working directory outside this repository and the original source directory.
2. Copy the source annotation, CT and target-mask SHA256 values from the verified baseline checkpoint into the candidate request below. Hash the candidate file. A shared filename or matching grid is not proof of patient identity: verify that the candidate was derived from that exact source.
3. If particular boundary portions have already been accepted, supply binary ROI masks identifying the voxels that must keep their baseline state. No automated tool here can recover a precise protection region from a verbal acceptance statement. Do not draw a synthetic protection ROI and call it clinician-approved.

Your saved midbrain request specifies axial overcoverage and insufficient superior extent in sagittal/coronal views. Those comments are preserved in the CT task; their exact boundary limits have not been marked. Use the comparison to assess a properly localised proposed trim/extension, not to substitute guessed limits for that review. Previously accepted cerebellar edges must remain protected.

## Candidate request

Save `candidate.json` next to the candidate and optional ROI files in the private directory. Substitute the actual hashes; placeholders deliberately cannot validate. `protectedRegions` can be empty, but the report will then state that no explicit accepted-boundary preservation check was possible.

```json
{
  "schema": "vm-mask-candidate/1",
  "structureId": "cth.bst.midbrain",
  "sourceAnnotationSha256": "REPLACE_WITH_BASELINE_ANNOTATION_SHA256",
  "sourceCtSha256": "REPLACE_WITH_REFERENCE_CT_SHA256",
  "baselineMaskSha256": "REPLACE_WITH_BASELINE_MASK_SHA256",
  "candidate": {
    "file": "midbrain-candidate.nii.gz",
    "sha256": "REPLACE_WITH_CANDIDATE_SHA256"
  },
  "protectedRegions": [
    {
      "id": "accepted-boundary",
      "file": "accepted-boundary-roi.nii.gz",
      "sha256": "REPLACE_WITH_ROI_SHA256"
    }
  ]
}
```

Only relative file paths confined to the request directory are allowed. Region IDs are simple lowercase identifiers, not patient names. The request explicitly binds the source revision and target; it is an integrity contract, not a signed clinical attestation.

## Run locally

From the atlas source directory, use the CT project's already installed Python:

```powershell
& '<CT-project>\work\segmentation\.venv\Scripts\python.exe' scripts/compare-local-mask-candidate.py --state '<CT-project>\work\segmentation\LATEST_ATLAS_STATE.json' --request '<private-candidate-directory>\candidate.json' --allow-draft cth.bst.midbrain --check-only
```

`--check-only` writes nothing and prints only aggregate counts/signals, not coordinates, source paths or headers. To save the full private report and maps, replace `--check-only` with `--output-dir '<new-private-review-directory>'`. That directory must not exist. Do not select the original-data directory, repository or source-state directory. For an accepted baseline omit `--allow-draft`; a candidate compared with an accepted baseline **remains unapproved**.

The CLI checks exact annotation/CT/baseline/candidate/ROI hashes, binary values, grid shape and affine, explicit NIfTI transforms and units. It rejects conflicting active qform/sform transforms, unsupported or oversized inputs, stale sources, non-finite values and overwrite attempts. Mask headers with unknown spatial units inherit millimetres only after matching the verified millimetre CT grid; explicit non-mm masks are rejected. Native source units and this assumption remain in the report. Inputs are hashed again before completion.

Current limits: one target per request, up to 16 explicit protected ROIs, 3-D single-file `.nii`/`.nii.gz`, no dimension over 8,192, at most 128 million voxels and 512 MiB per external mask file. Slab reading limits transient input allocation, but several full-volume arrays are retained; a large study can require substantial desktop RAM. This is not a browser/mobile memory guarantee.

## Review in Slicer

Load the original CT and the proposed candidate independently. Add the generated label maps on the same grid, with **no extra transform**. Confirm orientation, patient/source revision and overlay agreement before trusting any result. Nothing in the script drives Slicer or changes its current scene.

| File | Values |
| --- | --- |
| `changes.nii.gz` | 0 unchanged/background; 1 added foreground; 2 removed foreground |
| `protected-conflicts.nii.gz` | Bit 1: added overlap with accepted structure; bit 2: removed overlap; bit 4: changed voxel in explicit protected ROI. Values 5/6 combine flags. |

These are review overlays, **not corrected segmentations**. Choose appropriate label colours/opacity in Slicer. A nonzero overlap flag is not automatically an anatomical error. Adjacency counts refer to six voxel-index face neighbours, not proven surface contact or a physical clearance measurement. No distances, Hausdorff scores, closed-surface claims or segmentation-quality certification are inferred.

New output headers omit original descriptions, extensions and demographics, but review maps can still reveal anatomy. Keep the whole output private and out of GitHub, `public/`, lecture material and deployment archives. If the completion manifest is missing, the output is incomplete. A file hash does not authenticate a reviewer or constitute approval.

After inspecting changes and accepted boundaries, save any revised candidate as a separate new draft. Only the radiologist can accept it through the existing CT workflow; this tool never updates annotation JSON, accepted-mask status, workbook or scene.

## Validation

`scripts/validate-local-mask-comparison.py` tests synthetic oblique geometry, exact voxel counts and map round trips, deterministic gzip encoding, preservation of sources, new/existing overlaps, ROI additions/removals, units and transform conflicts, bad binary values, stale/duplicate inputs, forbidden paths, overwrite/partial-output guards, empty masks and offline operation.

Optional `--state <saved-state>` runs an additional **read-only identity probe**, using the original midbrain as its own candidate and checking all accepted binary masks. It writes no private output and generates no real clinical feedback. Zero differences in that probe verify compatibility, not the correctness of the midbrain anatomy.

The coordinate/header handling follows the [NiBabel NIfTI affine and scaling documentation](https://nipy.org/nibabel/nifti_images.html) and [coordinate-system documentation](https://nipy.org/nibabel/coordinate_systems.html). The underlying CT ingestion and original-DICOM agreement still require separate validation; the helper reuses the existing source checkpoint. Actual Slicer loading, radiologist correction and sign-off remain outstanding.

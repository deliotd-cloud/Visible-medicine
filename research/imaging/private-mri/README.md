# Private native MRI preparation pilot

Local preprocessing tools for a future modality-aware Visible Medicine viewer. This directory contains code and documentation only: **no scans, patient-derived images, private manifests or clinical approvals**. It is not an atlas feature release and does not change the CT-head project or the website.

## Scope and safety

- Reads a SHA-pinned ZIP from the owner's local `D:/Cases` intake; never extracts or alters the original DICOM files. Output must be a new directory immediately within the configured D recovery folder. Existing packets cannot be overwritten.
- Supports a deliberately narrow profile: classic single-frame BIPED MR, MONOCHROME2, 16-bit integers, JPEG 2000 lossless, identity rescale, consistent dimensions/orientation/spacing and near-uniform slice positions. Enhanced MR, localizers, lossy encoding, intensity mappings, shear and unsupported geometry are held, not silently coerced.
- Uses the existing local imaging Python environment, with pydicom explicitly selecting GDCM. No package installation, paid service, network transfer, segmentation or inference occurs.
- Retains original decoded integer signal, `[column,row,slice]` array ordering and DICOM LPS geometry; converts the affine to NIfTI RAS+. The full sform is authoritative; qform is unset. MRI signal is **not CT Hounsfield units** or a calibrated quantitative map.
- Keeps individual source positions and the affine-fit residual. Nominal slice thickness is not slice-centre spacing. Acquisition gaps remain explicit: native planes only, no invented intervening tissue or isotropic-volume claim.
- Writes three display-windowed review PNGs and a NIfTI; percentile windowing changes only PNG appearance. Completion manifest is written last. Incomplete output without the manifest must not be admitted.
- Export metadata excludes raw UIDs, patient fields, source filenames and DICOM free text. This is not complete de-identification: source headers and all pixels still require the owner's privacy/clinical review. Derived packets are PRIVATE, with all publication/approval fields false and no atlas registration.

## Local usage

Use the existing approved imaging environment containing pydicom, NumPy, NiBabel, Pillow and python-gdcm. Do not install a replacement environment merely to run this pilot. The source/archive and output-root guards in the script are intentionally workstation-specific.

```powershell
& $imagingPython ./prepare-private-mri.py --intake $privateIntake --case $caseAlias --series $seriesAlias --check-only
& $imagingPython ./prepare-private-mri.py --intake $privateIntake --case $caseAlias --series $seriesAlias --output $newPrivatePacket
& $imagingPython ./validate-private-mri.py --packet $newPrivatePacket
```

The private intake, created separately, must contain `LOCAL-ONLY-source-manifest.json` (an array with `case`, `archivePath`, `archiveSha256`, and `seriesUidSha256ToAlias`) and `inventory.json` (`cases[].case`, `cases[].series[]` with `series`, `modalities`, `localizer`, `instances`). Never commit these populated files. This code is not a general-purpose DICOM intake or anonymizer.

Run `validate-private-mri.py` without `--packet` for synthetic tests only. It verifies non-square pixel indexing, shuffled slice sorting, rotated and genuinely oblique planes, LPS/RAS conversion and seven geometry rejection cases. Optional PRIVATE packet verification checks every file hash, NIfTI geometry/units/form codes and every native frame's decoded pixel hash. Run without Python `-O`: validation uses assertions.

The exporter also checks NIfTI sample equality and all slice corner coordinates against the pre-save array/affine. These are computational consistency checks, not an independent decoder comparison, clinical sign-off or accepted device/browser performance test.

## Next integration gate

1. Radiologist verifies sequence/plane/laterality, native source appearance, anatomy and privacy across the complete series. Three preview slices do not clear a series.
2. Implement a distinct MR-aware private volume contract and native-slice display. Preserve existing CT validation; never relabel this NIfTI as a CT `.vmatlas` file.
3. Carry modality, uncalibrated signal units, native spacing/gaps and review status into the UI. No HU presets or interpolation across missing acquisitions by default.
4. Validate orientation markers and source-to-display coordinates before linking reviewed structures. Use conceptual anatomy links until a real, validated registration/segmentation exists.
5. Obtain explicit release clearance before any scan upload. GitHub/Sites backups may include only these generic scripts and notes, not packet contents. Imaging and lecture entitlements remain separate.

## Dependencies and reference basis

No new dependency, model, texture, training dataset or image is redistributed here. The existing local runtime used pydicom 3.0.2, NumPy 2.5.2, NiBabel 5.4.2, Pillow 12.3.0 and python-gdcm 3.2.6. Upstream permissive licence families include pydicom MIT (with dictionary notices), NumPy BSD and bundled notices, NiBabel MIT, Pillow MIT-CMU and GDCM Apache-2.0 with third-party notices. This is **not** clearance to redistribute all binaries or embedded codecs: retain and audit their exact installed notices if packaging an environment. No package versions or atlas notices are changed by this local tool backup.

Geometry follows the [DICOM Image Plane Module](https://dicom.nema.org/medical/dicom/current/output/chtml/part03/sect_C.7.6.2.html) and [NiBabel coordinate-system documentation](https://nipy.org/nibabel/coordinate_systems.html). Decoder selection follows the [pydicom compressed-pixel guide](https://pydicom.github.io/pydicom/stable/guides/user/image_data_handlers.html); Pillow is used only for PNG output, not JPEG 2000 decoding. These references do not certify clinical correctness or source-image rights.

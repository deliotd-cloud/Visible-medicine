# Decoded CT/MRI volume viewer

Implemented September 2026: a CPU axial/coronal/sagittal reslicer and optional Canvas viewer for already decoded, modality-rescaled, uniformly sampled image volumes. This replaces the previous need for a host to write its own image renderer. It does not decode DICOM, load scans, supply a dataset, approve a crosswalk, or register generic anatomy to a patient. No adapter is installed by default and no controls are added to the disconnected atlas.

## Architecture and integration

- `lib/volume-reslice.ts`: bounded affine geometry, patient LPS transforms, physically scaled reslice grids, trilinear sampling and linear grayscale windowing.
- `lib/volume-comparison.ts`: asynchronous source-bound selection, cancellation, dual-bridge lifecycle and immediate mounted-image clearing.
- `lib/volume-canvas.ts`: actual RGBA drawing to a 2D canvas.
- `app/volume-image.tsx` and CSS: orientation labels and collapsed window/level controls, with `installVolumeViewer` as the explicit host entry point. The existing comparison panel supplies plane and slice controls; its model subtree remains mounted.

A trusted client host imports `installVolumeViewer` and passes `id`, a non-patient `label`, `modality` (CT/MRI), and `resolve(anatomy, abortSignal)`. The resolver must authorize the exact imaging resource independently of the atlas and lecture subscriptions before requesting its pixels. It returns `unmapped`, `access-denied`, or a ready resolution with opaque `resourceId`/`resourceRevision`, exact mapped anatomy `{ id, sources }`, scalar volume, initial window, and optional reviewed image-space `focusLps`. Wrong IDs/source hashes are withheld. Do not derive a correspondence from similar names or a generic surface centre.

The resolver is trusted application code, not a security boundary. It must use the signal to cancel network/decoder work, release owned resources, and never return unapproved or inaccessible pixels. The adapter also rejects late results independently if the resolver ignores cancellation. It displays loading with no old image before a new selection, including same-structure series/revision changes.

On logout, entitlement expiry or withdrawal, call the returned `revoke()` synchronously. It aborts outstanding work, clears mounted pixels, drops volume references, and permanently denies further resolutions for that connection; dispose and explicitly reconnect after fresh authorization. `clear()` clears the series without reconnecting and cannot undo revocation. `dispose()` tears down both bridges and the renderer. The host owns server-side permission enforcement and buffer disposal; JavaScript reference release is not a guaranteed secure memory erasure.

Atlas detachment also invalidates the selected volume immediately: abort pending
resolution, clear mounted images, discard the retained volume and retire old
window/plane/slice controls. Late success or failure cannot repopulate the closed
view. A fresh Atlas attachment may select again through the existing authorized
resolver; detachment never reverses a prior access revocation. This lifecycle
applies to the optional website-integrated comparison, not the Didanix desktop
application. Synthetic CT/MRI regression evidence is separate from real-image,
browser/device and radiologist acceptance.

The pixel buffer is borrowed read-only for the lifetime of a ready resolution: never mutate, detach, resize or reuse it while this viewer retains it. Prepared geometry is copied/frozen. Shared/resizable buffers, invalid dimensions, singular geometry and buffers above 256 MiB are rejected. This is browser-side code, not a server-volume processing service.

## Volume input

`values` is Int16Array, Uint16Array or Float32Array, indexed `i + sizeI * (j + sizeJ * k)`. Dimensions are positive integers. `originLps` is the centre of voxel 0,0,0 in millimetres. Each of three `stepsLps` vectors gives a complete millimetre displacement for one i, j or k step. CT uses already-rescaled HU; MRI uses already-rescaled relative intensities. Supply `window: { center, width, function: 'LINEAR' | 'LINEAR_EXACT', inverted }` from reviewed image metadata/teaching settings. There are no invented universal MRI presets.

Upstream DICOM assembly must use image position/orientation and pixel spacing, not instance number or nominal slice thickness. Validate a consistent series/frame of reference, sorting, actual inter-slice displacement, row/column spacing order, duplicate/missing slices and per-frame transforms. Irregular spacing or changing orientation needs a separately validated reconstruction; this API represents only a uniform affine grid, including consistently sheared or reversed stacks. Apply modality LUT/rescale before passing values. Convert padding/missing values to NaN in a float array; do not blend pixel padding into tissue. Resolve MONOCHROME1/presentation inversion upstream into the explicit inversion flag. Unsupported VOI LUTs or SIGMOID must not be silently treated as LINEAR.

Coordinates follow human LPS: positive x left, y posterior, z superior. Output uses axial R/L and A/P, coronal R/L and S/I, sagittal A/P and S/I. Physical horizontal/vertical pixel spacing is equal to prevent stretching. Output dimensions are bounded to 512 by default (maximum 1024); resliced frame count may differ from acquired slice count for oblique geometry. Frames are labelled **Reformatted**. Outside-support or missing data is black, including under inversion. Resampling can smooth partial-volume detail and is not lossless native-pixel viewing.

When switching planes, the current image-space location is retained to the nearest output plane. If no reviewed image focus is supplied, the initial view is the volume centre, not a claimed anatomical localization. No 3D atlas coordinate, crosshair or segmentation is inferred. The comparison still says **Teaching comparison · not spatially registered**.

## Validation and remaining gates

`npm run volume-viewer:test` exercises synthetic, non-anatomical scalar ramps; hand-calculated orientation and grayscale values; anisotropic, reversed and sheared transforms; missing pixels; bounds; source/revision mismatches; asynchronous cancellation; revocation; disposal; actual Canvas calls and React server markup. `npm run imaging-comparison:test`, `npm run imaging:test`, TypeScript and the production build cover existing integration boundaries. These checks are not browser, diagnostic display, scan correctness or clinical acceptance evidence.

Before use with the user's provisional CT-head atlas: obtain release/privacy/rights clearance, validate its decoder and uniform-grid export, create a revision-bound cth.* to VM source-ID crosswalk, inspect actual images against the original viewer, test side/orientation and measured landmarks, verify windowing and padding, then review performance and touch/keyboard interaction on supported devices. The current NOT_FOR_PUBLICATION CT-head material is neither copied nor connected by this change. MRI clearance remains separate.

The next spatial step needs a reviewed same-study transform and landmarks. Generic body reference meshes cannot be made patient-aligned merely by drawing a slicing plane. Four simultaneous panes, scan segmentation, crosshairs, oblique interactive cuts, DICOM codecs, server-authorized resource delivery and real-volume clinical review remain unfinished. Large volumes may need workers/GPU sampling after profiling; current CPU sampling runs only when a frame/window changes.

## Sources and licensing

Original MIT application code; no package, model, font, texture, patient image, anatomy dataset or paid runtime added. DICOM is a specification reference, not imported source code or a conformance certification:

- [DICOM PS3.3 C.7.6.2 — patient-coordinate image geometry](https://dicom.nema.org/medical/dicom/current/output/chtml/part03/sect_C.7.6.2.html)
- [DICOM PS3.3 C.11.2 — VOI windowing](https://dicom.nema.org/medical/dicom/current/output/chtml/part03/sect_C.11.2.html)

Each future scan, annotation and crosswalk still needs its own provenance, rights/privacy review, independent server-side entitlement checks and scoped radiologist sign-off.

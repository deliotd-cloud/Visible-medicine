# Private native MRI import checker

Route: `/review/mri-import`, under the existing local CT workspace's collapsed Private import checks. The owner selected Elivion Didanix light/education as the DICOM/PACS viewer during implementation: see [the binding integration decision](DIDANIX_EDUCATION_INTEGRATION.md). This utility remains solely for local source/import QA. It is not the learner viewer, a competing PACS, a Didanix adapter, or a change to CT admission rules.

## User experience

The native image occupies the main working area with a slice slider and Previous/Next controls. A narrow sidebar holds Close and collapsed brightness/contrast and geometry/review sections; on smaller screens these become compact controls above the image. No introductory marketing page or extra permanently open settings panel is added.

- Click/tap a source sample to inspect stored signal and LPS coordinates. Arrow keys move by one in-plane sample; Page Up/Down changes the acquired slice. Keyboard activation does not create a synthetic pointer position. The crosshair stays at the chosen in-plane index when moving through slices.
- Source-derived edge letters indicate directions toward the screen edges, including compound oblique labels. They do not classify sequence, body-part laterality or a standardised radiological orientation. No mirror/rotation is applied.
- Physical in-plane pixel aspect is preserved when fitting the image. Display range and greyscale inversion do not modify source samples. No CT HU windows or calibrated quantitative-MRI interpretation are supplied.
- Actual native origins determine coordinates; the UI distinguishes centre spacing, nominal slice thickness, acquisition gaps and nominal overlap. There is no interpolation across acquisitions and no MPR reconstruction or 3D tissue claim.
- Closing clears the loaded React state; cancelling invalidates an in-flight result. File contents remain in memory for this browser session. The module has no upload, telemetry, browser-storage or server-persistence path. Garbage-collection timing and secure memory erasure are not guaranteed.
- Clinical and privacy approval remain false, and atlas registration is null. No segmentations, diagnostic conclusions, normality labels, approval buttons, paywall changes or lecture entitlements are introduced.

## Local preparation

Use the private `vm-private-mr-stack/1` packet prepared outside this repository with the existing imaging environment. The new adapter checks its pinned NIfTI hash, dimensions/type/range, mm units, sform/qform, LPS geometry and all native frame pixel hashes. It then writes a new `.vmmr` file outside all detected Git repositories. It does not read DICOM, alter originals, install libraries or contact a service.

```powershell
& $imagingPython scripts/pack-native-mr.py --packet $privatePacketDirectory --output $newPrivateVmmrFile
```

The target directory must exist and the target file must not. Never put patient material in this checkout, `public`, any GitHub mirror or a runtime archive. Ignore patterns are defence in depth, not a confidentiality guarantee. Do not rename a NIfTI/CT file to `.vmmr`: content signatures and contracts differ.

## Binary contract

Eight-byte ASCII `VMMR0001`, then little-endian uint32 JSON-header length and body length. UTF-8 JSON begins at byte16; scalar body starts at the next eight-byte boundary. Total file size must exactly match and cannot exceed128 MiB. Header maximum128 KiB. The body is native int16/uint16 with column fastest, then row, then slice. The JSON includes a SHA-256 body fingerprint and the source NIfTI fingerprint; hashes detect corruption, not trusted clinical signatures.

Schema `vm-native-mr/1` accepts only the documented top-level keys: schema, release, modality, privacyCertified, clinicalApproved, atlasRegistration, units, order, scalarType, dimensions, spacing, directions, positions, thickness, window, sourceSha256, bodySha256. Release must be `NOT_FOR_PUBLICATION`; units `stored-MR-signal`. No raw patient fields, filenames, raw UIDs, sequence descriptions or arbitrary free-text labels are copied into this contract.

Dimensions: at most2048×2048×512, at least two slices, constrained further by byte limits. Directions must be orthonormal, in-plane spacing positive, native origins finite and advancing along the cross-product normal. Mixed/near-nonuniform spacing or in-plane drift outside0.01 mm tolerance is rejected by this pilot. Individual origins are retained instead of replaced by an idealised uniform affine. Lossless DICOM decoding, source de-identification and input provenance remain upstream responsibilities. The earlier preparer supports only a narrow classic-MR profile; this is not a general DICOM viewer.

Coordinate basis: [DICOM PS3.3 Image Plane Module](https://dicom.nema.org/medical/dicom/current/output/chtml/part03/sect_C.7.6.2.html). Column index uses the first orientation vector and column spacing; row index uses the second vector and row spacing. LPS positive directions are left, posterior and superior. Both indices refer to voxel centres.

## Verification and remaining acceptance

```text
node scripts/validate-native-mr.mjs
node scripts/validate-local-imaging.mjs
node scripts/validate-native-mr.mjs --packet <PRIVATE.vmmr> --source-packet <PRIVATE original packet directory>
```

Synthetic checks cover unsigned/signed signals, non-square pixels, rotated and genuinely oblique coordinates, direction labels, display mapping/inversion, native bounds, corrupted/unsupported packets, CT/MRI mutual rejection, SSR and real component callbacks (slice controls, keyboard, signal selection, display errors/reset and close). Optional PRIVATE validation checks every native frame hash and renders each slice without publishing or logging its pixels. Test browser APIs/hooks are controlled in the callback harness, not a live browser.

TypeScript and the production build are additional engineering checks, not browser/GPU/device or clinical acceptance. The radiologist must confirm orientation/sequence/laterality, inspect the complete source series and pixels for privacy, compare against a source viewer, and approve teaching use. Mobile layout, text zoom, actual canvas rendering, loading cancellation/races and memory limits still require real-browser/device testing. No such acceptance is claimed from SSR or synthetic tests.

Next: use Didanix Education's agreed integration contract for reviewed anatomical landmarks and imaging-to-atlas concept links, then genuine same-study segmentation/registration where available. `.vmmr` is a private QA format only; do not require Didanix to ingest it, build another DICOM pipeline, or continue extending this utility as the learner viewer. Do not enable spatial 3D↔MRI correspondence from generic anatomical similarity. CT-head midbrain/cerebellar edits remain with the CT-head task. Ultrasound admission and independent lecture entitlements retain their separate review gates.

# Private native MRI import checker

Route: `/review/mri-import`, under the existing local CT workspace's collapsed Private import checks. The owner selected Elivion Didanix light/education as the DICOM/PACS viewer during implementation: see [the binding integration decision](DIDANIX_EDUCATION_INTEGRATION.md). This utility remains solely for local source/import QA. It is not the learner viewer, a competing PACS, a Didanix adapter, or a change to CT admission rules.

## User experience

The native image occupies the main working area with a slice slider and Previous/Next controls. A narrow sidebar holds Close and collapsed brightness/contrast and geometry/review sections; on smaller screens these become compact controls above the image. No introductory marketing page or extra permanently open settings panel is added.

- Click/tap a source sample to inspect stored signal and LPS coordinates. Arrow keys move by one in-plane sample; Page Up/Down changes the acquired slice. Keyboard activation does not create a synthetic pointer position. The crosshair stays at the chosen in-plane index when moving through slices.
- Source-derived edge letters indicate directions toward the screen edges, including compound oblique labels. They do not classify sequence, body-part laterality or a standardised radiological orientation. No mirror/rotation is applied.
- Physical in-plane pixel aspect is preserved when fitting the image. Display range and greyscale inversion do not modify source samples. No CT HU windows or calibrated quantitative-MRI interpretation are supplied.
- Actual native origins determine coordinates; the UI distinguishes centre spacing, nominal slice thickness, acquisition gaps and nominal overlap. There is no interpolation across acquisitions and no MPR reconstruction or 3D tissue claim.
- Closing clears the loaded React state; cancelling, closing or replacing an import aborts its active `FileReader` and invalidates late results. File contents remain in memory for this browser session. The module has no upload, telemetry, browser-storage or server-persistence path. Garbage-collection timing and secure memory erasure are not guaranteed.
- Clinical and privacy approval remain false, and atlas registration is null. No segmentations, diagnostic conclusions, normality labels, approval buttons, paywall changes or lecture entitlements are introduced.
- A loaded packet carries a persistent visible warning, announced to assistive technology, that source provenance is unverified. Passing the local check means only that the packet format and body integrity are internally consistent; the checker cannot authenticate where the data came from or grant privacy or clinical clearance.

## Local preparation

Use the private `vm-private-mr-stack/1` packet prepared outside this repository with the existing imaging environment. The new adapter checks its pinned NIfTI hash, dimensions/type/range, mm units, sform/qform, LPS geometry and all native frame pixel hashes. It then writes a new `.vmmr` file outside all detected Git repositories. It does not read DICOM, alter originals, install libraries or contact a service.

```powershell
& $imagingPython scripts/pack-native-mr.py --packet $privatePacketDirectory --output $newPrivateVmmrFile
```

The target directory must exist and the target file must not. Never put patient material in this checkout, `public`, any GitHub mirror or a runtime archive. Ignore patterns are defence in depth, not a confidentiality guarantee. Do not rename a NIfTI/CT file to `.vmmr`: content signatures and contracts differ.

## Binary contract

Eight-byte ASCII `VMMR0001`, then little-endian uint32 JSON-header length and body length. UTF-8 JSON begins at byte16; scalar body starts at the next eight-byte boundary. Total file size must exactly match and cannot exceed128 MiB. Header maximum128 KiB. The body is native int16/uint16 with column fastest, then row, then slice. The JSON includes a SHA-256 body fingerprint and a claimed source NIfTI fingerprint; the local body check detects corruption or mismatch against the header, not a trusted source signature.

Schema `vm-native-mr/1` accepts only the documented top-level keys: schema, release, modality, privacyCertified, clinicalApproved, atlasRegistration, units, order, scalarType, dimensions, spacing, directions, positions, thickness, window, sourceSha256, bodySha256. Release must be `NOT_FOR_PUBLICATION`; units `stored-MR-signal`. No raw patient fields, filenames, raw UIDs, sequence descriptions or arbitrary free-text labels are copied into this contract. The source fingerprint is a claim supplied by the packet, not independently authenticated by this checker. A fabricated packet can carry self-consistent hashes without establishing source provenance.

Dimensions: at most2048×2048×512, at least two slices, constrained further by byte limits. Directions must be orthonormal, in-plane spacing positive, native origins finite and advancing along the cross-product normal. Mixed/near-nonuniform spacing or in-plane drift outside0.01 mm tolerance is rejected by this pilot. Individual origins are retained instead of replaced by an idealised uniform affine. Lossless DICOM decoding, source de-identification and input provenance remain upstream responsibilities. The earlier preparer supports only a narrow classic-MR profile; this is not a general DICOM viewer.

Coordinate basis: [DICOM PS3.3 Image Plane Module](https://dicom.nema.org/medical/dicom/current/output/chtml/part03/sect_C.7.6.2.html). Column index uses the first orientation vector and column spacing; row index uses the second vector and row spacing. LPS positive directions are left, posterior and superior. Both indices refer to voxel centres.

## Verification and remaining acceptance

### Browser follow-up, 13 September 2026

Actual local Windows in-app-browser testing used generated, non-anatomical
fixtures only, never the private MRI packet or `D:/Cases`. The new
`scripts/create-native-mr-browser-fixtures.mjs` writes two tiny, explicit
synthetic packets and one invalid file into an existing directory outside Git
repositories, refusing to overwrite files. The adjacent evidence JSON lists
each expected starting pixel, source-space point, aspect ratio and edge label.
No dataset, dependency, licence, scan or mask changed.

- Desktop 1294×856: the 4×3×3 unsigned pattern preserves its 2:1 physical aspect.
  The initial sample is signal 18 at column 3, row 2, LPS 48,46,33.6 mm.
  Arrow/Page Down and Enter give signal 29 at 48,43,37.2 without a synthetic
  keyboard click jump. Pointer selection gives the expected first sample.
- The real browser exposed a reset bug: edited but unapplied/invalid range
  fields survived Reset when the applied window was already the default.
  Reset now remounts the range form explicitly. Repeating 30/10 → validation
  error → Reset restores 0/35 in both fields and clears the error; source sample
  and coordinate remain unchanged.
- At 390×844, slice controls, Close, collapsed settings and the image fit without
  horizontal page overflow. Home selects the first native slice and disables
  Previous; Close removes the viewer. An invalid file is rejected and a new
  signed oblique fixture loads without retaining the old sample or error.
- The 8×6×5 signed oblique pattern displays signal 4 at 24.88,-40.16,18.30 mm,
  a one-mm acquisition gap, AR/PL/I/S edges, and its 5.6:6.6 physical aspect.
  The phone image measures 380.15625×448.046875 CSS pixels (rounding preserved).
- Seventy-one synthetic/real-component callback checks retain the original 57
  and add reset and delayed-read lifecycle coverage. Cancelled late success is
  ignored; an old failure cannot erase a newly loaded study; an oversize file
  is rejected before reading. These delayed-read tests use controlled promises,
  not a claim of real-browser in-flight cancellation or memory certification.
  The unchanged CT suite passes 78 checks; TypeScript passes.

These are engineering/browser samples, not real-DICOM decoding, clinical or
privacy approval, independent scanner-viewer comparison, physical-phone QA,
200% text-zoom acceptance or secure memory-erasure evidence. Real in-flight
cancellation, large-file memory behaviour and those other gates remain open.
The page title now identifies MRI import checking rather than a 3D anatomy page.
Publication and exact source/recovery state belong in the coordinating task's
dated checkpoint; do not assume the hosted standalone utility is current.

### Source follow-up, 24 September 2026

The private import control now reads through `FileReader` so Cancel, Close,
replacement and unmount call `abort()` on an active read. Generation checks
continue to reject late success or failure events, including after a synchronous
read-start error. Controlled callback validation passes 81 checks, including
abort invocation, stale events and a later successful import; TypeScript passes.
This is source and synthetic callback evidence. Actual browser cancellation,
large-file memory behaviour, secure erasure and clinical/privacy acceptance
remain unverified.

```text
node scripts/validate-native-mr.mjs
node scripts/validate-local-imaging.mjs
node scripts/validate-native-mr.mjs --packet <PRIVATE.vmmr> --source-packet <PRIVATE original packet directory>
```

Synthetic checks cover unsigned/signed signals, non-square pixels, rotated and genuinely oblique coordinates, direction labels, display mapping/inversion, native bounds, corrupted/unsupported packets, CT/MRI mutual rejection, a fabricated self-consistent packet admitted with the persistent source-provenance warning, SSR and real component callbacks (slice controls, keyboard, signal selection, display errors/reset and close). Optional PRIVATE validation compares every native frame hash with the supplied private packet and renders each slice without publishing or logging its pixels; that comparison is not independent source authentication. Test browser APIs/hooks are controlled in the callback harness, not a live browser.

TypeScript and the production build are additional engineering checks, not browser/GPU/device or clinical acceptance. The radiologist must confirm orientation/sequence/laterality, inspect the complete source series and pixels for privacy, compare against a source viewer, and approve teaching use. Mobile layout, text zoom, actual canvas rendering, loading cancellation/races and memory limits still require real-browser/device testing. No such acceptance is claimed from SSR or synthetic tests.

### Provenance wording follow-up, 24 September 2026

The local checker now labels its result as packet-format and body-integrity
checking, not source authentication. A persistent alert on the loaded view says
that provenance, privacy clearance and clinical clearance are unverified. A
fabricated packet with self-consistent hashes is intentionally admitted as a
packet while retaining that warning; a damaged body remains rejected. The
synthetic/component validator passed 85 checks and TypeScript passed. In a
temporary loopback browser tab, the initial checker page visibly used the
corrected wording. No file was imported in that browser check, so loaded-state
visual behavior, real cancellation, and clinical/privacy acceptance remain open.

Next: use Didanix Education's agreed integration contract for reviewed anatomical landmarks and imaging-to-atlas concept links, then genuine same-study segmentation/registration where available. `.vmmr` is a private QA format only; do not require Didanix to ingest it, build another DICOM pipeline, or continue extending this utility as the learner viewer. Do not enable spatial 3D↔MRI correspondence from generic anatomical similarity. CT-head midbrain/cerebellar edits remain with the CT-head task. Ultrasound admission and independent lecture entitlements retain their separate review gates.

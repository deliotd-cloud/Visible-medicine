# Education localizer geometry: guarded frame selection

12 September 2026. This update is confined to the website's educational geometry adapter and its request mapping. It does not modify the separate Didanix Education or clinical PACS repository, native scan data, CT-head masks, assessments or stored bookmarks. No additional dependency or licensed asset is introduced.

## Reproduced and corrected

Synthetic execution of the previous adapter selected z = -120 mm instead of -117.5 mm when the second frame of a multi-frame SOP was requested, accepted `NaN` image dimensions, and projected a point at z = 999 mm onto a stack ending near z = 118 mm. The focused regression suite now covers those cases and related invalid-input paths.

- Source SOP, optional `sourceFrame` and optional `sourceSliceIndex` are combined, not treated as fallback alternatives. Exactly one frame must match. All supplied indices must be nonnegative integers. `frame` is zero-based in this internal API; DICOM one-based frame references require explicit conversion at ingestion. `sliceIndex` is a unique display index, not InstanceNumber.
- Image dimensions, dense finite geometry tuples, frame identity, positive pixel spacing and supplied slice thickness are checked before arithmetic. Both directions reject non-finite computed coordinates. Orientation axes must be unit and orthogonal within a 0.0001 application tolerance; only bounded decimal rounding is corrected. Malformed acquisition geometry is not silently normalized into valid geometry.
- Projection requires an in-plane pixel footprint and native slice support. `sliceThicknessMm` is optional, but absence permits only on-plane projection (0.0001 mm numerical tolerance). Do not substitute inter-slice distance for slice thickness: that would fill acquisition gaps. The existing synthetic examples explicitly declare their 2.5 mm support. Real ingestion must provide trustworthy per-frame geometry and separate temporal/echo stacks; MPR interpolation needs its own validated volume policy.
- Equal-distance adjacent planes use a stable display-index tie-break. Equally close coplanar or differently oriented frames are rejected as ambiguous; no arbitrary time/echo frame is chosen.
- Registration is directional and must have one explicitly validated match, a non-empty identity, 16 finite elements, affine last row and a non-singular basis. Projective, malformed or ambiguous matrices are not accepted. The numerical conditioning threshold is an application guard, not evidence of anatomical registration quality. No inverse, chained or deformable registration is inferred.
- An unlocatable target still rejects the whole synchronized operation. Stored points return `null` for unknown source series/plane instead of inventing source provenance from the first target. The request mapper no longer coerces strings/null to coordinate zero or silently defaults a missing source display index to zero.

## Standards and implementation policy

The image-position/orientation and row/column-spacing convention follows [DICOM PS3.3 C.7.6.2](https://dicom.nema.org/medical/DICOM/current/output/chtml/part03/sect_C.7.6.2.html). Affine matrix ordering and last-row constraints follow [DICOM PS3.3 C.20.2](https://dicom.nema.org/medical/DICOM/current/output/chtml/part03/sect_C.20.2.html). The cited pages were inspected on 12 September 2026. Rounding tolerances, slice-support rejection and ambiguity handling above are explicit application policies, not quotations or claims of DICOM conformance certification.

## Verification and remaining gates

`tests/education-geometry.test.ts` executes the actual geometry module with synthetic fixtures: anisotropic spacing, oblique coordinates, bounded round-off, malformed tuples/dimensions, frame identity/contradictions, duplicate indices, acquisition gaps/slab limits, in-plane coverage, ties, registration validity/direction, stored provenance and the unchanged tri-planar centre journey. It runs in the existing `npm test` command without additional packages. Full TypeScript and production-build checks accompany the release.

This is not browser, real-DICOM, clinical, full server-authorization or device acceptance. The current website case geometry remains synthetic. Real Didanix frame ingestion, multi-frame/time/echo navigation, volume interpolation, independently reviewed registration and cleared CT/MRI journeys must still be tested. The Atlas API remains disconnected by default; independent paid-lecture/case entitlements and patient-release gates are unchanged.

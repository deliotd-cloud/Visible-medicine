# Private candidate-specific correction feedback

Candidate feedback is now a separate, source-bound review stream. It does not alter segmentation masks, turn points into contours, approve anatomy, open Slicer, or upload private data. The baseline workflow remains compatible with `vm-local-review/1`.

## Review and export

1. Open the matching `.vmatlas` study and verified `.vmcompare` attachment in Local CT + 3D.
2. Expand **Mark corrections** and check **Reviewing: Baseline** or **Reviewing: Candidate**. Baseline/off reviews the original; Changes, Candidate mask and Protected warnings all review the candidate. Include/exclude means include in or exclude from that candidate—not editing the difference/warning map.
3. Choose a click action and mark positions in the CT views. Only marks for the current version are shown. Changing version or selecting another structure returns the action to Locate anatomy. Points may be outside the target foreground but must remain inside the source CT.
4. **Export review marks** saves the active version. Baseline uses `visible-medicine-local-review.json`; candidate uses `visible-medicine-candidate-review.json`. Export each version separately if both have feedback. The panel reports both counts; Undo/Clear affects only the active version.
5. Replacing/removing a comparison with candidate marks requires explicit discard confirmation. Declining keeps the old comparison and marks. Cancelling the file chooser keeps the existing attachment. Study closure and page-unload protection consider both review streams. Exports do not automatically clear marks.

Feedback is held only in memory until explicitly downloaded. Browser exit/crash can still lose unexported work; unload protection is not a backup guarantee. All files remain private owner data. Candidate export remains unapproved even when the baseline was accepted or the two masks are identical.

## Return candidate marks to Slicer

Use the existing CT-head Python environment and the exact original comparison request and completed output directory:

```powershell
& '<CT-project>\work\segmentation\.venv\Scripts\python.exe' scripts/import-local-candidate-review.py --state '<CT-project>\work\segmentation\LATEST_ATLAS_STATE.json' --request '<private-candidate-directory>\candidate.json' --comparison-dir '<private-comparison-output>' --review '<private-download-directory>\visible-medicine-candidate-review.json' --allow-draft cth.bst.midbrain --check-only
```

For private files, replace `--check-only` with `--output-dir '<new-private-candidate-feedback-directory>'`. Do not use both. Omit `--allow-draft` for an accepted baseline; that never accepts its candidate. The new output must be outside the repository, original data, state and comparison-output directories. It must not exist or contain any input path. Existing outputs are never overwritten.

The importer reuses the attachment exporter's shared source verification: annotation, CT, baseline, candidate, optional protected ROIs, request, completed comparison report and both difference maps must still match. A correct-looking filename or valid hash format is not sufficient. The review must identify this exact comparison manifest and request as well as the candidate and baseline. A changed candidate, report, source or request fails validation. Baseline and candidate review envelopes are deliberately not interchangeable.

Successful conversion creates locked, LPS-mm `.candidate.include.mrk.json` / `.candidate.exclude.mrk.json` fiducials as applicable, a README, and **`CANDIDATE_REVIEW_MANIFEST.json` written last**. Every point is explicitly labelled CANDIDATE; descriptions retain candidate, baseline and comparison hashes. The manifest hashes output files and records conflicting include/exclude mark numbers on the same source voxel for human resolution. Nothing is automatically deleted, merged or interpreted as an edit. Missing completion manifest means incomplete output.

In Slicer, verify the exact source CT and candidate against the manifest before adding these point lists. Do not flip coordinates or apply an extra transform. Keep original accepted masks intact, resolve conflicting feedback with the radiologist, and save any subsequent segmentation as a **new draft**. Actual Slicer loading and original-DICOM agreement still require human validation.

## Contract and validation

`vm-local-candidate-review/1` contains `release: NOT_FOR_PUBLICATION`, `approval: false`, `coordinateSystem: LPS-mm`, source annotation/CT hashes, target `structureId`, baseline/candidate hashes, comparison-manifest/request hashes and 1–500 `{action, lps}` marks. Only include/exclude actions and three finite, in-grid coordinates are accepted. It is not a signed clinical attestation. The Python importer rejects additional fields, duplicate JSON keys, unsupported schemas, oversized JSON, stale pins and conflicting units/geometry through the shared comparison checks.

`validate-local-candidate-review.py` covers synthetic source preservation, exact coordinate round trips, version mixing, stale sources, malformed marks, conflicts, explicit draft scope, forbidden destinations, overwrite/partial-output guards and a real TypeScript-export → Python-import → Slicer-JSON round trip. `validate-local-comparison-viewer.mjs` drives the real component callbacks, download payloads, version-specific glyphs, Undo/Clear, discard confirmation and candidate-only unload/close protection. Existing baseline and comparison tests remain in place. No real clinical marks, corrected candidate, protected-boundary ROI, GPU/browser acceptance or Slicer runtime validation is fabricated.

The saved midbrain axial-trim/superior-extension feedback remains available in the CT task. Its precise boundaries still need localisation; this feature makes the subsequent candidate review traceable and does not guess those boundaries. Other regional anatomy and imaging/lecture integration goals remain separate ongoing workstreams.

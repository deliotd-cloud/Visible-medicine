# X-ray epoch separation — bounded handoff

Parent source receipt: `G:/VisibleMedicine-temp/staging/20261031-release-partition10-final/SOURCE.json`, SHA-256 `cf3faf8f249686f28885eafe388e1d834608f09e9fd59bda49d133963d19c7a2`. Edited only the three assigned test files in `G:/VisibleMedicine-temp/staging/20261031-release-partition11-repairs/website`. Exact per-file before/after SHA-256 values and whole test roots are in `RESULT.json`.

- Abdominal: pins introduction `c3593e66` and tree `9585f7f6`; binds the later `a01ea4a0` heading correction for seven exact identities. The historical 20-of-9,936 lesson and 20-of-1,104 packet proof remains intact. Every current lesson and packet is checked against bound current Atlas source, and the seven corrected lessons must differ from introduction only in title. All Review forgery and stale-decision refusals remain.
- Femoral: pins introduction `aba5a002` and tree `4642d622`; keeps the six-placement and packet historical admission proof at that epoch. Current anatomy, lessons, packets and source bytes bind independently to current `c32bc81c`, with the later shoulder citation source pinned at `79784789`. Forgery and stale-decision checks remain.
- Shoulder vessel: current runtime pin now binds to `c32bc81c`, with historical `190a6323` ancestry and exact original 14-topic introduction `9fba9a1e`/tree `1bd327fb`. Historical anatomy and tours compare to baseline; current anatomy and tours compare to current source. The later citation and renal-tour epochs are bound explicitly. All 9,936 placements, 1,104 packets, and refusal checks remain.

No test or build was run under the main chat's serial low-memory test policy. Main should run each complete root in `RESULT.json`, then the whole source-matched partition 11. Any failure needs its full TAP diff; these text changes alone establish no pass, install, deployment or clinical approval.

## Added knee notice seam

`clinical-review-knee-stability-guide.test.ts` now authenticates the saved `public/media/atlas/NOTICES.md` against both the original website commit `d48b32c8` and knee admission commit `e2812b54` (3,524 bytes; SHA-256 `55f0d74ecb7d0a110c901f97e59a3522c9ed27c781f86e6cf65406a264a3c5bd`). The current 3,536-byte notice remains separately pinned to `c2247722b9a67799ff1a1518945023e5bd270f9b5538f9c0ac37cd5f0c62ee89`. An exact inverse check permits only the documented statement that the current distribution includes `3d-detail-preview.jpg` and omits legacy `3d-preview.png`. The existing public preview preflight independently verifies the current notice, exact five-asset manifest and each asset's size/hash. All other historical notices, 356 packet comparisons, 67 pins, guide and stale-request checks remain. The obsolete notice is not treated as current and no notice or image was edited.

## Added coverage delivery seam

`coverage-delivery-roles.mjs` now authenticates the saved 727 website at `F:/VisibleMedicine/staging/20261025-effective-entitlement-website/website` against `../SOURCE_CANDIDATE_V5.json` SHA-256 `24cdf7e2f5bb47142fb0c27a6730269d03539d425f75b1a1ba3536282d5ab482` before importing its API. Its finite 23-path closure covers the five code modules, fixture, manifest, index, twelve delivery documents and four coverage artifacts, with exact receipt size/hash checks. This leaves the complete original four-case 727 proof on its own source. A separate C32 API pins current code, fixture, manifest and index hashes; two new cases verify the actual C32 projection, source counts, current artifacts, and rejection of historical, forged, incomplete or duplicate inputs. The original 6d code fixture and mutation proof is unchanged. No native Atlas source or product file was edited.

For the whole `tests/current-coverage-delivery.test.mjs` root, set the existing original-6d runner inputs as used by `tests/current-190-coverage.test.mjs`:

- `VM_COVERAGE_HISTORICAL_SITE=F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website`
- `VM_COVERAGE_HISTORICAL_RECEIPT=F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/VERIFIED_SOURCE.json` (SHA-256 `1b38f47acd68bd9765d442f356a3390bda69f305007887739e03b362b480a9a3`)
- `VM_COVERAGE_485_INDEX=F:/VisibleMedicine/staging/20261020-combined-website-ui/website/docs/anatomy-coverage/index.json` (SHA-256 `9020eac8ed2fee77ef04b63357eabd23471f99e3e966d5b2c427010ee3478579`)

No extra helper edit is needed. Main should run the entire coverage root with these inputs and then source-matched partition 11. These edits have not been run or installed.

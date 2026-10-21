# Elbow/forearm tour epoch repair proposal

This proposal changes only two admitted clinical tests and their two pure preservation guards. The two strict 9f import loaders and both byte-exact original raw fixtures are copied unchanged as local support. Frozen Website, clean Atlas source, closed 9f export, Review, learner files, and the passing inbox tests were not edited. The inbox test suffixes in both proposed files are byte-identical to the frozen Website copies.

The completed elbow f74 and forearm d81 source epochs both have 47 tours / 282 stops and retain their parents' complete tour objects, including every step and camera. Portal 47a appends exactly `portal-hepatic-venous-relationships` for 48 / 290. Cervical c26 appends `cervical-whole-discs-orientation` for 49; medial 469 appends `right-medial-thigh-orientation` for 50. Venous 628 preserves the 50 tour IDs, preserves every other full tour object, and explicitly verifies the documented six-to-nine-stop v2 revision in `right-lower-limb-venous-orientation`. Calf 840 appends `right-posterior-calf-achilles-orientation` for 51. Playback c978 preserves all tours. Each transition is bound to its genuine commit/tree and exact `lib/regional-tours.ts` Git blob. The strict closed 9f import must deep-equal playback; the current 485 import must deep-equal 9f with both the committed source and Review import bound to SHA-256 `88f195fd9dbfcd4033a5012eeb760f358cca16da7f48cbca8671ef92c69bea97`.

Original 6/8 changed drafts, 9930/9928 preserved lessons, 1098/1096 preserved packets, forged/stale/refusal/storage assertions and original registered test bodies remain; inverse guards pin the full original raw files and the exact proposed postimages. No count was relabelled as a 9f count. The two current inbox test bodies remain exactly unchanged.

## File SHA-256 (lowercase)

| Path under this directory | SHA-256 |
| --- | --- |
| `tests/clinical-review-elbow-us-followup.test.ts` | `9b0b950ead7cc57f0dfe069d1a359a65b96e15a51aa004dca536f52e0ed3b443` |
| `tests/clinical-review-forearm-vascular-xray.test.ts` | `108d94b7a5b0ead7e302ab576b2f295d44eb7cd7c2229de686115402379b6778` |
| `tests/elbow-us-followup-preservation.test.mjs` | `00c2bbcf29ab8ad3dfa3f1032643e302a17bb4bf70e9fe59a12b7ed3dcd1b166` |
| `tests/forearm-xray-preservation.test.mjs` | `3d9822101754c23bd6a7d7e3645a30743f0ce0fc0299771c630634032f16a205` |
| `tests/elbow-admission-import-history.mjs` (unchanged) | `f994bb22c3e12330d82fe9c25d33e1a48a2bee8dd9ebf47a3b5d222ca004232d` |
| `tests/forearm-admission-import-history.mjs` (unchanged) | `d6b519e7a24b27163b8417fa46829dd41dc8978a97b58df1b7ae453d75c86629` |
| `tests/fixtures/clinical-review-elbow-us-followup.original.ts.raw` (unchanged) | `aad244f03fc81cec834dbed52eed7681f8a680f6d6d52cc82a9c17cde84fab0c` |
| `tests/fixtures/clinical-review-forearm-vascular-xray.original.ts.raw` (unchanged) | `59af4032c50b8352a1664d9296f522d2dd63bb0fbda5653ccd7c26168103bc62` |

Frozen preimage SHA-256: elbow test `666eadec1b2b71bed584db21d022a5af97d4e6f5e8b589ab0c7d77704b63800e`; forearm test `1e609a7bd8a18d032a3d586c1bab99cc3ebed8f4c4b5477bcf0e055110eeb058`; elbow guard `b2127dac886e0811462cfef39cd885e3d118cb13db442e01a573d307d1a9dff5`; forearm guard `41b999b07c36480e8b4fa85a34e532218c9a2666022d5a6a4543aff3f0b2a791`.

Pure verification performed: both guard tests passed (including negative tamper and complete inverse to original), TS files parsed with esbuild `transformSync` without bundling, 9f and 485 source blobs both `fb65a9c68d8753fc1789c7e6281e36c2889e0136`, Review import/source SHA matched the committed 485 bytes, and the current inbox suffixes were byte-identical. The historical API, imported bundles, actual clinical tests, corpus, build, and typecheck were **not** run here. Main should admit these files only after verifying their hashes, then run both clinical tests in the guarded Website test slot; any later failure must be diagnosed rather than treating the pure guard as clinical passage.

# Hepatic X-ray contract proposal files

All paths below are new proposal copies. The frozen Website test and Atlas source were not edited.

| Proposed shipping path | SHA-256 | Purpose |
| --- | --- | --- |
| `tests/clinical-review-hepatic-venous-xray.test.ts` | `182d5a2130226f0deaa4b32ae8458c804a8a05f72d44bb619fa62b786b29edb5` | Both original registrations retained against their genuine epochs; separate current-485 continuity theorem. |
| `tests/hepatic-admission-import-history.mjs` | `1b59db5168de418dc208334df0db8e53b907d270faed7df8144205536054148f` | Fail-closed historical 9f Review import loader. |
| `tests/fixtures/clinical-review-hepatic-venous-xray.original.ts.raw` | `0e1caf978b937fc60ee32aa4410b2e5e99e706866c8be4d330181fcc3225c8b1` | Byte-exact whole original frozen test. |
| `tests/hepatic-xray-preservation.test.mjs` | `e425bc21bc5f8046da4a4d49b3f07af27486a24994a4546be332119cfbf7099d` | Pure postimage/hunk/inverse and negative-tamper proof. |

The raw fixture SHA equals the frozen Website preimage SHA. The proposed test SHA is its exact reviewed postimage; the preservation test reconstructs every original byte from the reviewed edit hunks.

# Hepatic X-ray contract proposal files

All paths below are new proposal copies. The frozen Website test and Atlas source were not edited.

| Proposed shipping path | SHA-256 | Purpose |
| --- | --- | --- |
| `tests/clinical-review-hepatic-venous-xray.test.ts` | `9d598a559ec9543a6be1bfa9521559c61d9531519aadc2483efc8b1f529e0b6c` | Both original registrations retained; corrected built-in import, separate current-485 continuity theorem. |
| `tests/hepatic-admission-import-history.mjs` | `1b59db5168de418dc208334df0db8e53b907d270faed7df8144205536054148f` | Fail-closed historical 9f Review import loader. |
| `tests/fixtures/clinical-review-hepatic-venous-xray.original.ts.raw` | `0e1caf978b937fc60ee32aa4410b2e5e99e706866c8be4d330181fcc3225c8b1` | Byte-exact whole original frozen test. |
| `tests/hepatic-xray-preservation.test.mjs` | `528541621527a51ddb49af89aa24761c27778835df0445c00f5eafe14aef3a23` | Main-verified two-import-line correction; exact postimage/hunk/inverse and negative-tamper proof. |

The raw fixture SHA equals the frozen Website preimage SHA. The proposed test SHA is its exact reviewed postimage; the preservation test reconstructs every original byte from the reviewed edit hunks.

# Connective X-ray test proposal — source-only, unrun

Scope: replace only `tests/clinical-review-lower-limb-connective-xray.test.ts`; add `tests/connective-xray-original-preservation.test.mjs` and `tests/fixtures/connective-xray-9f-original.test.ts.raw`. These are proposal paths under this stage, not installed Website files.

| Role | SHA-256 |
| --- | --- |
| Canonical test preimage | `45edaee10adc1dd2bcd5da4461832a4878431ac0c3cfca18624c84bf95fcc074` |
| Raw original fixture | `45edaee10adc1dd2bcd5da4461832a4878431ac0c3cfca18624c84bf95fcc074` |
| Proposed test | `eb7e626855026127c0c02927a8b4c7ad7cc31da4637681dc5efa11c281bdd4f7` |
| Preservation helper | `95155898472c71789a4cc9cbd38236dca47d64c831c765eba05cceb76ca69c7f` |

Original source is 254 lines; the proposed source is 289 lines, with 48 inserted and 13 removed lines in the exact line-edit script SHA-256 `ffcb04a59f951cf91642032d0bf69b81d8fa6ef2dfe4cde5f0ecbfafe8b39e45`. The helper pins both complete files and this edit script, reconstructs the original source exactly, and rejects one-byte mutations of either file. It has not been executed.

The original single outer case remains one current delivery case. It retains the c575 before record, direct 0f introduction, a679 simulated renderer (`f5fc` → `a38b`) and epoch-only 9,932 unchanged lessons, 1,100 unchanged packets, four changed packets and four introduction pins. Current 190a/Review34c1, two learner manifests, exact connective source bytes, selected lessons, current Review packets, stale/forged refusal and current decision refusal remain separate assertions. Four later source-input blob pairs are pinned, and the 587 changed display-pin IDs from a679 to 190a are count/hash bound.

Remaining risk: this is a source-role proposal without native execution. Main must inspect whether a679 historical packet parser and current decision contexts satisfy the moved assertions; if a later transition changes a selected packet field, classify that exact source change instead of weakening a refusal. Main should run the affected native case and helper, then assess any failure before installation. No types, build, browser, GitHub, canonical or Atlas writes were performed.

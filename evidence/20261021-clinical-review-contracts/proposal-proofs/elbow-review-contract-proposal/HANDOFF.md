# Elbow review contract handoff — 21 October 2026

Proposed shipping paths under Website `tests/`:

| Path | SHA-256 |
| --- | --- |
| `clinical-review-elbow-us-followup.test.ts` | `666eadec1b2b71bed584db21d022a5af97d4e6f5e8b589ab0c7d77704b63800e` |
| `elbow-admission-import-history.mjs` | `f994bb22c3e12330d82fe9c25d33e1a48a2bee8dd9ebf47a3b5d222ca004232d` |
| `elbow-us-followup-preservation.test.mjs` | `b2127dac886e0811462cfef39cd885e3d118cb13db442e01a573d307d1a9dff5` |
| `fixtures/clinical-review-elbow-us-followup.original.ts.raw` | `aad244f03fc81cec834dbed52eed7681f8a680f6d6d52cc82a9c17cde84fab0c` |

The frozen Website original remains at the same `aad244f0…` SHA. The preservation test passed 1/1: exact preimage/postimage/loader hashes, 25 controlled hunk fingerprints, complete inverse to original bytes, both registered test bodies, retained count/refusal strings and five tamper refusals. TypeScript transform and helper syntax passed. The eight changed original assertion lines are only the documented epoch, file-path and Teaching URL seams; all other original `assert.*` lines remain exact.

Metadata check: the closed 9fba imported `app/body-content.ts` and the genuine Git blob are byte-equal, both SHA-256 `92add5e49675680abd55f687c08e7d4bbcfcb0ab34e1e0f611cc3da74c3fef9f`. The historical public reader checks relative path syntax, scope and realpath containment. The source-bound private old inbox path stays F-local. No frozen checkout edits or network activity occurred.

Actual historical loader/full test and current inbox/source resolver remain unrun while the full Website suite and queued dental job own the heavy slot. After those finish, integrate all four paths and run the command in `PROPOSAL.md` with `VM_ATLAS_SOURCE_REPO` set to the clean 485df source checkout. If the strict loader reports an unrecorded dependency, stop and identify that exact dependency; do not fall back to current files.

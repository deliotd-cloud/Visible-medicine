# Connective X-ray source roles (read-only follow-up, 21 October 2026)

## Finding

`f5fcf51b2eaa8cce712e957dc741543146a1ff091cdbd809355439bb5d3a13cf` is a fixed test input to a **synthetic historical renderer binding**, not an asserted historical Website export. In `tests/clinical-review-lower-limb-connective-xray.test.ts:116-122`, the test reads the genuine `a6797b2b` Atlas renderer, hashes `{source: sourceRenderer.sha256, website: connectiveIntegration}` to the asserted `a38b1836...` value, then overrides only `content/body-renderer-revision.json` in `exactSourceHistoryApi`. The SHA-256 calculation reproduces `a38b1836eeeaf121b617e357fcb121dd300222a3a639642b1dd75ad04b04ff9e`. At `a6797b2b`, `lib/body-review-context.ts` reads `renderer.sha256` for `rendererHash` and the geometry revision, whereas the teaching revision hashes source, teaching fingerprint and teaching checks. The constant therefore supplies a deterministic simulated Website binding for historical Review context; lack of an archived export with that exact integration hash does not by itself block a repair. Label it as synthetic in any repaired proof and preserve its original value/derived hash.

## Exact roles

- `c57599c400e5145f16c819b7cb6d9720df989ecf`: genuine before state, named by the immutable `before.json` and transition record.
- `0f8944603ba440a4d859f95015e328394c089925`: four-draft introduction, direct child of `c57599c`; its original Atlas source test includes the 9,932 other placements and four Review worksheet checks.
- `a6797b2b0c850edc5f50918c9352c887209eac94`: direct child of `0f8944`, earliest post-introduction renderer/workspace epoch. This is the historical replay target, with the synthetic renderer override above.
- `9fba9a1e24b6669aafd48e945d55fc0939d50ab2`: later epoch pinned as `revision` in the untouched Website test; it is now historical, not current.
- `190a63238eadcf906abe89dcbb6a67c88afe70b9`: current clean Atlas source and Website Review/learner import source; installed Review integration is `34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f`.

The connective lesson, before-record and full-body catalog Git blobs are equal at `a679` and `190a`; `app/body-content.ts`, `lib/regional-tours.ts`, `lib/body-review-material.ts` and display pins differ. Exactly 587 of 1,104 display-pin digests differ across those endpoints. Thus the old test's current-versus-`a679` equality assertions for all other lessons, all Review packets/tours, and only two changed pins cannot be retained as claims about current `190a`. First observed full-suite failure is the stale HEAD assertion at original line 56; later assertions have not been run in this follow-up.

## Smallest original-preserving repair path

1. Preserve the entire original Website test source byte-for-byte as a uniquely named raw historical fixture (current SHA-256 `45edaee10adc1dd2bcd5da4461832a4878431ac0c3cfca18624c84bf95fcc074`). Add an exact-original inverse/mutation guard for any adapted test source; retain every original assertion in its correct historical role.
2. Prove the original introduction transition separately: `c57599c` before record versus `0f8944`/`a679` after state, including the four exact lesson hashes, 9,932 other placements, 1,100 unchanged Review packets, four changed packets, refusals and original synthetic renderer binding. The bound renderer is a test-context witness, not a claimed export artifact.
3. Prove current delivery independently against `190a` Git bytes, installed Review `34c1`, current learner/viewer manifests, four selected identities and exact lesson content, current Review packets/revision-bound refusals. Compare current nonselected rows to an independently established immediate predecessor or enumerated later transitions; do not use `a679` as a blanket current unchanged witness. Derive current display-pin changes from the exact later source sequence rather than asserting only the two orbital rings.
4. Main should review the staged inverse and run the native affected test plus mutation proof after source roles and current allowed deltas are encoded. This follow-up ran no native tests, types, build or browser checks and changed no canonical/staged test source.

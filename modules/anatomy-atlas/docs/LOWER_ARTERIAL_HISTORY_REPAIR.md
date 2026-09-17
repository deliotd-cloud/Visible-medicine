# Lower-arterial historical validation repair

17 September 2026. Test infrastructure only: no current anatomy, teaching,
geometry, approvals, patient data, website runtime or entitlements change.

## Cause and exact repair

The lower-arterial validator compared its original 1,078-record curriculum with
a newer catalogue. After removing the already-recorded short-ciliary addition,
the older reconstruction still contained 24 later source selections/five bundles
and 46 later pelvic-vein lessons. Selecting the older catalogue alone was not
enough: those teaching changes also needed an explicit historical record.

`exact-source-history-api.mjs` compiles every application import from original
Git commit `b5725a6b8cf2fa9028b93a9e3853d864bc874bc3`, with no current-source
fallback. Its complete body/shoulder/recipe snapshot matches the **unchanged**
original fixture `129b1a83c9c921af15aa33a15ff2b8b3dda421303fbe0f17ead975cae1d670c4`.

The new `content/lower-arterial-source-history.json` records only the exact
missing differences between that original source and the already reconstructed
history. It was recorded at source `9182953ac5e8ad37c2ab253db44279d8b26edf4d`.
The recorder refuses to overwrite it or create a new record at an arbitrary head.

`restoreLowerArterialSourceHistory` checks the immutable record, full source
catalogue and full teaching/recipe snapshot before making a historical projection.
It excludes only the recorded later source selections/bundles from that view
and restores only the 46 recorded lesson pairs. All earlier source identities,
shoulder lessons and recipes remain exact. Both pending and authored phases of
the original 36 arterial topics are separately validated and retained; unknown,
mixed or changed inputs fail. The original validator uses the reconstructed
catalogue for its historical checksum and still exercises all current records.

This adapter is imported only by scripts. **No tissue or teaching is removed
from the current atlas, and no clinical approval is migrated.**

## Verification

Run from the Atlas checkout:

```sh
node scripts/record-lower-arterial-source-history.mjs --check
node scripts/validate-lower-arterial-source-history.mjs
node scripts/validate-lower-arterial-imaging.mjs
```

The new regression independently replays the original Git source, proves exact
catalogue and full-curriculum equality, checks idempotence and defensive copies,
and rejects ten invalid source/lesson/recipe states. It confirms current teaching
is unchanged. The original arterial validator retains its original hash and
checks 36 placements, 288 identity negatives and 36 real note render callbacks.
Results are in `lower-arterial-source-history-validation.json`; execution logs,
GitHub and D-drive recovery are recorded in the coordinating checkpoint.

This is a repair for this specific historical boundary, not evidence that every
legacy suite passes or that content has clinical approval. Future anatomy/copy
changes must have their own source-bound transition rather than relaxing hashes.

# Exact source-history verification

`scripts/exact-source-history-api.mjs` replays application imports from a full,
explicit Git commit. It does not substitute working-tree files when a historical
module is absent. Installed dependencies still use the existing hermetic builder.

The test-only `git-object-reader.mjs` uses one hidden, read-only
`git cat-file --batch` child per replay instead of starting `git show` for every
import. Protocol: https://git-scm.com/docs/git-cat-file#_batch_output_format.

Safeguards:

- Full lowercase SHA-1 commit/blob IDs; replacement objects disabled throughout.
- NUL-delimited tree paths; only regular Git blobs, not symlinks/submodules.
- Matching response ID/type, declared byte limit, exact content terminator and
  independently calculated Git blob SHA-1.
- Serial requests within one child, per-request timeout, queued rejection on
  failure/closure, and explicit child cleanup in `finally`.
- Fresh result buffers; no persistent source cache or cached test passes.

Run the real-Git fixture test:

```sh
node --test scripts/test-git-object-reader.mjs
```

It covers dirty/deleted working files, parallel/duplicate requests, empty/binary/
newline/NUL/multi-chunk contents, caller mutation, malformed/missing/non-blob IDs,
size boundaries, queued cancellation, spawn failure and idempotent closure.
Fixtures are private, generated under `.local`, and cleanup verifies the exact
temporary directory before removing it. The first fixture run exposed a Windows
reserved filename (`nul.txt`); the fixture now uses `embedded-nul.txt`.

## Measured checkpoint — 26 September 2026

Compared original helper at `aef64730d5e35d2962d75a436214ce67eab1c7c0`
with the new helper, replaying `1a978be6b835ec4a4c9fd2e22ef2888691ab7c09`.
Each profile had identical exported keys, structures and dissection profiles;
available content-tab exports were also identical.

| Profile | Original | Batch reader |
| --- | ---: | ---: |
| display | 12,500 ms | 248 ms |
| curriculum | 11,906 ms | 240 ms |
| copy | 11,769 ms | 241 ms |

These are one-run local observations, old then new in the same process, not a
controlled benchmark or an estimate of whole-project speed/token savings.
The complete internal-thoracic check took 61,484 ms (previous 73,901 ms), the
earlier thoracic check 58,927 ms (previous 72,296 ms), and orbital MRI 67,571 ms.
All three passed their existing exact-history/content/identity/render safeguards.
Their source baselines and expected hashes were not changed.

Evidence: `.local/test-logs/2026-09-26T15-17-04.621Z-7144-641dcf6d.{log,json}`.
Modified-script lint and `git diff --check` also pass. This is test tooling only;
no production build, deployment, clinical approval, desktop change or external
backup is implied. Current runtime renderer revision remains
`6788192e808204e39a2d06f9e021abc53bbc21551fec2137388e67e8405ca333`.

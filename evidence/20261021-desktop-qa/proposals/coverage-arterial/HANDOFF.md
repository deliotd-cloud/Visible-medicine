# Staged two-file Website test proposal

Only `tests/anatomy-coverage-revision-admission.test.mjs` and `tests/atlas-arterial-evidence-limits.test.mjs` are proposed for later integration. `FILES.json` records exact original, proposed and source SHA-256s. The unchanged originals are retained under `originals/`.

The coverage test now proves the old `400c50…` desktop source from the existing `current-delivery-before-inbox485` raw fixture while separately checking the actual current desktop `4d1ba4…` bytes. Its current source, package, snapshot and four artifact pins match stock `485df97…` producer/index/view output. It reconstructs the exact `87ed7e…` snapshot (`f21e4224…`) before the original `6036a7…` inverse, retaining old factual counts, historical raw fixtures, Review joins and clinical holds. The arterial test changes only the explicit current-source admission from `87ed7e…` to `485df97…`; its original whole-test inverse and feature-retention ancestor witness remain.

`node verify-inverse.mjs` passed. It checked frozen source bytes, reversed the complete proposed files to their SHA-bound originals, evaluated three self-contained historical/metadata callbacks, and confirmed 168 coverage source inputs with only `package.json` changing versus the old snapshot. Both proposed files passed `node --check`. These are staged proof/syntax checks, **not** focused test-module or full-suite passes.

After the live stock suite actually terminates, review its complete failure inventory. If these two repairs remain appropriate, main should verify the listed hashes, integrate only the two proposed test paths, run those exact focused modules once and assess any later failures. No runtime/source/model/clinical files were edited, and no commit, push or deployment was made.

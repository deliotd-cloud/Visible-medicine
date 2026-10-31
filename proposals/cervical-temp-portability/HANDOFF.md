# Cervical a01 temporary-directory transport proposal

Frozen source receipt: cf3faf8f249686f28885eafe388e1d834608f09e9fd59bda49d133963d19c7a2. This is a proposal only; the main task owns integration and the stock release queue.

- Source helper before and after: 814a4cc17c2358dd4383993b6fb9253d71d9fae7f8e62a301d77c46e1a02c1b1 (unchanged).
- Proposed helper: 77c10c49798a14538541499695b6392a7624eed3d5deb89a370b8ad79c2715f6.
- New focused test: 529186632784eac48afe518ff286dae1aec90564c8ee7666bd640826caf11132.
- Changed only the F-drive TEMP restriction. The exported resolver requires a supplied nonempty absolute existing readable/writable directory and returns its real path. The exported child-environment helper uses that path for TEMP, TMP and TMPDIR while preserving the fixed historical Atlas source pins and original environment isolation.
- The 6,928 historical source checks, eight dependency pins, exact a01 HEAD/tree/clean pre/post checks, original child root, complete TAP gate, and 768 MiB child heap remain unchanged. No source identity was altered.
- At the Get-Counter gate, Available MBytes was 4,728 (threshold 4,096). Ran: `node --max-old-space-size=384 --test G:\VisibleMedicine-temp\proposals\20261031-cervical-temp-portability\files\tests\cervical-a01-temp.test.mjs`. Result: 3 tests passed, 0 failed/skipped.
- Did not run the original historical child or broad release tests. Main should review this diff, integrate into its chosen successor source, run the affected original root and stock partition 11 against that exact source.

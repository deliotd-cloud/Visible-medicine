# Regional workspace return — 26 September 2026

Laterality remains shared across Explore, Dissect and Practice, like selection
and teaching navigation. Restoring a saved workspace now reconciles its focused
recipe and Undo/Redo history against the current region and side using the same
source-availability rule as the side selector. Compatible snapshots retain
their edits, history, camera, zoom and separation. An unavailable focus returns
to assembled anatomy; no opposite-side anatomy is fabricated or substituted.

## Reproduced failure and correction

At baseline `ee6c7436695acb2710d2da73517f9f3deddd1ee7`, open Head & neck,
Dissect, Study windows & focuses, then **Longus colli: supplied left parts**.
Switch to Explore, choose Right side, then return to Dissect. The old viewer
resurrected the left-only recipe despite no supplied targets on the right.
The rebuilt viewer returns to assembled anatomy on the right. Undo/Redo does
not resurrect that unavailable recipe. Removing platysma and switching modes
still restores that valid regional layer.

## Evidence

- `node scripts/test-workspace-scope-return.mjs`: 621 actual component-closure
  and persistent-hook cases, queued setters, both learning-mode directions,
  Practice return, compatible history/camera retention and no snapshot mutation.
  `--baseline` fails against the above commit (right pulmonary hilum/left).
- `validate-workspace-session.mjs`, `test-study-mode-transition.mjs` (16 cases),
  `test-search-selection-transition.mjs` (19), `validate-dissection-scope.mjs`
  (36 scopes/621 recipes) pass.
- Selection visibility (1,485,539 checks), renderer recovery (784 checks),
  body review decisions (1,104 contexts/3,312 tracks) and TypeScript pass.
- Shared regional production build passes. Existing large-chunk warning remains.
  Exact source-input hashes checked before serving from loopback; no scans or
  private data included. Built under D-drive recovery to avoid C-drive pressure.
- Actual browser: baseline failure and corrected return reproduced; safe
  Undo/Redo and valid layer retention checked. At 390 × 844, mode switching,
  tools drawer and retained layer checked with rendered anatomy. Screenshots:
  `D:/VisibleMedicine-Atlas-Recovery/workspace-scope-browser-20260926.png` and
  `D:/VisibleMedicine-Atlas-Recovery/workspace-scope-mobile-20260926.png`.

Renderer fingerprint regenerated; prior geometry approval is not carried
forward implicitly. No geometry, teaching, licences, access rules, external
dependencies or generated website modules changed. No deployment or clinical
approval is claimed. The full Atlas goal remains open.

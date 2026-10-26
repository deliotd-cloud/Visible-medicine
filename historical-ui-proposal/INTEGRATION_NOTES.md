# Historical current UI transition adapter

Apply only the four `tests/` paths in `PATCHSET.json` to an isolated successor
of `F:/VisibleMedicine/staging/20261026-current-delivery-advance/website` after
checking every `beforeSha256`. `VERIFY_STATIC_INVERSES.mjs` is a proposal-side
control and need not be copied into the website. The copied original source is
byte-exact SHA-256 `d7d18ae9b36cd593475998420137b7611695aba5a12053abe12fb0c18c27b696`.

The active `.test.mjs` root remains visible to the stock test command. It
checks the pinned `SOURCE_BOUND.json` and its parent receipt, hashes **all
6,162** recorded website source files with exact lengths and path containment,
checks the eight overlay rows against that closure, checks native 9e HEAD/tree
and a clean worktree, and checks the original test, validator, pin and three
2381 predecessor fixtures. It then runs the original unfiltered test file as
one isolated Node process in the 9e website with the 9e native checkout. The
adapter repeats the **same full receipt, 6,162-file closure, overlay, original
source and clean native source checks after child completion**, including when
the child fails. It requires exactly three child passes with zero fail, skipped,
cancelled or todo cases. One outer stock case contains these three original
child cases; the emitted `historical-ui-replay` marker reports that distinction,
the exact child TAP byte count/SHA-256, exit status, reported counts and whether
the post-child context check succeeded. A missing or changed historical context
fails the active root.

The original test imports only Node builtins and the local
`current-atlas-delivery.mjs`, which imports only Node builtins and the local
`atlas-source-repo.mjs`; that file imports only Node builtins. The external Git
command used by those helpers is pinned to the observed Windows launcher SHA
`22fead82...`, first PATH resolution and version `2.55.0.windows.2`. The
source receipt covers the local modules, `package.json` and lockfile; no blanket
dependency or hermetic runtime claim is made.
This is source regression evidence; it does not confer a01/current admission,
clinical approval, release readiness or approval migration.

The two related edits use the frozen original test source for their historical
inverse. Both edited whole files invert byte-for-byte to their current
preimages, and the frozen 9e source inverses exactly to both older transition
fixtures. `VERIFY_STATIC_INVERSES.mjs` checks these without importing or
running any test. It passed, as did `node --check` on the three proposed test
files. No runtime test or build was run in this proposal.

Main should check `SOURCE_BOUND.json` rows and run this active root after
integration, then separately triage any *other* current-context assertions in
head-pan/window-drag roots. Those roots retain their own cases and refusals;
only their historical transition operand is changed here. The a01 current
contract and current Help transition remain separate. Keep complete original
TAP/error output on failure, and do not fall back to current candidate bytes.

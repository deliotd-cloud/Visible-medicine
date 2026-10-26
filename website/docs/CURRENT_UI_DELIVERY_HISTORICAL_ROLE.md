# Exact 9e UI roots: source-only replay proposal

This patch owns exactly three active roots, one fixed helper and three whole
original `.raw` files under `tests/`. Apply it only to an isolated successor
after checking the candidate preimage hashes in `PATCHSET.json`. V1 and V2
remain separate historical proposals; no candidate, canonical, checkpoint,
receipt, Git or production file was edited here.

The original active roots are byte-exact to
`F:/VisibleMedicine/staging/20261023-head-pan-bound/website`: current UI
transition `d7d18ae9...` (3 cases), head pan binding `13997d80...` (8 cases),
window drag binding `caebbf23...` (6 cases). The 17 whole original case bodies,
negative checks and cross-file inverses remain in their authentic checkout;
there are no partial operand edits. Their immutable `.raw` copies must equal
both candidate preimages and the old checkout before replay.

The helper accepts only those three literal filenames. For each active stock
root it checks the pinned `SOURCE_BOUND.json` and parent receipt, all 6,162
recorded website source rows by length and SHA-256, eight overlays, every
frozen original and exact historical file, old validator/pin/predecessor
fixtures, and native 9e HEAD/tree/clean status. It repeats the *entire* context
check after the child finishes, including if the child fails. Missing or
changed historical bytes fail that active root; there is no a01 fallback.

The child runs the unfiltered original filename in an isolated Node test
process at the 9e checkout. It must report exactly its original 3, 8 or 6
passes with zero failures, skipped, cancelled or todo cases. The stock runner
sees three outer wrapper cases, each containing the stated historical child
cases. Every line of child TAP and stderr is emitted with a distinct comment
prefix, followed by a marker with the exact raw TAP SHA-256/byte count,
reported counts, status and post-context result. These are nested counts, not
extra parent cases. No full suite, build, browser or clinical acceptance is
claimed by this proposal.

The original import closure is Node builtins plus the local
`current-atlas-delivery.mjs`, `atlas-source-repo.mjs` and
`head-pan-current-admission.mjs`; there is no package import. The external Git
launcher used by the source helper is pinned by SHA-256, first PATH resolution
and version `2.55.0.windows.2`. Exact local modules, `package.json` and the
lockfile are in the 6,162-row receipt. This is a source regression replay, not
a hermetic runtime or clinical/source approval transfer.

`VERIFY_STATIC_INVERSES.mjs` is proposal-side only. It confirms three exact
originals in candidate and old checkout, 17 case names/counts, the old pin,
receipt rows, complete import allowlist, exact one-root wrapper text and
foreign/tampered-source refusals. It passes without running tests. Main must
run the three active roots and verify the full closure in the integrated
successor, retaining their output and failure evidence. The a01 current
engineering and functional contracts remain separate.

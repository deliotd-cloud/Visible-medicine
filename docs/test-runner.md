# Complete website tests

`npm test` runs every direct `tests/*.test.ts` and `tests/*.test.mjs` entry,
with isolated Node test files and concurrency1. A wrapper importing another
test stays in the inventory: the runner does not silently deduplicate, skip or
name-filter entries. Case totals can therefore exceed direct entry-file totals.

Use `npm run test:list` to inspect the complete inventory without launching a
test process. Calling `node scripts/run-website-tests.mjs` directly also defaults
to listing. Do not combine `--run` and `--list`.

Each invocation creates a fresh ignored `.local/website-test-runs/` directory
with a manifest and terminal receipt. A run also records the actual spawned
runner/test PID and exact command in `started.json`, and retains `child.log`.
Spawn evidence is not proof a process remains alive: check that PID/command or
the terminal receipt before resuming a wait. Never restart solely because an
observation timed out. Logs are local evidence, not cleared hosted artifacts.

The manifest fingerprints effective text/code/metadata in named project paths,
including migrations and generated Atlas/Review metadata. Binary models,
scans, masks, media, dependencies, build output and private runtime directories
are excluded. Private-directory and credential-filename exclusions are
case-insensitive. This is a bounded source inventory, not a complete data backup,
de-identification audit, licence certificate or clinical acceptance record.

A failed child or changed/added/deleted test/source input cannot produce a
passing receipt. Keep the candidate unchanged during a full run and preserve
the original failed log when repairing a fixture. Focused checks remain useful,
but they do not substitute for the final applicable release suite.

`passingClaim` means only a successful Node child with stable named inputs.
Receipts also record case counts and a stricter `unskippedPassingClaim`, which
requires positive case coverage and no failures, cancellations, skips or todos.
Platform omissions must not disappear behind an exit0: the baseline's two
skips were Windows symlink-privilege limits, not successful symlink validation.
Neither field constitutes browser, clinical, rights/privacy or release approval.

The720-entry baseline completed on16October2026 with3212 cases:3036 passed,
174 failed and2 skipped. Its source and raw log are preserved separately.
It is not a passing release gate. New source-bound repair checkpoints and
the current inventory must be consulted before comparing later results.

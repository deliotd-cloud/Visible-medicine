# Opt-in chunked Website test evidence

This staged tool is separate from `scripts/run-website-tests.mjs`. The copied default runner is byte-identical to the 22 October diagnostic successor (SHA-256 `9dc062a40d1a92c45c4d0d45ab02957b4f54a32af9d96f9e84ce06601d828a7a`). `stock-website-test-inventory.mjs` is that exact source with only `export { inventory };` appended; the focused test proves the inverse. The default `npm test`, stock arguments, and uninterrupted release gate remain unchanged.

After integration into an isolated Website source, run explicitly:

```text
node scripts/run-website-tests-chunked.mjs --run --root ABSOLUTE_WEBSITE_ROOT --chunk-size 25
node scripts/run-website-tests-chunked.mjs --resume ABSOLUTE_BATCH_DIRECTORY --root ABSOLUTE_WEBSITE_ROOT
```

`--stop-after N` creates an intentional incomplete pause after N newly passing chunks. The batch lives under the Website root's ignored `.local/website-test-chunks`. Each owned Node coordinator runs the native `node:test` API with explicit direct-root filenames, the native spec/TAP reporters, `--experimental-strip-types`, and concurrency 1. Its actual arguments and helper bytes are frozen in the plan. Plan, start, receipt, raw spec/TAP logs, hashes, and attempt history remain local. A retry creates a new attempt directory and retains every old failed or interrupted log.

The owned coordinator uses IPC to announce readiness before invoking `node:test`. The parent inspects that same live PID through Windows CIM, writes the sealed start and anchor records, then explicitly releases it. A parent disconnect or startup failure before release ends the waiting child without running test files. This avoids the short-lived `--test` controller race; native `node:test` still manages its normal test workers after release. A failed identity inspection never accepts a gone or unknown process.

Before any output or child, the production CLI applies the stock Website Git/history and public-preview gates. It freezes exact named input bytes, full direct-root inventory, proven glottic mirror choice, public preview proof, environment hash, Node identity, tool bytes, and the chunk plan. It refuses resume on drift, tampering, a live/unknown runner or child identity, missing terminal evidence, or incomplete native counts. PID reuse is checked with Windows start/executable/command identity, not PID alone. Failed, skipped, todo, cancelled, signal-terminated, interrupted, or malformed attempts are never reusable.

On resume, the batch path, plan, and anchor are validated before checking frozen inputs. Any observed source, preview, history, tool, environment, Node, or preflight drift writes a sealed `invalidated.json` with exclusive creation and stops the batch permanently. Restoring the prior bytes or preview proof does not permit a later resume. The marker and old attempts remain for review. A production new run still applies the preflight before creating the batch.

Production receipt parsing requires actual sequential, unindented top-level results and suite-summary parity as well as exact TAP/spec case totals. The terminal plan counts top-level results, not nested cases. Empty suites are counted separately from cases. Summary-only fixtures are supported only by the pure helper's legacy default; both production receipt paths explicitly enable strict result requirements. Skip, todo, cancellation, failure, reporter mismatch, missing plan/results, and malformed top-level numbering remain refusals. Observed post-attempt drift also creates a permanent marker, even if a later guard sees restored inputs.

The unchanged stock inventory currently fingerprints6,244named text/code/metadata files and1,178test entries; the separate delivery receipt names6,426paths. Its182extra paths include binary assets, local source maps, Python and historical fixture formats outside the stock named scope. Neither count is a whole-private-data fingerprint. Main verified the exact1,177direct-root union plus the one proven import-covered mirror, including Windows command-budget partitioning. Do not equate this partition proof with executing those roots or approving those assets.

A composite pass requires one valid passing attempt per planned chunk under the same frozen identity. It is **sequential chunked evidence**, never the original uninterrupted stock run, a browser/release gate, or clinical/privacy approval. Process isolation can change cross-file interactions. This worker tested only small synthetic fixtures under its stage; the active 1,178-entry stock run and selected Website source were untouched. Raw logs can contain assertion values and should not be published.

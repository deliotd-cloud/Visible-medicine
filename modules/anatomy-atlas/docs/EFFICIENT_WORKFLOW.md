# Efficient delivery without weaker review

Owner-approved working policy, 16 September 2026. The complete Atlas/website
roadmap and its clinical, licensing, privacy and release gates remain in force.

## Allocation

| Work | Default |
| --- | --- |
| Planning, integration, final diff/risk review | Main Astra, High |
| Bounded implementation, regression tests, structured drafts | Sol, Medium |
| Read-only code mapping, primary-reference collection, concise audit | Terra, Medium |
| Mechanical conversion, inventories, hashes, repeated verification | Existing scripts first |
| Difficult spatial/registration, security or unresolved reasoning | Escalate narrowly to Astra higher effort; explain why |

Use zero workers for tiny or tightly coupled tasks, otherwise normally one or
two. More workers are not inherently more efficient. Do not delegate merely
to fill slots or send every decision back through the same full investigation.
No nested delegation. Only the main task commits, integrates, backs up or
publishes; specialist ownership and existing authorization still apply.

The project .codex/config.toml sets GPT-6 Astra High and GPT-6 Sol Medium defaults with a
two-worker limit; equivalent copies live in the main coordination folder and
website checkout. No account-wide setting, permissions or authentication change.
Existing task/composer overrides can take precedence; a file edit does not
retroactively switch the running turn. Explicitly request model and effort when
spawning workers, and verify the actual tool result. Use a lighter read-only
worker only for a bounded scan that benefits from parallelism. If the composer
still shows Ultra, select High there for the main task.

Configuration syntax checked against [official subagent documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents).
This is our project allocation policy, not a guarantee of equal performance or
a percentage saving. Lower model cost and lower token count are different.

## Brief and handover

### Dispatch contract

Use these explicit tool settings when dispatching a bounded task:

- Implementation/tests: `model: "gpt-6-sol"`, `reasoning_effort: "medium"`.
- Read-only discovery: `model: "gpt-5.6-terra"`, `reasoning_effort: "medium"`.
- For either worker, use `fork_turns: "none"` with the complete short brief below;
  include applicable instructions and reference paths, not the full chat history.

The coordinator keeps a small working queue: ready, assigned (owner and exact
files), awaiting integration, verified, or blocked (specific missing input).
Finish and review an in-flight deliverable before opening another dependent one.
Delegate only when the coordinator has useful independent work to do concurrently.
If a worker slot is unavailable, continue safe local work; do not repeatedly retry
spawning, poll unchanged state, or create a separate user task as a workaround.
Never claim a configured default changed the current main model or reasoning
effort. Keep explicit dispatch settings even when matching project defaults.

Give each worker a fresh bounded context, not the accumulated chat:

1. Objective, acceptance criteria and exact source/checkpoint.
2. Allowed files; exclusive ownership; interfaces other workers must preserve.
3. Applicable instructions and required references, plus explicit exclusions.
4. Checks to run once, how to report evidence and when to escalate.

Reusable worker brief (fill in the actual paths, commit and checks; omit any
field that does not apply):

```text
Objective: One bounded deliverable and its acceptance criterion.
Baseline: Exact repository, commit, and relevant source/checkpoint.
Ownership: Files this worker alone may edit; other workers' files are off limits.
Acceptance: Named behavior, negative cases, and focused commands to run once.
Boundaries: No scans, masks, identifiers, unreviewed assets or approval claims;
            list any additional product-specific exclusions.
Handoff: Changed paths, pass/fail evidence, unresolved risks and next action
         in about 200 words. No commit, push, deployment or nested delegation.
```

The coordinator chooses zero to two independent tasks, keeps dependent steps
local, reviews the actual returned diffs and safety gates, runs any integration
checks, then alone commits and verifies GitHub and D-drive recovery. A worker
should stop with evidence when its bounded task needs a source or clinical
decision; it must not broaden ownership or weaken a test to report success.

Workers return changed paths, evidence/log locations, failures/limits and next
action in about 200 words (longer only for material risks). Main reviews the
actual diff and evidence, resolves conflicts, and adds missing tests. Do not
repeat successful unchanged checks just to recreate their output. Re-run checks
when relevant source, dependencies, environment or generated output changes.
Never reuse a pass without its source/configuration identity.

## Risk-matched validation

### Throughput update — 26 September 2026

Use the available workers for independent deliverables, not duplicate full-project
investigations. Assign source ownership before starting; the coordinator alone
edits shared content dispatch, history, package scripts and generated review data.
Workers return focused evidence and stop; the coordinator integrates a completed
batch once and runs the shared validation once against that exact combined state.

Only one memory-heavy build, typecheck or broad validation process runs at a time.
On this Windows host, the recovered Vite build used process-local
`RAYON_NUM_THREADS=1` and `GOMAXPROCS=2`; prefer that bounded concurrency while
memory pressure is unresolved. Do not change machine-wide settings or terminate
unrelated applications. Lightweight independent research may proceed concurrently.

Classify a failed check before retrying: resource failure, pre-existing diagnostic,
or regression. Retain the original failure and rerun only the affected check after
a relevant correction or observed resource recovery. Never suppress a check to
improve throughput. Browser acceptance and actual remote backup still need their
own evidence; neither can be inferred from a build or local commit.

The current session admits two workers plus the coordinator. A four-worker
future-session cap was discussed, but the protected configuration write was not
granted. No higher cap was applied or claimed; obey the actual session limit.

These are starting points, not automatic coverage or a release checklist:

| Change | Required decision/checks |
| --- | --- |
| Documentation/workflow only | Diff, links/config syntax, tooling tests; no website build solely for prose |
| Teaching | Exact affected source-pin/transition/teaching suite; content contract and review-binding checks for changed contracts |
| Anatomy/model | Affected geometry/export suite, source-holds:test, source-geometry:test; source identity, licences and renderer/review bindings |
| Viewer interactions | Affected behavior tests, renderer:test, selection-visibility:test, relevant navigation/link tests; actual visual/mobile QA |
| Imaging/access | Affected imaging:test, didanix-adapter:test, imaging-comparison:test, volume-viewer:test and independent-navigation:test |
| Website integration/release | Applicable integration tests, TypeScript/build, model-delivery inventory/access checks and existing publication verification |

Many validators write evidence JSON. Build regenerates review records and
delivery outputs. Inspect status before/after, preserve unrelated work and do not
call these operations read-only. Run shared-output writers sequentially.
Never suppress a failed test, broaden a fixture to fit a bug, skip a source
hold, or treat source tests as browser/GPU or clinical evidence.

## Focused checks

From the Atlas checkout:

```sh
node --test scripts/test-focused-checks.mjs
node scripts/run-focused-checks.mjs --dry-run craniofacial-organ-imaging:test
node scripts/run-focused-checks.mjs craniofacial-organ-imaging:test
```

Select actual package test/check aliases deliberately. The runner keeps full
logs and a manifest under ignored .local/ and reports concise status/duration.
It does not cache passes, infer coverage, authorize publication, or make the
underlying validators read-only. Review the current package command before
running it. Keep logs local; they are not cleared public artifacts.
Use existing commands directly for builds/audits outside its selection policy.

## Checkpoints and evaluation

Keep a compact latest-state pointer with source heads, completed checks, active
process handles (or none), deployment state, genuine blocker and next task.
Retain historical evidence rather than copying it into each new worker brief.
Backup requires verified GitHub readback and D-drive recovery; a local commit is
not a remote backup. Do not repeatedly retry an unchanged external failure.

Record worker model/effort, elapsed time, tests and correction/rework for each
pilot. Include tokens only when actual per-run measurements are available;
otherwise mark unavailable. Compare total work including orchestration/rework
before claiming savings. If quality drops, narrow the task or escalate.
Clinical/anatomical drafts always remain subject to the user's revision-bound
radiologist sign-off. Never trade that gate for lower token usage.

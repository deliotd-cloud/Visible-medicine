# Viewer control state — 26 September 2026

Source-only improvement from Atlas `ce2037fcdd2ff3308095ce34a7d24628f6a864d2`.

- Regional/whole-body separation slider now uses the same empty-view/exam lock
  as the adjacent style selector. Its callback also rejects changes while locked.
  Hiding all anatomy cannot silently alter separation before a system is restored.
  Restoring anatomy preserves the prior separation amount.
- Labels, Fade others and Frame selection now expose their existing boolean state
  through `aria-pressed`, retaining stable accessible names and the existing layout.
- No geometry, teaching, licence, entitlement or clinical approval changes.
  Renderer and unsigned review-pilot bindings were regenerated; no approvals migrated.

## Verification

`node --test scripts/test-viewer-control-state.mjs`: 21 cases pass. Executes
production JSX attributes/callbacks for all three layouts, exam/normal mode,
zero/one/multiple available structures, restoration and both toggle states.
Toggle output is also rendered to static HTML. Leaf controls are substituted;
this is not evidence of browser focus, pointer behavior or assistive technology.

Also passed: TypeScript, separation styles, selection visibility, scene recovery,
body review, body decisions, content contracts. Pre-change camera keyboard and
screen-label suites passed; neither source was changed.

Local runner logs:

- `.local/test-logs/2026-09-26T10-40-39.079Z-47124-182561e8.log` — new regression suite.
- `.local/test-logs/2026-09-26T10-41-18.073Z-15176-ce126e9e.log` — control,
  selection, renderer and review checks pass; separation process ran out of memory
  and content process exited abnormally. Not an all-pass log.
- `.local/test-logs/2026-09-26T10-42-17.191Z-54884-ffa34979.log` — separation
  and content rerun pass.

## Verification follow-up

The production build subsequently passed (3,371 modules, 8.53 seconds) with
process-local `RAYON_NUM_THREADS=1` and `GOMAXPROCS=2`. Existing large-chunk
warnings remain. The new regression file also passes oxlint. The generated
candidate contains all 199 files, bound to runtime source `ffe718b`.

The three React lint diagnostics were also reproduced from the pre-change
`ce2037f` explorer extracted under `.local/control-state-lint-baseline-20260926`.
That isolated extraction has additional missing-import/type diagnostics and is
not a whole-project baseline lint pass. No lint rules were weakened.

## Subsequent local batch

The `81ed12c` viewer-transition batch fixes the three existing React lint errors
without suppressions, passes focused lint/TypeScript/build and retains all 21
control-state regressions. See [integration evidence](VIEWER_EFFECT_STATE.md).
The user allowed local preview in chat, but the browser tool still rejected the
fresh loopback URL. Browser acceptance and external recovery remain pending.

## Historical pending state before that batch

- Earlier build attempts failed allocating memory; the later successful build
  resolves that build blocker, not the outstanding browser acceptance.
- Full-file lint reports three diagnostics at unchanged explorer lines 416, 420
  and 464. No whole-file clean lint claim. Do not weaken rules or edit unrelated
  effects to hide these results.
- Local browser access was explicitly denied. No workaround was attempted.
  Actual empty-view slider and toggle browser/AT verification remains required.
- Live-site access was confirmed separately, but its tab crashed on opening
  `/atlas/3d`. No regional acceptance was completed and no candidate was deployed.
- Current environment did not grant requested GitHub network/D-drive write access.
  New changes are locally saved only until external backup is verified.

Live website remains private version 157 / website `a5c79d1` with Atlas `ce2037f`.
All existing release/privacy/clinical/device/imaging gates remain open.

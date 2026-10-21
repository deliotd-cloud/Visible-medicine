# Complete-suite tail triage (read-only)

Evidence: native `child.tap` from the 2026-10-21 05:37 run, with its terminal receipt now present. This is first-failure diagnosis, not post-fix validation or a claim of passing delivery. No test, build, type check, validator, or source edit was run. `TRIAGE.json` contains metadata only: TAP number, module, declaration/assertion line where available, short scalar identity/count mismatch, category, and concise cause. It copies no assertion payload, manifest, media, or private data.

After excluding V7's 28, Batch C-v4's 10, and Batch E-v4's 7 failure markers, **91 markers in 67 modules** remain: 60 stale source/revision first failures, 23 stale representation/minifier or whole-source witness first failures, 7 harness/mock/interface first failures, and 1 unresolved connective theorem. These are diagnostic categories, not permission to repin or skip historical proofs. No genuine product regression is confirmed by these first failures.

Highest-priority checks for main:

- `head-neck-pilot.test.ts:144` / TAP2875: historical 9f manifest refers to `body-scene-CcFnIl_v.js`, absent in current190 runtime (which has `body-scene-Bzofy8VU.js`). The historical overlay freezes only selected text and falls through to current files; determine whether the old asset is recoverable before calling this a runtime regression.
- `clinical-review-specimen-continuous-playback.test.ts:96,181` / TAP1058–1059: Git ancestry/object calls cannot resolve current190 from that helper's root. Check repository/root wiring, not clinical behavior, first.
- `clinical-review-lower-limb-connective-xray.test.ts:56` / TAP953: Review owner is 98d7 but the test expects 9f; historical four-entry/9,932/1,100/refusal proof and separate current190 binding remain unresolved. Do not merely change the expected hash.

Other notable clusters: legacy clinical tests compare current190 to 9f/87ed/485 source epochs; several head-runtime transitions compare later CSS/hash or 1,710-binding counts to closed earlier representations; public-focus and vascular preservation guards reject test-source changes beyond declared seams. Exact module inventory and evidence are in `TRIAGE.json`. Main should validate all classifications against final native receipt and actual focused proof runs; this triage does not close any case.

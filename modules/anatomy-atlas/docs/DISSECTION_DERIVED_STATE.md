# Dissection interaction calculations

13 September 2026. The regional and whole-body explorer now reuses unchanged
membership, guidance, loading and practice calculations while presentation
controls change. The model, interface and available actions remain the same.

Previously each parent render rebuilt the enabled-structure array. That also
invalidated the existing joint close-up calculation and repeated guidance,
practice eligibility and question counts, even for separation or fading changes.
Reasoning practice was counted three times: readiness, total and an empty retry
list. The readiness check now uses the same total, and empty retries remain zero.

The actual React `useMemo` dependencies track source scope, system switches,
dissection visibility, recipe/focus, loaded/failed bundles, practice settings,
results and session state. Camera/separation/appearance updates still reach the
renderer, including the required recalculation of joint close-up framing.
No model is simplified, no frame is throttled and no data is deferred. Memo
reuse is an optimization only: discarding the cache produces the same results.

## Verification

`node scripts/validate-dissection-derived-state.mjs` extracts and executes the
actual 17 explorer derivations against the preceding committed source
`6b1385e522a90cda5f76aa5fc7e587673991c910`. It uses current source helpers and
catalogue, with a dependency-cache harness; it is not a full browser mount.

Across 36 region/side scopes, 1,044 comparisons retain the preceding outputs.
432 presentation-only updates make zero calls to the targeted heavy helpers.
864 changed-input checks cover visibility, loaded/failed/retry state, focus
sampling, question mode, results, active exam scenes and rendering readiness.
Uncached replay is equivalent and all 1,101 source records remain unchanged.
The local twelve-render whole-body sample was 64.922 ms before / 0.534 ms after
for these derivations only. That is not a frame-rate, INP or device guarantee.

Existing dissection-history (104,541 checks), reasoning-practice (10,611 checks),
source-bound body-review safeguards, TypeScript and the production build pass.
The new display dependency hash is
`8c1db6391c2f9bad5ec47f5f2f01fd1de3f71449d66591f1a27b27422f7ece0f`.
Consult the checkpoint for source recovery and hosted status.
No source mesh, lesson, licence, library, private scan, approval, entitlement,
imaging contract, saved-view format or dissection action is changed. The
root-body display fingerprint must advance with the renderer input change;
existing clinical/display approvals are not migrated.

The independent shoulder and specimen-based website pilots do not use this
root-body explorer and are not regenerated for this change. Browser/touch and
whole-body GPU/memory performance remain separate acceptance work. Continue
the shared regional anatomy, teaching and Education integration roadmap.

# Regional loading and practice resilience

## What changes

All eleven regional explorers and whole-body scope now track each source bundle as **ready**, **failed** or **pending**, with no simultaneous ready/failed membership. A later rendering failure withdraws the earlier ready state. Successful recovery clears the failure; selective retry clears only the requested groups before remounting them. Unaffected groups and dissection settings are retained.

The scene and readiness counter share the same enabled-system, hidden-tissue and ghost predicate. The counter reports genuinely ready groups; failed groups are shown separately and never counted as loaded. Exam readiness follows the anatomy actually rendered for the question: all snapshotted find-mode targets, or the current naming-mode target. Unrendered context and unrelated failures do not inflate the counter or pause that question.

Starting practice waits for the visible target scope to settle. Failed groups cannot supply targets or distractors; practice from the successfully loaded subset remains possible when enough eligible anatomy exists. Find mode needs one target; naming mode needs at least two distinct case-insensitive names, using the same predicate as question creation. Ghost-only context is not an eligible target.

During practice, a pending or failed required group pauses model answers, naming choices, skip/reveal and next/finish. An announced message explains loading versus unavailable anatomy. Questions, responses and score are retained; **Retry missing anatomy** or **Exit practice** remain available. Existing retry-missed, answer-once and stale-question safeguards remain intact. No practice answers are sent to a server.

## Implementation and evidence

- `lib/anatomy-load-state.ts`: immutable atomic load reducer, defensive partition summary and shared rendered scope.
- `app/body-scene.tsx`: uses the shared scope predicate; original source geometry, cache and selective boundary remounting remain intact.
- `app/body-explorer.tsx`: scene-scoped progress, failure-aware eligibility, pause announcements and independently guarded answer/advance handlers.
- `lib/anatomy-practice.ts`: shared minimum-pool predicate; existing sampling, identity, scoring and question semantics preserved.

Run `npm run loads:test`. The committed `anatomy-loading-validation.json` records **84,966 assertions**, 36 region/side scopes, 714 recipe scopes, 11,424 enabled/hidden/ghost combinations and 1,425 valid sessions. Tests cover late failure, conflicting legacy status, selective retry, idempotence, distinct naming choices, exact exam scope, source non-mutation and retained questions/answers. Static handler and markup checks verify the actual UI gates; these are **not browser fault injection**.

Existing source, dissection, workbench, practice, saved-view, imaging-ID, navigation, study-link, study-library, inspection, arrangement, explode and review suites pass. The catalogue remains **1,006 entries / 82 body bundles / 128 stages / 110 focuses**; the separate shoulder asset remains unchanged. Review fingerprints are refreshed for the shared practice-file change without creating approvals.

## Explicit remaining acceptance

Test throttled and failed downloads, late render errors, repeated retries, changing systems/regions, ghost context, return navigation and naming-question transitions in actual browsers. Verify keyboard and assistive-technology announcements, touch interaction and exit/recovery on small screens. WebGL context loss, GPU exhaustion, a global Canvas failure, stalled network timeouts and generation-token cancellation are not solved or browser-tested by this milestone. The dedicated shoulder's separate loading implementation is unchanged. Numerical tests do not establish anatomical accuracy or quiz validity.

No new runtime dependency, anatomy asset, texture, font, copied illustration, paid API or licence obligation is introduced. This is a functional reliability change, not new anatomical coverage or clinical approval.

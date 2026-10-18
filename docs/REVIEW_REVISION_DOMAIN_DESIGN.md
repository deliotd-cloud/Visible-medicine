# Review revision domains: audit before changing approval scope

Read-only audit of Atlas source `25fcb29cd0ae718ef33691d5bcddcd06bda38dc7`.
The current strict implementation remains authoritative; this design note
does not change a revision, saved decision, checklist or approval.

## Why simply pruning teaching files is unsafe

`scripts/body-renderer-revisions.mjs` walks the complete renderer import graph.
The graph includes lazy teaching, scene/selection/layer/label controls, tours and
quiz interactions. `lib/regional-tours.ts` binds exact targets, context bundles,
camera frames and fading; these are behavioral geometry-review inputs, not prose.

`lib/body-review-context.ts` includes source, renderer and geometry checklist in
the geometry revision. Independently, `lib/body-review-api.ts` requires the exact
whole worksheet `materialHash` on every save, including geometry.
`lib/body-review-client.ts` also compares the worksheet material hash.
`lib/body-review-material.ts` includes all current topics, reasoning and tours in
that worksheet identity. Pruning one renderer dependency therefore neither
proves unchanged presentation nor solves stale-material saves.

There is a candidate runtime boundary in `app/lazy-body-teaching.tsx` and
`lib/body-teaching-loader.ts`: source-identity-bound lessons load on demand.
It is not yet proof that all excluded text/configuration cannot affect model
presentation, framing, visibility, labels, questions or guided interactions.

## Required future contract

1. Define explicit geometry, teaching and imaging review scopes, including what
   the reviewer actually sees. Identify every shared behavioral dependency.
2. Bind saves to the selected track's exact reviewed material **and** the current
   full worksheet/source context. A mismatched client or foreign source must
   still be refused before storage; do not accept arbitrary old material hashes.
3. Demonstrate prose-only isolation through actual source/renderer tests, not
   path-name exclusions. Mutate mesh/source identity, labels, camera, selection,
   layer controls, tour order/targets/fading, quiz behavior, rendering/compiler
   configuration and delivery bindings; each relevant geometry change must
   invalidate the geometry review.
4. Keep historical approvals in their original domains. A changed scope/schema
   requires explicit new review; never transfer confirmations, hide stale records
   or infer that unchanged mesh bytes mean clinically accepted anatomy.
5. Cover stale/forged submissions, changed accounts/institutions, late navigation,
   unsaved corrections and partial rollout across learner/Review revisions.

Retain source gates `validate-body-decisions.mjs`, `test-body-review-integrity.mjs`,
`test-body-review-display-digests.mjs`, `validate-body-review.mjs`,
`validate-selection-visibility.mjs` and `validate-scene-recovery.mjs`, plus website
revision-binding and decision API tests. No rule has been weakened while this
boundary is unproven. Advance independent anatomy/imaging/teaching work instead
of stalling for a speculative optimization or clinical sign-off.

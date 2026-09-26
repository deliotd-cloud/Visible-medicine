# Saved dissection views and side filters

New regional and whole-body bookmarks preserve effective dissection removals
across the entire current region, including structures temporarily excluded by
the Left/Right display filter. Restoring a bookmark still restores its saved
side, camera, systems and other display settings. Changing back to Both sides
must not resurrect tissue that was removed before saving.

Only bookmark capture uses the full regional scope. The visible model, removed
list, guidance and enabled counts continue to use the current side filter.
Stage/focus exclusions and manually restored exceptions are resolved into the
existing explicit hidden-ID list; no new storage schema or clinical data is
introduced. Structures outside the current region are not added.

Older bookmarks remain readable. Their missing opposite-side removals cannot
be reconstructed: recreate those removals and save a new view if needed.
Geometry/revision compatibility checks and all clinical review gates remain
unchanged. Browser acceptance remains pending; controlled source tests do not
establish visual, touch or assistive-technology behaviour.

Regression command: `npm run study-view-laterality:test`.

## Verification — 26 September 2026

- 37 scenarios execute the actual capture/restore handlers against the real
  catalog, profiles and reducer: 1,397 checks, including whole body, live focus
  recipes, manual exceptions, foreign-region exclusion and legacy parsing.
- `node scripts/test-study-view-laterality.mjs --baseline` deliberately runs the
  original `aecdc36` handlers and fails: the saved left-side bookmark omits the
  manually removed right clavicle. This is the expected pre-fix reproduction.
- Study-view, contextual undo, renderer, selection visibility, body-review and
  decision-binding checks pass. Log:
  `.local/test-logs/2026-09-26T12-27-43.843Z-32060-f0ed18d4.log`.
- TypeScript and focused lint pass. The initial nullable-catalog TypeScript
  diagnostic was fixed before the passing rerun; no checks were suppressed.
- Production regional module build passes (3,378 modules, 9.16 seconds), with
  existing large-chunk warnings. Unsigned renderer/review bindings refreshed;
  no approval records or anatomy/teaching assets changed.

# Model access notices

9 October 2026. Source milestone; matching website learner/Clinical Review import
and actual-browser acceptance remain pending. This does not change access control.

The shared model boundary distinguishes verified HTTP 401 and 403 responses for
the exact requested model URL, including its revision query. Explorer and the
shared nested workbench explain sign-in versus refused access and offer an explicit
**Check access again** action. Other errors retain the existing generic Retry UI.
The observed Three/Drei wrapper is matched narrowly; unrelated response URLs,
unknown wrappers, malformed objects, geometry failures and network failures never
infer authentication or entitlement state. Error text and private URLs are not
displayed. No automatic retries, authentication changes or sign-in route assumptions.

Only required failed bundles contribute to the notice. Loaded or out-of-scope
failures cannot leave an access warning behind; a later generic failure overwrites
the old reason. Existing selection/dissection state, manual retry plans, rendering
readiness and practice safeguards remain in place. Other independent BodyScene
consumers may still show generic recovery UI; this is not a site-wide completion
claim. No patient-space synchronization, clinical approval or new assets implied.

Focused verification:

- `node --import tsx --test scripts/test-model-load-failure.mjs scripts/test-body-bundle-geometry.mjs`:
  10 tests including real error-boundary propagation and strict URL/refusal cases.
- `node scripts/test-explorer-load-notice.mjs`: 9 controlled Explorer callback/UI checks.
- `node scripts/test-nested-selection-order.mjs`: 39 nested checks, including access
  recovery, preserved selection, successful load, unrelated bundles and practice.
- Existing ventricular component: 160 checks; nested practice: 1,027 checks.
- Fresh TypeScript, generated renderer/export/Review bindings and focused validators;
  isolated E regional build recorded in the local evidence directory.

Evidence/checkpoint: `E:/VisibleMedicine-LocalStaging/20261009-model-access-notice/`.
Recovery is scoped source-only on the same machine, not verified GitHub/off-device
backup. Main website and running previews remain unchanged at this source step.

# Shoulder model access failures

The shoulder scene now uses the same strict model-response classifier as the
regional Atlas. This addresses the observed local website failure where a model
request returned 401 but the UI offered only “Retry shoulder anatomy”.

- Exact requested-bundle 401: sign in to the website hosting the Atlas, then
  **Check access again**.
- Exact requested-bundle 403: check access with the site owner, then
  **Check access again**. This does not promise that sign-in grants access.
- Other, malformed, mismatched-URL, decoding and network failures: retain the
  generic load error and **Retry shoulder anatomy**.

Only fixed explanatory text is shown; raw errors and URLs are not rendered.
The live status is accessible. Retry clears only the requested GLTF cache entry,
removes the failure state and lets the normal model-ready callback report success.
Selection, camera and workspace settings are not reset. Changing model URL mounts
a fresh boundary so a prior resource's failure is not carried to a new model.

No authentication, entitlement, request transport, asset registration, scan, mask,
desktop PACS, dependency or fee changes. This is guidance, not an access grant or
clinical approval. The classifier is included in shoulder display-review hashes.

`npm run shoulder-model-access:test` exercises the actual error-boundary class and
rendered fallback with exact, unknown and mismatched responses, default/configured
URLs, retry clearing and readiness. The existing strict classifier tests are also
run. Browser acceptance requires the matching generated website import; use the
dated coordination checkpoint for delivery state, not the presence of this source.

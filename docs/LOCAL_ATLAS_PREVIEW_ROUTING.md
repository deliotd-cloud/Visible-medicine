# Local Atlas preview routing

Development and production need different static-asset ordering. A blanket
`run_worker_first: true` in the Vite development server sent virtual browser
modules and source CSS to the application router. The resulting 404/HTML
responses left a server-rendered page with inactive controls.

`atlasWorkerFirst('build')` remains `true`. The production Worker, protected model
API, inventory policy and authorization/storage checks are unchanged.

For `serve` only, Vite handles its normal modules/styles. The first, pre-enforced
`localAtlasDevelopmentPlugin` middleware intercepts model requests before public
asset handling: exact inventory URLs are rewritten to their existing protected
API, and noncanonical, encoded, filesystem and unknown GLB aliases are refused.
Methods, query, range and conditional headers are preserved for the API to
authenticate and validate. This does not grant any account or model access.

Focused checks:

```text
node --experimental-strip-types --test tests/local-atlas-development-plugin.test.mjs tests/atlas-static-boundary.test.ts tests/native-locate-composed.test.mjs
```

The composed locate test uses a synthetic 3×3×3 mask and actual slice event,
geometry, mask-only loader and practice-hook code. It is not patient-image,
physical-pointer, assistive-technology or clinical validation. Loaded CT/MRI
acceptance and unsigned runtime probes have separate, source-specific F-drive
receipts; never infer those results from the unit tests alone.

References: [Cloudflare Vite static assets](https://developers.cloudflare.com/workers/vite-plugin/reference/static-assets/),
[Worker-first routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/).

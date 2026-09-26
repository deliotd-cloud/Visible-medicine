# Bundle geometry readiness contract

`Bundle` validates a loaded GLTF scene against `props.catalog.structures` for
that bundle before committing its success effect. Hidden structures, disabled
systems and regional subsets cannot conceal a missing expected Mesh. Missing
or duplicate expected Mesh names, absent/empty/non-XYZ position attributes,
fewer than three positions, and empty/out-of-bounds triangle draw metadata
throw into the existing `AssetBoundary` failure and retry path. A bundle with no
catalog expectations also fails closed. Extra scene
nodes, including duplicate noncatalog names, are allowed.

The helper caches the name index by immutable loaded scene identity and successful
contracts by catalog structures-array identity and bundle ID. It preserves the
original geometry objects and does not modify transforms, batching or labels.
GLTF retry clears the transport cache; a newly loaded scene gets a new index.
In-place mutation of loaded scenes/catalog arrays is outside this cache contract.

This is a structural readiness guard. It does not scan vertex values, validate
indices individually, audit degeneracy, verify asset hashes or prove anatomy or
clinical acceptance. Source/export audits and revision-bound review remain separate.

Focused check: `node --import tsx --test scripts/test-body-bundle-geometry.mjs`.
Tests use real Three objects and execute the actual Bundle and AssetBoundary
declarations with controlled hooks and simulated commit/boundary lifecycle.
They do not claim browser, React reconciler, GPU or clinical acceptance.

## Shipped-source regression

`node scripts/validate-body-bundle-geometry.mjs` loads all 109 current displayed
body bundles using GLTFLoader and checks the real 1,104-structure catalog. All
expected meshes pass. Each bundle also rejects a fresh scene clone with one
expected node removed and accepts a rebuilt intact scene. Raw model bytes are
checked against catalog sizes/SHA256; attribute/index bytes and transforms are
compared before and after validation. No source file is rewritten.

The focused load/renderer/selection suites pass alongside this check; see
`.local/test-logs/2026-09-26T11-24-20.488Z-24856-e049c350.log` and
`body-bundle-geometry-validation.json`. Regenerating the existing load report
also refreshes older recipe-count evidence; it does not add or alter recipes.
This scope is the shared regional/whole-body Bundle renderer, not an assertion
that every independent specimen or dedicated shoulder renderer uses this guard.
The local-preview denial is still in force; no browser retry, mobile or clinical
acceptance is inferred from the source tests.

TypeScript and focused oxlint pass (three test-only `prefer-const` diagnostics
were corrected, then the focused tests and lint rerun). Body review/decision
checks pass with regenerated, unsigned revision records. The production module
build passes: 3,374 modules, 6.69 seconds, existing large-chunk warnings retained.
Review log: `.local/test-logs/2026-09-26T11-25-24.263Z-34140-e6a00a50.log`.

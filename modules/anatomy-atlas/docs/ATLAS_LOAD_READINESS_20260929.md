# Anatomy readiness and lossless delivery experiment

29 September 2026. Runtime tested: Atlas `ed5215fcd3a8c4c113f8072b552f0a3cc1b5aa82`.
Website remains `4a5a9ed4989f4dca1719fbb689b715c5e7c79f9a`.
This commit adds diagnostic tooling/evidence only: no viewer, teaching, model,
access, deployment or clinical-review change. No new dependency or asset.

## Result and decision

The local uncompressed loading screen was an inadequate proxy for anatomy
readiness. Measure the existing renderer-ready state AND completion of all
requested bundle loads instead. The test waits another two animation frames;
this is operational readiness, not a proof of rendered-pixel or clinical accuracy.

| Controlled local delivery | Median anatomy ready | Median renderer ready | Skeleton body bytes |
| --- | ---: | ---: | ---: |
| Identity, experiment A | 16.770 s | 7.943 s | 9,461,616 |
| Gzip all, experiment A | 10.599 s | 3.122 s | 7,940,298 |
| Gzip all + scene preload, experiment A | 10.553 s | 3.095 s | 7,940,298 |
| Gzip text only, experiment B | 11.948 s | 3.150 s | 9,461,616 |
| Gzip all, experiment B | 10.601 s | 3.121 s | 7,940,298 |

Three observations per row, rotated ordering within each experiment. Fifteen
successful loads, each with eleven expected whole-body skeleton bundles and no
page errors. All 202 served-file gzip roundtrips are SHA-256 identical to their
inputs; browser decoded model lengths also match. The 874 build-input hashes
are checked before starting each immutable in-memory server snapshot.

Do not add scene preloading based on this result: its 46 ms median difference
is not compelling evidence of a useful improvement. Early failed module loads
also require explicit recovery testing before any later adoption. Do not reduce
anatomical geometry. HTTP gzip saves 16.1% of model bytes here, not the much larger
gain one might incorrectly infer from total-load improvement. Text compression
accounts for most of the observed improvement. Experiments A and B are separate
paired comparisons, not a single randomized four-arm trial.

## Method and limitations

- Chromium via installed Playwright; viewport 375×812, mobile/touch, scale 1.
- Fresh context per load, browser cache disabled, `Cache-Control: no-store`.
- Explicit CDP 150 ms latency, 1,125,000 bytes/s each direction, CPU slowdown 4.
- Compiled regional module, whole-body default skeleton; not development React.
- No production authentication, database, storage latency or TLS in this local
  microbenchmark. This does NOT predict the live website's load time.
- Gzip is precomputed in memory before serving. Server compression CPU cost,
  streaming behavior, origin/cache configuration and concurrent visitors are
  not measured. The lab is not a production HTTP negotiation implementation.
- Three observations are exploratory, not a statistical performance guarantee.
- No new geometry, teaching, scans, masks, identifiers or clinical sign-off.
- A phone-width accessibility snapshot retained named mode/search/system/camera/
  explode controls and the draft/attribution disclosures; not a full WCAG audit.

Earlier interactive DevTools trace on the same build, Fast 4G/CPU4, found LCP
9.392 s, renderer ready 9.602 s, operational readiness 19.146 s, CLS 0. Its
different trace/browser conditions mean it is NOT the baseline for the table.
The raw trace could not be saved through the tool's permitted output path;
only the observed summary was retained. No unsupported trace-file claim.

Machine-readable timings, file hashes and compressed sizes:
[`atlas-load-lab-20260929.json`](atlas-load-lab-20260929.json).
Raw local receipts/reports remain in the coordination workspace's `work/` folder;
their hashes are included in that evidence file.

## Reproduce locally

Use an already verified regional build in `.sites-runtime/head-neck-module`.
The server refuses mismatched source hashes. Pass NEW report paths; outputs
are exclusive-create to preserve old evidence. Run these from the Atlas checkout:

```powershell
node scripts/serve-atlas-load-lab.mjs C:/your-existing-test-folder/lab.json
```

In another terminal, point `VM_PLAYWRIGHT_MODULE` to the existing installed
Playwright ESM module (no package installation required):

```powershell
$env:VM_PLAYWRIGHT_MODULE='file:///C:/your-installed-playwright/index.mjs'
node scripts/test-atlas-load-lab.mjs C:/your-existing-test-folder/lab.json C:/your-existing-test-folder/results.json
```

Optional last argument selects modes, e.g. `gzip-text,gzip`. Default compares
identity, gzip-text, gzip and gzip-preload. Servers bind only to `127.0.0.1`;
stop the owned server with Ctrl+C afterward. Never expose this diagnostic server.

## Next production work (not implemented or deployed)

1. Verify actual private-preview response encodings for scripts, catalogue and
   models before introducing a custom compressor. Cloudflare documents text/JSON
   automatic compression, but its default content-type list does not include
   `model/gltf-binary`. Do not infer that the model route is compressed.
2. Benchmark any proposed model transport against the original protected route.
   Current storage deliberately registers and verifies canonical model bytes;
   standalone meshopt output cannot simply replace those objects/hashes.
3. If implementing streaming gzip, preserve authentication before every GET,
   HEAD, range and conditional response; independent entitlements; immutable
   canonical SHA checks; private/no-store; precise Accept-Encoding/Vary semantics;
   representation-aware validators and identity byte ranges. Test rejected
   encodings, disconnected streams, 206/304 and authorization failures.
4. Verify the actual Workers runtime behavior and existing maintenance verifier,
   not only Node tests. Do not double-compress pre-encoded streams. No paid
   service, public access, bucket mutation or rollout is authorized by this lab.

Official references inspected on 29 September 2026:
[Cloudflare content compression](https://developers.cloudflare.com/speed/optimization/content/compression/)
and [Workers Response encoding](https://developers.cloudflare.com/workers/runtime-apis/response/).
The runtime documentation distinguishes automatic encoding from pre-encoded
`encodeBody: "manual"`; a Node gzip lab alone cannot validate that integration.

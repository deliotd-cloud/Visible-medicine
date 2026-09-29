# Lossless protected model delivery — 29 September 2026

Local implementation; not published or clinically approved.

## Scope and safety

Full protected model responses negotiate native Workers gzip. The canonical
stream is passed unchanged to automatic runtime encoding, without a second
compressor, buffered copy or dependency. Original stored bytes, all 137 registered
models, geometry, identifiers, licences, teaching and clinical review revisions
are unchanged.

The bounded Accept-Encoding parser uses the original trusted
`request.cf.clientAcceptEncoding` when available, because Cloudflare can normalize
the HTTP header. Authorization precedes negotiation, conditional and range reads.
Gzip uses a weak canonical validator and omits canonical Content-Length; Vary
includes Cookie and Accept-Encoding. All responses remain private/no-store.
Ranges always address identity bytes, including stale If-Range full-response
fallbacks. Unacceptable encodings return 406; authentication errors retain their
status without model data. Browser verification still checks the decoded exact
length, GLB header and SHA-256, including cancellation and corrupted downloads.

No storage schema, credentials, entitlements, patient assets, desktop PACS,
generated renderer, dependencies or publication settings changed. Local learner
static URLs are unchanged: this improves the protected API and prepared Worker
delivery path, not the presently hosted website.

## Evidence

Raw HTTP against actual workerd with the normal outer response wrapper verifies
a single gzip decode produces the original fingerprint:

| Model | Canonical bytes | Gzip wire bytes |
| --- | ---: | ---: |
| Thorax skeleton | 3,099,336 | 2,632,272 |
| Largest current model | 19,648,284 | 16,171,040 |

Tests cover negotiation, HEAD, 304, partial reads, stale/weak If-Range, 416,
unacceptable encodings, denied requests, storage corruption, interrupted streams
and upstream failures. Existing D1 revocation checks also exercise gzip requests.

Actual signed-in localhost checks are recorded in
[the browser report](atlas-compression-browser-20260929.json): full exact-hash
download, HEAD, range and conditional requests succeed; signed-out access is 401.
One existing licensed public 3.1 MB thorax model was staged into local development
storage (201) after source-hash verification. This is not patient data or a remote
upload. The development bridge decodes and strips Content-Encoding, so these
browser checks do not measure a transfer speed improvement.

Final native focused tests (3), TypeScript and production build passed.
Final broad-suite result is recorded in the coordination checkpoint. Exploratory
failed test attempts remain in work/ logs alongside passing evidence, rather
than being presented as successful runs.

## Remaining release checks

No real-device speed, concurrency, CPU-budget or hosting cost guarantee is made.
Measure the prepared runtime with representative concurrency and devices before
deployment. No paid service was enabled. Clinical sign-off and protected imaging
release gates remain unchanged. GitHub/C recovery is handled separately; D-drive
recovery is still pending because that drive is full.

## Primary references

- [Workers Response encoding](https://developers.cloudflare.com/workers/runtime-apis/response/)
- [Workers original client encoding](https://developers.cloudflare.com/workers/runtime-apis/request/)
- [HTTP Accept-Encoding](https://www.rfc-editor.org/rfc/rfc9110.html#section-12.5.3)
